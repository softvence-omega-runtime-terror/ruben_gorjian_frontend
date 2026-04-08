import { useEffect, useRef, useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  const toast = ({ title, description, variant = 'default' }: Toast) => {
    // Simple console logging for now - can be enhanced with actual toast UI later
    if (variant === 'destructive') {
      console.error(`Toast Error: ${title}`, description);
    } else {
      console.log(`Toast: ${title}`, description);
    }
    
    // Add to toasts array (for future UI implementation)
    setToasts(prev => [...prev, { title, description, variant }]);
    
    // Auto-remove after 3 seconds
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
    timeoutsRef.current.push(timeoutId);
  };

  return { toast, toasts };
}
