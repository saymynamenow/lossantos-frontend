import React from "react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeConfig = {
    sm: { width: 12, height: 12, strokeWidth: "2" },
    md: { width: 15, height: 15, strokeWidth: "2.5" },
    lg: { width: 24, height: 24, strokeWidth: "2.5" },
  };

  const config = sizeConfig[size];

  return (
    <span
      title="Verified"
      className={`inline-flex items-center ${className}`}
      style={{ verticalAlign: "middle" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={config.width}
        height={config.height}
        viewBox="0 0 24 24"
        className="inline-block"
      >
        {/* Filled blue badge with white border */}
        <circle
          cx="12"
          cy="12"
          r="12"
          fill="#1877F2"
          stroke="#fff"
          strokeWidth="2"
        />
        {/* Filled white checkmark */}
        <path
          d="M17.5 8.5l-6 6-3-3"
          stroke="#fff"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
