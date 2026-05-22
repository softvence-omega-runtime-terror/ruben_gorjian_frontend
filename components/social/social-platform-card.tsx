import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unlink, ExternalLink, LucideIcon } from "lucide-react";
import { SocialAccount } from "@/hooks/use-social-accounts";

interface SocialPlatformCardProps {
  platform: {
    name: string;
    icon: LucideIcon;
    color: string;
    description: string;
  };
  account?: SocialAccount;
  onConnect: () => Promise<void>;
  onDisconnect: (accountId: string) => Promise<void>;
  disabled?: boolean;
}

export function SocialPlatformCard({
  platform,
  account,
  onConnect,
  onDisconnect,
  disabled = false,
}: SocialPlatformCardProps) {
  const [connecting, setConnecting] = useState(false);
  const Icon = platform.icon;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect();
    } catch {
      setConnecting(false);
    }
  };

  if (disabled) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 opacity-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-600 text-slate-400">
              <div className="h-5 w-5 rounded bg-slate-500" />
            </div>
            <div>
              <CardTitle className="text-slate-500">{platform.name}</CardTitle>
              <CardDescription className="text-slate-500">
                Coming soon
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            {platform.name} integration will be available soon
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-slate-800 bg-slate-900/60 ${
        account ? "border-lime-300/40" : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${platform.color} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">{platform.name}</CardTitle>
              <CardDescription className="text-slate-400">
                {platform.description}
              </CardDescription>
            </div>
          </div>
          {account && (
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
        {account ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm font-medium text-white">
                @{account.displayName || account.externalAccountId || `${platform.name.toLowerCase()}-page`}
              </p>
              <p className="text-xs text-slate-400">
                Connected{" "}
                {account.createdAt
                  ? new Date(account.createdAt).toLocaleDateString()
                  : "just now"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(account.id)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                title={`View on ${platform.name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Connect your {platform.name} page to start scheduling posts to {platform.name}
            </p>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className={`w-full ${platform.color} hover:opacity-90 text-white`}
            >
              {connecting ? "Connecting..." : `Connect ${platform.name}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}