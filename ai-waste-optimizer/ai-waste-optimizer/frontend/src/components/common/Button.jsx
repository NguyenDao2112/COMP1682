import React from "react";

/**
 * Reusable Button component with various styles
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'success'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} fullWidth - Full width button
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {React.ReactNode} children - Button content
 */
function Button({ 
  variant = "primary", 
  size = "medium", 
  fullWidth = false, 
  onClick, 
  disabled = false, 
  children,
  className = "",
  ...props 
}) {
  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
  };

  const sizeStyles = {
    small: { padding: "8px 16px", fontSize: "12px" },
    medium: { padding: "12px 20px", fontSize: "14px" },
    large: { padding: "14px 28px", fontSize: "16px" },
  };

  const variantStyles = {
    primary: {
      background: "linear-gradient(135deg, #10b981, #34d399)",
      color: "white",
      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.1)",
      color: "white",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444, #f87171)",
      color: "white",
      boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
    },
    success: {
      background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
      color: "white",
      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    },
  };

  const style = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      style={style}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;