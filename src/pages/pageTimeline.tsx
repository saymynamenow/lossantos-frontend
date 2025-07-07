import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Page, PagePost, User } from "../type";
import PageHeader from "./components/PageHeader";
import PagePostFeed from "./components/PagePostFeed";
import PostDetailModal from "./components/PostDetailModal";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RigthSidebar from "./components/RightSidebar";
import apiService from "../services/api";
import { canUserJoinPage, canUserFollowUser } from "../utils/accountStatus";

const PageTimeline: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<
    "admin" | "moderator" | "member" | "none"
  >("none");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [modalPost, setModalPost] = useState<PagePost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasInitialized = useRef(false);

  // Function to refresh membership and page data
  const refreshMembershipData = async () => {
    if (!pageId || !currentUser) return;

    try {
      // Fetch page members to check if current user is a member
      const membersData = await apiService.page.getPageMembers(pageId);

      // Check if current user is a member and get their role
      const currentUserMember = (membersData.members || []).find(
        (member: any) => member.id === currentUser.id
      );

      if (currentUserMember) {
        setIsMember(true);
        setCurrentUserRole(currentUserMember.role || "member");
        setHasPendingRequest(false); // Clear pending request if now a member
      } else {
        setIsMember(false);
        setCurrentUserRole("none");

        // Only check for pending request if not a member
        try {
          const myPendingRequests = await apiService.page.getMyPendingRequests(
            1,
            50
          );
          const hasPending = myPendingRequests.pendingRequests.some(
            (request: any) => request.page?.id === pageId
          );
          setHasPendingRequest(hasPending);
        } catch (error) {
          console.error("Failed to check pending requests:", error);
          setHasPendingRequest(false);
        }
      }
    } catch (error) {
      console.error("Failed to refresh membership data:", error);
    }
  };

  useEffect(() => {
    if (!pageId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current user
        const userData = await apiService.user.getCurrentUser();
        console.log("Current User:", userData);
        const pageFollower = await apiService.page.getUserFollowedPages();
        setIsFollowing(
          (pageFollower.followedPages || []).some(
            (item: any) => item.page.id === pageId
          )
        );
        setCurrentUser(userData);

        // Fetch page data
        const pageData = await apiService.page.getPageById(pageId);
        setPage(pageData.page);

        // Fetch page members to check if current user is a member
        const membersData = await apiService.page.getPageMembers(pageId);

        // Check if current user is a member and get their role
        const currentUserMember = (membersData.members || []).find(
          (member: any) => member.id === userData.id
        );

        if (currentUserMember) {
          setIsMember(true);
          setCurrentUserRole(currentUserMember.role || "member");
        } else {
          setIsMember(false);
          setCurrentUserRole("none");
        }

        // Check if current user has a pending request for this page
        try {
          const myPendingRequests = await apiService.page.getMyPendingRequests(
            1,
            50
          );
          const hasPending = myPendingRequests.pendingRequests.some(
            (request: any) => request.page?.id === pageId
          );
          setHasPendingRequest(hasPending);
        } catch (error) {
          console.error("Failed to check pending requests:", error);
          setHasPendingRequest(false);
        }

        // Fetch pending requests count for admins/owners
        const isOwner = userData.id === pageData.page.ownerId;
        const isAdminOrModerator =
          currentUserMember &&
          (currentUserMember.role === "admin" ||
            currentUserMember.role === "moderator");

        if (isOwner || isAdminOrModerator) {
          try {
            const pendingData = await apiService.page.getPendingRequests(
              pageId,
              1,
              1
            );
            setPendingRequestsCount(pendingData.pagination.totalCount || 0);
          } catch (error) {
            console.error("Failed to fetch pending requests count:", error);
            setPendingRequestsCount(0);
          }
        }

        // Fetch page posts
        setPostsLoading(true);
        const postsData = await apiService.page.getPagePosts(pageId);
        setPosts(postsData.posts || []);
        setPostsLoading(false);
      } catch (error) {
        console.error("Failed to fetch page data:", error);
        setError("Failed to load page. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (!hasInitialized.current && pageId) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [pageId, navigate]);

  const handleFollow = async () => {
    if (!page || !canUserFollowUser(currentUser)) return;

    try {
      await apiService.page.followPage(page.id);
      setIsFollowing(true);
      setPage((prev) =>
        prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : null
      );
    } catch (error) {
      console.error("Failed to follow page:", error);
    }
  };

  const handleUnfollow = async () => {
    if (!page || !canUserFollowUser(currentUser)) return;

    try {
      await apiService.page.unfollowPage(page.id);
      setIsFollowing(false);
      setPage((prev) =>
        prev
          ? {
              ...prev,
              followerCount: Math.max((prev.followerCount || 0) - 1, 0),
            }
          : null
      );
    } catch (error) {
      console.error("Failed to unfollow page:", error);
    }
  };

  const handleJoin = async () => {
    if (!page || !canUserJoinPage(currentUser)) return;

    try {
      const response = await apiService.page.joinPage(page.id);
      console.log("Join page response:", response);

      // Refresh membership data to get the actual current state
      await refreshMembershipData();

      // Show appropriate message based on the response
      if (
        response.status === "pending" ||
        response.message?.includes("pending")
      ) {
        alert("Your join request has been submitted and is pending approval.");
      } else if (
        response.status === "approved" ||
        response.status === "joined"
      ) {
        alert("You have successfully joined the page!");

        // Also follow the page when joining
        if (!isFollowing) {
          try {
            await apiService.page.followPage(page.id);
            setIsFollowing(true);
            setPage((prev) =>
              prev
                ? { ...prev, followerCount: (prev.followerCount || 0) + 1 }
                : null
            );
          } catch (followError) {
            console.error("Failed to follow page after joining:", followError);
          }
        }
      } else {
        alert("Your join request has been submitted and is pending approval.");
      }
    } catch (error) {
      console.error("Failed to join page:", error);
      alert("Failed to send join request. Please try again.");
    }
  };

  const handleLeave = async () => {
    if (!page) return;

    try {
      await apiService.page.leavePage(page.id);

      // Refresh membership data to get the actual current state
      await refreshMembershipData();

      alert("You have left the page successfully.");
    } catch (error) {
      console.error("Failed to leave page:", error);
      alert("Failed to leave page. Please try again.");
    }
  };

  const handleShare = () => {
    if (!page) return;

    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: page.name,
        text: page.description || `Check out ${page.name} on Los Santos Media`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert("Page URL copied to clipboard!");
    }
  };

  const openModal = (post: PagePost) => {
    setModalPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalPost(null);
    setIsModalOpen(false);
  };

  const updatePost = (updatedPost: PagePost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
    if (modalPost && modalPost.id === updatedPost.id) {
      setModalPost(updatedPost);
    }
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    try {
      // First, optimistically update the local state for immediate feedback
      const optimisticPosts = posts.map((post) => {
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

      setPosts(optimisticPosts);

      // Update modal post if it's the same post
      if (modalPost && modalPost.id === postId) {
        const updatedModalPost = optimisticPosts.find((p) => p.id === postId);
        if (updatedModalPost) {
          setModalPost(updatedModalPost);
        }
      }

      // Then make the API call
      await apiService.reaction.reactToPost(postId, reactionType);
    } catch (error) {
      console.error("Failed to react to post:", error);
      // Optionally revert the optimistic update on error
      // You could fetch the post again here to get the correct state
    }
  };

  const handleNewPost = async (
    content: string,
    media?: File[]
  ): Promise<PagePost> => {
    if (!page) {
      throw new Error("Cannot post: page not found");
    }

    // Check if user is either a member or the page owner
    const isOwner = currentUser?.id === page.ownerId;
    if (!isMember && !isOwner) {
      throw new Error(
        "Cannot post: you must be a member of this page or the page owner"
      );
    }

    try {
      console.log("Creating page post with:", { content, media });

      const response = await apiService.page.createPagePost(page.id, {
        content,
        media,
      });

      console.log("Page post creation response:", response);

      // Handle different possible response structures
      const newPost = response.post || response;

      // Add the new post to the beginning of the posts array
      setPosts((prev) => [newPost, ...prev]);

      // Update page post count
      setPage((prev) =>
        prev ? { ...prev, postCount: (prev.postCount || 0) + 1 } : null
      );

      return newPost;
    } catch (error) {
      console.error("Failed to create page post:", error);
      throw error;
    }
  };

  const loadMorePosts = async (page: number) => {
    if (!pageId) return { posts: [], hasMore: false };

    try {
      const response = await apiService.page.getPagePosts(pageId, page);
      return {
        posts: response.posts || [],
        hasMore: response.hasMore || false,
      };
    } catch (error) {
      console.error("Failed to load more posts:", error);
      return { posts: [], hasMore: false };
    }
  };

  if (loading) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
            {/* Loading skeleton */}
            <div className="space-y-8">
              {/* Header skeleton */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 md:h-64 bg-gray-200"></div>
                <div className="px-6 py-6">
                  <div className="ml-28 md:ml-36 pt-2">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-96 mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts skeleton */}
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
          </div>

          <RigthSidebar />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || "Page not found"}
              </h2>
              <p className="text-gray-600 mb-6">
                The page you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>

          <RigthSidebar />
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === page.ownerId;
  const canPost = isMember || isOwner;

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
          {/* Page Header */}
          <PageHeader
            page={{ ...page, isFollowing }}
            currentUser={currentUser}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onJoin={handleJoin}
            onLeave={handleLeave}
            isFollowing={isFollowing}
            onShare={handleShare}
            onPageUpdate={(updatedPage) => setPage(updatedPage)}
            isOwner={isOwner}
            currentUserRole={currentUserRole}
            hasPendingRequest={hasPendingRequest}
            pendingRequestsCount={pendingRequestsCount}
          />

          {/* Page Posts Feed */}
          <div className="mt-8">
            <PagePostFeed
              posts={posts}
              onNewPost={handleNewPost}
              loadMorePosts={loadMorePosts}
              currentUser={currentUser}
              canPost={canPost}
              loading={postsLoading}
              page={page}
              onPostClick={openModal}
            />
          </div>
        </div>

        <RigthSidebar />
      </div>

      {/* Post Detail Modal */}
      {isModalOpen && modalPost && (
        <PostDetailModal
          post={modalPost as any} // PagePost is compatible with Post structure
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
          onUpdatePost={updatePost as any}
        />
      )}
    </div>
  );
};

export default PageTimeline;
