import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "secondary", size = "md", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4ade80]/50 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-[#111111] text-[#4ade80] border border-[#1c1c1c] hover:border-[#2c2c2c]",
      secondary: "bg-[#111111] text-[#e5e5e5] border border-[#1c1c1c] hover:border-[#2c2c2c]",
      ghost: "text-[#737373] hover:text-[#e5e5e5] hover:bg-[#111111]",
      danger: "bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900/70",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };
    return (
      <button ref={ref} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
    );
  }
);
Button.displayName = "Button";
export { Button };
