import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaceIcon } from "@radix-ui/react-icons";
import NavigationBar from "./components/NavigationBar";
import PostFeed from "./components/PostFeed";
import PostDetailModal from "./components/PostDetailModal";
import PhotosGrid from "./components/PhotosGrid";
import PhotosSection from "./components/PhotosSection";
import FriendsSection from "./components/FriendsSection";
import UserBadges from "./components/UserBadges";
import type { Post, Media } from "../type";
import apiService from "../services/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState("Timeline");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<any>(null); // Current logged-in user

  // PostFeed state
  const [posts, setPosts] = useState<Post[]>([]);

  // Modal state
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [expandedPosts, setExpandedPosts] = useState<{
    [key: string]: boolean;
  }>({});
  const [showAllPhotos] = useState(false);

  // Friendship state
  const [friendshipStatus, setFriendshipStatus] = useState<any>(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch logged-in user for navigation
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/auth/me`, {
          withCredentials: true,
        });
        setLoggedInUser(response.data);
      } catch (error) {
        console.error("Failed to fetch logged-in user", error);
      }
    };
    fetchLoggedInUser();
  }, [apiUrl]);

  // Fetch current user (profile being viewed)
  const fetchCurrentUser = async () => {
    if (!username) return;

    try {
      setLoading(true);

      // Fetch user profile data
      const userResponse = await axios.get(`${apiUrl}/auth/user/${username}`, {
        withCredentials: true,
      });
      setCurrentUser(userResponse.data);

      // Fetch posts with full data (including reactions and comments)
      const postsResponse = await axios.get(
        `${apiUrl}/posts/user/username/${username}?page=1&limit=20`,
        {
          withCredentials: true,
        }
      );
      console.log("Fetched posts:", postsResponse.data);
      setPosts(postsResponse.data.post || postsResponse.data.posts || []);

      // Fetch user's friends
      await fetchUserFriends(userResponse.data.id);
    } catch (error) {
      console.error("Failed to fetch current user", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's friends
  const fetchUserFriends = async (userId: string) => {
    try {
      setFriendsLoading(true);
      const friendsResponse = await apiService.friend.getUserFriends(userId);
      console.log("Fetched friends:", friendsResponse);
      // Extract friends array from the response object
      const friendsArray = friendsResponse?.friends || [];
      setFriends(Array.isArray(friendsArray) ? friendsArray : []);
    } catch (error) {
      console.error("Failed to fetch user friends", error);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Refresh posts for the current profile
  const refreshProfilePosts = async () => {
    if (!username) return;

    try {
      console.log("Refreshing posts for profile:", username);
      // Fetch posts with full data (including reactions and comments)
      const postsResponse = await axios.get(
        `${apiUrl}/posts/user/username/${username}?page=1&limit=20`,
        {
          withCredentials: true,
        }
      );
      console.log("Refreshed posts response:", postsResponse.data);

      const newPosts =
        postsResponse.data.post || postsResponse.data.posts || [];
      console.log("Setting posts to:", newPosts);
      setPosts(newPosts);
    } catch (error) {
      console.error("Failed to refresh posts", error);
      // Don't clear posts on error to avoid showing "no posts found"
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [username, apiUrl]);

  // Check friendship status when both users are loaded
  useEffect(() => {
    const checkFriendshipStatus = async () => {
      if (!loggedInUser || !currentUser || loggedInUser.id === currentUser.id) {
        return; // Don't check friendship with yourself
      }

      try {
        setFriendshipLoading(true);

        // Check friendship status
        const status = await apiService.friend.getFriendshipStatus(
          currentUser.id
        );
        console.log("Friendship status:", status); // Debug log
        setFriendshipStatus(status);

        // Check follow status
        const followStatus = await apiService.user.getFollowStatus(
          currentUser.id
        );
        console.log("Follow status:", followStatus); // Debug log
        setIsFollowing(followStatus.isFollowing || false);
      } catch (error) {
        console.error("Failed to check friendship/follow status", error);
        setFriendshipStatus(null);
        setIsFollowing(false);
      } finally {
        setFriendshipLoading(false);
      }
    };

    checkFriendshipStatus();
  }, [loggedInUser, currentUser]);

  // Helper function to check if viewing own profile
  const isOwnProfile = () => {
    if (!loggedInUser || !currentUser) return false;
    const isOwn =
      loggedInUser.id === currentUser.id || loggedInUser.username === username;
    console.log("Profile ownership check:", {
      loggedInUserId: loggedInUser.id,
      loggedInUsername: loggedInUser.username,
      currentUserId: currentUser.id,
      currentUsername: currentUser.username,
      urlUsername: username,
      isOwnProfile: isOwn,
    });
    return isOwn;
  };

  // Modal handlers
  const openModal = (post: Post) => {
    // Find the most current version of the post from the posts array
    const currentPost = posts.find((p) => p.id === post.id) || post;
    setModalPost(currentPost);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalPost(null);
  };

  const updatePost = (updatedPost: Post) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
    // Always update the modal post if it's the same post being updated
    if (modalPost && modalPost.id === updatedPost.id) {
      setModalPost(updatedPost);
    }
  };

  // Handle reactions (both from modal and main feed)
  const handleReact = async (postId: string, reactionType: string) => {
    if (!loggedInUser) return;

    try {
      // First, optimistically update the local state for immediate feedback
      const optimisticPosts = posts.map((post) => {
        if (post.id === postId) {
          const existingReactionIndex = post.reactions?.findIndex(
            (reaction) => reaction.userId === loggedInUser.id
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
              userId: loggedInUser.id,
              postId: postId,
              createdAt: new Date().toISOString(),
              user: loggedInUser,
            });
          }

          return { ...post, reactions: newReactions };
        }
        return post;
      });

      setPosts(optimisticPosts);

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
      console.log("API reaction response:", response);

      // Update with real data from server
      if (response) {
        const serverUpdatedPosts = optimisticPosts.map((post) =>
          post.id === response.id ? response : post
        );
        console.log("Updating with server data:", serverUpdatedPosts);
        setPosts(serverUpdatedPosts);

        // Update modal with server data if it's showing the same post
        if (modalPost && modalPost.id === response.id) {
          setModalPost(response);
        }
      }
    } catch (error) {
      console.error("Failed to react to post", error);
      // Revert optimistic update on error
      setPosts(posts);
      if (modalPost && modalPost.id === postId) {
        setModalPost(modalPost);
      }
    }
  };
  // Handle comment toggle
  const handleToggleComments = (postId: string) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Handle post expansion toggle
  const handleToggleExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Extract all media from posts for the Photos section
  const getAllMedia = (): (Media & { postId: string })[] => {
    const allMedia: (Media & { postId: string })[] = [];
    posts.forEach((post) => {
      if (post.media && post.media.length > 0) {
        post.media.forEach((mediaItem) => {
          allMedia.push({
            ...mediaItem,
            postId: post.id, // Add reference to original post
          });
        });
      }
    });
    return allMedia;
  };

  const handlePhotoClick = (media: Media & { postId: string }) => {
    // Find the post that contains this media and open it in modal
    const post = posts.find((p) => p.id === media.postId);
    if (post) {
      openModal(post);
    }
  };

  // Friend action handlers
  const handleSendFriendRequest = async () => {
    if (!currentUser || !loggedInUser) return;

    try {
      setFriendshipLoading(true);
      const response = await apiService.friend.sendFriendRequest(
        currentUser.id
      );
      console.log("Friend request response:", response);

      // Refresh friendship status
      const status = await apiService.friend.getFriendshipStatus(
        currentUser.id
      );
      setFriendshipStatus(status);

      // Optionally refresh friends list if this is own profile
      if (isOwnProfile()) {
        await fetchUserFriends(currentUser.id);
      }
    } catch (error) {
      console.error("Failed to send friend request", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus?.friendship?.id) return;

    try {
      setFriendshipLoading(true);
      const response = await apiService.friend.acceptFriendRequest(
        friendshipStatus.friendship.id
      );
      console.log("Accept friend request response:", response);

      // Refresh friendship status
      const status = await apiService.friend.getFriendshipStatus(
        currentUser.id
      );
      setFriendshipStatus(status);

      // Refresh friends list for both users since they're now friends
      await fetchUserFriends(currentUser.id);
    } catch (error) {
      console.error("Failed to accept friend request", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!friendshipStatus?.friendship?.id) return;

    try {
      setFriendshipLoading(true);
      await apiService.friend.rejectFriendRequest(
        friendshipStatus.friendship.id
      );
      // Refresh friendship status
      const status = await apiService.friend.getFriendshipStatus(
        currentUser.id
      );
      setFriendshipStatus(status);
    } catch (error) {
      console.error("Failed to reject friend request", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    // Show confirmation modal instead of directly removing
    setShowUnfriendModal(true);
  };

  const handleCancelFriendRequest = async () => {
    // Show confirmation modal instead of directly canceling
    setShowCancelRequestModal(true);
  };

  // Confirm unfriend action
  const confirmUnfriend = async () => {
    if (!friendshipStatus?.friendship?.id) return;

    try {
      setFriendshipLoading(true);
      const response = await apiService.friend.unfriendUser(currentUser.id);
      console.log("Unfriend response:", response);

      // Refresh friendship status
      const status = await apiService.friend.getFriendshipStatus(
        currentUser.id
      );
      setFriendshipStatus(status);

      // Refresh friends list since friendship was removed
      await fetchUserFriends(currentUser.id);

      // Close the modal
      setShowUnfriendModal(false);
    } catch (error) {
      console.error("Failed to remove friend", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  // Cancel unfriend action
  const cancelUnfriend = () => {
    setShowUnfriendModal(false);
  };

  // Confirm cancel friend request action
  const confirmCancelRequest = async () => {
    if (!friendshipStatus?.friendship?.id) return;

    try {
      setFriendshipLoading(true);
      const response = await apiService.friend.cancelFriendRequest(
        friendshipStatus.friendship.id
      );
      console.log("Cancel friend request response:", response);

      // Refresh friendship status
      const status = await apiService.friend.getFriendshipStatus(
        currentUser.id
      );
      setFriendshipStatus(status);

      // Refresh friends list since friendship status changed
      await fetchUserFriends(currentUser.id);

      // Close the modal
      setShowCancelRequestModal(false);
    } catch (error) {
      console.error("Failed to cancel friend request", error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  // Cancel the cancel request action
  const cancelCancelRequest = () => {
    setShowCancelRequestModal(false);
  };

  // Follow/Unfollow handlers
  const handleFollow = async () => {
    if (!currentUser || !loggedInUser) return;

    try {
      setFollowLoading(true);
      await apiService.action.followUser(currentUser.id);
      setIsFollowing(true);
      console.log("Successfully followed user");
    } catch (error) {
      console.error("Failed to follow user", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !loggedInUser) return;

    try {
      setFollowLoading(true);
      await apiService.action.unfollowUser(currentUser.id);
      setIsFollowing(false);
      console.log("Successfully unfollowed user");
    } catch (error) {
      console.error("Failed to unfollow user", error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      cancelUnfriend();
    }
  };

  // Get the appropriate friend button based on status
  const getFriendButton = () => {
    if (friendshipLoading) {
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
        >
          Loading...
        </button>
      );
    }

    if (!friendshipStatus) {
      // No friendship exists - show Add Friend button
      return (
        <button
          onClick={handleSendFriendRequest}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          👤 Add Friend
        </button>
      );
    }

    const { status, perspective } = friendshipStatus;

    switch (status) {
      case "accepted":
        return (
          <button
            onClick={handleRemoveFriend}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
          >
            ✓ Friends
          </button>
        );

      case "pending":
        if (
          perspective === "sent" ||
          (perspective === "none" &&
            friendshipStatus.friendship?.userAId === loggedInUser?.id)
        ) {
          // You sent the request (either perspective is "sent" or you are userA in pending relationship)
          return (
            <button
              onClick={handleCancelFriendRequest}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition"
            >
              ⏳ Request Sent
            </button>
          );
        } else if (
          perspective === "received" ||
          (perspective === "none" &&
            friendshipStatus.friendship?.userBId === loggedInUser?.id)
        ) {
          // You received the request (either perspective is "received" or you are userB in pending relationship)
          return (
            <div className="flex space-x-2">
              <button
                onClick={handleAcceptFriendRequest}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                ✓ Accept
              </button>
              <button
                onClick={handleRejectFriendRequest}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
              >
                ✗ Decline
              </button>
            </div>
          );
        } else {
          // Fallback for pending status - assume it's a sent request if we can't determine
          return (
            <button
              onClick={handleCancelFriendRequest}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition"
            >
              ⏳ Pending
            </button>
          );
        }

      case "rejected":
        // Show Add Friend again after some time, or don't show anything
        return (
          <button
            onClick={handleSendFriendRequest}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            👤 Add Friend
          </button>
        );

      default:
        return (
          <button
            onClick={handleSendFriendRequest}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            👤 Add Friend
          </button>
        );
    }
  };

  const tabs = [
    { name: "Timeline", icon: "📝", active: true },
    { name: "Friends", icon: "👥", active: false },
    { name: "Photos", icon: "📷", active: false },
    // { name: "Products", icon: "🛍️", active: false },
    // { name: "Likes", icon: "❤️", active: false },
    // { name: "Groups", icon: "👥", active: false },
    // { name: "Events", icon: "📅", active: false },
  ];

  // Show loading indicator while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationBar
          username={loggedInUser?.username}
          profilePicture={loggedInUser?.profilePicture}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if user not found
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationBar
          username={loggedInUser?.username}
          profilePicture={loggedInUser?.profilePicture}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <FaceIcon
              width={64}
              height={64}
              className="text-gray-400 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              User not found
            </h2>
            <p className="text-gray-600 mb-4">
              The user "{username}" doesn't exist or the profile is private.
            </p>
            <button
              onClick={() => navigate("/timeline")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to Timeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar
        username={loggedInUser?.username}
        profilePicture={loggedInUser?.profilePicture}
      />
      {/* Cover Photo Section */}
      <div className="relative">
        <div className="h-96 w-full bg-black relative overflow-hidden">
          {currentUser?.coverPicture && (
            <img
              src={currentUser.coverPicture}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-xl">
            {currentUser?.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser?.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <FaceIcon width={60} height={60} className="text-gray-600" />
              </div>
            )}
          </div>
        </div>
        {/* Edit Cover Photo Button */}
        <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition">
          <span className="ml-2 text-sm font-medium text-black">
            Edit Cover Photo
          </span>
        </button>
      </div>
      {/* Profile Header */}
      <div className="bg-white pt-24 pb-4 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              {currentUser?.name || "Anonymous User"}
              <UserBadges
                isVerified={currentUser?.isVerified}
                isPro={currentUser?.isProUser}
                size="lg"
                spacing="normal"
              />
            </h1>
            <p className="text-gray-600 mb-4">{currentUser?.bio || " "}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/timeline")}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                📰 News Feed
              </button>

              {/* Show different buttons based on whether it's own profile or another user's */}
              {!loggedInUser ? (
                // Still loading logged in user - show loading state
                <button
                  disabled
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                >
                  Loading...
                </button>
              ) : isOwnProfile() ? (
                // Own profile - show Edit Profile and Add to Story
                <>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Add to Story
                  </button>
                  <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
                    Edit Profile
                  </button>
                </>
              ) : (
                // Another user's profile - show Follow, Friend, and Message buttons
                <>
                  {/* Follow Button */}
                  {followLoading ? (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                    >
                      Loading...
                    </button>
                  ) : isFollowing ? (
                    <button
                      onClick={handleUnfollow}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      ✓ Following
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      👁️ Follow
                    </button>
                  )}

                  {/* Friend Button */}
                  {getFriendButton()}

                  {/* Message Button */}
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    💬 Message
                  </button>
                </>
              )}

              <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
                ...
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation Tabs */}
      <div className="bg-white border-t border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.name
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sliding Container */}
        <div className="relative overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: "300%",
              transform:
                activeTab === "Friends"
                  ? "translateX(-33.333%)"
                  : activeTab === "Photos"
                  ? "translateX(-66.666%)"
                  : "translateX(0%)",
            }}
          >
            {/* Timeline View */}
            <div className="w-1/3 flex-shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Intro Card */}
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h3 className="text-xl font-semibold mb-6 text-black">
                      Intro
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="text-xl">📝</span>
                        <span className="font-medium text-base">
                          {posts.length} Posts
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="text-xl">📷</span>
                        <span className="font-medium text-base">
                          {getAllMedia().length} Photos
                        </span>
                      </div>
                      {currentUser?.relationships && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">💕</span>
                          <span className="font-medium text-base">
                            Relationship with {currentUser?.relationships}
                          </span>
                        </div>
                      )}
                      {currentUser?.location && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">🏠</span>
                          <span className="font-medium text-base">
                            {currentUser?.location}
                          </span>
                        </div>
                      )}
                      {currentUser?.studyField && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">🎓</span>
                          <div className="flex flex-col">
                            <span className="font-medium text-base">
                              Studied at {currentUser.studyField}
                            </span>
                          </div>
                        </div>
                      )}
                      {currentUser?.gender && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">
                            {currentUser.gender === "male"
                              ? "♂️"
                              : currentUser.gender === "female"
                              ? "♀️"
                              : "❌"}
                          </span>
                          <span className="font-medium text-base">
                            {currentUser.gender}
                          </span>
                        </div>
                      )}
                      {currentUser?.relationshipStatus && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">💖</span>
                          <span className="font-medium text-base">
                            {currentUser.relationshipStatus}
                          </span>
                        </div>
                      )}
                      {currentUser?.birthdate && (
                        <div className="flex items-center space-x-4 text-gray-600">
                          <span className="text-xl">🎂</span>
                          <span className="font-medium text-base">
                            {new Date(currentUser.birthdate).toLocaleDateString(
                              "en-US",
                              {}
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="text-xl">👥</span>
                        <span className="font-medium text-base">
                          {currentUser?.followers?.length || 0} Followers
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="text-xl">👁️</span>
                        <span className="font-medium text-base">
                          {currentUser?.following?.length || 0} Following
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Photos Card */}
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-black ">
                        Photos{" "}
                        {showAllPhotos && getAllMedia().length > 0 && (
                          <span className="text-sm font-normal text-gray-500">
                            ({getAllMedia().length})
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setActiveTab("Photos")}
                        className="text-blue-600 hover:underline text-base"
                      >
                        {showAllPhotos ? "Show Less" : "See All Photos"}
                      </button>
                    </div>
                    <PhotosGrid
                      media={getAllMedia()}
                      onImageClick={handlePhotoClick}
                      showAll={showAllPhotos}
                      maxPhotos={9}
                    />
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-black">
                        Friends{" "}
                        {Array.isArray(friends) && (
                          <span className="text-sm font-normal text-gray-500">
                            ({friends.length})
                          </span>
                        )}
                      </h3>
                      {/* Optionally, add a "See All Friends" button */}
                      {/* <button className="text-blue-600 hover:underline text-base">
                See All Friends
              </button> */}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {friendsLoading ? (
                        <div className="col-span-3 text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">
                            Loading friends...
                          </p>
                        </div>
                      ) : Array.isArray(friends) && friends.length > 0 ? (
                        friends.slice(0, 9).map((friend: any) => {
                          return (
                            <div
                              key={friend.id}
                              className="flex flex-col items-center text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                              onClick={() =>
                                navigate(`/profile/${friend.username}`)
                              }
                            >
                              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-2">
                                {friend.profilePicture ? (
                                  <img
                                    src={friend.profilePicture}
                                    alt={friend.name || friend.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <FaceIcon
                                      width={32}
                                      height={32}
                                      className="text-gray-600"
                                    />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900 truncate w-full flex items-center">
                                <div className="flex flex-col items-center w-full">
                                  {" "}
                                  <span className="text-sm font-medium text-gray-900 truncate w-full text-center flex items-center justify-center">
                                    {friend.name ||
                                      friend.username ||
                                      "Anonymous User"}
                                    <UserBadges
                                      isVerified={friend.isVerified}
                                      isPro={friend.isPro}
                                      size="sm"
                                      spacing="tight"
                                    />
                                  </span>
                                </div>
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-gray-500 col-span-3 text-center">
                          No friends to show
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                  {/* PostFeed Component */}
                  <PostFeed
                    posts={posts}
                    setPosts={setPosts}
                    currentUser={loggedInUser}
                    onPostClick={openModal}
                    showCreatePost={isOwnProfile()}
                    onReact={handleReact}
                    username={username}
                    onRefreshPosts={refreshProfilePosts}
                  />

                  {/* Message Prompt */}
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600 mb-6 text-base">
                      Message me if you want reach me
                    </p>
                    <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-base">
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Friends View */}
            <div className="w-1/3 flex-shrink-0">
              <div className="w-full">
                <FriendsSection
                  friends={friends}
                  friendsLoading={friendsLoading}
                  onBackToTimeline={() => setActiveTab("Timeline")}
                />
              </div>
            </div>

            {/* Photos View */}
            <div className="w-1/3 flex-shrink-0">
              <div className="w-full">
                <PhotosSection
                  media={getAllMedia()}
                  onImageClick={handlePhotoClick}
                  onBackToTimeline={() => setActiveTab("Timeline")}
                  loading={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PostDetailModal */}
      {modalPost && (
        <PostDetailModal
          post={modalPost}
          isOpen={isModalOpen}
          onClose={closeModal}
          currentUser={loggedInUser}
          onReact={handleReact}
          onToggleComments={handleToggleComments}
          showComments={showComments[modalPost.id] || false}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          expandedPosts={expandedPosts}
          onToggleExpansion={handleToggleExpansion}
          onUpdatePost={updatePost}
        />
      )}
      {/* Unfriend Confirmation Modal */}
      {showUnfriendModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Unfriend {currentUser?.name || currentUser?.username}?
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                {/* Profile Picture */}
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {currentUser?.profilePicture ? (
                    <img
                      src={currentUser.profilePicture}
                      alt={currentUser.name || currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <FaceIcon
                        width={32}
                        height={32}
                        className="text-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <p className="font-medium text-gray-900">
                    {currentUser?.name || currentUser?.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{currentUser?.username}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to remove{" "}
                {currentUser?.name || currentUser?.username} from your friends
                list? You will no longer be friends and will need to send a new
                friend request to connect again.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex space-x-3 justify-end">
              <button
                onClick={cancelUnfriend}
                disabled={friendshipLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnfriend}
                disabled={friendshipLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center"
              >
                {friendshipLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removing...
                  </>
                ) : (
                  "Unfriend"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Friend Request Confirmation Modal */}
      {showCancelRequestModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelCancelRequest();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Cancel Friend Request?
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                {/* Profile Picture */}
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {currentUser?.profilePicture ? (
                    <img
                      src={currentUser.profilePicture}
                      alt={currentUser.name || currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <FaceIcon
                        width={32}
                        height={32}
                        className="text-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <p className="font-medium text-gray-900">
                    {currentUser?.name || currentUser?.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{currentUser?.username}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your friend request to{" "}
                {currentUser?.name || currentUser?.username}? They will no
                longer receive your request.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex space-x-3 justify-end">
              <button
                onClick={cancelCancelRequest}
                disabled={friendshipLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                onClick={confirmCancelRequest}
                disabled={friendshipLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center"
              >
                {friendshipLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Canceling...
                  </>
                ) : (
                  "Cancel Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
