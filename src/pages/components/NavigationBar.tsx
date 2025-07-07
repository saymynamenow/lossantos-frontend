import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FaceIcon, PlusIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import apiService from "../../services/api";
import type { User } from "../../type";

// Notification interface based on API response
interface Notification {
  id: string;
  userId: string;
  senderId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  postId?: string;
  commentId?: string;
  pageId?: string;
  sender: {
    id: string;
    name: string;
    username: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  post?: {
    id: string;
    content: string;
    type: string;
    media: string[];
  };
  page?: any;
  comment?: any;
}

export default function NavigationBar({
  onFriendRequestUpdate,
}: {
  onFriendRequestUpdate?: () => void;
}) {
  const navigation = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const url = import.meta.env.VITE_UPLOADS_URL;

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    pages: any[];
  }>({ users: [], pages: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Use useRef to track timeout without causing re-renders
  const searchTimeoutRef = useRef<number | null>(null);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);
      const response = await apiService.user.getCurrentUser();
      setCurrentUser(response);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      const response = await apiService.friend.getReceivedFriendRequests();
      setFriendRequests(
        Array.isArray(response) ? response : response?.requests || []
      );
    } catch (error) {
      setFriendRequests([]);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await apiService.notification.getNotifications(1, 10);
      setNotifications(response.notifications || []);
    } catch (error) {
      setNotifications([]);
    }
  };
  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ users: [], pages: [] });
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      setShowSearchResults(true); // Show dropdown immediately with loading state

      // Use unified search API
      const response = await apiService.search.search(query, "all", 10);

      setSearchResults({
        users: response.users || [],
        pages: response.pages || [],
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ users: [], pages: [] });
      // Keep dropdown open to show "no results" message
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle Enter key press for immediate search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Immediate search
      handleSearch(searchQuery);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle search input change with auto-search after user stops typing
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Clear search results when input is empty
    if (!value.trim()) {
      setSearchResults({ users: [], pages: [] });
      setShowSearchResults(false);
      return;
    }

    // Set new timeout for auto-search
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(value);
    }, 600);
  };

  // Navigate to user profile
  const navigateToUser = (username: string) => {
    navigation(`/profile/${username}`);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  // Navigate to page
  const navigateToPage = (pageId: string) => {
    const currentPath = window.location.pathname;
    const newPath = `/page/${pageId}`;

    // If we're already on a page route, force a reload to ensure the page updates
    if (currentPath.startsWith("/page/") && currentPath !== newPath) {
      window.location.href = newPath;
    } else {
      navigation(newPath);
    }

    setShowSearchResults(false);
    setSearchQuery("");
  };

  // Handle accept friend request
  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      setLoading(true);
      await apiService.friend.acceptFriendRequest(friendshipId);
      await fetchFriendRequests();
      onFriendRequestUpdate?.();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Handle reject friend request
  const handleRejectRequest = async (friendshipId: string) => {
    try {
      console.log("Rejecting friend request with ID:", friendshipId);
      setLoading(true);
      await apiService.friend.rejectFriendRequest(friendshipId);
      await fetchFriendRequests();
      onFriendRequestUpdate?.();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await apiService.notification.markAsRead(notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // Do not navigate anywhere - just mark as read
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  // Helper function to clear cookies
  const clearCookie = (name: string) => {
    // Clear cookie by setting it to expire in the past
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Also try with different path and domain variations
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API first
      await apiService.user.logout();

      // Clear all stored auth tokens
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      sessionStorage.clear();

      // Clear authentication cookies
      clearCookie("token");
      clearCookie("authToken");
      clearCookie("auth_token");
      clearCookie("accessToken");
      clearCookie("refreshToken");

      // Force hard redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout:", error);

      // Still clear tokens and cookies even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      sessionStorage.clear();

      // Clear authentication cookies
      clearCookie("token");
      clearCookie("authToken");
      clearCookie("auth_token");
      clearCookie("accessToken");
      clearCookie("refreshToken");

      // Force hard redirect to login page even if API call fails
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Fetch user data and other initial data
    fetchCurrentUser();
    fetchFriendRequests();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFriendRequests && !target.closest(".friend-requests-dropdown")) {
        setShowFriendRequests(false);
      }
      if (showNotifications && !target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
      if (showSearchResults && !target.closest(".search-container")) {
        setShowSearchResults(false);
      }
      if (showProfileDropdown && !target.closest(".profile-dropdown")) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    showFriendRequests,
    showNotifications,
    showSearchResults,
    showProfileDropdown,
  ]);

  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
      {/* Logo (left) */}
      <div className="flex items-center">
        <span
          className="text-2xl font-bold text-red-600 tracking-tight cursor-pointer"
          onClick={() => navigation("/")}
        >
          LSM
        </span>
      </div>
      {/* Search Bar (center) */}
      <div className="flex-1 flex justify-center px-8">
        <div className="relative w-full max-w-xl search-container">
          <input
            type="text"
            placeholder="Search Los Santos Media..."
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyDown}
            className="w-full px-4 py-2 text-black rounded-full border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
          />

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Users Section */}
                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700">
                          People ({searchResults.users.length})
                        </h4>
                      </div>
                      {searchResults.users.map((user: any) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => navigateToUser(user.username)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                  <FaceIcon
                                    width={20}
                                    height={20}
                                    className="text-gray-600"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.name || user.username}
                                </p>
                                <UserBadges isVerified={user.isVerified} />
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pages Section */}
                  {searchResults.pages.length > 0 && (
                    <div>
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Pages ({searchResults.pages.length})
                        </h4>
                      </div>
                      {searchResults.pages.map((page: any) => (
                        <div
                          key={page.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => navigateToPage(page.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {page.profileImage ? (
                                <img
                                  src={`${url}/${page.profileImage}`}
                                  alt={page.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-red-500">
                                  <span className="text-white font-bold text-xs">
                                    {page.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {page.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {page.category} • {page._count.followers || 0}{" "}
                                followers
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.users.length === 0 &&
                    searchResults.pages.length === 0 &&
                    searchQuery.trim() && (
                      <div className="p-6 text-center text-gray-500">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try searching for something else
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Profile, Notifications, Friend Requests, Messages (right) */}
      <div className="flex items-center space-x-6 relative">
        {/* General Notifications Icon */}
        <div className="relative notifications-dropdown flex items-center">
          <button
            className="relative flex items-center justify-center text-gray-500 hover:text-red-600 transition"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ height: "40px", width: "40px" }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          {/* General Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "opacity-75"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Sender Profile Picture */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {notification.sender?.profilePicture ? (
                            <img
                              src={notification.sender.profilePicture}
                              alt={notification.sender.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                              <FaceIcon
                                width={20}
                                height={20}
                                className="text-gray-600"
                              />
                            </div>
                          )}
                        </div>
                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <span
                              className={`text-sm font-medium ${
                                !notification.isRead
                                  ? "text-gray-900"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.sender?.name}
                            </span>
                            <UserBadges
                              isVerified={notification.sender?.isVerified}
                            />
                          </div>
                          <div
                            className={`text-sm mb-1 ${
                              !notification.isRead
                                ? "text-gray-700"
                                : "text-gray-500"
                            }`}
                          >
                            <MentionText text={notification.content} />
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                        </div>
                        {/* Read/Unread indicator */}
                        <div className="flex items-center">
                          {!notification.isRead ? (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          ) : (
                            <div className="text-gray-400 text-xs">Read</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Friend Requests Icon */}
        <div className="relative friend-requests-dropdown flex items-center">
          <button
            className="relative flex items-center justify-center text-gray-500 hover:text-red-600 transition"
            onClick={() => setShowFriendRequests(!showFriendRequests)}
            style={{ height: "40px", width: "40px" }}
          >
            <PlusIcon width="24" height="24" />
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {friendRequests.length}
              </span>
            )}
          </button>

          {/* Friend Requests Dropdown */}
          {showFriendRequests && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Friend Requests</h3>
              </div>

              {friendRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending friend requests
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {friendRequests.map((request: any) => {
                    const sender = request.userA;
                    return (
                      <div key={request.id} className="p-4">
                        <div className="flex items-center space-x-3">
                          {/* Profile Picture */}
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {sender?.profilePicture ? (
                              <img
                                src={sender.profilePicture}
                                alt={sender.name || sender.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <FaceIcon
                                  width={24}
                                  height={24}
                                  className="text-gray-600"
                                />
                              </div>
                            )}
                          </div>
                          {/* Request Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {sender?.name ||
                                sender?.username ||
                                "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Sent you a friend request
                            </p>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={loading}
                            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Message Icon */}
        <button
          className="relative flex items-center justify-center text-gray-500 hover:text-red-600 transition"
          style={{ height: "40px", width: "40px" }}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            5
          </span>
        </button>
        {/* Profile Avatar with Dropdown */}
        <div className="relative profile-dropdown">
          <button
            className="w-10 h-10 rounded-full bg-gray-200 border-2 border-red-500 overflow-hidden cursor-pointer flex items-center justify-center hover:border-red-600 transition-colors"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            disabled={userLoading || !currentUser}
          >
            {userLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            ) : currentUser?.profilePicture ? (
              <img
                src={`${url}/${currentUser.profilePicture}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-full h-full text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
              </svg>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && currentUser && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {currentUser.profilePicture ? (
                      <img
                        src={`${url}/${currentUser.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <FaceIcon
                          width={20}
                          height={20}
                          className="text-gray-600"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.name || currentUser.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{currentUser.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigation(`/profile/${currentUser.username}`);
                    setShowProfileDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-gray-500"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    navigation("/settings");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-gray-500"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Settings</span>
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-red-500"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
