import * as React from "react"
import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("inline-flex items-center", className)}
    {...props}
  />
))
ButtonGroup.displayName = "ButtonGroup"

const ButtonGroupText = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center border-y border-white/20 bg-white/10 px-3 text-sm font-medium text-white backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupText }
