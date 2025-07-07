import { useState, useCallback, useRef, useEffect } from "react";
import type { Post, User } from "../../type";
import { formatDistanceToNow } from "date-fns";
import { FaceIcon } from "@radix-ui/react-icons";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import PostMediaGrid from "./PostMediaGrid";
import MentionInput, { type MentionInputRef } from "./MentionInput";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import {
  canUserPost,
  canUserComment,
  canUserReact,
} from "../../utils/accountStatus";
import { AccountStatusWarning } from "../../components/AccountStatusWarning";

// No more mock boosted posts - only use database posts

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
  currentUser: User | null;
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
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  const [selectedBoostedPost, setSelectedBoostedPost] = useState<Post | null>(
    null
  );
  const mentionInputRef = useRef<MentionInputRef>(null);
  const commentInputRefs = useRef<{ [key: string]: MentionInputRef }>({});
  const url = import.meta.env.VITE_UPLOADS_URL;
  const navigate = useNavigate();

  // Keep selectedBoostedPost synchronized with posts array
  useEffect(() => {
    if (selectedBoostedPost) {
      const updatedPost = posts.find(
        (post) => post.id === selectedBoostedPost.id
      );
      if (
        updatedPost &&
        (updatedPost.reactions?.length !==
          selectedBoostedPost.reactions?.length ||
          updatedPost.comments?.length !== selectedBoostedPost.comments?.length)
      ) {
        setSelectedBoostedPost(updatedPost);
      }
    }
  }, [posts, selectedBoostedPost]);

  // Listen for changes in posts array and update selectedBoostedPost accordingly
  useEffect(() => {
    if (selectedBoostedPost) {
      const updatedPost = posts.find(
        (post) => post.id === selectedBoostedPost.id
      );
      if (updatedPost) {
        // Check if the post has been updated (different reaction count or content)
        const reactionsChanged =
          (updatedPost.reactions?.length || 0) !==
            (selectedBoostedPost.reactions?.length || 0) ||
          JSON.stringify(updatedPost.reactions) !==
            JSON.stringify(selectedBoostedPost.reactions);

        const commentsChanged =
          (updatedPost.comments?.length || 0) !==
          (selectedBoostedPost.comments?.length || 0);

        if (reactionsChanged || commentsChanged) {
          console.log("Updating selectedBoostedPost due to changes:", {
            reactionsChanged,
            commentsChanged,
            oldReactions: selectedBoostedPost.reactions?.length || 0,
            newReactions: updatedPost.reactions?.length || 0,
          });
          setSelectedBoostedPost(updatedPost);
        }
      }
    }
  }, [posts]);

  // Select one random boosted post when posts change
  useEffect(() => {
    console.log("Posts changed, length:", posts.length);
    console.log("Current selectedBoostedPost:", selectedBoostedPost?.id);

    if (posts.length > 0) {
      const boostedPosts = posts.filter((post: any) => post.isBoosted);
      console.log("Boosted posts found:", boostedPosts.length);
      console.log(
        "Boosted post IDs:",
        boostedPosts.map((p) => p.id)
      );

      if (boostedPosts.length > 0) {
        // If we don't have a selected boosted post, select a new one
        if (!selectedBoostedPost) {
          const randomBoostedPost =
            boostedPosts[Math.floor(Math.random() * boostedPosts.length)];
          console.log(
            "No selected boosted post, selecting new one:",
            randomBoostedPost.id
          );
          setSelectedBoostedPost(randomBoostedPost);
        } else {
          // Check if the current selected boosted post is still in the boosted posts list
          const currentBoostedPostStillExists = boostedPosts.find(
            (p) => p.id === selectedBoostedPost.id
          );
          if (currentBoostedPostStillExists) {
            console.log(
              "Keeping existing boosted post:",
              selectedBoostedPost.id
            );
            // Only update if the post data has actually changed to avoid unnecessary re-renders
            if (
              JSON.stringify(currentBoostedPostStillExists) !==
              JSON.stringify(selectedBoostedPost)
            ) {
              console.log("Updating selectedBoostedPost with new data");
              setSelectedBoostedPost(currentBoostedPostStillExists);
            }
          } else {
            // Only select a new one if the current one is no longer available
            const randomBoostedPost =
              boostedPosts[Math.floor(Math.random() * boostedPosts.length)];
            console.log(
              "Current boosted post no longer exists, selecting new one:",
              randomBoostedPost.id
            );
            setSelectedBoostedPost(randomBoostedPost);
          }
        }
      } else {
        console.log("No boosted posts found, clearing selection");
        if (selectedBoostedPost) {
          setSelectedBoostedPost(null);
        }
      }
    } else {
      console.log("No posts found, clearing boosted post selection");
      if (selectedBoostedPost) {
        setSelectedBoostedPost(null);
      }
    }
  }, [posts]); // Remove selectedBoostedPost from dependency to avoid infinite loops

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

  // Handle image selection
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

  const handlePostSubmit = async () => {
    if ((!postContent.trim() && selectedImages.length === 0) || !currentUser)
      return;

    try {
      setUploadingImages(true);

      // Get the formatted content with mentions
      const formattedContent =
        mentionInputRef.current?.getFormattedValue() || postContent;

      // Create the post with images
      const newPost = await apiService.post.createPost(
        formattedContent,
        selectedImages.length > 0 ? selectedImages : undefined
      );
      console.log("Created new post:", newPost);

      // Clear the form
      setPostContent("");
      clearImages();
      mentionInputRef.current?.clear();

      // Refresh posts - use only one method to avoid double updates
      if (onRefreshPosts) {
        await onRefreshPosts();
      } else {
        // If we have a custom refresh function, use it
        // Otherwise, add the new post and refresh
        if (newPost) {
          setPosts((prev) => [newPost, ...prev]);
        }
        // Don't call refreshPostsData here as it might cause duplicate fetches
      }
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    // Check if user can react
    if (!canUserReact(currentUser)) {
      console.log("User cannot react due to account status");
      return;
    }

    // Check if this is a real boosted post
    if (selectedBoostedPost && postId === selectedBoostedPost.id) {
      // Handle real boosted post reactions using the parent's onReact
      if (onReact) {
        await onReact(postId, reactionType);
        return;
      }

      // Fallback for real boosted posts - optimistic update
      setPosts((prevData) =>
        prevData.map((post) => {
          if (post.id === postId) {
            const existingReactionIndex = post.reactions?.findIndex(
              (reaction) => reaction.userId === currentUser.id
            );
            let newReactions = [...(post.reactions || [])];

            if (
              existingReactionIndex !== undefined &&
              existingReactionIndex >= 0
            ) {
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
                user: currentUser,
              });
            }

            const updatedPost = {
              ...post,
              reactions: newReactions,
              // Preserve boosted post properties for boosted posts
              ...((post as any).isBoosted
                ? { isBoosted: true, boostedAt: (post as any).boostedAt }
                : {}),
            };

            // Update selectedBoostedPost if it matches this post
            if (selectedBoostedPost && selectedBoostedPost.id === postId) {
              setSelectedBoostedPost(updatedPost);
            }

            return updatedPost;
          }
          return post;
        })
      );

      try {
        const response = await apiService.reaction.reactToPost(
          postId,
          reactionType
        );
        if (response && response.post) {
          setPosts((prevData) =>
            prevData.map((post) => {
              if (post.id === postId) {
                const updatedPost = {
                  ...response.post,
                  reactions:
                    response.post.reactions || response.post.Reaction || [],
                  // Preserve boosted post properties
                  ...((post as any).isBoosted
                    ? { isBoosted: true, boostedAt: (post as any).boostedAt }
                    : {}),
                };

                // Update selectedBoostedPost if it matches this post
                if (selectedBoostedPost && selectedBoostedPost.id === postId) {
                  setSelectedBoostedPost(updatedPost);
                }

                return updatedPost;
              }
              return post;
            })
          );
        }
      } catch (error) {
        console.error("Failed to react to boosted post", error);
      }
      return;
    }

    // If parent provides a custom onReact handler, use it but also do optimistic update
    if (onReact) {
      // Do optimistic update first for immediate UI feedback
      setPosts((prevData) =>
        prevData.map((post) => {
          if (post.id === postId) {
            const existingReactionIndex = post.reactions?.findIndex(
              (reaction) => reaction.userId === currentUser.id
            );
            let newReactions = [...(post.reactions || [])];

            if (
              existingReactionIndex !== undefined &&
              existingReactionIndex >= 0
            ) {
              if (newReactions[existingReactionIndex].type === reactionType) {
                // Remove reaction if clicking the same type
                newReactions.splice(existingReactionIndex, 1);
              } else {
                // Update reaction type
                newReactions[existingReactionIndex] = {
                  ...newReactions[existingReactionIndex],
                  type: reactionType,
                };
              }
            } else {
              // Add new reaction
              newReactions.push({
                id: `temp-${Date.now()}`,
                type: reactionType,
                userId: currentUser.id,
                postId: postId,
                createdAt: new Date().toISOString(),
                user: currentUser,
              });
            }

            const updatedPost = {
              ...post,
              reactions: newReactions,
              // Preserve boosted post properties for boosted posts
              ...((post as any).isBoosted
                ? { isBoosted: true, boostedAt: (post as any).boostedAt }
                : {}),
            };

            // Update selectedBoostedPost if it matches this post
            if (selectedBoostedPost && selectedBoostedPost.id === postId) {
              setSelectedBoostedPost(updatedPost);
            }

            return updatedPost;
          }
          return post;
        })
      );

      // Then call parent handler
      try {
        await onReact(postId, reactionType);
      } catch (error) {
        console.error("Failed to react via parent handler", error);
      }
      return;
    }

    // Fallback to default behavior for components without custom reaction handling
    try {
      // Optimistic update first
      setPosts((prevData) =>
        prevData.map((post) => {
          if (post.id === postId) {
            const existingReactionIndex = post.reactions?.findIndex(
              (reaction) => reaction.userId === currentUser.id
            );
            let newReactions = [...(post.reactions || [])];

            if (
              existingReactionIndex !== undefined &&
              existingReactionIndex >= 0
            ) {
              if (newReactions[existingReactionIndex].type === reactionType) {
                // Remove reaction if clicking the same type
                newReactions.splice(existingReactionIndex, 1);
              } else {
                // Update reaction type
                newReactions[existingReactionIndex] = {
                  ...newReactions[existingReactionIndex],
                  type: reactionType,
                };
              }
            } else {
              // Add new reaction
              newReactions.push({
                id: `temp-${Date.now()}`,
                type: reactionType,
                userId: currentUser.id,
                postId: postId,
                createdAt: new Date().toISOString(),
                user: currentUser,
              });
            }

            const updatedPost = {
              ...post,
              reactions: newReactions,
              // Preserve boosted post properties for boosted posts
              ...((post as any).isBoosted
                ? { isBoosted: true, boostedAt: (post as any).boostedAt }
                : {}),
            };

            // Update selectedBoostedPost if it matches this post
            if (selectedBoostedPost && selectedBoostedPost.id === postId) {
              setSelectedBoostedPost(updatedPost);
            }

            return updatedPost;
          }
          return post;
        })
      );

      // Make API call
      const response = await apiService.reaction.reactToPost(
        postId,
        reactionType
      );

      // Update with real response if available
      if (response && response.post) {
        setPosts((prevData) =>
          prevData.map((post) => {
            if (post.id === postId) {
              const updatedPost = {
                ...response.post,
                reactions:
                  response.post.reactions || response.post.Reaction || [],
                // Preserve boosted post properties
                ...((post as any).isBoosted
                  ? { isBoosted: true, boostedAt: (post as any).boostedAt }
                  : {}),
              };

              // Update selectedBoostedPost if it matches this post
              if (selectedBoostedPost && selectedBoostedPost.id === postId) {
                setSelectedBoostedPost(updatedPost);
              }

              return updatedPost;
            }
            return post;
          })
        );

        // Notify parent component of post update (for modal sync)
        if (onPostUpdate) {
          onPostUpdate({
            ...response.post,
            reactions: response.post.reactions || response.post.Reaction || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to react to post", error);
      // Don't refresh posts on error - just log it
      // The optimistic update will remain, user can try again
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
    console.log("handleCommentSubmit called with postId:", postId);

    if (!currentUser) {
      console.log("No current user");
      return;
    }

    // Check if user can comment
    if (!canUserComment(currentUser)) {
      console.log("User cannot comment due to account status");
      return;
    }

    try {
      // Get the formatted content with mentions from the specific comment input
      const commentRef = commentInputRefs.current[postId];
      const stateContent = commentInputs[postId]?.trim();
      const refContent = commentRef?.getFormattedValue()?.trim();

      // Use whichever content is available
      const formattedContent = refContent || stateContent;

      console.log("Content sources:", {
        stateContent,
        refContent,
        formattedContent,
        commentRef: !!commentRef,
      });

      if (!formattedContent) {
        console.log("No content to submit");
        return;
      }

      console.log("Submitting comment:", { postId, formattedContent });

      const response = await apiService.comment.addComment(
        postId,
        formattedContent
      );
      console.log("Comment API response:", response);

      // Clear the comment input for this specific post
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      // Clear the mention input ref as well
      if (commentRef) {
        commentRef.clear();
      }

      // Update the specific post with the new comment instead of refreshing all posts
      if (response) {
        // Create a proper comment object based on the API response
        const newComment = {
          id: response.id || response.comment?.id || `temp-${Date.now()}`,
          content: formattedContent,
          userId: currentUser.id,
          postId: postId,
          createdAt: response.createdAt || new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username || currentUser.name.toLowerCase(),
            profilePicture: currentUser.profilePicture,
            isVerified: currentUser.isVerified,
            isProUser: currentUser.isProUser,
          },
        };

        console.log("TEST1", showBoostedPosts);

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              const updatedPost = {
                ...post,
                comments: [...(post.comments || []), newComment],
              };

              // Update selectedBoostedPost if it matches this post
              if (selectedBoostedPost && selectedBoostedPost.id === postId) {
                setSelectedBoostedPost(updatedPost);
              }

              return updatedPost;
            }
            return post;
          })
        );
      } else {
        // If no response, just refresh the specific post or all posts as fallback
        console.log("No valid response from API, refreshing posts");
        await refreshPostsData();
      }

      console.log("Comment submitted successfully");
    } catch (error) {
      console.error("Failed to submit comment", error);
      console.error(
        "Error details:",
        (error as any).response?.data || (error as any).message
      );

      // Don't refresh posts on error to prevent them from disappearing
      // Just show an error message or console log
      console.log("Comment submission failed, keeping posts intact");
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
  console.log("TEST", selectedBoostedPost);

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      {showCreatePost && (
        <div className="space-y-4">
          {!canUserPost(currentUser) ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {currentUser?.profilePicture ? (
                    <img
                      src={`${url}/${currentUser.profilePicture}`}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaceIcon
                      width={24}
                      height={24}
                      className="text-gray-600"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed">
                    What's on your mind?
                  </div>
                </div>
              </div>
              <AccountStatusWarning user={currentUser} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    {currentUser?.profilePicture ? (
                      <img
                        src={`${url}/${currentUser.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                        <FaceIcon
                          width={24}
                          height={24}
                          className="text-gray-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Create a post</h3>
                  <p className="text-sm text-gray-500">
                    Share what's on your mind
                  </p>
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <MentionInput
                  value={postContent}
                  onChange={(value) => {
                    if (value.length <= 250) {
                      setPostContent(value);
                    }
                  }}
                  ref={mentionInputRef}
                  placeholder="What's on your mind? #Hashtag @Mention"
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
              </div>

              {/* Image Preview Grid */}
              {imagePreviewUrls.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
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
                        <div className="absolute inset-0 bg-black/0  rounded-xl transition-all duration-200"></div>
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

              {/* Actions Bar */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center space-x-3">
                  {/* Photo Upload */}
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
              <div className="flex justify-end">
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 flex items-center space-x-2 min-w-[120px] justify-center"
                  disabled={
                    (!postContent.trim() && selectedImages.length === 0) ||
                    postContent.length > 250 ||
                    uploadingImages
                  }
                  onClick={handlePostSubmit}
                >
                  {uploadingImages ? (
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
          )}
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <>
          {/* Show boosted post if available */}
          {showBoostedPosts && selectedBoostedPost && (
            <div
              key={`boosted-${selectedBoostedPost.id}`}
              className={`relative rounded-xl shadow-md p-8 mb-6 bg-white boosted-border sparkle-container boosted-post-container`}
            >
              {/* Sparkle effects for boosted posts */}
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>

              {/* Boosted Post Indicator */}
              <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg border border-blue-200 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 shimmer-effect"></div>

                <div className="flex items-center space-x-2 text-sm text-blue-700 relative z-10">
                  <div className="animate-bounce">
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className="text-blue-600"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <span className="font-bold text-blue-800">
                    {selectedBoostedPost ? "Boosted Post" : "Sponsored"}
                  </span>
                </div>
                <div className="flex items-center space-x-1 relative z-10">
                  <span className="text-xs text-white bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                    ⚡ {selectedBoostedPost ? "Promoted" : "Ad"}
                  </span>
                </div>
              </div>

              {/* Post Header */}
              <div className="flex items-center mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                  {selectedBoostedPost.page ? (
                    selectedBoostedPost.page.profileImage ? (
                      <img
                        src={`${url}/${selectedBoostedPost.page.profileImage}`}
                        alt={selectedBoostedPost.page.name || "Page"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FaceIcon
                        width={24}
                        height={24}
                        style={{ color: "var(--gray-5)" }}
                      />
                    )
                  ) : selectedBoostedPost.author?.profilePicture ? (
                    <img
                      src={`${url}/${selectedBoostedPost.author.profilePicture}`}
                      alt={selectedBoostedPost.author?.name || "User"}
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
                    {selectedBoostedPost.page ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/profile/${selectedBoostedPost.author?.username}`
                            )
                          }
                          className="hover:underline cursor-pointer"
                        >
                          {selectedBoostedPost.author?.username ||
                            "Unknown User"}
                        </button>
                        <UserBadges
                          isVerified={selectedBoostedPost.author?.isVerified}
                          isPro={selectedBoostedPost.author?.isProUser}
                          size="md"
                          spacing="normal"
                        />
                        <span className="text-gray-500">→</span>
                        <button
                          onClick={() =>
                            navigate(`/page/${selectedBoostedPost.page?.id}`)
                          }
                          className="hover:underline cursor-pointer"
                        >
                          {selectedBoostedPost.page.name}
                        </button>
                        <UserBadges
                          isVerified={selectedBoostedPost.page.isVerified}
                          isPro={false}
                          size="md"
                          spacing="normal"
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            navigate(
                              `/profile/${selectedBoostedPost.author?.username}`
                            )
                          }
                          className="hover:underline cursor-pointer"
                        >
                          {selectedBoostedPost.author?.name || "Unknown User"}
                        </button>
                        <UserBadges
                          isVerified={selectedBoostedPost.author?.isVerified}
                          isPro={selectedBoostedPost.author?.isProUser}
                          size="md"
                          spacing="normal"
                        />
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedBoostedPost.createdAt &&
                    !isNaN(new Date(selectedBoostedPost.createdAt).getTime())
                      ? formatDistanceToNow(
                          new Date(selectedBoostedPost.createdAt),
                          {
                            addSuffix: true,
                          }
                        )
                      : "Just now"}{" "}
                    • Boosted
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4 text-gray-700 text-base relative z-10">
                <MentionText text={selectedBoostedPost.content || ""} />
              </div>

              {/* Media if available */}
              {selectedBoostedPost.media &&
                selectedBoostedPost.media.length > 0 && (
                  <div className="mb-4 relative z-10">
                    <PostMediaGrid
                      media={selectedBoostedPost.media}
                      onImageClick={() => onPostClick?.(selectedBoostedPost)}
                    />
                  </div>
                )}

              {/* Post Stats */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 relative z-10">
                <div className="flex items-center space-x-4">
                  {/* Reactions Display */}
                  {(() => {
                    const reactions = selectedBoostedPost?.reactions || [];

                    return reactions.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center -space-x-1">
                          {reactions
                            .slice(0, 3)
                            .map((reaction: any, i: number) => {
                              const emojiMap: { [key: string]: string } = {
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
                          {reactions.length > 3 && (
                            <span className="ml-2 text-xs text-gray-500 align-middle">
                              +{reactions.length - 3}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {reactions.length}{" "}
                          {reactions.length === 1 ? "reaction" : "reactions"}
                        </span>
                      </div>
                    ) : (
                      <div />
                    );
                  })()}

                  {/* Comments Count */}
                  <button
                    className="text-xs text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    onClick={() => toggleComments(selectedBoostedPost.id)}
                  >
                    {(() => {
                      const comments = selectedBoostedPost?.comments || [];

                      return comments.length > 0
                        ? `${comments.length} ${
                            comments.length === 1 ? "comment" : "comments"
                          }`
                        : "0 comment";
                    })()}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center border-t border-gray-100 pt-4 space-x-8 relative z-10 overflow-visible post-actions-container">
                {selectedBoostedPost ? (
                  <>
                    {(() => {
                      const reactions = selectedBoostedPost?.reactions || [];
                      const userReaction = reactions.find(
                        (reaction: any) =>
                          currentUser && reaction.userId === currentUser.id
                      );

                      return !canUserReact(currentUser) ? (
                        <div
                          className="flex items-center text-gray-400 cursor-not-allowed"
                          title="Account restricted - cannot react to posts"
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
                            <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3z" />
                          </svg>
                          <span className="text-base font-medium">Like</span>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center group transition focus:outline-none cursor-pointer relative ${
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
                          onClick={() => {
                            handleReact(selectedBoostedPost.id, "LIKE");
                          }}
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

                          {/* Reaction popup - positioned above the button */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-2 px-3 flex space-x-2 scale-95 group-hover:scale-100 transition-transform duration-150">
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
                                      key={`${selectedBoostedPost.id}-${i}`}
                                      className={`hover:scale-125 transition-transform duration-150 p-1 rounded-full ${
                                        isActive
                                          ? "scale-110 bg-blue-100"
                                          : "hover:bg-gray-100"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReact(
                                          selectedBoostedPost.id,
                                          reactionTypes[i]
                                        );
                                      }}
                                    >
                                      <span className="text-2xl">{emoji}</span>
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Comment Button */}
                    <button
                      className="flex items-center text-gray-500 hover:text-blue-600 transition focus:outline-none"
                      onClick={() => toggleComments(selectedBoostedPost.id)}
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
                  </>
                ) : (
                  <>
                    {/* CTA Buttons for mock boosted posts when no user */}
                    <button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                      onClick={() => {
                        console.log("Boosted post clicked - Learn More");
                        window.open("https://techcorp.com", "_blank");
                      }}
                    >
                      Learn More
                    </button>
                    <button
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                      onClick={() => {
                        // For mock posts, just close the ad
                        console.log("Hide boosted post");
                      }}
                    >
                      Hide Ad
                    </button>
                  </>
                )}
              </div>

              {/* Comment Section */}
              <div className="mt-5 relative z-10">
                {/* Show Comments when toggled */}
                {showComments[selectedBoostedPost.id] && (
                  <div className="mb-4 space-y-3">
                    {selectedBoostedPost.comments &&
                    selectedBoostedPost.comments.length > 0 ? (
                      selectedBoostedPost.comments
                        .slice(
                          0,
                          getVisibleCommentsCount(selectedBoostedPost.id)
                        )
                        .map((comment: any, index: number) => (
                          <div
                            key={comment.id || index}
                            className="flex items-start space-x-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {comment.user?.profilePicture ? (
                                <img
                                  src={`${url}/${comment.user.profilePicture}`}
                                  alt={comment.user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <FaceIcon
                                  width={16}
                                  height={16}
                                  style={{ color: "var(--gray-5)" }}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <div className="font-medium text-sm text-gray-800 flex items-center">
                                  {comment.user?.name || "Anonymous User"}
                                  <UserBadges
                                    isVerified={comment.user?.isVerified}
                                    isPro={comment.user?.isProUser}
                                    size="sm"
                                    className="ml-2"
                                  />
                                </div>
                                <div className="text-sm text-gray-700 mt-1">
                                  <MentionText
                                    text={
                                      comment.content ||
                                      "This is a sample comment."
                                    }
                                  />
                                </div>
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
                )}

                {/* Comment Input */}
                {currentUser && canUserComment(currentUser) && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {currentUser.profilePicture ? (
                        <img
                          src={`${url}/${currentUser.profilePicture}`}
                          alt="Your avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaceIcon
                          width={16}
                          height={16}
                          style={{ color: "var(--gray-5)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <MentionInput
                        value={commentInputs[selectedBoostedPost.id] || ""}
                        onChange={(value) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [selectedBoostedPost.id]: value,
                          }))
                        }
                        ref={(ref) => {
                          if (ref) {
                            commentInputRefs.current[selectedBoostedPost.id] =
                              ref;
                          }
                        }}
                        placeholder="Write a comment..."
                        className="w-full pr-12 p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(selectedBoostedPost.id);
                          }
                        }}
                      />
                      <button
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition ${
                          commentInputs[selectedBoostedPost.id]?.trim() ||
                          commentInputRefs.current[selectedBoostedPost.id]
                            ?.getFormattedValue()
                            ?.trim()
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() =>
                          handleCommentSubmit(selectedBoostedPost.id)
                        }
                        disabled={
                          !(
                            commentInputs[selectedBoostedPost.id]?.trim() ||
                            commentInputRefs.current[selectedBoostedPost.id]
                              ?.getFormattedValue()
                              ?.trim()
                          )
                        }
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
                        >
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular Posts - exclude ALL boosted posts since we show one separately */}
          {posts
            .filter((post: any) => !post.isBoosted)
            .map((post) => (
              <div
                className="relative rounded-xl shadow-md p-8 bg-white post-container"
                key={post.id}
              >
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
                          src={`${url}/${post.author.profilePicture}`}
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
                          /* If it's a page post, show "username -> Page name" format */
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                navigate(`/profile/${post.author?.username}`)
                              }
                              className="hover:underline cursor-pointer"
                            >
                              {post.author?.username || "Unknown User"}
                            </button>
                            <UserBadges
                              isVerified={post.author?.isVerified}
                              isPro={post.author?.isProUser}
                              size="md"
                              spacing="normal"
                            />
                            <span className="text-gray-500">→</span>
                            <button
                              onClick={() => navigate(`/page/${post.page?.id}`)}
                              className="hover:underline cursor-pointer"
                            >
                              {post.page.name}
                            </button>
                            <UserBadges
                              isVerified={post.page.isVerified}
                              isPro={false}
                              size="md"
                              spacing="normal"
                            />
                          </div>
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
                        {post.createdAt &&
                        !isNaN(new Date(post.createdAt).getTime())
                          ? formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })
                          : "Just now"}
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
                              handleUnfollowUser(
                                post.author?.id || "",
                                post.id
                              );
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

                <div className="flex items-center border-t border-gray-100 pt-4 space-x-8 overflow-visible post-actions-container">
                  {/* Like Button */}
                  {(() => {
                    const userReaction = post.reactions?.find(
                      (reaction) =>
                        currentUser && reaction.userId === currentUser.id
                    );

                    return !canUserReact(currentUser) ? (
                      <div
                        className="flex items-center text-gray-400 cursor-not-allowed"
                        title="Account restricted - cannot react to posts"
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
                          <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3z" />
                        </svg>
                        <span className="text-base font-medium">Like</span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center group transition focus:outline-none cursor-pointer relative ${
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
                        onClick={() => {
                          handleReact(post.id, "LIKE");
                        }}
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

                        {/* Reaction popup - positioned above the button */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-2 px-3 flex space-x-2 scale-95 group-hover:scale-100 transition-transform duration-150">
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
                                    className={`hover:scale-125 transition-transform duration-150 p-1 rounded-full ${
                                      isActive
                                        ? "scale-110 bg-blue-100"
                                        : "hover:bg-gray-100"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReact(post.id, reactionTypes[i]);
                                    }}
                                  >
                                    <span className="text-2xl">{emoji}</span>
                                  </button>
                                );
                              }
                            )}
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
                                      {comment.user?.username ||
                                        "Anonymous User"}
                                      <UserBadges
                                        isVerified={comment.user?.isVerified}
                                        isPro={comment.user?.isPro}
                                        size="sm"
                                        spacing="tight"
                                      />
                                    </div>
                                    {editingComment[comment.id] !==
                                    undefined ? (
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
                                      {comment.createdAt &&
                                      !isNaN(
                                        new Date(comment.createdAt).getTime()
                                      )
                                        ? formatDistanceToNow(
                                            new Date(comment.createdAt),
                                            {
                                              addSuffix: true,
                                            }
                                          )
                                        : "Just now"}
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
                        <div className="flex-1 bg-gray-200 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed">
                          Write a comment...
                        </div>
                      </div>
                      <AccountStatusWarning user={currentUser} />
                    </div>
                  ) : (
                    <div className="relative">
                      <MentionInput
                        value={commentInputs[post.id] || ""}
                        onChange={(value) => {
                          console.log("Comment input changed:", {
                            postId: post.id,
                            value,
                          });
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: value,
                          }));
                        }}
                        placeholder="Write a comment..."
                        className="w-full pr-12"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            console.log("Enter pressed for comment:", {
                              postId: post.id,
                              value: commentInputs[post.id],
                            });
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
                        onClick={() => {
                          console.log("Comment button clicked:", {
                            postId: post.id,
                            value: commentInputs[post.id],
                          });
                          handleCommentSubmit(post.id);
                        }}
                        disabled={(() => {
                          const stateContent = commentInputs[post.id]?.trim();
                          const refContent = commentInputRefs.current[post.id]
                            ?.getFormattedValue()
                            ?.trim();
                          return !stateContent && !refContent;
                        })()}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition ${
                          (() => {
                            const stateContent = commentInputs[post.id]?.trim();
                            const refContent = commentInputRefs.current[post.id]
                              ?.getFormattedValue()
                              ?.trim();
                            return stateContent || refContent;
                          })()
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
