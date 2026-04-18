"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Loader2, MoreHorizontal, Pencil, Plus, Power, PowerOff, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type GetAllFaqsResponse = {
  success: boolean;
  data: Faq[];
};

type UpsertFaqPayload = {
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
};

type UpsertFaqResponse = {
  success: boolean;
  data: Faq;
};

type DeleteFaqResponse = {
  success: boolean;
};

type UpdateStatusPayload = {
  status: "ACTIVE" | "INACTIVE";
};

export default function AdminFaqPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "Request failed";
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<Faq | null>(null);
  const [formData, setFormData] = useState<UpsertFaqPayload>({
    question: "",
    answer: "",
    displayOrder: 1,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: () => apiGet<GetAllFaqsResponse>("/api/faq/admin"),
  });

  const faqs = useMemo(() => {
    const rows = data?.data ?? [];
    return [...rows].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [data?.data]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(faqs.length / itemsPerPage);
  const currentFaqs = faqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      displayOrder: 1,
      isActive: true,
    });
  };

  const openCreate = () => {
    setEditingFaq(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (payload: UpsertFaqPayload) => apiPost<UpsertFaqResponse, UpsertFaqPayload>("/api/faq", payload),
    onSuccess: () => {
      toast({ title: "FAQ created" });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      resetForm();
    },
    onError: (err: unknown) => {
      toast({ title: "Create failed", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: UpsertFaqPayload }) =>
      apiPatch<UpsertFaqResponse, UpsertFaqPayload>(`/api/faq/${payload.id}`, payload.data),
    onSuccess: () => {
      toast({ title: "FAQ updated" });
      setIsDialogOpen(false);
      setEditingFaq(null);
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      resetForm();
    },
    onError: (err: unknown) => {
      toast({ title: "Update failed", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<DeleteFaqResponse>(`/api/faq/${id}`),
    onSuccess: () => {
      toast({ title: "FAQ deleted" });
      setIsDeleteDialogOpen(false);
      setFaqToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (err: unknown) => {
      toast({ title: "Delete failed", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: UpdateStatusPayload["status"] }) =>
      apiPatch<{ success: boolean; data?: Faq }, UpdateStatusPayload>(`/api/faq/${payload.id}/status`, {
        status: payload.status,
      }),
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (err: unknown) => {
      toast({ title: "Status update failed", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpsertFaqPayload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      displayOrder: Number(formData.displayOrder) || 0,
      isActive: Boolean(formData.isActive),
    };
    if (!payload.question || !payload.answer) {
      toast({ title: "Question and answer are required", variant: "destructive" });
      return;
    }
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-lime-400" />
            FAQ Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Create, edit, delete, and activate FAQs.</p>
        </div>
        <Button
          onClick={openCreate}
          className="cursor-pointer bg-lime-400 hover:bg-lime-300 text-slate-950 font-black gap-2 px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105 active:scale-95 text-base"
        >
          <Plus className="h-5 w-5" /> Create FAQ
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="text-slate-500 text-sm">Loading FAQs...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-slate-400 font-semibold py-4 w-20">Order</TableHead>
                  <TableHead className="text-slate-400 font-semibold py-4">Question</TableHead>
                  <TableHead className="text-slate-400 font-semibold py-4 w-36">Status</TableHead>
                  <TableHead className="text-slate-400 font-semibold py-4 w-52">Updated</TableHead>
                  <TableHead className="text-slate-400 font-semibold py-4 w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFaqs.length ? (
                  currentFaqs.map((faq) => (
                    <TableRow key={faq.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="py-4 text-slate-200 font-medium">{faq.displayOrder}</TableCell>
                      <TableCell className="py-4">
                        <div className="text-white font-medium leading-5">{faq.question}</div>
                        <div className="text-slate-500 text-xs mt-1 line-clamp-2">{faq.answer}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={
                            faq.isActive
                              ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
                              : "border-slate-700 bg-slate-800/40 text-slate-300"
                          }
                        >
                          {faq.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-slate-400 text-sm">{formatDateTime(faq.updatedAt)}</TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem
                              onClick={() => openEdit(faq)}
                              className="cursor-pointer focus:bg-slate-800"
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                statusMutation.mutate({
                                  id: faq.id,
                                  status: faq.isActive ? "INACTIVE" : "ACTIVE",
                                })
                              }
                              className="cursor-pointer focus:bg-slate-800"
                            >
                              {faq.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" /> Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setFaqToDelete(faq);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer text-red-400 focus:bg-slate-800 focus:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      No FAQs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Footer */}
            {faqs.length > itemsPerPage && (
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-slate-950/20">
                <div className="text-xs text-slate-500 font-medium uppercase">
                  Showing {faqs.length} total records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="bg-slate-900 border-slate-800 h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-400" />
                  </Button>
                  <div className="px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-md text-[10px] font-bold text-lime-400 uppercase">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="bg-slate-900 border-slate-800 h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingFaq(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">{editingFaq ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingFaq ? "Update the FAQ details." : "Add a new FAQ entry."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="question" className="text-slate-300">
                Question
              </Label>
              <Input
                id="question"
                className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                value={formData.question}
                onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer" className="text-slate-300">
                Answer
              </Label>
              <Textarea
                id="answer"
                className="min-h-32 bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                value={formData.answer}
                onChange={(e) => setFormData((p) => ({ ...p, answer: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder" className="text-slate-300">
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, displayOrder: Number.parseInt(e.target.value || "0", 10) }))
                  }
                  min={0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Active</Label>
                <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((p) => ({ ...p, isActive: Boolean(checked) }))}
                  />
                  <span className="text-sm text-slate-300">Visible on site</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white font-black px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 text-base"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black gap-2 px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105 active:scale-95 text-base"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingFaq ? "Update FAQ" : "Create FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Delete FAQ</DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone. Delete this FAQ?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
            <div className="text-sm text-white font-medium">{faqToDelete?.question}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{faqToDelete?.answer}</div>
          </div>
          <DialogFooter className="gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white font-black px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 text-base"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!faqToDelete || deleteMutation.isPending}
              onClick={() => faqToDelete && deleteMutation.mutate(faqToDelete.id)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(225,29,72,0.3)] transition-all hover:scale-105 active:scale-95 text-base border-none"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
