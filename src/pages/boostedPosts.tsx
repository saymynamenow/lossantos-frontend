import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  RocketIcon,
  BarChartIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { boostedPostsService, postService } from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/authContext";

interface BoostedPost {
  id: string;
  postId: string;
  userId: string;
  endDate: string;
  status: boolean;
  post: any;
}

interface BoostedStats {
  totalBoosts: number;
  activeBoosts: number;
  remainingBoosts: number;
  maxBoostsPerWeek: number;
}

const BoostedPosts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boostedPosts, setBoostedPosts] = useState<BoostedPost[]>([]);
  const [stats, setStats] = useState<BoostedStats | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostingPostId, setBoostingPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my-boosts" | "boost-post">(
    "my-boosts"
  );
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [endDate, setEndDate] = useState<string>("");

  // Check if user is Pro
  const isProUser = user?.isProUser || false;

  useEffect(() => {
    if (!isProUser) {
      toast.error("This feature is only available for Pro users");
      navigate("/comingsoon");
      return;
    }
    fetchData();
  }, [isProUser, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, boostsResponse, postsResponse] = await Promise.all([
        boostedPostsService.getStats(),
        boostedPostsService.getMyBoosts(),
        postService.getTimelinePosts(1, 20),
      ]);

      setStats(statsResponse.stats);
      setBoostedPosts(boostsResponse.boostedPosts || []);
      setUserPosts(postsResponse.post || []);
    } catch (error) {
      console.error("Error fetching boosted posts data:", error);
      toast.error("Failed to load boosted posts data");
    } finally {
      setLoading(false);
    }
  };

  const url = import.meta.env.VITE_UPLOADS_URL;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get date 7 days from today
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  };

  // Open boost modal
  const openBoostModal = (post: any) => {
    setSelectedPost(post);
    setEndDate(getTodayDate());
    setShowBoostModal(true);
  };

  // Close boost modal
  const closeBoostModal = () => {
    setShowBoostModal(false);
    setSelectedPost(null);
    setEndDate("");
  };

  const handleBoostPost = async () => {
    if (!selectedPost || !endDate) return;

    if (!stats || stats.remainingBoosts <= 0) {
      toast.error("You have reached your weekly boost limit");
      return;
    }

    try {
      setBoostingPostId(selectedPost.id);

      // Convert endDate string to Date object
      const endDateObject = new Date(endDate);
      await boostedPostsService.boostPost(selectedPost.id, endDateObject);

      toast.success("Post boosted successfully!");
      closeBoostModal();
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error boosting post:", error);
      toast.error("Failed to boost post");
    } finally {
      setBoostingPostId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading boosted posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <RocketIcon className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Boosted Posts
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                PRO Feature
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Total Boosts
                </h3>
                <BarChartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalBoosts}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Active Boosts
                </h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeBoosts}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Remaining This Week
                </h3>
                <CalendarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.remainingBoosts}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Weekly Limit
                </h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  MAX
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.maxBoostsPerWeek}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("my-boosts")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "my-boosts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Boosted Posts ({boostedPosts.length})
              </button>
              <button
                onClick={() => setActiveTab("boost-post")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "boost-post"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Boost New Post
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "my-boosts" ? (
              <div className="space-y-6">
                {boostedPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <RocketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No boosted posts yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start boosting your posts to increase their visibility!
                    </p>
                    <button
                      onClick={() => setActiveTab("boost-post")}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Boost Your First Post
                    </button>
                  </div>
                ) : (
                  boostedPosts.map((boostedPost) => (
                    <div key={boostedPost.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              boostedPost.status
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              boostedPost.status
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {boostedPost.status ? "accepted" : "Inactive"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Boosted{" "}
                          {new Date(boostedPost.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {boostedPost.post && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {boostedPost.post.author?.username
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {boostedPost.post.author?.username ||
                                  "Unknown User"}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  boostedPost.post.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">
                            {boostedPost.post.content}
                          </p>
                          {boostedPost.post.media &&
                            boostedPost.post.media.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {boostedPost.post.media
                                  .slice(0, 4)
                                  .map((media: any, index: number) => (
                                    <img
                                      key={index}
                                      src={`${url}${media.url}`}
                                      alt=""
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                  ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {stats && stats.remainingBoosts <= 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Weekly limit reached
                    </h3>
                    <p className="text-gray-600">
                      You've used all {stats.maxBoostsPerWeek} boosts for this
                      week. Come back next week!
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a post to boost
                      </h3>
                      <p className="text-gray-600">
                        You have {stats?.remainingBoosts || 0} boosts remaining
                        this week
                      </p>
                    </div>
                    <div className="space-y-4">
                      {userPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {post.author?.username
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {post.author?.username || "Unknown User"}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    post.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{post.content}</p>
                            {post.media && post.media.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {post.media
                                  .slice(0, 4)
                                  .map((media: any, index: number) => {
                                    // If media.url is an absolute URL (e.g., imgur), use as is; else prepend uploads URL
                                    const isExternal = /^https?:\/\//i.test(
                                      media.url
                                    );
                                    const src = isExternal
                                      ? media.url
                                      : `${url}${media.url}`;
                                    return (
                                      <img
                                        key={index}
                                        src={src}
                                        alt=""
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => openBoostModal(post)}
                              disabled={boostingPostId === post.id}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                              {boostingPostId === post.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Boosting...</span>
                                </>
                              ) : (
                                <>
                                  <RocketIcon className="w-4 h-4" />
                                  <span>Boost Post</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boost Modal */}
      {showBoostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Boost Post
                </h3>
                <button
                  onClick={closeBoostModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Post Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {selectedPost.author?.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {selectedPost.author?.username || "Unknown User"}
                    </h4>
                  </div>
                </div>
                <p
                  className="text-gray-700 text-sm overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {selectedPost.content}
                </p>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={getTodayDate()}
                  max={getMaxDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can select dates up to 7 days from today
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closeBoostModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBoostPost}
                  disabled={!endDate || boostingPostId === selectedPost.id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {boostingPostId === selectedPost.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Boosting...</span>
                    </>
                  ) : (
                    <>
                      <RocketIcon className="w-4 h-4" />
                      <span>Boost Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoostedPosts;
