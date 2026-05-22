import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN";
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
      const response = await fetch("/api/social", {
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
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

  const connectPlatform = async (platform: string) => {
    try {
      const response = await fetch("/api/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
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
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch("/api/social/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ socialAccountId: accountId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setAccounts(accounts.filter((acc) => acc.id !== accountId));
      toast({ title: "Success", description: "Account disconnected" });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    connectPlatform,
    disconnectAccount,
    refetch: fetchAccounts,
  };
}