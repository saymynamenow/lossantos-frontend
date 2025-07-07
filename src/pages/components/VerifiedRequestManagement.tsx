import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircledIcon,
  EyeOpenIcon,
  CheckIcon,
  Cross2Icon,
  PersonIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import UserBadges from "./UserBadges";
import apiService from "../../services/api";

interface VerificationRequest {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    profilePicture?: string | null;
    isVerified: boolean;
    isPro?: boolean;
    stats?: {
      posts: number;
      followers: number;
      following: number;
    };
  };
  requestType: "verified" | "pro";
  status: "pending" | "approved" | "rejected" | "under-review";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    username: string;
    name: string;
  };
  documents?: {
    id: string;
    type: "id" | "business" | "media" | "other";
    filename: string;
    url: string;
  }[];
  reason?: string;
  notes?: string;
  rejectionReason?: string;
}

export default function VerifiedRequestManagement() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [stats, setStats] = useState<{
    pending: number;
    underReview: number;
    approvedToday: number;
    totalVerified: number;
  }>({
    pending: 0,
    underReview: 0,
    approvedToday: 0,
    totalVerified: 0,
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.verification.getAllRequests(1, 50, {
        status: filterStatus !== "all" ? (filterStatus as any) : undefined,
        requestType: filterType !== "all" ? (filterType as any) : undefined,
        search: searchTerm || undefined,
      });
      setRequests(response.requests || response.data || []);
    } catch (error) {
      console.error("Failed to fetch verification requests", error);
      // Fallback to mock data if API fails
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.verification.getStatsOverview();
      setStats(response);
    } catch (error) {
      console.error("Failed to fetch verification stats", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under-review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "pro":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    const matchesType =
      filterType === "all" || request.requestType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: VerificationRequest["status"],
    rejectionReason?: string
  ) => {
    try {
      if (newStatus === "approved") {
        await apiService.verification.approveRequest(requestId);
      } else if (newStatus === "rejected" && rejectionReason) {
        await apiService.verification.rejectRequest(requestId, rejectionReason);
      } else if (newStatus === "under-review") {
        await apiService.verification.setUnderReview(requestId);
      }

      // Update local state optimistically
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: newStatus,
                reviewedAt: new Date().toISOString(),
                rejectionReason: rejectionReason,
                reviewedBy: {
                  id: "current-admin",
                  username: "admin",
                  name: "Current Admin",
                },
              }
            : request
        )
      );

      // Refresh stats after status change
      fetchStats();
    } catch (error) {
      console.error("Failed to update verification request status", error);
      // You might want to show a toast notification here
    }
  };

  // Add effect to refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRequests();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [filterStatus, filterType, searchTerm]);

  const handleViewDetails = async (requestId: string) => {
    try {
      const requestDetails = await apiService.verification.getRequestById(
        requestId
      );
      // You can implement a modal or detailed view here
      console.log("Request details:", requestDetails);
      // For now, just log the details. You might want to show them in a modal
    } catch (error) {
      console.error("Failed to fetch request details", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Verification Requests
        </h2>
        <div className="text-sm text-gray-600">
          Total Requests: {requests.length.toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Pending Review",
            value: stats.pending,
            color: "yellow",
          },
          {
            title: "Approved Today",
            value: stats.approvedToday,
            color: "green",
          },
          {
            title: "Verification Requests",
            value: stats.totalVerified,
            color: "blue",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search verification requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under-review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="verified">Verification</option>
            <option value="pro">Pro Upgrade</option>
          </select>
        </div>
      </div>

      {/* Verification Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircledIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No verification requests found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {request.user.profilePicture &&
                    request.user.profilePicture !== "null" ? (
                      <img
                        src={request.user.profilePicture}
                        alt={request.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PersonIcon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.user.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1).replace("-", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeColor(
                          request.requestType
                        )}`}
                      >
                        {request.requestType === "verified"
                          ? "Verification"
                          : "Pro Upgrade"}
                      </span>
                      <UserBadges
                        isVerified={request.user.isVerified}
                        isPro={request.user.isPro}
                        size="sm"
                      />
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">
                        @{request.user.username}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{request.user.email}</span>
                    </div>

                    {request.reason && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-500 text-sm">
                          Reason:
                        </span>
                        <p className="text-gray-700 mt-1">{request.reason}</p>
                      </div>
                    )}

                    {request.user.stats && (
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">
                            Posts:
                          </span>
                          <p className="text-gray-900">
                            {request.user.stats.posts.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">
                            Followers:
                          </span>
                          <p className="text-gray-900">
                            {request.user.stats.followers.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">
                            Following:
                          </span>
                          <p className="text-gray-900">
                            {request.user.stats.following.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.documents &&
                      Array.isArray(request.documents) &&
                      request.documents.length > 0 && (
                        <div className="mb-4">
                          <span className="font-medium text-gray-500 text-sm">
                            Documents:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {request.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                              >
                                <FileTextIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {doc.filename}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                  ({doc.type})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {request.rejectionReason && (
                      <div className="p-3 bg-red-50 rounded-lg mb-4">
                        <span className="font-medium text-red-700 text-sm">
                          Rejection Reason:
                        </span>
                        <p className="text-red-600 text-sm mt-1">
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(request.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeOpenIcon className="w-4 h-4" />
                  </button>
                  {(request.status === "pending" ||
                    request.status === "under-review") && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(request.id, "approved")
                        }
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve Request"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(
                            "Please provide a rejection reason:"
                          );
                          if (reason) {
                            handleUpdateStatus(request.id, "rejected", reason);
                          }
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject Request"
                      >
                        <Cross2Icon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-600">
                <span>
                  Submitted{" "}
                  {formatDistanceToNow(new Date(request.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {request.reviewedBy && (
                  <span>
                    {request.reviewedAt &&
                      `Reviewed ${formatDistanceToNow(
                        new Date(request.reviewedAt),
                        { addSuffix: true }
                      )}`}{" "}
                    by @{request.reviewedBy.username}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
