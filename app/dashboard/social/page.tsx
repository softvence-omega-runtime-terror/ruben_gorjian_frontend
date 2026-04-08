"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unlink, ExternalLink } from "lucide-react";
import {
  FaFacebook as Facebook,
  FaInstagram as Instagram,
} from "react-icons/fa";
import { SiTiktok as Tiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
  displayName?: string | null;
  externalAccountId?: string | null;
  createdAt?: string;
}

function isUploadPostAccount(account?: SocialAccount | null) {
  return Boolean(account?.externalAccountId?.startsWith("upload-post:"));
}

function SocialPageInner() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<
    SocialAccount["platform"] | null
  >(null);
  const [connectErrors, setConnectErrors] = useState<
    Partial<Record<SocialAccount["platform"], string>>
  >({});
  const [inlineMessage, setInlineMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledQueryKeyRef = useRef<string | null>(null);
  const refetchRetryIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryKey = searchParams.toString();

  // Fetch once on mount; keep this outside dependencies so changes to toast don't retrigger repeatedly
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/social-media/platform/my-links", {
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const rawAccounts = Array.isArray(data) 
        ? data 
        : data.links || data.accounts || data.data || [];
        
      const mappedAccounts: SocialAccount[] = rawAccounts.map((acc: any) => ({
        id: acc.id || acc._id || acc.platform,
        platform: acc.platform?.toUpperCase(),
        displayName: acc.username || acc.displayName || acc.platform,
        externalAccountId: acc.externalAccountId || acc.username || "",
        createdAt: acc.createdAt,
      }));
      setAccounts(mappedAccounts);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch connected accounts";
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    // Avoid re-handling the same query repeatedly
    if (handledQueryKeyRef.current === queryKey) return;
    handledQueryKeyRef.current = queryKey;

    const error = searchParams.get("error");
    const errorMessage = searchParams.get("errorMessage");
    const success = searchParams.get("success");
    const platform = searchParams.get("platform");
    const pendingVerification = searchParams.get("pendingVerification");

    if (error) {
      // Decode the error message if it's URL encoded
      const decodedMessage = errorMessage
        ? decodeURIComponent(errorMessage)
        : error === "missing_params"
          ? "Missing required OAuth parameters. Please try connecting again."
          : error === "connection_failed"
            ? "Failed to connect account. Please check your credentials and try again."
            : "Unable to connect account";

      setInlineMessage({ type: "error", text: decodedMessage });
      toast({
        title: "Connection failed",
        description: decodedMessage,
        variant: "destructive",
      });
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/social");
      }
    } else if (success) {
      const message = platform
        ? `Connected ${platform.toLowerCase()} account`
        : "Account connected";
      const finalMessage =
        pendingVerification === "true"
          ? `${message}. Talexia is still syncing confirmation from Upload-Post.`
          : message;
      setInlineMessage({ type: "success", text: finalMessage });
      toast({
        title: "Connected",
        description: finalMessage,
      });
      // Refetch so the list reflects reconciliation with Upload-Post
      fetchAccounts();
      // Delayed refetch to handle Upload-Post eventual consistency (cleaned up on unmount only)
      if (refetchRetryIdRef.current) clearTimeout(refetchRetryIdRef.current);
      refetchRetryIdRef.current = setTimeout(() => {
        refetchRetryIdRef.current = null;
        fetchAccounts();
      }, 2000);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/social");
      }
    }
  }, [queryKey, router, searchParams, toast, fetchAccounts]);

  // Clear delayed refetch on unmount
  useEffect(() => {
    return () => {
      if (refetchRetryIdRef.current) {
        clearTimeout(refetchRetryIdRef.current);
        refetchRetryIdRef.current = null;
      }
    };
  }, []);

  const connectPlatform = async (platform: SocialAccount["platform"]) => {
    setConnectingPlatform(platform);
    setConnectErrors((prev) => ({ ...prev, [platform]: undefined }));
    try {
      const response = await fetch("/api/social-media/platform/connect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          platform: platform.toLowerCase(),
          redirectUrl: `${window.location.origin}/dashboard/social`,
          showCalendar: false 
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const raw: string = data?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(raw);
      }

        const connectUrl = data.url || data.link || data.connect?.access_url || data.connect?.url;

        if (connectUrl) {
          window.location.href = connectUrl;
        } else {
          throw new Error("No connect URL returned from server.");
        }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect account";
      console.error("Connect error:", error);
      setConnectErrors((prev) => ({ ...prev, [platform]: message }));
      toast({
        title: `Failed to connect ${platform.charAt(0) + platform.slice(1).toLowerCase()}`,
        description: message,
        variant: "destructive",
      });
      setConnectingPlatform(null);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch("/api/social-media/platform/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setAccounts(accounts.filter((acc) => acc.id !== accountId));
      toast({ title: "Disconnected", description: "Account disconnected successfully." });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Failed to disconnect",
        description: error instanceof Error ? error.message : "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  const facebookAccount = accounts.find((acc) => acc.platform === "FACEBOOK");
  const instagramAccount = accounts.find((acc) => acc.platform === "INSTAGRAM");
  const tiktokAccount = accounts.find((acc) => acc.platform === "TIKTOK");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Media</h1>
          <p className="text-slate-400">Loading your connected accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Social Media</h1>
        <p className="text-slate-400">
          Connect your social media accounts to schedule and publish posts
        </p>
        {inlineMessage && (
          <div
            className={`mt-3 rounded-md border px-3 py-2 text-sm ${
              inlineMessage.type === "error"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                : "border-lime-400/50 bg-lime-400/10 text-lime-100"
            }`}
          >
            {inlineMessage.text}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`border-slate-800 bg-slate-900/60 ${facebookAccount ? "border-lime-300/40" : ""}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Facebook className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Facebook</CardTitle>
                  {/* <CardDescription className="text-slate-400">
                    Connect your Facebook page 
                  </CardDescription> */}
                </div>
              </div>
              {facebookAccount && (
                <Badge
                  variant="secondary"
                  className="bg-lime-300/20 text-lime-200 border-lime-300/40"
                >
                  Connected
                </Badge>
              )}
              {isUploadPostAccount(facebookAccount) && (
                <Badge variant="outline">via Upload-Post</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {facebookAccount ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm font-medium text-white">
                    @
                    {facebookAccount.displayName ||
                      facebookAccount.externalAccountId ||
                      "facebook-page"}
                  </p>
                  <p className="text-xs text-lime-400">
                    Connected{" "}
                    {facebookAccount.createdAt
                      ? new Date(facebookAccount.createdAt).toLocaleDateString()
                      : "just now"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(facebookAccount.id)}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    title="View on Facebook"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {connectErrors.FACEBOOK && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {connectErrors.FACEBOOK}
                  </div>
                )}
                <p className="text-sm text-slate-400">
                  Connect your Facebook page to start scheduling posts to
                  Facebook
                </p>
                <Button
                  onClick={() => connectPlatform("FACEBOOK")}
                  disabled={connectingPlatform === "FACEBOOK"}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connectingPlatform === "FACEBOOK" ? "Connecting..." : "Connect Facebook"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`border-slate-800 bg-slate-900/60 ${instagramAccount ? "border-lime-300/40" : ""}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-orange-400 text-white">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">Instagram</CardTitle>
              </div>
              {instagramAccount && (
                <Badge
                  variant="secondary"
                  className="bg-lime-300/20 text-lime-200 border-lime-300/40"
                >
                  Connected
                </Badge>
              )}
              {isUploadPostAccount(instagramAccount) && (
                <Badge variant="outline">via Upload-Post</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {instagramAccount ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm font-medium text-white">
                    @
                    {instagramAccount.displayName ||
                      instagramAccount.externalAccountId ||
                      "instagram-account"}
                  </p>
                  <p className="text-xs text-lime-400">
                    Connected{" "}
                    {instagramAccount.createdAt
                      ? new Date(
                          instagramAccount.createdAt,
                        ).toLocaleDateString()
                      : "just now"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(instagramAccount.id)}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    title="View on Instagram"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {connectErrors.INSTAGRAM && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {connectErrors.INSTAGRAM}
                  </div>
                )}
                <p className="text-sm text-slate-400">
                  Connect Instagram to publish directly to your feed
                </p>
                <Button
                  onClick={() => connectPlatform("INSTAGRAM")}
                  disabled={connectingPlatform === "INSTAGRAM"}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white"
                >
                  {connectingPlatform === "INSTAGRAM" ? "Connecting..." : "Connect Instagram"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


        <Card
          className={`border-slate-800 bg-slate-900/60 ${tiktokAccount ? "border-lime-300/40" : ""}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-black text-white border border-slate-700">
                <Tiktok className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">TikTok</CardTitle>
              </div>
              {tiktokAccount && (
                <Badge
                  variant="secondary"
                  className="bg-lime-300/20 text-lime-200 border-lime-300/40"
                >
                  Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tiktokAccount ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm font-medium text-white">
                    @
                    {tiktokAccount.displayName ||
                      tiktokAccount.externalAccountId ||
                      "tiktok-account"}
                  </p>
                  <p className="text-xs text-lime-400">
                    Connected{" "}
                    {tiktokAccount.createdAt
                      ? new Date(tiktokAccount.createdAt).toLocaleDateString()
                      : "just now"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(tiktokAccount.id)}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {connectErrors.TIKTOK && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {connectErrors.TIKTOK}
                  </div>
                )}
                <p className="text-sm text-slate-400">
                  Connect TikTok to schedule and post videos
                </p>
                <Button
                  onClick={() => connectPlatform("TIKTOK" as any)}
                  disabled={connectingPlatform === ("TIKTOK" as any)}
                  className="w-full bg-black hover:bg-slate-900 text-white border border-slate-700"
                >
                  {connectingPlatform === ("TIKTOK" as any) ? "Connecting..." : "Connect TikTok"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(facebookAccount || instagramAccount || tiktokAccount) && (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white">Connected Accounts</CardTitle>
            <CardDescription className="text-slate-400">
              These accounts are ready for scheduling posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facebookAccount && (
                <div className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-blue-600 text-white">
                      <Facebook className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        @
                        {facebookAccount.displayName ||
                          facebookAccount.externalAccountId ||
                          "facebook-page"}
                      </p>
                      <p className="text-xs text-lime-400">Facebook Page</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectAccount(facebookAccount.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {instagramAccount && (
                <div className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-gradient-to-r from-pink-500 to-orange-400 text-white">
                      <Instagram className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        @
                        {instagramAccount.displayName ||
                          instagramAccount.externalAccountId ||
                          "instagram-account"}
                      </p>
                      <p className="text-xs text-lime-400">
                        Instagram Business
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectAccount(instagramAccount.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {tiktokAccount && (
                <div className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-black text-white border border-slate-700">
                      <Tiktok className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        @
                        {tiktokAccount.displayName ||
                          tiktokAccount.externalAccountId ||
                          "tiktok-account"}
                      </p>
                      <p className="text-xs text-lime-400">TikTok</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectAccount(tiktokAccount.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Social Media</h1>
            <p className="text-slate-400">Loading your connected accounts...</p>
          </div>
        </div>
      }
    >
      <SocialPageInner />
    </Suspense>
  );
}
