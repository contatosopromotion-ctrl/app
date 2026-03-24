import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-brand-600 hover:bg-brand-700 text-white border-transparent disabled:bg-brand-400",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border-transparent disabled:bg-gray-50 disabled:text-gray-400",
  danger: "bg-red-600 hover:bg-red-700 text-white border-transparent disabled:bg-red-400",
  outline: "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 disabled:bg-gray-50 disabled:text-gray-400",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg border
          transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
          disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
