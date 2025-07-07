import React from "react";
import type { User } from "../type";
import {
  isAccountRestricted,
  getAccountStatusMessage,
  getAccountStatusColor,
} from "../utils/accountStatus";

interface AccountStatusWarningProps {
  user: User | null;
}

export const AccountStatusWarning: React.FC<AccountStatusWarningProps> = ({
  user,
}) => {
  if (!user || !isAccountRestricted(user)) return null;

  return (
    <div
      className={`p-4 rounded-lg border ${getAccountStatusColor(
        user.accountStatus || "active"
      )}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">⚠️</span>
        <span className="font-medium">Account Restricted</span>
      </div>
      <p className="mt-1 text-sm">
        {getAccountStatusMessage(user.accountStatus || "active")}
      </p>
    </div>
  );
};
