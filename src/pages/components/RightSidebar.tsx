import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sponsoredService } from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import { FaceIcon } from "@radix-ui/react-icons";
import apiService from "../../services/api";

// Sponsored Post Interface (from backend)
interface SponsoredPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  link?: string | null;
  isActive: "accepted" | "pending" | "rejected" | "expired";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Pro User Interface
interface ProUser {
  id: string;
  name: string;
  username: string;
  profilePicture?: string;
  isProUser: boolean;
  isVerified?: boolean;
}

// Verified Page Interface
interface VerifiedPage {
  id: string;
  name: string;
  username?: string;
  description?: string;
  profileImage?: string;
  isVerified: boolean;
  followersCount?: number;
}

export default function RigthSidebar() {
  const navigate = useNavigate();
  const [sponsoredPost, setSponsoredPost] = useState<SponsoredPost | null>(
    null
  );
  const [proUsers, setProUsers] = useState<ProUser[]>([]);
  const [verifiedPages, setVerifiedPages] = useState<VerifiedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [proUsersLoading, setProUsersLoading] = useState(true);
  const [verifiedPagesLoading, setVerifiedPagesLoading] = useState(true);
  const url = import.meta.env.VITE_UPLOADS_URL;

  // Fetch Pro users from database
  const fetchProUsers = useCallback(async () => {
    try {
      setProUsersLoading(true);
      const response = await apiService.user.getAllUser(1, 50); // Fetch more users to filter
      const allUsers = response.users || [];

      // Filter for Pro users only
      const proUsersOnly = allUsers.filter(
        (user: ProUser) => user.isProUser === true
      );

      // Take first 3 Pro users for display
      setProUsers(proUsersOnly.slice(0, 3));
    } catch (error) {
      console.error("Error fetching Pro users:", error);
      setProUsers([]);
    } finally {
      setProUsersLoading(false);
    }
  }, []);

  // Fetch verified pages from page suggestions API
  const fetchVerifiedPages = useCallback(async () => {
    try {
      setVerifiedPagesLoading(true);
      // Try to use the page suggestions endpoint
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/page/suggestions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allPages = data.pages || data || [];

        // Filter for verified pages only
        const verifiedPagesOnly = allPages.filter(
          (page: VerifiedPage) => page.isVerified === true
        );

        // Take first 3 verified pages for display
        setVerifiedPages(verifiedPagesOnly.slice(0, 3));
      } else {
        // Fallback to getAllPages if suggestions endpoint is not available
        const fallbackResponse = await apiService.page.getAllPages(1, 50);
        const allPages = fallbackResponse.pages || fallbackResponse || [];

        // Filter for verified pages only
        const verifiedPagesOnly = allPages.filter(
          (page: VerifiedPage) => page.isVerified === true
        );

        // Take first 3 verified pages for display
        setVerifiedPages(verifiedPagesOnly.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching verified pages:", error);
      setVerifiedPages([]);
    } finally {
      setVerifiedPagesLoading(false);
    }
  }, []);

  // Fetch sponsored posts and randomly select one that's active
  const fetchSponsoredPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sponsoredService.getSponsoredPosts(1, 50); // Fetch more to have better selection
      const posts = response.posts || response;

      // Filter for active posts only
      const activePosts = posts.filter(
        (post: SponsoredPost) => post.isActive === "accepted"
      );

      if (activePosts.length > 0) {
        // Randomly select one active post
        const randomIndex = Math.floor(Math.random() * activePosts.length);
        setSponsoredPost(activePosts[randomIndex]);
      } else {
        setSponsoredPost(null);
      }
    } catch (error) {
      console.error("Error fetching sponsored posts:", error);
      setSponsoredPost(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsoredPost();
    fetchProUsers();
    fetchVerifiedPages();
  }, [fetchSponsoredPost, fetchProUsers, fetchVerifiedPages]);
  return (
    <div className="hidden lg:block w-1/4 p-6 space-y-6">
      {/* Pro Users Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pro Users</h3>
        {proUsersLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : proUsers.length > 0 ? (
          <div className="space-y-3">
            {proUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-0.5 hover:scale-105 transition-transform"
                  >
                    {user.profilePicture && user.profilePicture !== "null" ? (
                      <img
                        src={`${url}/${user.profilePicture}`}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <FaceIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </button>
                  <div className="ml-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate(`/profile/${user.username}`)}
                        className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {user.name}
                      </button>
                      <UserBadges
                        isVerified={user.isVerified}
                        isPro={user.isProUser}
                      />
                    </div>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            <p className="text-sm">No Pro users available</p>
          </div>
        )}
        <button
          onClick={() => navigate("/people")}
          className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium mt-4"
        >
          View all Pro Users
        </button>
      </div>

      {/* Verified Pages Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Verified Pages
        </h3>
        {verifiedPagesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : verifiedPages.length > 0 ? (
          <div className="space-y-3">
            {verifiedPages.map((page) => (
              <div key={page.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(`/page/${page.id}`)}
                    className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-0.5 hover:scale-105 transition-transform"
                  >
                    {page.profileImage && page.profileImage !== "null" ? (
                      <img
                        src={`${url}/${page.profileImage}`}
                        alt={page.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {page.name?.charAt(0)?.toUpperCase() || "P"}
                        </span>
                      </div>
                    )}
                  </button>
                  <div className="ml-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate(`/page/${page.id}`)}
                        className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {page.name}
                      </button>
                      {page.isVerified && (
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {page.followersCount
                        ? `${page.followersCount.toLocaleString()} followers`
                        : "Verified page"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            <p className="text-sm">No verified pages available</p>
          </div>
        )}
        <button
          onClick={() => navigate("/pages")}
          className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium mt-4"
        >
          View all Verified Pages
        </button>
      </div>
      {/* Sponsored Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sponsored</h3>
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32 w-full mb-3"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-3 rounded w-1/2"></div>
            </div>
          </div>
        ) : sponsoredPost ? (
          <div className="space-y-3">
            {/* Post Image - only show if imageUrl exists */}
            {sponsoredPost.imageUrl && (
              <div className="relative group cursor-pointer">
                <img
                  src={`${url}/${sponsoredPost.imageUrl}`}
                  alt={sponsoredPost.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-all duration-200 rounded-lg"></div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                {sponsoredPost.title}
              </h4>
              <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                <MentionText text={sponsoredPost.content} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Sponsored •{" "}
                  {formatDistanceToNow(new Date(sponsoredPost.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {sponsoredPost.link && (
                  <button
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition"
                    onClick={() => {
                      window.open(sponsoredPost.link!, "_blank");
                    }}
                  >
                    Learn More
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            <p className="text-sm">No sponsored posts available</p>
          </div>
        )}
      </div>

      {/* Links Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <button
            onClick={() => navigate("/about")}
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            About Us
          </button>
          <span className="text-gray-400">•</span>
          <button
            onClick={() => navigate("/rules")}
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            ((Community Rules))
          </button>
          <span className="text-gray-400">•</span>
          <button
            onClick={() => navigate("/copyright")}
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Copyright
          </button>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Los Santos Media. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
