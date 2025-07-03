import { useState, useCallback, useRef } from "react";
import type { Post } from "../../type";
import { formatDistanceToNow } from "date-fns";
import { FaceIcon } from "@radix-ui/react-icons";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import PostMediaGrid from "./PostMediaGrid";
import MentionInput, { type MentionInputRef } from "./MentionInput";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

// Boosted Post Interface
interface BoostedPost {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    name: string;
    profilePicture?: string;
    isVerified: boolean;
    isProUser?: boolean;
  };
  sponsor: {
    name: string;
    budget: number;
  };
  createdAt: string;
  media?: string[];
  views: number;
  clicks: number;
  targetAudience: string;
}

// Mock boosted post data
const mockBoostedPosts: BoostedPost[] = [
  {
    id: "boosted-1",
    content:
      "🚀 Discover the future of technology with @[TechCorp](techcorp)! Revolutionary innovation awaits. Join thousands who've already upgraded their digital experience. #TechRevolution #Innovation #FutureTech",
    author: {
      id: "sponsor-user-1",
      username: "techcorp",
      name: "TechCorp Innovation",
      profilePicture: undefined,
      isVerified: true,
      isProUser: true,
    },
    sponsor: {
      name: "TechCorp Inc.",
      budget: 5000,
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    media: [],
    views: 15420,
    clicks: 432,
    targetAudience: "Tech enthusiasts, 18-35",
  },
  {
    id: "boosted-2",
    content:
      "🌟 Transform your style with @[FashionForward](fashionforward)! Exclusive summer collection now available. Get 30% off your first purchase! #Fashion #Summer2025 #StyleGoals",
    author: {
      id: "sponsor-user-2",
      username: "fashionforward",
      name: "Fashion Forward Co.",
      profilePicture: undefined,
      isVerified: true,
      isProUser: true,
    },
    sponsor: {
      name: "Fashion Forward Co.",
      budget: 3500,
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    media: [],
    views: 12890,
    clicks: 387,
    targetAudience: "Fashion lovers, 20-40",
  },
  {
    id: "boosted-3",
    content:
      "🎮 Level up your gaming experience with @[GameZone](gamezone)! New releases, epic deals, and exclusive content await. Join the gaming revolution! #Gaming #NewReleases #GamerLife",
    author: {
      id: "sponsor-user-3",
      username: "gamezone",
      name: "GameZone Pro",
      profilePicture: undefined,
      isVerified: true,
      isProUser: true,
    },
    sponsor: {
      name: "GameZone Entertainment",
      budget: 4200,
    },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    media: [],
    views: 18750,
    clicks: 521,
    targetAudience: "Gamers, 16-30",
  },
];

// Get random boosted post
const getRandomBoostedPost = (): BoostedPost => {
  return mockBoostedPosts[Math.floor(Math.random() * mockBoostedPosts.length)];
};

// Helper function to safely truncate text with mentions
const safeTruncateWithMentions = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  // Find the last safe position to truncate (before a mention or at a space)
  let truncatePos = maxLength;

  // Look for mention patterns @[username](username) and avoid breaking them
  const mentionRegex = /@\[[^\]]+\]\([^)]+\)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionStart = match.index;
    const mentionEnd = match.index + match[0].length;

    // If truncation would be inside a mention, truncate before it
    if (truncatePos > mentionStart && truncatePos < mentionEnd) {
      truncatePos = mentionStart;
      break;
    }
  }

  // If we're still too long, find the last space before truncatePos
  if (truncatePos > maxLength) {
    const lastSpace = text.lastIndexOf(" ", maxLength);
    if (lastSpace > 0 && lastSpace < truncatePos) {
      truncatePos = lastSpace;
    } else {
      truncatePos = maxLength;
    }
  }

  return text.substring(0, truncatePos);
};

interface PostFeedProps {
  posts: Post[];
  setPosts: (posts: Post[] | ((prev: Post[]) => Post[])) => void;
  currentUser: { id: string; name: string } | null;
  onPostClick?: (post: Post) => void;
  showCreatePost?: boolean;
  showBoostedPosts?: boolean; // Control whether to show boosted posts
  userId?: string; // For profile page - to fetch specific user's posts by ID
  username?: string; // For profile page - to fetch specific user's posts by username
  fetchEndpoint?: string; // Custom endpoint for fetching posts
  onRefreshPosts?: () => Promise<void>; // Custom refresh function for profile pages
  onPostUpdate?: (updatedPost: Post) => void; // Callback when a post is updated (for modal sync)
  onReact?: (postId: string, reactionType: string) => Promise<void>; // Custom reaction handler from parent
  onLoadMore?: () => Promise<void>; // Custom load more function for infinite scroll
  hasMore?: boolean; // Whether there are more posts to load
  isLoading?: boolean; // Whether posts are currently being loaded
}

export default function PostFeed({
  posts,
  setPosts,
  currentUser,
  onPostClick,
  showCreatePost = false,
  showBoostedPosts = true,
  userId,
  username,
  fetchEndpoint,
  onRefreshPosts,
  onPostUpdate,
  onReact,
  onLoadMore,
  hasMore = true,
  isLoading = false,
}: PostFeedProps) {
  const [isActive, setIsActive] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [visibleComments, setVisibleComments] = useState<{
    [key: string]: number;
  }>({});
  const [commentDropdowns, setCommentDropdowns] = useState<{
    [key: string]: boolean;
  }>({});
  const [editingComment, setEditingComment] = useState<{
    [key: string]: string;
  }>({});
  const [expandedPosts, setExpandedPosts] = useState<{
    [key: string]: boolean;
  }>({});
  const [postDropdowns, setPostDropdowns] = useState<{
    [key: string]: boolean;
  }>({});
  const [boostedPost, setBoostedPost] = useState<BoostedPost>(() =>
    getRandomBoostedPost()
  );
  const [showBoostedPost, setShowBoostedPost] = useState(true);
  const mentionInputRef = useRef<MentionInputRef>(null);
  const commentInputRefs = useRef<{ [key: string]: MentionInputRef }>({});
  const url = import.meta.env.VITE_UPLOADS_URL;
  const navigate = useNavigate();

  const refreshPostsData = async () => {
    if (onRefreshPosts) {
      await onRefreshPosts();
    } else {
      fetchPosts(true);
    }
  };

  const fetchPosts = useCallback(
    async (resetPage = false) => {
      if (loading || (!hasMore && !resetPage)) return;
      setLoading(true);

      try {
        const currentPage = resetPage ? 1 : page;
        let result;

        console.log("PostFeed fetchPosts:", { username, userId, currentPage });

        if (username) {
          console.log("Fetching posts by username:", username);
          result = await apiService.post.getPostsByUsername(
            username,
            currentPage,
            5
          );
        } else if (userId) {
          console.log("Fetching posts by userId:", userId);
          result = await apiService.post.getPostsByUserId(
            userId,
            currentPage,
            5
          );
        } else {
          console.log("Fetching timeline posts");
          result = await apiService.post.getTimelinePosts(currentPage, 5);
        }

        if (resetPage) {
          setPosts(result.post || []);
          setPage(2);
        } else {
          setPosts((prev) => {
            const newPosts = result.post || [];
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueNewPosts = newPosts.filter(
              (post: Post) => !existingIds.has(post.id)
            );
            return [...prev, ...uniqueNewPosts];
          });
          setPage((prev) => prev + 1);
        }

        // Note: hasMore is now controlled by parent component
      } catch (err: any) {
        console.error("Failed to fetch posts", err);
        if (resetPage) {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, hasMore, loading, userId, username, fetchEndpoint, setPosts]
  );

  const throttledFetchPosts = useCallback(() => {
    console.log("Infinite scroll triggered:", {
      loading: isLoading,
      hasMore,
      onLoadMore,
    });
    if (!isLoading && hasMore) {
      if (onLoadMore) {
        onLoadMore();
      } else {
        fetchPosts();
      }
    }
  }, [onLoadMore, fetchPosts, isLoading, hasMore]);

  const loaderRef = useInfiniteScroll(
    throttledFetchPosts,
    hasMore && !isLoading
  );
  const handlePostSubmit = async () => {
    if (!postContent.trim() || !currentUser) return;

    try {
      // Get the formatted content with mentions
      const formattedContent =
        mentionInputRef.current?.getFormattedValue() || postContent;

      // Create the post
      const newPost = await apiService.post.createPost(formattedContent);
      console.log("Created new post:", newPost);

      // Clear the form
      setPostContent("");
      setIsActive(false);

      // If we're on a profile page (username is provided) and onRefreshPosts is available,
      // refresh to get the updated posts for that profile
      if (username && onRefreshPosts) {
        await onRefreshPosts();
      } else if (onRefreshPosts) {
        // If we have a custom refresh function (like for timeline), use it
        await onRefreshPosts();
      } else {
        // Fallback: add the post optimistically and refresh
        if (newPost) {
          setPosts((prev) => [newPost, ...prev]);
        }
        await refreshPostsData();
      }
      mentionInputRef.current?.clear();
    } catch (error) {
      console.error("Failed to create post", error);
    }
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    // If parent provides a custom onReact handler, use it instead
    if (onReact) {
      await onReact(postId, reactionType);
      return;
    }

    // Fallback to default behavior for components without custom reaction handling
    try {
      const updatedPost = (post: Post) => {
        const existingReactionIndex = post.reactions?.findIndex(
          (reaction) => reaction.userId === currentUser.id
        );
        let newReactions = [...(post.reactions || [])];

        if (existingReactionIndex !== undefined && existingReactionIndex >= 0) {
          if (newReactions[existingReactionIndex].type === reactionType) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = {
              ...newReactions[existingReactionIndex],
              type: reactionType,
            };
          }
        } else {
          newReactions.push({
            id: `temp-${Date.now()}`,
            type: reactionType,
            userId: currentUser.id,
            postId: postId,
            createdAt: new Date().toISOString(),
            user: {
              ...currentUser,
              username: currentUser.name.toLowerCase(),
              email: "",
              password: "",
              isVerified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        }

        return { ...post, Reaction: newReactions };
      };

      setPosts((prevData) =>
        prevData.map((post) => (post.id === postId ? updatedPost(post) : post))
      );

      const response = await apiService.reaction.reactToPost(
        postId,
        reactionType
      );

      if (response && response.post) {
        const updatedPostData = {
          ...response.post,
          Reaction: response.post.reactions || response.post.reactions,
        };

        setPosts((prevData) =>
          prevData.map((post) => (post.id === postId ? updatedPostData : post))
        );

        // Notify parent component of post update (for modal sync)
        if (onPostUpdate) {
          onPostUpdate(updatedPostData);
        }
      }
    } catch (error) {
      console.error("Failed to react to post", error);
      await refreshPostsData();
    }
  };
  console.log(posts);
  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentContent = commentInputs[postId]?.trim();
    if (!commentContent || !currentUser) return;

    try {
      // Get the formatted content with mentions from the specific comment input
      const commentRef = commentInputRefs.current[postId];
      const formattedContent =
        commentRef?.getFormattedValue() || commentContent;

      await apiService.comment.addComment(postId, formattedContent);

      // Clear the comment input for this specific post
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      // Use custom refresh function if provided (for profile pages), otherwise use default fetchPosts
      await refreshPostsData();
    } catch (error) {
      console.error("Failed to submit comment", error);
    }
  };

  const showMoreComments = (postId: string) => {
    setVisibleComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 5) + 5,
    }));
  };

  const getVisibleCommentsCount = (postId: string) => {
    return visibleComments[postId] || 5;
  };

  const toggleCommentDropdown = (commentId: string) => {
    setCommentDropdowns((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingComment((prev) => ({
      ...prev,
      [commentId]: currentContent,
    }));
    setCommentDropdowns((prev) => ({
      ...prev,
      [commentId]: false,
    }));
  };

  const handleSaveEditComment = async (commentId: string) => {
    const editedContent = editingComment[commentId]?.trim();
    if (!editedContent) return;

    try {
      await apiService.comment.updateComment(commentId, editedContent);

      setEditingComment((prev) => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
      await refreshPostsData();
    } catch (error) {
      console.error("Failed to edit comment", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiService.comment.deleteComment(commentId);

      setCommentDropdowns((prev) => ({
        ...prev,
        [commentId]: false,
      }));
      await refreshPostsData();
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const cancelEditComment = (commentId: string) => {
    setEditingComment((prev) => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await apiService.comment.reportComment(
        commentId,
        "Inappropriate content"
      );

      setCommentDropdowns((prev) => ({
        ...prev,
        [commentId]: false,
      }));
      alert("Comment reported successfully");
    } catch (error) {
      console.error("Failed to report comment", error);
      alert("Failed to report comment");
    }
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const togglePostDropdown = (postId: string) => {
    setPostDropdowns((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSavePost = async (postId: string) => {
    try {
      await apiService.action.savePost(postId);

      setPostDropdowns((prev) => ({
        ...prev,
        [postId]: false,
      }));
      alert("Post saved successfully!");
    } catch (error) {
      console.error("Failed to save post", error);
      alert("Failed to save post");
    }
  };

  const handleUnfollowUser = async (userId: string, postId: string) => {
    try {
      await apiService.action.unfollowUser(userId);

      setPostDropdowns((prev) => ({
        ...prev,
        [postId]: false,
      }));
      alert("Unfollowed user successfully!");
    } catch (error) {
      console.error("Failed to unfollow user", error);
      alert("Failed to unfollow user");
    }
  };

  const handleUnfollowPage = async (pageId: string, postId: string) => {
    try {
      await apiService.page.unfollowPage(pageId);

      setPostDropdowns((prev) => ({
        ...prev,
        [postId]: false,
      }));
      alert("Unfollowed page successfully!");
    } catch (error) {
      console.error("Failed to unfollow page", error);
      alert("Failed to unfollow page");
    }
  };

  const handleHidePost = (postId: string) => {
    setPosts((prevData) => prevData.filter((post) => post.id !== postId));
    setPostDropdowns((prev) => ({
      ...prev,
      [postId]: false,
    }));
    alert("Post hidden successfully!");
  };

  const handleReportPost = async (postId: string) => {
    try {
      await apiService.action.reportPost(postId, "Inappropriate content");

      setPostDropdowns((prev) => ({
        ...prev,
        [postId]: false,
      }));
      alert("Post reported successfully!");
    } catch (error) {
      console.error("Failed to report post", error);
      alert("Failed to report post");
    }
  };

  const handleOpenInNewTab = (postId: string) => {
    navigate(`/post/${postId}`);
    setPostDropdowns((prev) => ({
      ...prev,
      [postId]: false,
    }));
  };

  // Function to refresh boosted post
  const refreshBoostedPost = () => {
    const newBoostedPost = getRandomBoostedPost();
    setBoostedPost(newBoostedPost);
    setShowBoostedPost(true);
  };

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      {showCreatePost && (
        <div className="relative">
          {isActive && (
            <div
              className="fixed inset-0 bg-black opacity-40 z-30 transition-opacity duration-200"
              onClick={() => setIsActive(false)}
              aria-label="Background overlay"
            />
          )}
          <div
            className={`bg-white rounded-xl shadow-md p-6 flex items-start transition-all duration-200 z-40 relative ${
              isActive ? "ring-4 ring-red-200" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
              <FaceIcon width={24} height={24} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <MentionInput
                value={postContent}
                onChange={(value) => {
                  if (value.length <= 250) {
                    setPostContent(value);
                  }
                }}
                ref={mentionInputRef}
                placeholder="What is on your mind? #Hashtag.. @Mention.. Link.."
                className={`w-full transition-all duration-200 ${
                  isActive ? "transform scale-[1.02]" : ""
                }`}
                disabled={loading}
                autoFocus={isActive}
                onFocus={() => setIsActive(true)}
                onBlur={() => !postContent && setIsActive(false)}
              />
              {isActive && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-base text-gray-500">
                    <span
                      className={
                        postContent.length > 200
                          ? "text-orange-500"
                          : postContent.length === 250
                          ? "text-red-500"
                          : ""
                      }
                    >
                      {postContent.length}/250
                    </span>
                  </div>
                  <button
                    className="bg-red-600 cursor-pointer text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    disabled={!postContent.trim() || postContent.length > 250}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handlePostSubmit}
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <>
          {/* Boosted Post */}
          {showBoostedPosts && showBoostedPost && (
            <div
              className="relative bg-white rounded-xl shadow-lg p-8 mb-6 border-4 border-transparent bg-clip-padding"
              style={{
                background:
                  "linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899) border-box",
              }}
            >
              {/* Content */}
              <div className="relative z-10 bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-lg p-6">
                {/* Sponsored Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      ✨ Sponsored
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      🚀 Boosted
                    </span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setShowBoostedPost(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Post Header */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mr-4 flex items-center justify-center">
                    {boostedPost.author?.profilePicture ? (
                      <img
                        src={boostedPost.author.profilePicture}
                        alt={boostedPost.author?.name || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FaceIcon width={24} height={24} className="text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">
                      {boostedPost.author?.name || "Unknown User"}
                      <UserBadges
                        isVerified={boostedPost.author?.isVerified}
                        isPro={boostedPost.author?.isProUser}
                        size="md"
                        spacing="normal"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(boostedPost.createdAt), {
                        addSuffix: true,
                      })}{" "}
                      • Sponsored by {boostedPost.sponsor.name}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4 text-gray-700 text-base">
                  <MentionText text={boostedPost.content || ""} />
                </div>

                {/* Boosted Post Stats */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mr-1"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      {boostedPost.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mr-1"
                      >
                        <path d="M9 11H3l3.64 7.64a.75.75 0 001.28 0L12 13h6l-3.64-7.64a.75.75 0 00-1.28 0L9 11z"></path>
                      </svg>
                      {boostedPost.clicks.toLocaleString()} clicks
                    </span>
                    <span className="text-blue-600 font-medium">
                      Target: {boostedPost.targetAudience}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex space-x-3">
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    onClick={() => {
                      // Track click for analytics
                      console.log("Boosted post clicked - Learn More");
                      // You can add analytics tracking here
                      window.open("https://techcorp.com", "_blank");
                    }}
                  >
                    Learn More
                  </button>
                  <button
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setShowBoostedPost(false)}
                  >
                    Hide Ad
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Posts */}
          {posts.map((post) => (
            <div className="bg-white rounded-xl shadow-md p-8" key={post.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                    {/* Show page profile picture if it's a page post, otherwise show user profile picture */}
                    {post.page ? (
                      post.page.profileImage ? (
                        <img
                          src={`${url}/${post.page.profileImage}`}
                          alt={post.page.name || "Page"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaceIcon
                          width={24}
                          height={24}
                          style={{ color: "var(--gray-5)" }}
                        />
                      )
                    ) : post.author?.profilePicture ? (
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
                      {post.page ? (
                        /* If it's a page post, show page name and make it clickable */
                        <button
                          onClick={() => navigate(`/page/${post.page?.id}`)}
                          className="hover:underline cursor-pointer"
                        >
                          {post.page.name}
                          <UserBadges
                            isVerified={post.page.isVerified}
                            isPro={false}
                            size="md"
                            spacing="normal"
                          />
                        </button>
                      ) : (
                        /* If it's a regular post, show user name and make it clickable */
                        <>
                          <button
                            onClick={() =>
                              navigate(`/profile/${post.author?.username}`)
                            }
                            className="hover:underline cursor-pointer"
                          >
                            {post.author?.name || "Unknown User"}
                          </button>
                          <UserBadges
                            isVerified={post.author?.isVerified}
                            isPro={post.author?.isProUser}
                            size="md"
                            spacing="normal"
                          />
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>

                {/* Post Dropdown Menu */}
                <div className="relative post-dropdown">
                  <button
                    onClick={() => togglePostDropdown(post.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-500"
                    >
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </button>

                  {postDropdowns[post.id] && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => handleSavePost(post.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Save Post</span>
                      </button>

                      <button
                        onClick={() => {
                          if (post.page) {
                            // If it's a page post, unfollow the page
                            handleUnfollowPage(post.page.id, post.id);
                          } else {
                            // If it's a user post, unfollow the user
                            handleUnfollowUser(post.author?.id || "", post.id);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="18" y1="8" x2="23" y2="13"></line>
                          <line x1="23" y1="8" x2="18" y2="13"></line>
                        </svg>
                        <span>
                          Unfollow{" "}
                          {post.page
                            ? post.page.name
                            : post.author?.name || "User"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleHidePost(post.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                          <line x1="4.9" y1="4.9" x2="19.1" y2="19.1"></line>
                        </svg>
                        <span>Hide this post</span>
                      </button>

                      <button
                        onClick={() => handleReportPost(post.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                          <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                        <span>Report post</span>
                      </button>

                      <button
                        onClick={() => handleOpenInNewTab(post.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15,3 21,3 21,9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        <span>Open post in new tab</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 text-gray-700 text-base">
                {post.content && post.content.length > 50 ? (
                  <>
                    {expandedPosts[post.id] ? (
                      <>
                        <MentionText text={post.content || ""} />
                        <button
                          onClick={() => togglePostExpansion(post.id)}
                          className="text-blue-600 hover:text-blue-800 ml-1 font-medium cursor-pointer"
                        >
                          Read less
                        </button>
                      </>
                    ) : (
                      <>
                        <MentionText
                          text={
                            safeTruncateWithMentions(post.content || "", 50) +
                            "..."
                          }
                        />
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
                  <MentionText text={post.content || ""} />
                )}

                {post.media && post.media.length > 0 && (
                  <PostMediaGrid
                    media={post.media}
                    onImageClick={() => onPostClick?.(post)}
                  />
                )}

                {/* Reactions and Comments Count Row */}
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
                              key={reaction.id}
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
                  <button
                    className="text-xs text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    onClick={() => toggleComments(post.id)}
                  >
                    {Array.isArray(post.comments) && post.comments.length > 0
                      ? `${post.comments.length} ${
                          post.comments.length === 1 ? "comment" : "comments"
                        }`
                      : "0 comment"}
                  </button>
                </div>
              </div>

              <div className="flex items-center border-t border-gray-100 pt-4 space-x-8">
                {/* Like Button */}
                {(() => {
                  const userReaction = post.reactions?.find(
                    (reaction) =>
                      currentUser && reaction.userId === currentUser.id
                  );

                  return (
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
                            {["👍", "❤️", "😂", "😢", "😮", "😠"].map(
                              (emoji, i) => {
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
                                    key={`${post.id}-${i}`}
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
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Comment Button */}
                <button
                  className="flex items-center text-gray-500 hover:text-blue-600 transition focus:outline-none"
                  onClick={() => toggleComments(post.id)}
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

              {/* Comment Section */}
              <div className="mt-5">
                {/* Show Comments when toggled */}
                {showComments[post.id] && (
                  <div className="mb-4 space-y-3">
                    {post.comments && post.comments.length > 0 ? (
                      <>
                        {/* Show "View previous comments" button if there are more than 5 comments */}
                        {post.comments.length > 5 &&
                          getVisibleCommentsCount(post.id) <
                            post.comments.length && (
                            <button
                              onClick={() => showMoreComments(post.id)}
                              className="w-full text-center py-2 text-sm text-gray-600 hover:text-blue-600 transition cursor-pointer"
                            >
                              View previous comments (
                              {post.comments.length -
                                getVisibleCommentsCount(post.id)}{" "}
                              more)
                            </button>
                          )}

                        {/* Display comments */}
                        {post.comments
                          .slice(-getVisibleCommentsCount(post.id))
                          .map((comment: any) => (
                            <div
                              key={comment.id}
                              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg relative group"
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
                                  <div className="font-medium text-sm text-gray-800">
                                    {comment.user?.username || "Anonymous User"}
                                    <UserBadges
                                      isVerified={comment.user?.isVerified}
                                      isPro={comment.user?.isPro}
                                      size="sm"
                                      spacing="tight"
                                    />
                                  </div>
                                  {editingComment[comment.id] !== undefined ? (
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        value={editingComment[comment.id]}
                                        onChange={(e) =>
                                          setEditingComment((prev) => ({
                                            ...prev,
                                            [comment.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleSaveEditComment(comment.id);
                                          } else if (e.key === "Escape") {
                                            cancelEditComment(comment.id);
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                      />
                                      <div className="flex space-x-2 mt-2">
                                        <button
                                          onClick={() =>
                                            handleSaveEditComment(comment.id)
                                          }
                                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() =>
                                            cancelEditComment(comment.id)
                                          }
                                          className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-700 mt-1">
                                      <MentionText
                                        text={
                                          comment.content ||
                                          "This is a sample comment."
                                        }
                                      />
                                    </div>
                                  )}
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

                              {/* Three-dot menu for comments */}
                              <div className="relative comment-dropdown">
                                <button
                                  onClick={() =>
                                    toggleCommentDropdown(comment.id)
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition-all duration-200"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-500"
                                  >
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                  </svg>
                                </button>

                                {/* Dropdown menu */}
                                {commentDropdowns[comment.id] && (
                                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[100px]">
                                    {currentUser &&
                                    comment.user?.id === currentUser.id ? (
                                      // User's own comment - show Edit and Delete
                                      <>
                                        <button
                                          onClick={() =>
                                            handleEditComment(
                                              comment.id,
                                              comment.content ||
                                                "This is a sample comment."
                                            )
                                          }
                                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                          </svg>
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(comment.id)
                                          }
                                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                          </svg>
                                          <span>Delete</span>
                                        </button>
                                      </>
                                    ) : (
                                      // Other user's comment - show only Report
                                      <button
                                        onClick={() =>
                                          handleReportComment(comment.id)
                                        }
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                      >
                                        <svg
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                          <line
                                            x1="4"
                                            y1="22"
                                            x2="4"
                                            y2="15"
                                          ></line>
                                        </svg>
                                        <span>Report</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                )}

                {/* Write Comment Input */}
                <div className="relative">
                  <MentionInput
                    value={commentInputs[post.id] || ""}
                    onChange={(value) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: value,
                      }))
                    }
                    placeholder="Write a comment..."
                    className="w-full pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommentSubmit(post.id);
                      }
                    }}
                    ref={(ref) => {
                      if (ref) {
                        commentInputRefs.current[post.id] = ref;
                      }
                    }}
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
              </div>
            </div>
          ))}

          {/* Loading and infinite scroll indicators */}
          {loading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Loading more posts...</p>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">You've reached the end</p>
            </div>
          )}
          {hasMore && !isLoading && (
            <div
              ref={loaderRef}
              className="h-20 flex items-center justify-center"
            >
              <div className="text-gray-400 text-sm">Loading more posts...</div>
            </div>
          )}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="text-gray-500 mt-2 text-sm">
                Loading more posts...
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">No posts found</div>
      )}
    </div>
  );
}
