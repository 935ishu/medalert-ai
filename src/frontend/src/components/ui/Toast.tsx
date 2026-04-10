import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "bg-card border-border text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

// Re-export toast from sonner for convenience
export { toast } from "sonner";
