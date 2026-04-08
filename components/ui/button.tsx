import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-purple-500/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 hover:opacity-95 active:scale-[0.98] after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-full after:pointer-events-none",

        shiny:
          "relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white shadow-lg shadow-purple-500/40 hover:shadow-pink-500/50 active:scale-[0.98] after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-full after:pointer-events-none",

        outline:
          "border-primary/20 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/30 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5",

        secondary:
          "bg-primary/5 text-primary hover:bg-primary/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",

        glass:
          "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",

        ghost:
          "hover:bg-primary/5 hover:text-primary",

        destructive:
          "bg-red-500/10 text-red-500 hover:bg-red-500/20",

        link:
          "text-indigo-600 hover:underline underline-offset-4",
      },

      size: {
        default:
          "h-9 gap-2.5 px-4",

        xs:
          "h-6 px-2 text-xs",

        sm:
          "h-8 px-3 text-sm",

        lg:
          "h-11 px-6 text-base",

        icon:
          "h-9 w-9",

        "icon-sm":
          "h-8 w-8",

        "icon-lg":
          "h-11 w-11",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {

  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {props.children}
    </Comp>
  )
}

export { Button, buttonVariants }