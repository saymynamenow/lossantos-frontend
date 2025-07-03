import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import type { PageJoinRequest, PendingRequestsResponse } from "../../type";
import apiService from "../../services/api";

const MyPendingRequests: React.FC = () => {
  const [requests, setRequests] = useState<PageJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const url = import.meta.env.VITE_UPLOADS_URL;

  useEffect(() => {
    fetchMyPendingRequests();
  }, [currentPage]);

  const fetchMyPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PendingRequestsResponse =
        await apiService.page.getMyPendingRequests(currentPage, 20);

      setRequests(response.pendingRequests);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error: any) {
      console.error("Failed to fetch my pending requests:", error);
      setError("Failed to load your pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            My Pending Requests
          </h2>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse"
            >
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            My Pending Requests
          </h2>
        </div>

        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchMyPendingRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ClockIcon className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            My Pending Requests
          </h2>
          {totalCount > 0 && (
            <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Pending Requests
          </h3>
          <p className="text-gray-600">
            You don't have any pending join requests at the moment.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {request.page?.profileImage ? (
                      <img
                        src={`${url}/${request.page.profileImage}`}
                        alt={request.page.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {request.page?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {request.page?.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircledIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {request.page?.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      {request.page?.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested on{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {request.page?.owner && (
                      <p className="text-xs text-gray-500 mt-1">
                        Owner: {request.page.owner.name} (@
                        {request.page.owner.username})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
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
        </>
      )}
    </div>
  );
};

export default MyPendingRequests;
