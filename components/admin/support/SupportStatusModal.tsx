"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Clock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmissionStatus = "PENDING" | "REPLIED" | "RESOLVED";

interface SupportStatusModalProps {
  submission: {
    id: string;
    fullName: string;
    status: SubmissionStatus;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportStatusModal({
  submission,
  open,
  onOpenChange,
}: SupportStatusModalProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | null>(null);

  useEffect(() => {
    if (submission) {
      setSelectedStatus(submission.status);
    }
  }, [submission]);

  const statusMutation = useMutation({
    mutationFn: (status: SubmissionStatus) => 
      apiPatch<{ success: boolean }>(`/api/contact/admin/submissions/${submission?.id}/status`, { status }),
    onSuccess: (_, status) => {
      toast.success(`Status updated to ${status.toLowerCase()}`, {
        position: "top-right"
      });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error("Failed to update status", {
        description: err.message,
        position: "top-right"
      });
    }
  });

  const statuses: { value: SubmissionStatus; label: string; icon: any; color: string }[] = [
    { value: "PENDING", label: "Pending", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    // { value: "REPLIED", label: "Replied", icon: Mail, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { value: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-lime-400 bg-lime-400/10 border-lime-400/20" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-200 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            Change Status
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Update the processing status for <span className="text-white">{submission?.fullName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                selectedStatus === status.value
                  ? "bg-slate-900 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", status.color)}>
                  <status.icon className="h-4 w-4" />
                </div>
                <span className={cn("font-bold", selectedStatus === status.value ? "text-white" : "text-slate-400")}>
                  {status.label}
                </span>
              </div>
              {selectedStatus === status.value && (
                <CheckCircle2 className="h-5 w-5 text-lime-400" />
              )}
            </button>
          ))}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 hover:text-white hover:bg-slate-900 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedStatus && statusMutation.mutate(selectedStatus)}
            disabled={statusMutation.isPending || selectedStatus === submission?.status}
            className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-8 h-11 rounded-xl shadow-[0_10px_20px_rgba(163,230,53,0.2)]"
          >
            {statusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
