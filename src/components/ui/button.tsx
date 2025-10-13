"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500":
            variant === "default",
          "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900":
            variant === "outline",
          "bg-transparent text-gray-300 hover:text-white hover:bg-white/10":
            variant === "ghost",
        },
        {
          "h-10 px-4 text-sm": size === "default",
          "h-8 px-3 text-xs": size === "sm",
          "h-12 px-6 text-base": size === "lg",
          "h-10 w-10 p-0": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}
