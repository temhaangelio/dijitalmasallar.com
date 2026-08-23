import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold", {
  variants: {
    variant: {
      neutral: "bg-surface-3 text-ink-2",
      solid: "bg-ink text-white",
      outline: "border border-line-strong bg-surface text-ink",
      danger: "bg-danger-surface text-danger",
      success: "bg-success-surface text-success",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
