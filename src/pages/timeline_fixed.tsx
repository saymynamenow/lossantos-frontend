import { useEffect, useState, useRef } from "react";
import axios from "axios";
import type { Post } from "../type";
import PostDetailModal from "./components/PostDetailModal";
import PostFeed from "./components/PostFeed";
import Sidebar from "./components/Sidebar";
import NavigationBar from "./components/NavigationBar";
import RigthSidebar from "./components/RightSidebar";
import apiService from "../services/api";

export default function Timeline() {
  const [timelineData, setTimelineData] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    username: string;
    profilePicture?: string;
  } | null>(null);
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
        const response = await axios.get(`${apiUrl}/auth/me`, {
          withCredentials: true,
        });
        setCurrentUser({
          id: response.data.id,
          name: response.data.name,
          username: response.data.username,
          profilePicture: response.data.profilePicture || "",
        });
      } catch (error) {
        console.error("Failed to fetch current user", error);
        setCurrentUser({ id: "temp-user", name: "You", username: "temp-user" });
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
          // Use combined timeline endpoint that includes both regular posts and followed page posts
          const res = await apiService.post.getTimelinePosts(1, 5);
          console.log("Timeline: Initial posts fetched:", res);
          setTimelineData(res.post || []);
          setHasMore(res.post && res.post.length === 5);
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
      // Use combined timeline endpoint for loading more posts
      const res = await apiService.post.getTimelinePosts(page, 5);

      const newPosts = res.post || [];
      setTimelineData((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewPosts = newPosts.filter(
          (post: Post) => !existingIds.has(post.id)
        );
        return [...prev, ...uniqueNewPosts];
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
              user: {
                ...currentUser,
                email: "",
                password: "",
                isVerified: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            });
          }

          return { ...post, reactions: newReactions };
        }
        return post;
      });

      console.log("Timeline: Optimistically updating posts:", optimisticPosts);
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
      console.log("Timeline: API reaction response:", response);

      // Update with real data from server
      if (response) {
        const serverUpdatedPosts = optimisticPosts.map((post) =>
          post.id === response.id ? response : post
        );
        console.log("Timeline: Updating with server data:", serverUpdatedPosts);
        setTimelineData(serverUpdatedPosts);

        // Update modal with server data if it's showing the same post
        if (modalPost && modalPost.id === response.id) {
          setModalPost(response);
        }
      }
    } catch (error) {
      console.error("Timeline: Failed to react to post", error);
      // Revert optimistic update on error
      setTimelineData(timelineData);
      if (modalPost && modalPost.id === postId) {
        const originalPost = timelineData.find((p) => p.id === postId);
        if (originalPost) {
          setModalPost(originalPost);
        }
      }
    }
  };

  return (
    <div className="">
      <NavigationBar
        username={currentUser?.username}
        profilePicture={currentUser?.profilePicture}
      />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        {/* Timeline Feed */}
        <div className="w-full max-w-3xl mx-20 my-12 relative z-20">
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
