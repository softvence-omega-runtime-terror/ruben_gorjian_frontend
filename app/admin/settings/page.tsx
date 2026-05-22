"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";

type RoutingMode = "FORCE_NATIVE" | "FORCE_UPLOAD_POST";
type ApplyScope = "USERS_ONLY" | "ALL_USERS";

type GlobalRoutingSummary = {
  scope: ApplyScope;
  globalDefault: {
    mode: RoutingMode;
    useInstagram: boolean;
    useFacebook: boolean;
    useLinkedin: boolean;
  };
  totalUsers: number;
  modeCounts: {
    FORCE_NATIVE: number;
    FORCE_UPLOAD_POST: number;
  };
};

type GlobalRoutingUpdateResponse = {
  mode: RoutingMode;
  applyTo: ApplyScope;
  targetUsersCount: number;
  updatedExistingCount: number;
  createdCount: number;
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftGlobalDefault, setDraftGlobalDefault] = useState<GlobalRoutingSummary["globalDefault"] | null>(null);

  const globalRoutingQuery = useQuery({
    queryKey: ["admin-global-publishing-routing"],
    queryFn: () => apiGet<GlobalRoutingSummary>("/api/admin/publishing-routing/global"),
  });

  // Derive applyTo from server when available; use local state only for user selection before apply
  const serverScope = globalRoutingQuery.data?.scope ?? "USERS_ONLY";
  const [userChosenScope, setUserChosenScope] = useState<ApplyScope | null>(null);
  const applyTo = userChosenScope ?? serverScope;

  const applyGlobalMutation = useMutation({
    mutationFn: () =>
      apiPut<GlobalRoutingUpdateResponse, Record<string, unknown>>(
        "/api/admin/publishing-routing/global",
        {
          mode: effectiveGlobalDefault.mode,
          applyTo,
          useInstagram:
            effectiveGlobalDefault.mode === "FORCE_UPLOAD_POST"
              ? effectiveGlobalDefault.useInstagram
              : undefined,
          useFacebook:
            effectiveGlobalDefault.mode === "FORCE_UPLOAD_POST"
              ? effectiveGlobalDefault.useFacebook
              : undefined,
          useLinkedin:
            effectiveGlobalDefault.mode === "FORCE_UPLOAD_POST"
              ? effectiveGlobalDefault.useLinkedin
              : undefined,
        },
      ),
    onSuccess: (data) => {
      toast({
        title: "Global posting channel updated",
        description: `Applied to ${data.targetUsersCount} user(s).`,
      });
      setUserChosenScope(null);
      setDraftGlobalDefault(null);
      queryClient.invalidateQueries({
        queryKey: ["admin-global-publishing-routing"],
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to apply global posting channel",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const modeCounts = globalRoutingQuery.data?.modeCounts;
  const effectiveGlobalDefault =
    draftGlobalDefault ??
    globalRoutingQuery.data?.globalDefault ?? {
      mode: "FORCE_NATIVE" as RoutingMode,
      useInstagram: true,
      useFacebook: true,
      useLinkedin: true,
    };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400">
          Configure admin panel and system settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-lime-400" />
            Global Posting Channel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Users: {globalRoutingQuery.data?.totalUsers ?? "—"}
            </Badge>
            <Badge variant="outline">
              Default: {modeCounts?.FORCE_NATIVE ?? "—"}
            </Badge>
            <Badge variant="outline">
              Upload-Post: {modeCounts?.FORCE_UPLOAD_POST ?? "—"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="global-mode">Posting Channel</Label>
              <Select
                id="global-mode"
                value={effectiveGlobalDefault.mode}
                onChange={(event) =>
                  setDraftGlobalDefault({
                    ...effectiveGlobalDefault,
                    mode: event.target.value as RoutingMode,
                  })
                }
              >
                <option value="FORCE_NATIVE">Default</option>
                <option value="FORCE_UPLOAD_POST">Upload-Post</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="global-scope">Apply Scope</Label>
              <Select
                id="global-scope"
                value={applyTo}
                onChange={(event) => setUserChosenScope(event.target.value as ApplyScope)}
              >
                <option value="USERS_ONLY">General Users Only</option>
                <option value="ALL_USERS">All Accounts (incl. admins)</option>
              </Select>
            </div>
          </div>

          {effectiveGlobalDefault.mode === "FORCE_UPLOAD_POST" && (
            <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs text-slate-400">Upload-Post platform toggles</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm text-slate-200">
                  Instagram
                  <Checkbox
                    checked={effectiveGlobalDefault.useInstagram}
                    onCheckedChange={(value) =>
                      setDraftGlobalDefault({
                        ...effectiveGlobalDefault,
                        useInstagram: Boolean(value),
                      })
                    }
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-slate-200">
                  Facebook
                  <Checkbox
                    checked={effectiveGlobalDefault.useFacebook}
                    onCheckedChange={(value) =>
                      setDraftGlobalDefault({
                        ...effectiveGlobalDefault,
                        useFacebook: Boolean(value),
                      })
                    }
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-slate-200">
                  LinkedIn
                  <Checkbox
                    checked={effectiveGlobalDefault.useLinkedin}
                    onCheckedChange={(value) =>
                      setDraftGlobalDefault({
                        ...effectiveGlobalDefault,
                        useLinkedin: Boolean(value),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          )}

          <Button
            onClick={() => applyGlobalMutation.mutate()}
            disabled={applyGlobalMutation.isPending}
          >
            Apply To {applyTo === "ALL_USERS" ? "All Users" : "General Users"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
