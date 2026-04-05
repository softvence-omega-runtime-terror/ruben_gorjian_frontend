"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPatch } from "@/lib/api";
import { 
  Clock, 
  CheckCircle, 
  Mail, 
  Globe, 
  User, 
  Calendar, 
  MessageSquare,
  Info
} from "lucide-react";

type SubmissionStatus = "PENDING" | "REPLIED" | "RESOLVED";

interface SubmissionDetail {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  websiteHandle: string;
  interests: string[];
  postsPerMonth: string;
  message: string;
  source: string;
  status: SubmissionStatus;
  repliedBy: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  createdIp: string;
}

interface SupportDetailsModalProps {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDetailsModal({
  submissionId,
  open,
  onOpenChange,
}: SupportDetailsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyMessage, setReplyMessage] = useState("");

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ["contact-submission", submissionId],
    queryFn: () => apiGet<{ success: boolean; data: SubmissionDetail }>(`/api/contact/admin/submissions/${submissionId}`).then(res => res.data),
    enabled: !!submissionId && open,
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => 
      apiPatch<{ success: boolean }>(`/api/contact/admin/submissions/${submissionId}/reply`, { replyMessage: message }),
    onSuccess: () => {
      toast({ title: "Reply sent successfully" });
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["contact-submission", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: SubmissionStatus) => 
      apiPatch<{ success: boolean }>(`/api/contact/admin/submissions/${submissionId}/status`, { status }),
    onSuccess: () => {
      toast({ title: `Status updated to ${submission?.status === "RESOLVED" ? "PENDING" : "RESOLVED"}` });
      queryClient.invalidateQueries({ queryKey: ["contact-submission", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  });

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    replyMutation.mutate(replyMessage);
  };

  const toggleStatus = () => {
    const nextStatus = submission?.status === "RESOLVED" ? "PENDING" : "RESOLVED";
    statusMutation.mutate(nextStatus);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "RESOLVED":
        return <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/20">Resolved</Badge>;
      case "REPLIED":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">Replied</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-400 border-amber-400/50 bg-amber-400/10">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-200 scrollbar-hide">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-lime-400" />
              Submission Details
            </DialogTitle>
            {submission && getStatusBadge(submission.status)}
          </div>
          <DialogDescription className="text-slate-400">
            Full report of contact request from {submission?.fullName || "user"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-lime-400"></div>
            <p className="text-sm text-slate-500">Fetching submission details...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <Info className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
            <p className="text-red-400 font-medium">Failed to load details</p>
            <p className="text-sm text-slate-500">{(error as Error).message}</p>
          </div>
        ) : submission ? (
          <div className="space-y-8 mt-4">
            {/* User Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-xl border border-white/5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Full Name</p>
                    <p className="font-medium text-white">{submission.fullName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Email Address</p>
                    <p className="font-medium text-white">{submission.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Website / Handle</p>
                    <p className="font-medium text-white">{submission.websiteHandle}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Business Name</p>
                    <p className="font-medium text-white">{submission.businessName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Submitted At</p>
                    <p className="font-medium text-white">{formatDate(submission.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Source</p>
                  <Badge variant="outline" className="text-[10px] border-slate-700">{submission.source}</Badge>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lime-400"></div>
                Project Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/30 p-4 rounded-lg border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="bg-slate-800 text-slate-300">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/30 p-4 rounded-lg border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Posts Per Month</p>
                  <p className="text-white font-medium">{submission.postsPerMonth}</p>
                </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lime-400"></div>
                User Message
              </h3>
              <div className="bg-slate-900/80 p-6 rounded-xl border border-white/10 shadow-inner">
                <p className="text-slate-300 leading-relaxed italic">"{submission.message}"</p>
              </div>
            </div>

            {/* Reply Log */}
            {submission.replyMessage && (
              <div className="space-y-4 bg-lime-500/5 p-6 rounded-xl border border-lime-500/10">
                <h3 className="text-sm font-semibold text-lime-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Your Reply
                </h3>
                <p className="text-slate-300 leading-relaxed">{submission.replyMessage}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 border-t border-lime-500/10 pt-4">
                  <span>Replied at {formatDate(submission.repliedAt)}</span>
                  <span>•</span>
                  <span>ID: {submission.repliedBy}</span>
                </div>
              </div>
            )}

            {/* Reply Form */}
            {!submission.replyMessage && (
              <div className="space-y-4 border-t border-slate-800 pt-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Send a Response</h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply to the user here..."
                    className="min-h-[120px] bg-slate-950 border-slate-800 focus-visible:ring-lime-500/50"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500 italic">User will receive this via email.</p>
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyMessage.trim() || replyMutation.isPending}
                      className="bg-lime-500 hover:bg-lime-600 text-slate-950 font-bold px-8"
                    >
                      {replyMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-slate-800 pt-6 flex sm:justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                {getStatusBadge(submission.status)}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-800" onClick={() => onOpenChange(false)}>
                  Close Details
                </Button>
                {/* <Button 
                  variant={submission.status === "RESOLVED" ? "secondary" : "default"}
                  className={submission.status === "RESOLVED" ? "" : "bg-lime-500 hover:bg-lime-600 text-slate-900"}
                  onClick={toggleStatus}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? "Updating..." : submission.status === "RESOLVED" ? "Mark as Pending" : "Mark as Resolved"}
                </Button> */}
              </div>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
