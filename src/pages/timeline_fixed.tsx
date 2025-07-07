import { useEffect, useState, useRef } from "react";
import type { Post, User } from "../type";
import PostDetailModal from "./components/PostDetailModal";
import PostFeed from "./components/PostFeed";
import Sidebar from "./components/Sidebar";
import NavigationBar from "./components/NavigationBar";
import RigthSidebar from "./components/RightSidebar";
import apiService from "../services/api";

export default function Timeline() {
  const [timelineData, setTimelineData] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasInitialized = useRef(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiService.user.getCurrentUser();
        setCurrentUser(response);
      } catch (error) {
        console.error("Failed to fetch current user", error);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, [apiUrl]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        try {
          // Fetch both regular posts and boosted posts
          const [timelineRes, boostedRes] = await Promise.all([
            apiService.post.getTimelinePosts(1, 5),
            apiService.boostedPosts.getAllBoostedPosts().catch((error) => {
              console.error("Failed to fetch boosted posts:", error);
              return { data: [] };
            }),
          ]);

          const regularPosts = timelineRes.post || [];
          const boostedPosts = boostedRes.data || boostedRes.boostedPosts || [];

          // Temporary fallback: if no boosted posts from API, create a mock one for testing
          const finalBoostedPosts = boostedPosts;

          console.log("Timeline Debug:");
          console.log("Regular posts:", regularPosts.length);
          console.log("Boosted posts:", finalBoostedPosts.length);
          console.log("Boosted posts data:", finalBoostedPosts);

          // Combine and sort posts by date, with boosted posts getting priority
          const allPosts = [
            ...regularPosts,
            ...finalBoostedPosts.map((bp: any) => ({
              ...bp.post,
              isBoosted: true,
              boostedAt: bp.boostedAt,
            })),
          ];

          // Sort by date (newest first), but prioritize boosted posts
          const sortedPosts = allPosts.sort((a: any, b: any) => {
            if (a.isBoosted && !b.isBoosted) return -1;
            if (!a.isBoosted && b.isBoosted) return 1;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          console.log("Final sorted posts:", sortedPosts.length);
          console.log(
            "Posts with boosted flags:",
            sortedPosts.filter((p) => p.isBoosted)
          );

          setTimelineData(sortedPosts);
          setHasMore(regularPosts.length === 5);
          setPage(2); // Next page to fetch
        } catch (error) {
          console.error("Failed to fetch initial posts", error);
          setTimelineData([]);
        } finally {
          setInitialLoading(false);
        }
      }
    };
    fetchInitialData();
  }, [apiUrl]);

  // Handle infinite scroll - load more posts
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      // Fetch both regular posts and boosted posts for pagination
      const [timelineRes, boostedRes] = await Promise.all([
        apiService.post.getTimelinePosts(page, 5),
        apiService.boostedPosts
          .getAllBoostedPosts()
          .catch(() => ({ data: [] })),
      ]);

      const newPosts = timelineRes.post || [];
      const newBoostedPosts = boostedRes.data || boostedRes.boostedPosts || [];

      // Combine new posts with boosted posts
      const allNewPosts = [
        ...newPosts,
        ...newBoostedPosts.map((bp: any) => ({
          ...bp.post,
          isBoosted: true,
          boostedAt: bp.boostedAt,
        })),
      ];

      setTimelineData((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewPosts = allNewPosts.filter(
          (post: Post) => !existingIds.has(post.id)
        );

        // Sort new posts by date, prioritizing boosted posts
        const sortedNewPosts = uniqueNewPosts.sort((a: any, b: any) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        return [...prev, ...sortedNewPosts];
      });

      setHasMore(newPosts.length === 5);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch more posts", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const openModal = (post: Post) => {
    setModalPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalPost(null);
    setIsModalOpen(false);
  };

  const updatePost = (updatedPost: Post) => {
    setTimelineData((prevData) =>
      prevData.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
    if (modalPost && modalPost.id === updatedPost.id) {
      setModalPost(updatedPost);
    }
  };

  // Refresh posts data (called after creating a new post)
  const refreshPosts = async () => {
    try {
      // Fetch both regular posts and boosted posts
      const [timelineRes, boostedRes] = await Promise.all([
        apiService.post.getTimelinePosts(1, 5),
        apiService.boostedPosts.getAllBoostedPosts().catch((error) => {
          console.error("Failed to fetch boosted posts:", error);
          return { data: [] };
        }),
      ]);

      const regularPosts = timelineRes.post || [];
      const boostedPosts = boostedRes.data || boostedRes.boostedPosts || [];

      console.log("Refreshing posts:");
      console.log("Regular posts:", regularPosts.length);
      console.log("Boosted posts:", boostedPosts.length);

      // Combine and sort posts by date, with boosted posts getting priority
      const allPosts = [
        ...regularPosts,
        ...boostedPosts.map((bp: any) => ({
          ...bp.post,
          isBoosted: true,
          boostedAt: bp.boostedAt,
        })),
      ];

      // Sort by date (newest first), but prioritize boosted posts
      const sortedPosts = allPosts.sort((a: any, b: any) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      console.log("Refreshed posts:", sortedPosts.length);
      console.log(
        "Posts with boosted flags:",
        sortedPosts.filter((p) => p.isBoosted)
      );

      setTimelineData(sortedPosts);
      setHasMore(regularPosts.length === 5);
      setPage(2); // Reset to next page
    } catch (error) {
      console.error("Failed to refresh posts", error);
    }
  };

  // Handle reactions (both from modal and main feed)
  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    try {
      // First, optimistically update the local state for immediate feedback
      const optimisticPosts = timelineData.map((post) => {
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

          return { ...post, reactions: newReactions };
        }
        return post;
      });

      setTimelineData(optimisticPosts);

      // Update modal immediately if it's open and showing the same post
      const updatedModalPost = optimisticPosts.find((p) => p.id === postId);
      if (modalPost && modalPost.id === postId && updatedModalPost) {
        setModalPost(updatedModalPost);
      }

      // Then make the API call to confirm
      const response = await apiService.reaction.reactToPost(
        postId,
        reactionType
      );

      // Update with real data from server
      if (response && response.post) {
        const originalPost = optimisticPosts.find((p) => p.id === postId);
        const updatedPost = {
          ...response.post,
          reactions: response.post.reactions || response.post.Reaction || [],
          ...(originalPost && (originalPost as any).isBoosted
            ? { isBoosted: true }
            : {}),
        };

        const serverUpdatedPosts = optimisticPosts.map((post) =>
          post.id === postId ? updatedPost : post
        );
        setTimelineData(serverUpdatedPosts);

        // Update modal with server data if it's showing the same post
        if (modalPost && modalPost.id === postId) {
          setModalPost(updatedPost);
        }
      }
    } catch (error) {
      console.error("Timeline: Failed to react to post", error);
      // Don't revert optimistic update on error - let the user try again
      // The optimistic update will stay in place, providing better UX
    }
  };

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        {/* Timeline Feed */}
        <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
          {/* Debug Info - Remove this in production */}
          {!initialLoading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <div className="font-semibold text-blue-800 mb-2">
                🚀 Timeline Debug Info:
              </div>
              <div className="text-blue-700 space-y-1">
                <div>
                  <strong>Total posts:</strong> {timelineData.length}
                </div>
                <div>
                  <strong>Boosted posts:</strong>{" "}
                  {timelineData.filter((p) => (p as any).isBoosted).length}
                </div>
                <div>
                  <strong>Regular posts:</strong>{" "}
                  {timelineData.filter((p) => !(p as any).isBoosted).length}
                </div>
                {timelineData.filter((p) => (p as any).isBoosted).length >
                  0 && (
                  <div className="text-green-600 font-medium">
                    ✅ Boosted posts are displaying!
                  </div>
                )}
              </div>
            </div>
          )}

          {initialLoading ? (
            // Show loading skeleton while initially loading
            <div className="space-y-8">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow p-8 mb-8"
                >
                  {/* Header skeleton */}
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

                  {/* Content skeleton */}
                  <div className="mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>

                  {/* Image skeleton */}
                  <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>

                  {/* Reactions/Comments count skeleton */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>

                  {/* Actions skeleton */}
                  <div className="flex items-center space-x-8 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading text */}
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-4 h-4 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-4 h-4 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-gray-500 mt-4 text-lg font-medium">
                  Loading your feed...
                </p>
              </div>
            </div>
          ) : (
            <PostFeed
              posts={timelineData}
              setPosts={setTimelineData}
              currentUser={currentUser}
              onPostClick={openModal}
              showCreatePost={true}
              onReact={handleReact}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={loadingMore}
              showBoostedPosts={true}
              onRefreshPosts={refreshPosts}
            />
          )}
        </div>

        <RigthSidebar />
      </div>

      {/* PostDetailModal */}
      {modalPost && (
        <PostDetailModal
          post={modalPost}
          isOpen={isModalOpen}
          onClose={closeModal}
          currentUser={currentUser}
          onReact={handleReact}
          onToggleComments={() => {}}
          showComments={false}
          commentInputs={{}}
          setCommentInputs={() => {}}
          expandedPosts={{}}
          onToggleExpansion={() => {}}
          onUpdatePost={updatePost}
        />
      )}
    </div>
  );
}
