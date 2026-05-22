"use client";

import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMediaPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Media Library</h1>
        <p className="text-sm text-slate-400">
          Browse and manage all uploaded media files.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-lime-400" />
            Media Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-800 p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Media Library Coming Soon
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              This section will display all uploaded images and videos with search,
              filtering, and bulk management capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
