import React, { useState, useRef } from "react";
import type { PagePost, User, Page } from "../../type";
import { formatDistanceToNow } from "date-fns";
import { DotsVerticalIcon, PlusIcon, FaceIcon } from "@radix-ui/react-icons";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import PostMediaGrid from "./PostMediaGrid";
import MentionInput, { type MentionInputRef } from "./MentionInput";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import { AccountStatusWarning } from "../../components/AccountStatusWarning";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import {
  canUserPost,
  canUserComment,
  canUserReact,
} from "../../utils/accountStatus";

interface PagePostFeedProps {
  posts: PagePost[];
  onNewPost: (content: string, media?: File[]) => Promise<PagePost>;
  loadMorePosts: (
    page: number
  ) => Promise<{ posts: PagePost[]; hasMore: boolean }>;
  currentUser: User | null;
  canPost: boolean;
  loading: boolean;
  page: Page;
  onPostClick?: (post: PagePost) => void;
}

const PagePostFeed: React.FC<PagePostFeedProps> = ({
  posts,
  onNewPost,
  loadMorePosts,
  currentUser,
  canPost,
  loading,
  page,
  onPostClick,
}) => {
  const navigate = useNavigate();
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [postStates, setPostStates] = useState<{ [key: string]: any }>({});
  const [displayedPosts, setDisplayedPosts] = useState<PagePost[]>(posts);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{
    [postId: string]: string;
  }>({});
  const [visibleCommentsCount, setVisibleCommentsCount] = useState<{
    [postId: string]: number;
  }>({});

  const mentionInputRef = useRef<MentionInputRef>(null);

  // Load more posts function
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await loadMorePosts(currentPage + 1);
      if (result.posts.length > 0) {
        setDisplayedPosts((prev) => [...prev, ...result.posts]);
        setCurrentPage((prev) => prev + 1);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Update displayed posts when posts prop changes
  React.useEffect(() => {
    setDisplayedPosts(posts);
    setCurrentPage(1);
    setHasMore(true);
  }, [posts]);
  const url = import.meta.env.VITE_UPLOADS_URL;
  // Infinite scroll setup
  const loaderRef = useInfiniteScroll(loadMore, hasMore && !loadingMore);

  const handleCreatePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0) return;

    // Check if user can post
    if (!canUserPost(currentUser)) {
      console.log("User cannot post due to account status");
      return;
    }

    try {
      setIsCreatingPost(true);
      setUploadingImages(true);
      await onNewPost(postContent, selectedImages);

      // Reset form
      setPostContent("");
      clearImages();
      if (mentionInputRef.current) {
        mentionInputRef.current.clear();
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsCreatingPost(false);
      setUploadingImages(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxImages = 4;

    if (selectedImages.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images per post.`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        alert(`${file.name} is not a valid image file.`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);

      // Create preview URLs
      const newPreviewUrls = validFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }

    // Clear the input value to allow selecting the same file again
    event.target.value = "";
  };

  // Remove selected image
  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all images
  const clearImages = () => {
    // Revoke all object URLs
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    // Check if user can react
    if (!canUserReact(currentUser)) {
      console.log("User cannot react due to account status");
      return;
    }

    try {
      await apiService.reaction.reactToPost(postId, reactionType);

      // Update post state optimistically
      const currentReactions = postStates[postId]?.reactions || [];
      const existingReaction = currentReactions.find(
        (r: any) => r.userId === currentUser?.id
      );

      let newReactions;
      if (existingReaction && existingReaction.type === reactionType) {
        // Remove reaction
        newReactions = currentReactions.filter(
          (r: any) => r.userId !== currentUser?.id
        );
      } else if (existingReaction) {
        // Update reaction type
        newReactions = currentReactions.map((r: any) =>
          r.userId === currentUser?.id ? { ...r, type: reactionType } : r
        );
      } else {
        // Add new reaction
        newReactions = [
          ...currentReactions,
          {
            id: `temp-${Date.now()}`,
            type: reactionType,
            userId: currentUser?.id,
            user: currentUser,
          },
        ];
      }

      setPostStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          reactions: newReactions,
        },
      }));
    } catch (error) {
      console.error("Failed to react to post:", error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) return;

    // Check if user can comment
    if (!canUserComment(currentUser)) {
      console.log("User cannot comment due to account status");
      return;
    }

    try {
      const response = await apiService.comment.addComment(postId, content);

      // Create a properly structured comment object
      const newComment = {
        id: response.comment?.id || response.id || `temp-${Date.now()}`,
        content: content,
        userId: currentUser?.id,
        postId: postId,
        createdAt:
          response.comment?.createdAt ||
          response.createdAt ||
          new Date().toISOString(),
        user: currentUser || {
          id: "unknown",
          username: "Unknown User",
          name: "Unknown User",
          profilePicture: null,
        },
      };

      // Get existing comments - either from local state or original post
      const currentPost = displayedPosts.find((p) => p.id === postId);
      const existingComments =
        postStates[postId]?.comments || currentPost?.comments || [];

      // Since API returns DESC order (newest first), we need to add new comment at the beginning
      // but we'll reverse the order for display to show newest at bottom
      const updatedComments = [newComment, ...existingComments];

      // Update post state with new comment
      setPostStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: updatedComments,
        },
      }));
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const getPostReactions = (post: PagePost) => {
    return postStates[post.id]?.reactions || post.reactions || [];
  };

  const getPostComments = (post: PagePost) => {
    // If we have local state comments, use them (they include original + new comments)
    // Otherwise, use the original post comments
    if (postStates[post.id]?.comments) {
      return postStates[post.id].comments;
    }
    return post.comments || [];
  };

  // Function to show more comments
  const showMoreComments = (postId: string) => {
    setVisibleCommentsCount((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 5) + 5,
    }));
  };

  // Function to get visible comments count for a post
  const getVisibleCommentsCount = (postId: string) => {
    return visibleCommentsCount[postId] || 5;
  };

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      {canPost && currentUser && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {!canUserPost(currentUser) ? (
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                {currentUser.profilePicture &&
                currentUser.profilePicture !== "null" ? (
                  <img
                    src={`${url}/${currentUser.profilePicture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaceIcon
                      width={24}
                      height={24}
                      className="text-gray-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-900">
                    {currentUser.name}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    posting to {page.name}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-gray-500 cursor-not-allowed">
                  What's on your mind?
                </div>
                <div className="mt-4">
                  <AccountStatusWarning user={currentUser} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                {currentUser.profilePicture &&
                currentUser.profilePicture !== "null" ? (
                  <img
                    src={`${url}/${currentUser.profilePicture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaceIcon
                      width={24}
                      height={24}
                      className="text-gray-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-900">
                    {currentUser.name}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    posting to {page.name}
                  </span>
                </div>

                <MentionInput
                  ref={mentionInputRef}
                  placeholder={`What's happening on ${page.name}?`}
                  value={postContent}
                  onChange={(value) => {
                    if (value.length <= 250) {
                      setPostContent(value);
                    }
                  }}
                  className="w-full min-h-[100px] p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none text-lg"
                  disabled={uploadingImages}
                />

                {/* Character Count */}
                <div className="flex justify-end mt-2">
                  <span
                    className={`text-sm ${
                      postContent.length > 200
                        ? postContent.length > 250
                          ? "text-red-500"
                          : "text-orange-500"
                        : "text-gray-400"
                    }`}
                  >
                    {postContent.length}/250
                  </span>
                </div>

                {/* Media Preview */}
                {imagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-xl shadow-sm"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute z-0 -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                          <div className="absolute inset-0 bg-black/0 rounded-xl transition-all duration-200"></div>
                        </div>
                      ))}
                    </div>

                    {/* Clear All Button */}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={clearImages}
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors duration-200"
                      >
                        Clear all images
                      </button>
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={uploadingImages || selectedImages.length >= 4}
                      />
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {selectedImages.length > 0
                          ? `${selectedImages.length}/4 Photos`
                          : "Photos"}
                      </span>
                    </label>
                  </div>

                  {/* Character Count */}
                  <div className="text-sm">
                    <span
                      className={`${
                        postContent.length > 200
                          ? postContent.length > 250
                            ? "text-red-500"
                            : "text-orange-500"
                          : "text-gray-400"
                      }`}
                    >
                      {postContent.length}/250
                    </span>
                  </div>
                </div>

                {/* Post Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleCreatePost}
                    disabled={
                      isCreatingPost ||
                      (!postContent.trim() && selectedImages.length === 0) ||
                      postContent.length > 250 ||
                      uploadingImages
                    }
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 flex items-center space-x-2 min-w-[120px] justify-center"
                  >
                    {isCreatingPost || uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-8 animate-pulse"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="w-full h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : displayedPosts.length > 0 ? (
        <div className="space-y-6">
          {displayedPosts.map((post) => {
            const reactions = getPostReactions(post);
            const comments = getPostComments(post);
            const isExpanded = expandedPosts.has(post.id);

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          navigate(`/profile/${post.author?.username}`)
                        }
                        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                      >
                        {post.author?.profilePicture &&
                        post.author.profilePicture !== "null" ? (
                          <img
                            src={`${url}/${post.author.profilePicture}`}
                            alt={post.author?.name || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <FaceIcon
                              width={24}
                              height={24}
                              className="text-gray-600"
                            />
                          </div>
                        )}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/profile/${post.author?.username}`)
                            }
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {post.author?.name || "Unknown User"}
                          </button>
                          <UserBadges
                            isVerified={post.author?.isVerified}
                            isPro={post.author?.isProUser}
                          />
                          <span className="text-gray-500">→</span>
                          <span className="font-medium text-blue-600">
                            {page.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <DotsVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <div className="mb-4 text-black">
                      <MentionText text={post.content} />
                    </div>
                  )}
                </div>

                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <PostMediaGrid
                    media={post.media}
                    onImageClick={() => onPostClick?.(post)}
                  />
                )}

                {/* Post Actions */}
                <div className="px-6 py-4">
                  {/* Reaction Summary */}
                  {reactions.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          {["❤️", "👍", "😂", "😮", "😢", "😠"]
                            .slice(0, 3)
                            .map((emoji, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs"
                              >
                                {emoji}
                              </div>
                            ))}
                        </div>
                        <span>{reactions.length} reactions</span>
                      </div>

                      {comments.length > 0 && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {comments.length} comments
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center border-t border-gray-100 pt-4 space-x-8">
                    {/* Like Button with Reaction System */}
                    {(() => {
                      const userReaction = reactions.find(
                        (reaction: any) =>
                          currentUser && reaction.userId === currentUser.id
                      );

                      return !canUserReact(currentUser) ? (
                        <div className="flex items-center text-gray-400 cursor-not-allowed">
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
                          <span className="text-base font-medium">Like</span>
                        </div>
                      ) : (
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

                            <div className="absolute left-0 bottom-full mb-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                              <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-2 px-3 flex space-x-2 min-w-max transform -translate-x-4">
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
                                        <span className="text-3xl">
                                          {emoji}
                                        </span>
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

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Add Comment */}
                      {currentUser && (
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {currentUser.profilePicture &&
                            currentUser.profilePicture !== "null" ? (
                              <img
                                src={`${url}/${currentUser.profilePicture}`}
                                alt={currentUser.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <FaceIcon
                                  width={16}
                                  height={16}
                                  className="text-gray-600"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            {!canUserComment(currentUser) ? (
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
                                    Write a comment...
                                  </div>
                                  <button
                                    className="px-3 py-1 bg-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed"
                                    disabled
                                  >
                                    Post
                                  </button>
                                </div>
                                <AccountStatusWarning user={currentUser} />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 mb-2">
                                <MentionInput
                                  placeholder="Write a comment..."
                                  value={commentInputs[post.id] || ""}
                                  onChange={(content) => {
                                    setCommentInputs((prev) => ({
                                      ...prev,
                                      [post.id]: content,
                                    }));
                                  }}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => {
                                    const content = commentInputs[post.id];
                                    if (content && content.trim()) {
                                      handleAddComment(post.id, content);
                                      setCommentInputs((prev) => ({
                                        ...prev,
                                        [post.id]: "",
                                      }));
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  Post
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comments List */}
                      <div className="space-y-3">
                        {/* Show "View previous comments" button if there are more than 5 comments */}
                        {comments.length > 5 &&
                          getVisibleCommentsCount(post.id) <
                            comments.length && (
                            <button
                              onClick={() => showMoreComments(post.id)}
                              className="w-full text-center py-2 text-sm text-gray-600 hover:text-blue-600 transition cursor-pointer"
                            >
                              View previous comments (
                              {comments.length -
                                getVisibleCommentsCount(post.id)}{" "}
                              more)
                            </button>
                          )}

                        {/* Display comments - reverse order to show oldest first, newest last */}
                        {comments
                          .slice()
                          .reverse()
                          .slice(-getVisibleCommentsCount(post.id))
                          .map((comment: any) => (
                            <div
                              key={comment.id}
                              className="flex items-start space-x-3"
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                {comment.user?.profilePicture &&
                                comment.user.profilePicture !== "null" ? (
                                  <img
                                    src={`${url}/${comment.user.profilePicture}`}
                                    alt={comment.user?.username || "User"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <FaceIcon
                                      width={16}
                                      height={16}
                                      className="text-gray-600"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg px-3 py-2">
                                  <div className="font-medium text-sm text-gray-900 mb-1">
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/profile/${
                                            comment.user?.username || "unknown"
                                          }`
                                        )
                                      }
                                      className="text-blue-600 hover:underline font-medium"
                                    >
                                      {comment.user?.username || "Unknown User"}
                                    </button>
                                  </div>
                                  <MentionText
                                    text={comment.content || ""}
                                    className="text-sm text-black"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 mt-1 ml-3">
                                  {formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    { addSuffix: true }
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loadingMore ? "Loading..." : "Load More Posts"}
              </button>
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="h-4" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-4">
            {canPost
              ? "Be the first to post something on this page!"
              : "This page doesn't have any posts yet."}
          </p>
          {canPost && (
            <button
              onClick={() => {
                // Focus on create post input
                const textarea = document.querySelector(
                  'textarea[placeholder*="What\'s happening"]'
                ) as HTMLTextAreaElement;
                textarea?.focus();
              }}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Post
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PagePostFeed;
