import React, { useState, useEffect } from "react";
import {
  PersonIcon,
  EyeOpenIcon,
  FileTextIcon,
  ClockIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import type { Page, User } from "../../type";
import apiService from "../../services/api";

interface PageDashboardOverviewProps {
  page: Page;
  currentUser: User;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
  pendingRequestsCount: number;
}

interface PageStats {
  memberCount: number;
  postCount: number;
  followerCount: number;
}

const PageDashboardOverview: React.FC<PageDashboardOverviewProps> = ({
  page,
  currentUser,
  currentUserRole,
  isOwner,
  pendingRequestsCount,
}) => {
  const [stats, setStats] = useState<PageStats>({
    memberCount: 0,
    postCount: 0,
    followerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch page members
        const membersData = await apiService.page.getPageMembers(page.id);
        // Fetch page posts
        const postsData = await apiService.page.getPagePosts(page.id, 1, 1);

        setStats({
          memberCount: membersData.pagination.totalMembers || 0,
          postCount: postsData.pagination.totalPosts || 0,
          followerCount: page._count.followers || 0,
        });

        // Mock recent activity data
        setRecentActivity([
          {
            id: 1,
            type: "join_request",
            message: "New join request from John Doe",
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          },
          {
            id: 2,
            type: "new_post",
            message: "New post published: 'Check out our latest update'",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          },
          {
            id: 3,
            type: "new_member",
            message: "Jane Smith joined the page",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch page stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [page.id]);
  console.log(page);
  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "join_request":
        return <ClockIcon className="w-4 h-4 text-orange-500" />;
      case "new_post":
        return <FileTextIcon className="w-4 h-4 text-blue-500" />;
      case "new_member":
        return <PersonIcon className="w-4 h-4 text-green-500" />;
      default:
        return <StarIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <PersonIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.memberCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <EyeOpenIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Followers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.followerCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileTextIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.postCount}
              </p>
            </div>
          </div>
        </div>

        {/* Only show pending requests card to admin and owner */}
        {(isOwner || currentUserRole === "admin") && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingRequestsCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Only show pending requests for admin and owner, not moderators */}
            {pendingRequestsCount > 0 &&
              (isOwner || currentUserRole === "admin") && (
                <button className="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Review Requests
                      </p>
                      <p className="text-sm text-gray-500">
                        {pendingRequestsCount} pending
                      </p>
                    </div>
                    <ClockIcon className="w-5 h-5 text-orange-500" />
                  </div>
                </button>
              )}

            {/* Allow moderators to create posts */}
            {(isOwner ||
              currentUserRole === "admin" ||
              currentUserRole === "moderator") && (
              <button className="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Create Post</p>
                    <p className="text-sm text-gray-500">Share new content</p>
                  </div>
                  <FileTextIcon className="w-5 h-5 text-blue-500" />
                </div>
              </button>
            )}

            {/* Only allow admin and owner to edit page settings */}
            {(isOwner || currentUserRole === "admin") && (
              <button className="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Edit Page</p>
                    <p className="text-sm text-gray-500">Update details</p>
                  </div>
                  <StarIcon className="w-5 h-5 text-purple-500" />
                </div>
              </button>
            )}

            {/* Show members view for moderators */}
            {currentUserRole === "moderator" && (
              <button className="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">View Members</p>
                    <p className="text-sm text-gray-500">See page members</p>
                  </div>
                  <PersonIcon className="w-5 h-5 text-green-500" />
                </div>
              </button>
            )}

            {/* Show posts view for moderators */}
            {currentUserRole === "moderator" && (
              <button className="p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">View Posts</p>
                    <p className="text-sm text-gray-500">Browse page posts</p>
                  </div>
                  <FileTextIcon className="w-5 h-5 text-blue-500" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page Info */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Page Information
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-600">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {page.createdAt
                  ? new Date(page.createdAt).toLocaleDateString()
                  : "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {page.category || "General"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Privacy</dt>
              <dd className="mt-1 text-sm text-gray-900">Public</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Your Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isOwner ? "Owner" : currentUserRole}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default PageDashboardOverview;
