"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  itemType?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Schedule",
  description = "Are you sure you want to delete this schedule? This action cannot be undone and will remove the post from your pipeline.",
  itemType = "post",
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-slate-900 border-slate-800 p-0 overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
             <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-rose-500" />
             </div>
          </div>
          
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-base leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-2">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[11px] text-amber-500/80 font-medium leading-tight">
               Important: If you delete this, it will be permanently removed from the user's content calendar.
             </p>
          </div>

          <DialogFooter className="gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white font-black h-14 rounded-2xl order-2 sm:order-1 transition-all hover:scale-105 active:scale-95"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black h-14 rounded-2xl shadow-[0_15px_30px_rgba(225,29,72,0.3)] order-1 sm:order-2 transition-all hover:scale-105 active:scale-95 border-none"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removing...
                </div>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
