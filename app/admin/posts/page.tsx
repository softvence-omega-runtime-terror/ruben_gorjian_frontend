"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPostsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Posts</h1>
        <p className="text-sm text-slate-400">
          View and manage all scheduled and published posts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-lime-400" />
            Post Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-800 p-4 mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Post Management Coming Soon
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              This section will provide a comprehensive view of all posts across users,
              with filtering, bulk actions, and detailed analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
