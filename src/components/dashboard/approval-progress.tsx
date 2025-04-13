"use client"

import { cn } from "@/lib/utils"

interface ApprovalStep {
  label: string
  status: "pending" | "approved" | "current"
  description?: string
}

interface ApprovalProgressProps {
  steps: ApprovalStep[]
  className?: string
}

export function ApprovalProgress({ steps, className }: ApprovalProgressProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                {
                  "bg-black text-white": step.status === "approved",
                  "border-2 border-black": step.status === "current",
                  "border-2 border-gray-300": step.status === "pending",
                }
              )}
            >
              {step.status === "approved" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-xs mt-1">{step.label}</span>
            {step.description && (
              <span className="text-xs text-gray-500">{step.description}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn("h-[2px] flex-1 mx-2", {
                "bg-black": step.status === "approved",
                "bg-gray-300": step.status !== "approved",
              })}
            />
          )}
        </div>
      ))}
    </div>
  )
} 