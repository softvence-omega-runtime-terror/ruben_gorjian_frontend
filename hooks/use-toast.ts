import { useCallback, useMemo } from "react";
import { toast as sonnerToast } from "sonner";

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description: description,
      });
    } else {
      sonnerToast.success(title, {
        description: description,
      });
    }
  }, []);

  return useMemo(() => ({ toast }), [toast]);
}


