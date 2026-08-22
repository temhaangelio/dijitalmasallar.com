import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-black !text-white hover:bg-neutral-800",
      secondary: "bg-[#f5f5f5] text-black hover:bg-[#ececec]",
      ghost: "bg-transparent text-[#4a4a4a] hover:bg-white hover:text-black",
      outline: "border border-[#dedede] bg-white text-black hover:bg-[#f7f7f7]",
      destructive: "bg-[#fff1f0] text-[#b42318] hover:bg-[#fee4e2]",
    },
    size: { sm: "min-h-9 px-4 text-[13px]", md: "min-h-11 px-5", lg: "min-h-12 px-6" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
