import React, { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { FaceIcon } from "@radix-ui/react-icons";
import MentionInput, { type MentionInputRef } from "./MentionInput";
import MentionText from "./MentionText";
import UserBadges from "./UserBadges";
import { AccountStatusWarning } from "../../components/AccountStatusWarning";
import type { Post, User } from "../../type";
import { canUserComment, canUserReact } from "../../utils/accountStatus";

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

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onReact: (postId: string, reactionType: string) => void;
  onToggleComments: (postId: string) => void;
  showComments: boolean;
  commentInputs: { [key: string]: string };
  setCommentInputs: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  expandedPosts: { [key: string]: boolean };
  onToggleExpansion: (postId: string) => void;
  onUpdatePost?: (updatedPost: Post) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onReact,

  onUpdatePost,
}) => {
  if (!isOpen) return null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localPost, setLocalPost] = useState(post);

  // Internal state for modal-specific comment management
  const [modalShowComments, setModalShowComments] = useState(true); // Comments are visible by default in modal
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalExpandedPost, setModalExpandedPost] = useState(false);
  const modalCommentInputRef = useRef<MentionInputRef>(null);

  const userReaction = localPost.reactions?.find(
    (reaction) => currentUser && reaction.userId === currentUser.id
  );

  // Update local post when prop changes
  const url = import.meta.env.VITE_UPLOADS_URL;
  useEffect(() => {
    setLocalPost(post);
    // Reset modal state when post changes
    setModalCommentInput("");
    setModalExpandedPost(false);
    setModalShowComments(true);
  }, [post]);
  // Reset image index when modal opens with new post
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [post.id]);
  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;

      const body = document.body;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.overflow = "hidden";

      return () => {
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.overflow = "";

        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle reaction with optimistic update
  const handleReactionClick = async (reactionType: string) => {
    if (!currentUser) return;

    // Check if user can react
    if (!canUserReact(currentUser)) {
      console.log("User cannot react due to account status");
      return;
    }

    // Optimistic update for immediate UI feedback
    setLocalPost((prevPost) => {
      const currentReactions = prevPost.reactions || [];
      const existingReactionIndex = currentReactions.findIndex(
        (reaction) => reaction.userId === currentUser.id
      );

      let updatedReactions = [...currentReactions];

      if (existingReactionIndex !== -1) {
        const existingReaction = currentReactions[existingReactionIndex];

        if (existingReaction.type === reactionType) {
          // Remove reaction if clicking same type
          updatedReactions.splice(existingReactionIndex, 1);
        } else {
          // Update reaction type
          updatedReactions[existingReactionIndex] = {
            ...existingReaction,
            type: reactionType,
          };
        }
      } else {
        // Add new reaction
        const newReaction = {
          id: `temp-${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          postId: prevPost.id,
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
          post: prevPost,
        };
        updatedReactions.push(newReaction);
      }

      return {
        ...prevPost,
        reactions: updatedReactions,
      };
    });

    // Call parent's onReact to update timeline and sync with server
    onReact(post.id, reactionType);
  };

  // Navigation functions
  const nextImage = () => {
    if (post.media && currentImageIndex < post.media.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };
  // Local comment handling functions
  const handleLocalCommentSubmit = async (postId: string) => {
    console.log("handleLocalCommentSubmit called with postId:", postId);

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
      // Get the formatted content with mentions from the modal comment input
      const stateContent = modalCommentInput.trim();
      const refContent = modalCommentInputRef.current
        ?.getFormattedValue()
        ?.trim();

      // Use whichever content is available
      const formattedContent = refContent || stateContent;

      console.log("Content sources:", {
        stateContent,
        refContent,
        formattedContent,
        modalCommentInputRef: !!modalCommentInputRef.current,
      });

      if (!formattedContent) {
        console.log("No content to submit");
        return;
      }

      console.log("Submitting comment:", { postId, formattedContent });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/comment/${postId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: formattedContent,
          }),
        }
      );

      if (response.ok) {
        const newComment = await response.json();

        // Create properly typed comment object
        const commentToAdd: any = {
          id: newComment.id || `temp-${Date.now()}`,
          content: formattedContent,
          userId: currentUser.id,
          postId: postId,
          createdAt: new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name,
          },
        };

        // Update local post immediately
        setLocalPost((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), commentToAdd],
        }));

        // Clear the input
        setModalCommentInput("");
        modalCommentInputRef.current?.clear();

        // Optionally update parent
        if (onUpdatePost) {
          const updatedPost = {
            ...localPost,
            comments: [...(localPost.comments || []), commentToAdd],
          };
          onUpdatePost(updatedPost);
        }

        console.log("Comment submitted successfully");
      } else {
        console.error(
          "Failed to submit comment - HTTP error:",
          response.status
        );
      }
    } catch (error) {
      console.error("Failed to submit comment", error);
      console.error(
        "Error details:",
        (error as any).response?.data || (error as any).message
      );
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        prevImage();
      } else if (event.key === "ArrowRight") {
        nextImage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, currentImageIndex, post.media]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (
      isLeftSwipe &&
      post.media &&
      currentImageIndex < post.media.length - 1
    ) {
      nextImage();
    }
    if (isRightSwipe && currentImageIndex > 0) {
      prevImage();
    }
  };

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      {" "}
      <div
        className="w-screen h-screen overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {" "}
        {/* Left side - Image Slider */}
        <div className="flex-1 bg-black flex items-center justify-center relative h-full">
          {post.media && post.media.length > 0 ? (
            <>
              {" "}
              {/* Main Image with touch support */}
              <div
                className="w-full h-full flex items-center justify-center"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  key={currentImageIndex}
                  src={url + post.media[currentImageIndex].url}
                  alt={`Post media ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain transition-opacity duration-300 ease-in-out"
                />
              </div>
              {post.media.length > 1 && (
                <>
                  {" "}
                  {/* Previous Arrow */}
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-3 transition-all ${
                      currentImageIndex === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-opacity-90 text-white"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                  </button>
                  {/* Next Arrow */}
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === post.media.length - 1}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-3 transition-all ${
                      currentImageIndex === post.media.length - 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-opacity-90 text-white"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                  </button>
                </>
              )}
              {/* Image Counter */}
              {post.media.length > 1 && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-full px-3 py-1 text-white text-sm">
                  {currentImageIndex + 1} / {post.media.length}
                </div>
              )}
              {/* Thumbnail Navigation - only show if more than 1 image */}
              {post.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
                  {post.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-gray-400 hover:bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-white text-center p-8">
              <p className="text-lg">No media available</p>
            </div>
          )}{" "}
          {/* Close button overlay */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all z-10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>{" "}
        {/* Right side - Post details */}
        <div
          className={`w-full md:w-[450px] flex flex-col h-full relative ${
            (post as any).isBoosted
              ? "bg-white sparkle-container boosted-border"
              : "bg-white"
          }`}
        >
          {/* Sparkle effects for boosted posts */}
          {(post as any).isBoosted && (
            <>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
            </>
          )}

          {/* Boosted Post Indicator */}
          {(post as any).isBoosted && (
            <div className="mx-4 mt-4 mb-2 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-lg border border-blue-200 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-purple-100/50 to-pink-100/50 opacity-30 animate-pulse"></div>

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
                <span className="font-bold text-blue-800">Boosted Post</span>
              </div>
              <div className="flex items-center space-x-1 relative z-10">
                <span className="text-xs text-white bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                  ⚡ Promoted
                </span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                {post.author?.profilePicture ? (
                  <img
                    src={`${url}/${post.author?.profilePicture}`}
                    alt={post.author?.username || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaceIcon
                    width={20}
                    height={20}
                    style={{ color: "var(--gray-5)" }}
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-lg">
                  {post.page ? (
                    /* If it's a page post, show "username -> Page name" format */
                    <div className="flex items-center space-x-2">
                      <span>{post.author?.username || "Unknown User"}</span>
                      <UserBadges
                        isVerified={post.author?.isVerified}
                        isPro={post.author?.isProUser}
                        size="md"
                        spacing="normal"
                      />
                      <span className="text-gray-500">→</span>
                      <span>{post.page.name}</span>
                      <UserBadges
                        isVerified={post.page.isVerified}
                        isPro={false}
                        size="md"
                        spacing="normal"
                      />
                    </div>
                  ) : (
                    /* If it's a regular post, show user name */
                    <div className="flex items-center space-x-1">
                      <span>{post.author?.name || "Unknown User"}</span>
                      <UserBadges
                        isVerified={post.author?.isVerified}
                        isPro={post.author?.isProUser}
                        size="md"
                        spacing="normal"
                      />
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg
                width="24"
                height="24"
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

          {/* Post content */}
          <div className="p-4 border-b border-gray-200 text-black relative z-10">
            {post.content && post.content.length > 50 ? (
              <>
                {modalExpandedPost ? (
                  <>
                    <MentionText text={post.content || ""} />
                    <button
                      onClick={() => setModalExpandedPost(false)}
                      className="text-blue-600 hover:text-blue-800 ml-1 font-medium cursor-pointer"
                    >
                      Read less
                    </button>
                  </>
                ) : (
                  <>
                    <MentionText
                      text={
                        safeTruncateWithMentions(post.content || "", 50) + "..."
                      }
                    />
                    <button
                      onClick={() => setModalExpandedPost(true)}
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
          </div>

          {/* Reactions and Comments Count */}
          <div className="px-4 py-2 border-b border-gray-200 relative z-10">
            <div className="flex items-center justify-between">
              {" "}
              {/* Reactions */}
              {localPost.reactions && localPost.reactions.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {localPost.reactions.slice(0, 3).map((reaction, i) => {
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
                          className={`inline-block text-lg bg-white rounded-full border border-gray-200 shadow-sm ${
                            i > 0 ? "-ml-2" : ""
                          }`}
                          title={reaction.type}
                        >
                          {emojiMap[reaction.type] || "👍"}
                        </span>
                      );
                    })}
                    {localPost.reactions.length > 3 && (
                      <span className="ml-2 text-xs text-gray-500 align-middle">
                        +{localPost.reactions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div />
              )}
              {/* Comments Count */}{" "}
              <button
                className="text-xs text-gray-500 hover:text-blue-600 transition cursor-pointer"
                onClick={() => setModalShowComments(!modalShowComments)}
              >
                {Array.isArray(localPost.comments) &&
                localPost.comments.length > 0
                  ? `${localPost.comments.length} ${
                      localPost.comments.length === 1 ? "comment" : "comments"
                    }`
                  : "0 comment"}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-6 relative z-10">
            {/* Like Button */}
            {!canUserReact(currentUser) ? (
              <div className="flex items-center text-gray-400 cursor-not-allowed">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 9V5a3 3 0 0 0-6 0v4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3z" />
                </svg>
                <span className="text-sm font-medium">Like</span>
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
                  <span className="text-lg mr-2">
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
                    width="20"
                    height="20"
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
                  <span className="text-sm font-medium">
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

                  <div className="absolute left-0 -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-1 px-2 flex space-x-1">
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
                            className={`hover:scale-125 transition-transform duration-150 p-1 ${
                              isActive
                                ? "scale-110 bg-blue-100 rounded-full"
                                : ""
                            }`}
                            onClick={() =>
                              handleReactionClick(reactionTypes[i])
                            }
                          >
                            <span className="text-2xl">{emoji}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comment Button */}
            <button
              className="flex items-center text-gray-500 hover:text-blue-600 transition focus:outline-none"
              onClick={() => setModalShowComments(!modalShowComments)}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mr-2"
                viewBox="0 0 24 24"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm">Comment</span>
            </button>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto relative z-10">
            {modalShowComments && (
              <div className="p-4 space-y-3">
                {localPost.comments && localPost.comments.length > 0 ? (
                  localPost.comments.map((comment: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaceIcon
                          width={16}
                          height={16}
                          style={{ color: "var(--gray-5)" }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
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
                            <MentionText
                              text={
                                comment.content || "This is a sample comment."
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <button className="hover:text-blue-600">Like</button>
                          <button className="hover:text-blue-600">Reply</button>
                          <span>
                            {comment.createdAt
                              ? formatDistanceToNow(
                                  new Date(comment.createdAt),
                                  { addSuffix: true }
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
            )}
          </div>

          {/* Comment input */}
          <div className="p-4 border-t border-gray-200 relative z-10">
            {!canUserComment(currentUser) ? (
              <div>
                <div className="relative">
                  <div className="w-full pr-12 p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                    Write a comment...
                  </div>
                  <button
                    disabled
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-gray-400 cursor-not-allowed"
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
                <div className="mt-3">
                  <AccountStatusWarning user={currentUser} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <MentionInput
                  value={modalCommentInput}
                  onChange={setModalCommentInput}
                  placeholder="Write a comment..."
                  className="w-full pr-12"
                  ref={modalCommentInputRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLocalCommentSubmit(post.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleLocalCommentSubmit(post.id)}
                  disabled={!modalCommentInput.trim()}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition ${
                    modalCommentInput.trim()
                      ? "text-red-600 hover:bg-red-50 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
