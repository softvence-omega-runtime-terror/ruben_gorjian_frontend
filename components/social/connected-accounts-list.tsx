import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Unlink } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { SocialAccount } from "@/hooks/use-social-accounts";

interface ConnectedAccountsListProps {
  accounts: SocialAccount[];
  onDisconnect: (accountId: string) => Promise<void>;
}

export function ConnectedAccountsList({
  accounts,
  onDisconnect,
}: ConnectedAccountsListProps) {
  if (accounts.length === 0) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "FACEBOOK":
        return FaFacebook;
      default:
        return FaFacebook;
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white">Connected Accounts</CardTitle>
        <CardDescription className="text-slate-400">
          These accounts are ready for scheduling posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => {
            const Icon = getPlatformIcon(account.platform);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded bg-blue-600 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      @{account.displayName || account.externalAccountId || `${account.platform.toLowerCase()}-page`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {account.platform.charAt(0) + account.platform.slice(1).toLowerCase()} Page
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect(account.id)}
                  className="text-slate-400 hover:text-white"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
