import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  Cross2Icon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import type {
  PageJoinRequest,
  PendingRequestsResponse,
  User,
} from "../../type";
import apiService from "../../services/api";

interface PagePendingRequestsManagementProps {
  pageId: string;
  currentUser: User;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
  pendingRequestsCount: number;
  onRequestsCountChange: (count: number) => void;
}

const PagePendingRequestsManagement: React.FC<
  PagePendingRequestsManagementProps
> = ({ pageId, currentUserRole, isOwner, onRequestsCountChange }) => {
  const [requests, setRequests] = useState<PageJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  const url = import.meta.env.VITE_UPLOADS_URL;
  const canManageRequests =
    isOwner || currentUserRole === "admin" || currentUserRole === "moderator";

  useEffect(() => {
    if (canManageRequests) {
      fetchPendingRequests();
    }
  }, [pageId, currentPage, canManageRequests]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PendingRequestsResponse =
        await apiService.page.getPendingRequests(pageId, currentPage, 20);

      setRequests(response.pendingRequests);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      onRequestsCountChange(response.pagination.totalCount);
    } catch (error: any) {
      console.error("Failed to fetch pending requests:", error);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      setProcessingRequest(userId);
      await apiService.page.approveJoinRequest(pageId, userId);

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.user.id !== userId));
      setTotalCount((prev) => {
        const newCount = prev - 1;
        onRequestsCountChange(newCount);
        return newCount;
      });
    } catch (error: any) {
      console.error("Failed to approve request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (userId: string, userName: string) => {
    try {
      setProcessingRequest(userId);
      await apiService.page.rejectJoinRequest(pageId, userId);

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.user.id !== userId));
      setTotalCount((prev) => {
        const newCount = prev - 1;
        onRequestsCountChange(newCount);
        return newCount;
      });

      alert(`${userName}'s join request has been rejected.`);
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!canManageRequests) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to manage join requests. Only page owners,
            administrators, and moderators can approve or reject requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Join Requests
            </h2>
            {totalCount > 0 && (
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full">
                {totalCount}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Review and manage requests from users who want to join your page
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Requests
              </h3>
              <p className="text-gray-600">
                All join requests have been reviewed. New requests will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        request.user.profilePicture
                          ? `${url}/${request.user.profilePicture}`
                          : "/default-avatar.png"
                      }
                      alt={request.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.user.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        @{request.user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveRequest(request.user.id)}
                      disabled={processingRequest === request.user.id}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleRejectRequest(request.user.id, request.user.name)
                      }
                      disabled={processingRequest === request.user.id}
                      className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Cross2Icon className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing page {currentPage} of {totalPages} ({totalCount} total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagePendingRequestsManagement;
