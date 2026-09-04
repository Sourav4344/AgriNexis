import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:bg-emerald-800",
      secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:bg-black",
      outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 active:bg-slate-100",
      ghost: "hover:bg-slate-100 text-slate-700 active:bg-slate-200",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:bg-rose-800",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-lg font-medium",
      md: "px-4 py-2 text-sm rounded-lg font-semibold",
      lg: "px-5 py-2.5 text-base rounded-xl font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
