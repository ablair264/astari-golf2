import { cn } from "@/lib/utils"

export function Logo({ className }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="#303843" />
      <text
        x="50"
        y="65"
        fontSize="48"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui"
      >
        A
      </text>
    </svg>
  )
}
