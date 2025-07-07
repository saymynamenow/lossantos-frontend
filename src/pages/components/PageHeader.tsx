import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Page, User } from "../../type";
import {
  CheckCircledIcon,
  PersonIcon,
  EyeOpenIcon,
  GearIcon,
  Share1Icon,
  ClockIcon,
} from "@radix-ui/react-icons";
import PendingRequestsModal from "./PendingRequestsModal";
import { canUserJoinPage, canUserFollowUser } from "../../utils/accountStatus";
import { AccountStatusWarning } from "../../components/AccountStatusWarning";

interface PageHeaderProps {
  page: Page;
  currentUser?: User | null;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  onShare?: () => void;
  onPageUpdate?: (updatedPage: Page) => void;
  isOwner?: boolean;
  isFollowing?: boolean;
  currentUserRole?: "member" | "admin" | "moderator" | "none";
  hasPendingRequest?: boolean; // New prop to indicate if user has pending request
  pendingRequestsCount?: number; // New prop for pending requests count
}

const PageHeader: React.FC<PageHeaderProps> = ({
  page,
  currentUser,
  onFollow,
  onUnfollow,
  onJoin,
  onLeave,
  onShare,
  isOwner = false,
  isFollowing = false,
  currentUserRole = "none",
  hasPendingRequest = false,
  pendingRequestsCount = 0,
}) => {
  const navigate = useNavigate();
  const [showPendingRequestsModal, setShowPendingRequestsModal] =
    useState(false);

  const isMember = currentUserRole !== "none";
  const canEdit = isOwner || currentUserRole === "admin";
  const canManageRequests =
    isOwner || currentUserRole === "admin" || currentUserRole === "moderator";

  // Check account status restrictions
  const canJoinPage = canUserJoinPage(currentUser || null);
  const canFollowPage = canUserFollowUser(currentUser || null);

  const url = import.meta.env.VITE_UPLOADS_URL;

  const handlePrimaryAction = () => {
    if (isOwner || currentUserRole === "admin") {
      navigate(`/page/${page.id}/dashboard`);
    } else if (isMember) {
      onLeave?.();
    } else if (hasPendingRequest) {
      // Do nothing - request is pending
      return;
    } else if (isFollowing) {
      if (!canFollowPage) return; // Block if account is restricted
      onUnfollow?.();
    } else {
      if (!canJoinPage) return; // Block if account is restricted
      onJoin?.();
    }
  };

  const handleSecondaryAction = () => {
    if (!canFollowPage) return; // Block if account is restricted

    if (isFollowing && !isMember) {
      onUnfollow?.();
    } else if (!isFollowing && !isMember) {
      onFollow?.();
    }
  };

  const getPrimaryButtonText = () => {
    if (isOwner || currentUserRole === "admin") return "Manage Page";
    if (isMember) return "Leave Page";
    if (hasPendingRequest) return "Request Pending";
    return "Join Page";
  };

  const getPrimaryButtonStyle = () => {
    if (isOwner || currentUserRole === "admin")
      return "bg-blue-600 text-white hover:bg-blue-700";
    if (isMember) return "bg-red-600 text-white hover:bg-red-700";
    if (hasPendingRequest) return "bg-orange-500 text-white cursor-not-allowed";
    return "bg-blue-600 text-white hover:bg-blue-700";
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-400 to-blue-600">
        {page.coverImage ? (
          <img
            src={`${url}/${page.coverImage}`}
            alt={`${page.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
        )}
        <div className="absolute inset-0 bg-black/20" />

        {/* Dashboard button for owners and admins */}
        {canEdit && (
          <Link
            to={`/page/${page.id}/dashboard`}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
            title="Page Dashboard"
          >
            <GearIcon className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Page Info */}
      <div className="relative px-6 py-6">
        {/* Profile Picture */}
        <div className="absolute -top-12 left-6">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {page.profileImage ? (
              <img
                src={`${url}/${page.profileImage}`}
                alt={`${page.name} profile`}
                className="w-full h-full object-cover rounded-xl border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl md:text-3xl">
                  {page.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Verified Badge */}
            {page.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <CheckCircledIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Page Details */}
        <div className="ml-28 md:ml-36 pt-2">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                {page.name}
                {page.isVerified && (
                  <CheckCircledIcon className="w-6 h-6 text-blue-500 ml-2" />
                )}
              </h1>

              <p className="text-gray-600 font-medium mt-1">{page.category}</p>

              {page.description && (
                <p className="text-gray-700 mt-3 leading-relaxed">
                  {page.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-4 text-gray-600">
                {page._count.followers !== undefined && (
                  <div className="flex items-center space-x-2">
                    <PersonIcon className="w-4 h-4" />
                    <span className="font-medium">
                      {page._count.followers.toLocaleString()} followers
                    </span>
                  </div>
                )}

                {page._count.posts !== undefined && (
                  <div className="flex items-center space-x-2">
                    <EyeOpenIcon className="w-4 h-4" />
                    <span className="font-medium">
                      {page._count.posts} posts
                    </span>
                  </div>
                )}

                {currentUserRole !== "none" && currentUserRole !== "member" && (
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {currentUserRole.charAt(0).toUpperCase() +
                      currentUserRole.slice(1)}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {(page.website || page.email || page.phone || page.address) && (
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  {page.website && (
                    <div>
                      <span className="font-medium">Website:</span>{" "}
                      <a
                        href={page.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {page.website}
                      </a>
                    </div>
                  )}

                  {page.email && (
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      <a
                        href={`mailto:${page.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {page.email}
                      </a>
                    </div>
                  )}

                  {page.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {page.phone}
                    </div>
                  )}

                  {page.address && (
                    <div>
                      <span className="font-medium">Address:</span>{" "}
                      {page.address}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0 md:ml-6">
              <button
                onClick={handlePrimaryAction}
                disabled={
                  hasPendingRequest ||
                  (!canJoinPage &&
                    !isMember &&
                    !isOwner &&
                    currentUserRole === "none")
                }
                className={`px-6 py-2 font-medium rounded-lg transition-colors ${getPrimaryButtonStyle()} ${
                  (!canJoinPage &&
                    !isMember &&
                    !isOwner &&
                    currentUserRole === "none") ||
                  hasPendingRequest
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {hasPendingRequest && (
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                )}
                {getPrimaryButtonText()}
              </button>

              {/* Pending Requests Button for Admins/Owners/Moderators */}
              {canManageRequests && pendingRequestsCount > 0 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowPendingRequestsModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>Requests</span>
                    <span className="bg-orange-600 text-orange-100 text-xs px-2 py-1 rounded-full">
                      {pendingRequestsCount}
                    </span>
                  </button>
                </div>
              )}

              {/* Manage All Requests Button for Admins/Owners/Moderators */}

              {!isOwner && !isMember && !hasPendingRequest && (
                <button
                  onClick={handleSecondaryAction}
                  disabled={!canFollowPage}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                    isFollowing
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${!canFollowPage ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}

              <button
                onClick={onShare}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share page"
              >
                <Share1Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Warning */}
      {currentUser &&
        !canJoinPage &&
        !isMember &&
        !isOwner &&
        currentUserRole === "none" && (
          <div className="px-6 pb-6">
            <AccountStatusWarning user={currentUser} />
          </div>
        )}

      {/* Pending Requests Modal */}
      <PendingRequestsModal
        pageId={page.id}
        isOpen={showPendingRequestsModal}
        onClose={() => setShowPendingRequestsModal(false)}
        canManageRequests={canManageRequests}
      />
    </div>
  );
};

export default PageHeader;
