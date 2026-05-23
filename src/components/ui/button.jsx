import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — solid orange gradient with inner glow
        default:
          "text-white active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95",
        // Glass — frosted translucent panel
        outline:
          "border border-transparent text-foreground active:scale-95 backdrop-blur-[20px]",
        secondary:
          "text-foreground active:scale-95 backdrop-blur-[20px]",
        ghost: "text-foreground hover:bg-white/[0.06] active:scale-95",
        link: "text-primary underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-12 px-6 py-3 text-base lg:h-10 lg:px-4 lg:py-2 lg:text-sm",
        sm: "h-10 rounded px-4 text-xs lg:h-8 lg:px-3",
        lg: "h-14 rounded px-8 text-lg lg:h-10 lg:px-8 lg:text-base",
        icon: "h-12 w-12 lg:h-9 lg:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Variant-specific inline styles for glass/gradient effects
const variantStyles = {
  default: {
    background: "linear-gradient(160deg, #FF8533 0%, #FF6B00 60%, #E05A00 100%)",
    boxShadow: "0 0 0 1px rgba(255,107,0,0.4), 0 0 16px rgba(255,107,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
  },
  outline: {
    background: "linear-gradient(rgba(26,26,26,0.65), rgba(26,26,26,0.65)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04)) border-box",
  },
  secondary: {
    background: "linear-gradient(rgba(26,26,26,0.65), rgba(26,26,26,0.65)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)) border-box",
    border: "1px solid transparent",
  },
}

const Button = React.forwardRef(({ className, variant = "default", size, asChild = false, style, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const vs = variantStyles[variant] || {}
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={{ ...vs, ...style }}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
