import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  Pencil1Icon,
  TrashIcon,
  EyeOpenIcon,
  PersonIcon,
  LockClosedIcon,
  LockOpen1Icon,
  CheckIcon,
  Cross2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import UserBadges from "./UserBadges";
import apiService from "../../services/api";
import { useNavigate } from "react-router-dom";

interface UserAccount {
  id: string;
  username: string;
  name: string;
  email?: string;
  isVerified?: boolean;
  isPro?: boolean;
  isAdmin?: boolean;
  status?: "active" | "suspended" | "banned" | "pending";
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  profilePicture?: string | null;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  const [pageSize, setPageSize] = useState(10);
  const navigation = useNavigate();
  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiService.user.getAllUser(page, pageSize);

      // Map API response to our UserAccount interface
      const mappedUsers: UserAccount[] = response.users.map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email || `${user.username}@example.com`, // fallback email
        isVerified: user.isVerified || false,
        isPro: user.isPro || user.isProUser || false,
        isAdmin: user.isAdmin || false,
        status: user.status || "active",
        joinedAt: user.createdAt,
        _count: user._count || {
          posts: 0,
          followers: 0,
          following: 0,
        },
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
      }));
      console.log("Fetched users:", mappedUsers);
      setUsers(mappedUsers);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalUsers: response.pagination.totalUsers,
      });
    } catch (error) {
      console.error("Failed to fetch users", error);
      // Set empty data on error
      setUsers([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "banned":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || (user.status || "active") === filterStatus;
    const matchesType =
      filterType === "all" ||
      (filterType === "admin" && user.isAdmin) ||
      (filterType === "verified" && user.isVerified) ||
      (filterType === "pro" && user.isPro) ||
      (filterType === "regular" &&
        !user.isAdmin &&
        !user.isVerified &&
        !user.isPro);
    return matchesSearch && matchesStatus && matchesType;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchUsers(1);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      // Update local state immediately for better UX
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, status: newStatus as UserAccount["status"] }
            : user
        )
      );

      // TODO: Call API to update user status on server
      // await apiService.user.updateUserStatus(userId, newStatus);
    } catch (error) {
      console.error("Failed to toggle user status", error);
      // Revert changes on error
      fetchUsers(pagination.currentPage);
    }
  };

  const handleToggleVerification = async (userId: string) => {
    try {
      // Update local state immediately for better UX
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isVerified: !user.isVerified } : user
        )
      );

      // TODO: Call API to update user verification on server
      // await apiService.user.updateUserVerification(userId, !user.isVerified);
    } catch (error) {
      console.error("Failed to toggle verification", error);
      // Revert changes on error
      fetchUsers(pagination.currentPage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        // Remove from local state immediately for better UX
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        // TODO: Call API to delete user on server
        // await apiService.user.deleteUser(userId);

        // Refresh data to get updated totals
        fetchUsers(pagination.currentPage);
      } catch (error) {
        console.error("Failed to delete user", error);
        // Revert changes on error
        fetchUsers(pagination.currentPage);
      }
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
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="text-sm text-gray-600">
          Total Users: {pagination.totalUsers.toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: pagination.totalUsers.toString(),
            color: "blue",
          },
          {
            title: "Active Users",
            value: users
              .filter((u) => (u.status || "active") === "active")
              .length.toString(),
            color: "green",
          },
          {
            title: "Verified Users",
            value: users.filter((u) => u.isVerified).length.toString(),
            color: "blue",
          },
          {
            title: "Pro Users",
            value: users.filter((u) => u.isPro).length.toString(),
            color: "purple",
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
              placeholder="Search users..."
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
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="admin">Admin</option>
            <option value="verified">Verified</option>
            <option value="pro">Pro Users</option>
            <option value="regular">Regular Users</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <PersonIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <PersonIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <UserBadges
                              isVerified={user.isVerified}
                              isPro={user.isPro}
                              size="sm"
                            />
                            {user.isAdmin && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          user.status || "active"
                        )}`}
                      >
                        {(user.status || "active").charAt(0).toUpperCase() +
                          (user.status || "active").slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>{user._count?.posts || 0} posts</div>
                        <div>
                          {(user._count?.followers || 0).toLocaleString()}{" "}
                          followers
                        </div>
                        <div>
                          {(user._count?.following || 0).toLocaleString()}{" "}
                          following
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleToggleStatus(user.id, user.status || "active")
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === "active"
                              ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }`}
                          title={
                            user.status === "active"
                              ? "Suspend User"
                              : "Activate User"
                          }
                        >
                          {user.status === "active" ? (
                            <LockClosedIcon className="w-4 h-4" />
                          ) : (
                            <LockOpen1Icon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleVerification(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isVerified
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                              : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          }`}
                          title={
                            user.isVerified
                              ? "Remove Verification"
                              : "Verify User"
                          }
                        >
                          {user.isVerified ? (
                            <Cross2Icon className="w-4 h-4" />
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                          onClick={() =>
                            navigation(`/profile/${user.username}`)
                          }
                        >
                          <EyeOpenIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Pencil1Icon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {(pagination.currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pageSize,
                  pagination.totalUsers
                )}{" "}
                of {pagination.totalUsers} users
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.currentPage >=
                      pagination.totalPages - 2
                    ) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
