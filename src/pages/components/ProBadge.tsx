import React from "react";

interface ProBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProBadge: React.FC<ProBadgeProps> = ({ size = "md", className = "" }) => {
  const sizeConfig = {
    sm: {
      padding: "px-1 py-0.5",
      fontSize: "text-xs",
      text: "PRO",
    },
    md: {
      padding: "px-2 py-1",
      fontSize: "text-xs",
      text: "PRO",
    },
    lg: {
      padding: "px-3 py-1",
      fontSize: "text-sm",
      text: "PRO",
    },
  };

  const config = sizeConfig[size];

  return (
    <span
      title="Pro User"
      className={`inline-flex items-center ${className}`}
      style={{ verticalAlign: "middle" }}
    >
      <div
        className={`bg-gradient-to-r from-blue-400 to-green-500 text-white ${config.padding} rounded-full ${config.fontSize} font-bold border border-yellow-300 shadow-sm`}
      >
        {config.text}
      </div>
    </span>
  );
};

export default ProBadge;
