import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-neutral-800 active:bg-neutral-700",
        secondary: "bg-surface-2 text-ink hover:bg-line active:bg-line-strong",
        ghost: "bg-transparent text-ink-2 hover:bg-surface hover:text-ink active:bg-surface-2",
        outline: "border border-line-strong bg-surface text-ink hover:bg-surface-2 active:bg-line",
        /** Low-emphasis destructive action, e.g. a sign-out button inside a card. */
        destructive: "bg-danger-surface text-danger hover:bg-danger-surface-2 active:bg-danger-surface-2",
        /** High-emphasis destructive action: the confirm button of a delete dialog. */
        danger: "bg-danger text-white hover:bg-danger-strong active:bg-danger-strong",
      },
      size: { sm: "min-h-11 px-4 text-[13px]", md: "min-h-11 px-5 text-sm", lg: "min-h-12 px-6 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

// `type` is intentionally not defaulted: several call sites rely on the native submit behaviour.
export function Button({ className, variant, size, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
