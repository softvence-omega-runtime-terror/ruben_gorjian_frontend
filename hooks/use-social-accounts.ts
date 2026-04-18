import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
  displayName?: string | null;
  externalAccountId?: string | null;
  createdAt?: string;
}

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      const rawAccounts = Array.isArray(data) ? data : data.links || data.accounts || [];
      const mappedAccounts: SocialAccount[] = rawAccounts.map((acc: any) => ({
        id: acc.id || acc._id || acc.platform,
        platform: acc.platform?.toUpperCase(),
        displayName: acc.username || acc.displayName || acc.platform,
        externalAccountId: acc.externalAccountId || acc.username || "",
        createdAt: acc.createdAt,
      }));
      setAccounts(mappedAccounts);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch connected accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const connectPlatform = useCallback(async (platform: string) => {
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
        const message = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      const connectUrl = data.url || data.link || data.connect?.access_url || data.connect?.url;

      if (connectUrl) {
        window.location.href = connectUrl;
      } else {
        throw new Error("No connect URL returned");
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to connect ${platform}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      const response = await fetch("/api/social-media/platform/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setAccounts(prev => prev.filter((acc) => acc.id !== accountId));
      toast({ title: "Success", description: "Account disconnected" });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return useMemo(() => ({
    accounts,
    loading,
    connectPlatform,
    disconnectAccount,
    refetch: fetchAccounts,
  }), [accounts, loading, connectPlatform, disconnectAccount, fetchAccounts]);
}