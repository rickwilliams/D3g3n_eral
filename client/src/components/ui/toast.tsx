import * as React from "react";
import { createContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast, ToastOptions } from "./use-toast";
import { cva, type VariantProps } from "class-variance-authority";

const ToastVariants = cva(
  "fixed group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-5 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-background border",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const ToastContext = createContext<{
  toasts: Toast[];
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: Toast = { id, ...options };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ToastVariants> {
  variant?: "default" | "destructive";
}

export function Toaster() {
  const { toasts, dismiss } = React.useContext(ToastContext);

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2 max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
          title={toast.title}
          description={toast.description}
          action={toast.action}
        />
      ))}
    </div>
  );
}

export function Toast({
  className,
  variant,
  onClose,
  title,
  description,
  action,
  ...props
}: ToastProps & {
  onClose: () => void;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(ToastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {action}
      <button
        onClick={onClose}
        className="rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

export type ToastActionElement = React.ReactElement<{
  onPress: () => void;
}>;

interface ToastActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  altText?: string;
}

export function ToastAction({ 
  className, 
  children, 
  altText,
  ...props 
}: ToastActionProps) {
  return (
    <button 
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className
      )} 
      {...props}
    >
      {children}
      {altText && <span className="sr-only">{altText}</span>}
    </button>
  );
}

// Add missing components that toaster.tsx is trying to import
export function ToastClose({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none",
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}

export function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm font-medium", className)} {...props} />;
}

export function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />;
}

export function ToastViewport(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2 max-w-[420px]"
      {...props}
    />
  );
}

export { ToastContext };
