import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

const variantConfig: Record<
  DialogVariant,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    confirmBtn: string;
    accentLine: string;
  }
> = {
  danger: {
    icon: <Trash2 className="h-5 w-5" />,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    confirmBtn: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    accentLine: "bg-destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    iconBg: "bg-gold/15",
    iconColor: "text-gold",
    confirmBtn: "bg-forest-deep text-white hover:bg-gold hover:text-gold-foreground",
    accentLine: "bg-gold",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    iconBg: "bg-forest-deep/10",
    iconColor: "text-forest-deep",
    confirmBtn: "bg-forest-deep text-white hover:bg-forest",
    accentLine: "bg-forest-deep",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[92vw] max-w-md translate-x-[-50%] translate-y-[-50%]",
            "border border-border/80 bg-background shadow-luxury",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "overflow-hidden focus:outline-none",
          )}
        >
          {/* Brand Accent line */}
          <div className={cn("h-1 w-full", cfg.accentLine)} />

          <div className="p-6 sm:p-7">
            {/* Header: Icon + Title + Description */}
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "shrink-0 rounded-full p-2.5 mt-0.5 flex items-center justify-center",
                  cfg.iconBg,
                  cfg.iconColor,
                )}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialogPrimitive.Title className="font-serif text-2xl text-forest-deep leading-snug">
                  {title}
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </AlertDialogPrimitive.Description>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <AlertDialogPrimitive.Cancel
                disabled={isLoading}
                className="inline-flex items-center justify-center border border-border bg-background px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-medium transition-colors shadow-sm disabled:opacity-50",
                  cfg.confirmBtn,
                )}
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  confirmLabel
                )}
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
