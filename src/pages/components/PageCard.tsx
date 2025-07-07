import React from "react";
import type { Page, User } from "../../type";
import {
  CheckCircledIcon,
  PersonIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import { canUserFollowUser } from "../../utils/accountStatus";

interface PageCardProps {
  page: Page;
  onFollow?: (pageId: string) => void;
  onUnfollow?: (pageId: string) => void;
  isFollowing?: boolean;
  showActions?: boolean;
  size?: "small" | "medium" | "large";
  currentUser?: User | null;
}

const PageCard: React.FC<PageCardProps> = ({
  page,
  onFollow,
  onUnfollow,
  isFollowing = false,
  showActions = true,
  size = "medium",
  currentUser,
}) => {
  const navigate = useNavigate();
  const url = import.meta.env.VITE_UPLOADS_URL;

  const isOwner = currentUser && page.ownerId === currentUser.id;
  const canFollow = canUserFollowUser(currentUser || null);

  const handlePageClick = () => {
    navigate(`/page/${page.id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canFollow) return; // Block if account is restricted

    if (isFollowing && onUnfollow) {
      onUnfollow(page.id);
    } else if (!isFollowing && onFollow) {
      onFollow(page.id);
    }
  };

  const sizeClasses = {
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  const imageSizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-20 h-20",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 ${sizeClasses[size]}`}
      onClick={handlePageClick}
    >
      {/* Cover Photo */}
      {page.coverImage && (
        <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden rounded-t-xl">
          <img
            src={`${url}/${page.coverImage}`}
            alt={`${page.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className={`relative flex-shrink-0 ${imageSizeClasses[size]}`}>
          {page.profileImage ? (
            <img
              src={`${url}/${page.profileImage}`}
              alt={`${page.name} profile`}
              className="w-full h-full object-cover rounded-xl border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-white font-bold text-lg">
                {page.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Verified Badge */}
          {page.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
              <CheckCircledIcon className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Page Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate flex items-center">
                {page.name}
                {page.isVerified && (
                  <CheckCircledIcon className="w-4 h-4 text-blue-500 ml-1 flex-shrink-0" />
                )}
              </h3>

              <p className="text-sm text-gray-600 font-medium mb-1">
                {page.category}
              </p>

              {page.description && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {page.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {page._count.followers !== undefined && (
                  <div className="flex items-center space-x-1">
                    <PersonIcon className="w-3 h-3" />
                    <span>
                      {page._count.followers.toLocaleString()} followers
                    </span>
                  </div>
                )}

                {page._count.posts !== undefined && (
                  <div className="flex items-center space-x-1">
                    <EyeOpenIcon className="w-3 h-3" />
                    <span>{page._count.posts} posts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button or Owner Badge */}
            {showActions && !isOwner && (
              <button
                onClick={handleFollowClick}
                disabled={!canFollow}
                className={`ml-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } ${!canFollow ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
            {showActions && isOwner && (
              <div className="ml-3 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                Owner
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {(page.website || page.address) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-1 text-xs text-gray-500">
            {page.website && (
              <div className="truncate">
                <span className="font-medium">Website:</span>{" "}
                <a
                  href={page.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {page.website}
                </a>
              </div>
            )}

            {page.address && (
              <div className="truncate">
                <span className="font-medium">Address:</span> {page.address}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageCard;
