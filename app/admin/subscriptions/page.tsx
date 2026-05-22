"use client";

import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSubscriptionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Subscriptions</h1>
        <p className="text-sm text-slate-400">
          Manage user subscriptions and billing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-lime-400" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-800 p-4 mb-4">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Subscription Management Coming Soon
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              This section will allow you to view and manage all user subscriptions,
              including plan changes, billing history, and subscription analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
