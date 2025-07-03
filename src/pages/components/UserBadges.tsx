import React from "react";
import VerifiedBadge from "./VerifiedBadge";
import ProBadge from "./ProBadge";

interface UserBadgesProps {
  isVerified?: boolean;
  isPro?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  spacing?: "tight" | "normal" | "loose";
}

const UserBadges: React.FC<UserBadgesProps> = ({
  isVerified,
  isPro,
  size = "sm",
  className = "",
  spacing = "normal",
}) => {
  const spacingConfig = {
    tight: "ml-0.5",
    normal: "ml-1",
    loose: "ml-2",
  };

  const spacingClass = spacingConfig[spacing];

  if (!isVerified && !isPro) {
    return null;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      {isVerified && <VerifiedBadge size={size} className={spacingClass} />}
      {isPro && <ProBadge size={size} className={spacingClass} />}
    </span>
  );
};

export default UserBadges;
