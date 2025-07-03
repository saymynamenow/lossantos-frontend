import React, { useState, useEffect } from "react";
import {
  PersonIcon,
  CheckIcon,
  Cross2Icon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import type { PageJoinRequest, PendingRequestsResponse } from "../../type";
import apiService from "../../services/api";

interface PendingRequestsModalProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  canManageRequests: boolean; // Only owners, admins, and moderators can manage requests
}

const PendingRequestsModal: React.FC<PendingRequestsModalProps> = ({
  pageId,
  isOpen,
  onClose,
  canManageRequests,
}) => {
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

  useEffect(() => {
    if (isOpen && canManageRequests) {
      fetchPendingRequests();
    }
  }, [isOpen, pageId, currentPage, canManageRequests]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PendingRequestsResponse =
        await apiService.page.getPendingRequests(pageId, currentPage, 20);

      setRequests(response.pendingRequests);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error: any) {
      console.error("Failed to fetch pending requests:", error);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (userId: string, userName: string) => {
    try {
      setProcessingRequest(userId);
      await apiService.page.approveJoinRequest(pageId, userId);

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.user.id !== userId));
      setTotalCount((prev) => prev - 1);

      // Show success message (you could use a toast notification here)
      alert(`${userName} has been approved to join the page!`);
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
      setTotalCount((prev) => prev - 1);

      // Show success message
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

  if (!isOpen) return null;

  // Access denied screen
  if (!canManageRequests) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to manage join requests. Only page owners,
            administrators, and moderators can approve or reject requests.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Okay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchPendingRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Requests
              </h3>
              <p className="text-gray-600">
                There are no join requests waiting for approval.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {request.user.profilePicture ? (
                          <img
                            src={`${url}/${request.user.profilePicture}`}
                            alt={request.user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <PersonIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {request.user.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">
                          {request.user.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          @{request.user.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleApproveRequest(
                            request.user.id,
                            request.user.name
                          )
                        }
                        disabled={processingRequest === request.user.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() =>
                          handleRejectRequest(
                            request.user.id,
                            request.user.name
                          )
                        }
                        disabled={processingRequest === request.user.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Cross2Icon className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({totalCount} total requests)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                {currentPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRequestsModal;
