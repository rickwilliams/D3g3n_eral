// Adapted from shadcn/ui toast component
import { useContext } from "react";
import { ToastActionElement, ToastContext } from "./toast";

export const useToast = () => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

export type ToastOptions = Pick<Toast, "title" | "description" | "action" | "variant">; 