import React, { useState, useEffect } from "react";
import { PersonIcon, TrashIcon, BadgeIcon } from "@radix-ui/react-icons";
import type { User } from "../../type";
import apiService from "../../services/api";

interface PageMembersManagementProps {
  pageId: string;
  currentUser: User;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
}

interface PageMember {
  id: string;
  name: string;
  username: string;
  profilePicture?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
}

const PageMembersManagement: React.FC<PageMembersManagementProps> = ({
  pageId,
  currentUser,
  currentUserRole,
  isOwner,
}) => {
  const [members, setMembers] = useState<PageMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = import.meta.env.VITE_UPLOADS_URL;
  const canManageMembers = isOwner || currentUserRole === "admin";

  useEffect(() => {
    fetchMembers();
  }, [pageId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await apiService.page.getPageMembers(pageId);
      setMembers(response.members || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "moderator":
        return "bg-yellow-100 text-yellow-800";
      case "member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <BadgeIcon className="w-3 h-3" />;
      case "moderator":
        return <BadgeIcon className="w-3 h-3" />;
      default:
        return <PersonIcon className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <PersonIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Page Members
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {members.length}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Manage page members and their roles
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-12">
              <PersonIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Members Yet
              </h3>
              <p className="text-gray-600">
                Page members will appear here once they join.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {member.profilePicture ? (
                      <img
                        src={
                          member.profilePicture
                            ? `${url}/${member.profilePicture}`
                            : undefined
                        }
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                          (
                            e.currentTarget.nextSibling as HTMLElement
                          )?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center${
                        member.profilePicture ? " hidden" : ""
                      }`}
                    >
                      <PersonIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        @{member.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </span>

                    {canManageMembers && member.id !== currentUser.id && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={member.role}
                          onChange={(e) => {
                            // Handle role change
                            console.log(
                              `Change ${member.name} role to ${e.target.value}`
                            );
                          }}
                          className="text-sm border text-black border-gray-300 rounded px-2 py-1"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          {isOwner && <option value="admin">Admin</option>}
                        </select>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to remove ${member.name} from the page?`
                              )
                            ) {
                              // Handle member removal
                              console.log(`Remove ${member.name}`);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Remove member"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageMembersManagement;
