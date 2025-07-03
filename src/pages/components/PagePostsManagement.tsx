import React from "react";
import { FileTextIcon, EyeOpenIcon, HeartIcon } from "@radix-ui/react-icons";
import type { User } from "../../type";

interface PagePostsManagementProps {
  pageId: string;
  currentUser: User;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
}

const PagePostsManagement: React.FC<PagePostsManagementProps> = ({
  pageId,
  currentUser,
  currentUserRole,
  isOwner,
}) => {
  const canManagePosts = isOwner || currentUserRole === "admin";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileTextIcon className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Posts Management
            </h2>
          </div>
          <p className="text-gray-600 mt-1">
            Manage and moderate page posts and content
          </p>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Posts Management Coming Soon
            </h3>
            <p className="text-gray-600">
              Advanced post management features will be available here.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileTextIcon className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Posts
                  </p>
                  <p className="text-xl font-bold text-gray-900">--</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <EyeOpenIcon className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Views
                  </p>
                  <p className="text-xl font-bold text-gray-900">--</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HeartIcon className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Likes
                  </p>
                  <p className="text-xl font-bold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagePostsManagement;
