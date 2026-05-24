import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/95 border border-primary-dark shadow-sm active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-white/[0.04] active:scale-95",
        secondary:
          "bg-secondary border border-border text-foreground hover:bg-secondary/80 active:scale-95",
        ghost: "text-foreground hover:bg-white/[0.06] active:scale-95",
        link: "text-primary underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-12 px-6 py-3 text-base lg:h-10 lg:px-4 lg:py-2 lg:text-sm",
        sm: "h-11 rounded-lg px-4 text-xs lg:h-8 lg:px-3",
        lg: "h-14 rounded-2xl px-8 text-lg lg:h-10 lg:px-8 lg:text-base",
        icon: "h-12 w-12 lg:h-9 lg:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant = "default", size, asChild = false, style, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={style}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
