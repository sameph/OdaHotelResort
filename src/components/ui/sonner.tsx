import { Toaster as Sonner } from "sonner";
import type { ComponentProps } from "react";

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group font-sans text-sm rounded-none border shadow-luxury backdrop-blur-sm",
          title: "font-medium tracking-wide",
          description: "text-xs opacity-80 mt-0.5",
          closeButton:
            "!border-border/40 !bg-background/80 hover:!bg-muted transition-colors",
          success:
            "!bg-[oklch(0.97_0.02_158)] !text-[oklch(0.28_0.06_158)] !border-[oklch(0.7_0.08_158)/40]",
          error:
            "!bg-[oklch(0.97_0.02_27)] !text-[oklch(0.45_0.18_27)] !border-[oklch(0.55_0.22_27)/30]",
          warning:
            "!bg-[oklch(0.97_0.04_85)] !text-[oklch(0.45_0.1_85)] !border-[oklch(0.76_0.13_88)/40]",
          info:
            "!bg-[oklch(0.97_0.01_240)] !text-[oklch(0.35_0.08_240)] !border-[oklch(0.6_0.1_240)/30]",
          actionButton:
            "!bg-[oklch(0.33_0.055_158)] !text-[oklch(0.985_0.005_85)] text-xs uppercase tracking-[0.15em] !rounded-none px-4 py-2 hover:!bg-[oklch(0.76_0.13_88)] hover:!text-[oklch(0.2_0.03_158)] transition-colors",
          cancelButton:
            "!bg-transparent !border !border-border !text-muted-foreground text-xs uppercase tracking-[0.15em] !rounded-none px-4 py-2 hover:!bg-muted/50 transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
