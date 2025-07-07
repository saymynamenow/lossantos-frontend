import type { User } from "../type";

export const isAccountRestricted = (user: User | null): boolean => {
  if (!user) return true;

  const restrictedStatuses = ["pending", "suspend", "inactive"];
  return restrictedStatuses.includes(user.accountStatus || "active");
};

export const canUserPost = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserComment = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserReact = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserCreatePage = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserJoinPage = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserFollowUser = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const canUserSendFriendRequest = (user: User | null): boolean => {
  return !isAccountRestricted(user);
};

export const getAccountStatusMessage = (accountStatus: string): string => {
  switch (accountStatus) {
    case "pending":
      return "Your account is pending verification. You can view content but cannot post, comment, or perform other actions until your account is verified.";
    case "suspend":
      return "Your account has been suspended. You can view content but cannot post, comment, or perform other actions.";
    case "inactive":
      return "Your account is inactive. You can view content but cannot post, comment, or perform other actions.";
    default:
      return "";
  }
};

export const getAccountStatusColor = (accountStatus: string): string => {
  switch (accountStatus) {
    case "pending":
      return "bg-yellow-50 border-yellow-300 text-yellow-700";
    case "suspend":
      return "bg-red-50 border-red-300 text-red-700";
    case "inactive":
      return "bg-gray-50 border-gray-300 text-gray-700";
    default:
      return "bg-green-50 border-green-300 text-green-700";
  }
};

// Component to show account status warning
export const AccountStatusWarning = ({ user }: { user: User | null }) => {
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
