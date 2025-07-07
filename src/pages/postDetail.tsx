import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { FaceIcon } from "@radix-ui/react-icons";
import type { Post, User } from "../type";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RigthSidebar from "./components/RightSidebar";
import PostMediaGrid from "./components/PostMediaGrid";
import UserBadges from "./components/UserBadges";
import { canUserComment, canUserReact } from "../utils/accountStatus";
import { AccountStatusWarning } from "../components/AccountStatusWarning";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [expandedPosts, setExpandedPosts] = useState<{
    [key: string]: boolean;
  }>({});

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/auth/me`, {
          withCredentials: true,
        });
        setCurrentUser(response.data.user || response.data);
      } catch (error) {
        console.error("Failed to fetch current user", error);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, [apiUrl]);
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/posts/${postId}`, {
          withCredentials: true,
        });

        // Handle different possible API response structures
        let postData = response.data;

        // If the API returns 'user' instead of 'author', map it
        if (postData.user && !postData.author) {
          postData = {
            ...postData,
            author: postData.user,
          };
        }

        // If author is missing entirely, create a fallback
        if (!postData.author) {
          postData = {
            ...postData,
            author: {
              id: "unknown",
              name: "Unknown User",
              username: "unknown",
              email: "",
              password: "",
              isVerified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              profilePicture: null,
            },
          };
        }

        setPost(postData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch post", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, apiUrl]);

  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser || !post) return;

    // Check if user can react
    if (!canUserReact(currentUser)) {
      console.log("User cannot react due to account status");
      return;
    }

    try {
      const currentReactions = post.reactions || [];
      const existingReactionIndex = currentReactions.findIndex(
        (reaction) => reaction.userId === currentUser.id
      );

      let updatedReactions = [...currentReactions];

      if (existingReactionIndex !== -1) {
        const existingReaction = currentReactions[existingReactionIndex];

        if (existingReaction.type === reactionType) {
          updatedReactions.splice(existingReactionIndex, 1);
        } else {
          updatedReactions[existingReactionIndex] = {
            ...existingReaction,
            type: reactionType,
          };
        }
      } else {
        const newReaction = {
          id: `temp-${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          postId: postId,
          type: reactionType,
          createdAt: new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.name.toLowerCase(),
            email: "",
            password: "",
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          post: post,
        };
        updatedReactions.push(newReaction);
      }

      setPost({
        ...post,
        reactions: updatedReactions,
      });

      const response = await axios.post(
        `${apiUrl}/like/${postId}/react`,
        { type: reactionType },
        {
          withCredentials: true,
        }
      );

      // Sync with server response
      if (response.data && response.data.post) {
        setPost({
          ...response.data.post,
          Reaction:
            response.data.post.reactions || response.data.post.reactionss,
        });
      }
    } catch (error) {
      console.error("Failed to react to post", error);
      // Revert optimistic update on error
      const response = await axios.get(`${apiUrl}/posts/${postId}`, {
        withCredentials: true,
      });
      setPost(response.data);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentContent = commentInputs[postId]?.trim();
    if (!commentContent || !currentUser) return;

    // Check if user can comment
    if (!canUserComment(currentUser)) {
      console.log("User cannot comment due to account status");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/comment/${postId}`,
        {
          content: commentContent,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setCommentInputs((prev) => ({
          ...prev,
          [postId]: "",
        }));

        // Refresh post to get updated comments
        const postResponse = await axios.get(`${apiUrl}/posts/${postId}`, {
          withCredentials: true,
        });
        setPost(postResponse.data);
      }
    } catch (error) {
      console.error("Failed to submit comment", error);
    }
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (loading) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />
          <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow p-8">
              {/* Loading skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>

              <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>

              <div className="text-center py-8">
                <p className="text-gray-500 text-lg font-medium">
                  Loading post...
                </p>
              </div>
            </div>
          </div>
          <RigthSidebar />
        </div>
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />
          <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Post Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                {error ||
                  "The post you're looking for doesn't exist or has been removed."}
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition"
              >
                Go Back
              </button>
            </div>
          </div>
          <RigthSidebar />
        </div>
      </div>
    );
  }

  // Additional safety check for post data structure
  if (!post.id || !post.createdAt) {
    console.error("Invalid post data structure:", post);
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />
          <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Invalid Post Data
              </h1>
              <p className="text-gray-600 mb-6">
                The post data structure is invalid. Please check the API
                response.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition mr-4"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-700 transition"
              >
                Go Back
              </button>
            </div>
          </div>
          <RigthSidebar />
        </div>
      </div>
    );
  }

  const userReaction = post.reactions?.find(
    (reaction) => currentUser && reaction.userId === currentUser.id
  );

  return (
    <div className="">
      <NavigationBar />
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
          <div className="bg-white rounded-xl shadow p-8 mb-8">
            {" "}
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                  {post.author?.profilePicture ? (
                    <img
                      src={post.author.profilePicture}
                      alt={post.author?.name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaceIcon
                      width={24}
                      height={24}
                      style={{ color: "var(--gray-5)" }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-lg">
                    {post.author?.name || "Unknown User"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Post Content */}
            <div className="mb-4 text-gray-700 text-base">
              {post.content && post.content.length > 50 ? (
                <>
                  {expandedPosts[post.id] ? (
                    <>
                      {post.content}
                      <button
                        onClick={() => togglePostExpansion(post.id)}
                        className="text-blue-600 hover:text-blue-800 ml-1 font-medium cursor-pointer"
                      >
                        Read less
                      </button>
                    </>
                  ) : (
                    <>
                      {post.content.substring(0, 50)}...
                      <button
                        onClick={() => togglePostExpansion(post.id)}
                        className="text-blue-600 hover:text-blue-800 ml-1 font-medium cursor-pointer"
                      >
                        Read more
                      </button>
                    </>
                  )}
                </>
              ) : (
                post.content
              )}

              {/* Media */}
              {post.media && post.media.length > 0 && (
                <PostMediaGrid media={post.media} />
              )}

              {/* Reactions and Comments Count */}
              <div className="flex items-center justify-between mb-4 mt-4">
                {/* Reactions */}
                {post.reactions && post.reactions.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {post.reactions.slice(0, 3).map((reaction, i) => {
                        const emojiMap: Record<string, string> = {
                          LIKE: "👍",
                          LOVE: "❤️",
                          HAHA: "😂",
                          SAD: "😢",
                          WOW: "😮",
                          ANGRY: "😠",
                        };
                        return (
                          <span
                            key={reaction.id + i}
                            className={`inline-block text-xl bg-white rounded-full border border-gray-200 shadow-sm ${
                              i > 0 ? "-ml-2" : ""
                            }`}
                            title={reaction.type}
                          >
                            {emojiMap[reaction.type] || "👍"}
                          </span>
                        );
                      })}
                      {post.reactions.length > 3 && (
                        <span className="ml-2 text-xs text-gray-500 align-middle">
                          +{post.reactions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Comments Count */}
                <div
                  className="text-xs text-gray-500 hover:text-blue-600 transition cursor-pointer"
                  onClick={() => setShowComments(!showComments)}
                >
                  {Array.isArray(post.comments) && post.comments.length > 0
                    ? `${post.comments.length} ${
                        post.comments.length === 1 ? "comment" : "comments"
                      }`
                    : "0 comments"}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center border-t border-gray-100 pt-4 space-x-8">
              {/* Like Button */}
              <div
                className={`flex items-center group transition focus:outline-none cursor-pointer ${
                  userReaction
                    ? userReaction.type === "LIKE"
                      ? "text-blue-600"
                      : userReaction.type === "LOVE"
                      ? "text-red-500"
                      : userReaction.type === "HAHA"
                      ? "text-yellow-500"
                      : userReaction.type === "SAD"
                      ? "text-gray-600"
                      : userReaction.type === "WOW"
                      ? "text-purple-500"
                      : userReaction.type === "ANGRY"
                      ? "text-orange-500"
                      : "text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
                role="button"
                tabIndex={0}
              >
                {userReaction ? (
                  <span className="text-xl mr-2">
                    {userReaction.type === "LIKE"
                      ? "👍"
                      : userReaction.type === "LOVE"
                      ? "❤️"
                      : userReaction.type === "HAHA"
                      ? "😂"
                      : userReaction.type === "SAD"
                      ? "😢"
                      : userReaction.type === "WOW"
                      ? "😮"
                      : userReaction.type === "ANGRY"
                      ? "😠"
                      : "👍"}
                  </span>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3z" />
                  </svg>
                )}

                <div className="relative">
                  <span className="text-base font-medium">
                    {userReaction
                      ? userReaction.type === "LIKE"
                        ? "Like"
                        : userReaction.type === "LOVE"
                        ? "Love"
                        : userReaction.type === "HAHA"
                        ? "Haha"
                        : userReaction.type === "SAD"
                        ? "Sad"
                        : userReaction.type === "WOW"
                        ? "Wow"
                        : userReaction.type === "ANGRY"
                        ? "Angry"
                        : "Like"
                      : "Like"}
                  </span>

                  <div className="absolute left-0 -translate-x-1/2 bottom-full mb-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-2 px-3 flex space-x-2 scale-100">
                      {["👍", "❤️", "😂", "😢", "😮", "😠"].map((emoji, i) => {
                        const reactionTypes = [
                          "LIKE",
                          "LOVE",
                          "HAHA",
                          "SAD",
                          "WOW",
                          "ANGRY",
                        ];
                        const isActive =
                          userReaction?.type === reactionTypes[i];

                        return (
                          <button
                            key={i}
                            className={`hover:scale-150 transition-transform duration-150 p-2 ${
                              isActive
                                ? "scale-125 bg-blue-100 rounded-full"
                                : ""
                            }`}
                            onClick={() =>
                              handleReact(post.id, reactionTypes[i])
                            }
                          >
                            <span className="text-3xl">{emoji}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment Button */}
              <button
                className="flex items-center text-gray-500 hover:text-blue-600 transition focus:outline-none"
                onClick={() => setShowComments(!showComments)}
              >
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-base">Comment</span>
              </button>

              {/* Share Button */}
              <button className="flex items-center text-gray-500 hover:text-blue-600 transition focus:outline-none">
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 12v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-base">Share</span>
              </button>
            </div>
            {/* Comments Section */}
            {showComments && (
              <div className="mt-6">
                <div className="mb-4 space-y-3">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaceIcon
                            width={16}
                            height={16}
                            style={{ color: "var(--gray-5)" }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="font-medium text-sm text-gray-800 flex items-center">
                              {comment.user?.name || "Anonymous User"}
                              <UserBadges
                                isVerified={comment.user?.isVerified}
                                isPro={comment.user?.isPro}
                                size="sm"
                                className="ml-2"
                              />
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {comment.content || "This is a sample comment."}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <button className="hover:text-blue-600">
                              Like
                            </button>
                            <button className="hover:text-blue-600">
                              Reply
                            </button>
                            <span>
                              {comment.createdAt
                                ? formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )
                                : "2m"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                {!canUserComment(currentUser) ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaceIcon
                          width={16}
                          height={16}
                          className="text-gray-400"
                        />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full px-5 py-3 text-gray-400 cursor-not-allowed text-base">
                        Write a comment...
                      </div>
                    </div>
                    <AccountStatusWarning user={currentUser} />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCommentSubmit(post.id);
                        }
                      }}
                      className="w-full px-5 py-3 pr-12 rounded-full border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200 text-black placeholder-black text-base"
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition ${
                        commentInputs[post.id]?.trim()
                          ? "text-red-600 hover:bg-red-50 cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <RigthSidebar />
      </div>
    </div>
  );
}
