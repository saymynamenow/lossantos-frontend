import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  CheckIcon,
  Cross2Icon,
  PersonIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import UserBadges from "./UserBadges";

interface Report {
  id: string;
  type: "post" | "comment" | "user" | "message";
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  reportedBy: {
    id: string;
    username: string;
    name: string;
    isVerified?: boolean;
    isPro?: boolean;
  };
  reportedContent?: {
    id: string;
    type: "post" | "comment" | "user" | "message";
    content?: string;
    author?: {
      id: string;
      username: string;
      name: string;
      isVerified?: boolean;
      isPro?: boolean;
    };
  };
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: {
    id: string;
    username: string;
    name: string;
  };
}

export default function ReportingManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockReports: Report[] = [
        {
          id: "1",
          type: "post",
          reason: "Inappropriate content",
          description:
            "This post contains offensive language and harmful content.",
          status: "pending",
          priority: "high",
          reportedBy: {
            id: "user1",
            username: "reporter1",
            name: "John Reporter",
            isVerified: true,
          },
          reportedContent: {
            id: "post1",
            type: "post",
            content: "This is the content of the reported post...",
            author: {
              id: "user2",
              username: "baduser",
              name: "Bad User",
              isVerified: false,
            },
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          type: "user",
          reason: "Harassment",
          description: "This user has been sending threatening messages.",
          status: "reviewed",
          priority: "critical",
          reportedBy: {
            id: "user3",
            username: "victim1",
            name: "Victim User",
            isVerified: false,
            isPro: true,
          },
          reportedContent: {
            id: "user4",
            type: "user",
            author: {
              id: "user4",
              username: "harasser",
              name: "Harassing User",
              isVerified: false,
            },
          },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          reviewedBy: {
            id: "admin1",
            username: "admin",
            name: "Admin User",
          },
        },
        {
          id: "3",
          type: "comment",
          reason: "Spam",
          description: "This comment is spam and promoting external services.",
          status: "resolved",
          priority: "medium",
          reportedBy: {
            id: "user5",
            username: "gooduser",
            name: "Good User",
            isVerified: true,
            isPro: true,
          },
          reportedContent: {
            id: "comment1",
            type: "comment",
            content:
              "Check out this amazing deal! Click here to get rich quick...",
            author: {
              id: "user6",
              username: "spammer",
              name: "Spam User",
              isVerified: false,
            },
          },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setReports(mockReports);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return ChatBubbleIcon;
      case "comment":
        return ChatBubbleIcon;
      case "user":
        return PersonIcon;
      case "message":
        return ChatBubbleIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedBy.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (report.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesPriority =
      filterPriority === "all" || report.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: Report["status"]
  ) => {
    try {
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : report
        )
      );
      // TODO: Call API to update report status
    } catch (error) {
      console.error("Failed to update report status", error);
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
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
        <div className="text-sm text-gray-600">
          Total Reports: {reports.length.toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Pending Reports",
            value: reports
              .filter((r) => r.status === "pending")
              .length.toString(),
            color: "yellow",
          },
          {
            title: "Critical Priority",
            value: reports
              .filter((r) => r.priority === "critical")
              .length.toString(),
            color: "red",
          },
          {
            title: "Resolved Today",
            value: reports
              .filter(
                (r) =>
                  r.status === "resolved" &&
                  new Date(r.updatedAt || r.createdAt).toDateString() ===
                    new Date().toDateString()
              )
              .length.toString(),
            color: "green",
          },
          {
            title: "User Reports",
            value: reports.filter((r) => r.type === "user").length.toString(),
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
              placeholder="Search reports..."
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
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="user">Users</option>
            <option value="message">Messages</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const TypeIcon = getTypeIcon(report.type);
            return (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <TypeIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.reason}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status.charAt(0).toUpperCase() +
                            report.status.slice(1)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            report.priority
                          )}`}
                        >
                          {report.priority.charAt(0).toUpperCase() +
                            report.priority.slice(1)}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-gray-600 mb-3">
                          {report.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">
                            Reported by:
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-gray-900">
                              @{report.reportedBy.username}
                            </span>
                            <UserBadges
                              isVerified={report.reportedBy.isVerified}
                              isPro={report.reportedBy.isPro}
                              size="sm"
                            />
                          </div>
                        </div>
                        {report.reportedContent?.author && (
                          <div>
                            <span className="font-medium text-gray-500">
                              Reported user/author:
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-gray-900">
                                @{report.reportedContent.author.username}
                              </span>
                              <UserBadges
                                isVerified={
                                  report.reportedContent.author.isVerified
                                }
                                isPro={report.reportedContent.author.isPro}
                                size="sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {report.reportedContent?.content && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-500 text-sm">
                            Reported content:
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {report.reportedContent.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeOpenIcon className="w-4 h-4" />
                    </button>
                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "resolved")
                          }
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Resolved"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "dismissed")
                          }
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dismiss Report"
                        >
                          <Cross2Icon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <span>
                    Reported{" "}
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {report.reviewedBy && (
                    <span>Reviewed by @{report.reviewedBy.username}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
