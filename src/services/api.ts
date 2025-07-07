import axios from "axios";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_API_URL;

// User services
export const userService = {
  // Get current logged-in user
  getCurrentUser: async () => {
    const response = await axios.get(`${apiUrl}/auth/me`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get user by username
  getUserByUsername: async (username: string) => {
    const response = await axios.get(`${apiUrl}/auth/user/${username}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    const response = await axios.get(`${apiUrl}/auth/user/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  getAllUser: async (page: number = 1, limit: number = 10) => {
    const response = await axios.get(
      `${apiUrl}/users?page=${page}&limit=${limit}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Search users by query (for mentions)
  searchUsers: async (query: string) => {
    const response = await axios.get(
      `${apiUrl}/auth/search?q=${encodeURIComponent(query)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Check if current user is following another user
  getFollowStatus: async (userId: string) => {
    const response = await axios.get(
      `${apiUrl}/friendship/follow-status/${userId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId: string, profileData: { coverPhoto?: File }) => {
    const formData = new FormData();

    if (profileData.coverPhoto)
      formData.append("coverPicture", profileData.coverPhoto);

    const response = await axios.patch(
      `${apiUrl}/users/editcover/${userId}`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Update user profile fields with optional file upload
  updateUserProfile: async (
    userId: string,
    profileData: {
      username?: string;
      name?: string;
      bio?: string;
      profilePicture?: string;
      coverPicture?: string;
      location?: string;
      studyField?: string;
      relationshipStatus?: string;
      relationship?: string;
      birthdate?: string;
      gender?: string;
    },
    profilePictureFile?: File
  ) => {
    // If there's a file to upload, use FormData
    if (profilePictureFile) {
      const formData = new FormData();

      // Append profile data
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Append profile picture file
      formData.append("profilePicture", profilePictureFile);

      const response = await axios.patch(
        `${apiUrl}/users/${userId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } else {
      // If no file, use JSON
      const response = await axios.patch(
        `${apiUrl}/users/${userId}`,
        profileData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    }
  },

  // Upload profile picture

  logout: async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      toast.success("Logged out successfully");
      return response.data;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },
};

export const sponsoredService = {
  getSponsoredPosts: async (page: number = 1, limit: number = 5) => {
    const response = await axios.get(
      `${apiUrl}/sponsored?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  createSponsoredPost: async (formData: FormData) => {
    console.log("Creating sponsored post with data:", formData.get("title"));
    const response = await axios.post(
      `${apiUrl}/sponsored/createsponsored`,
      {
        title: formData.get("title"),
        content: formData.get("content"),
        link: formData.get("link"),
        status: formData.get("status"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  acceptSponsoredPost: async (id: string) => {
    const response = await axios.put(
      `${apiUrl}/sponsored/accept/${id}`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  rejectSponsoredPost: async (id: string) => {
    const response = await axios.put(
      `${apiUrl}/sponsored/reject/${id}`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  deleteSponsoredPost: async (id: string) => {
    const response = await axios.delete(`${apiUrl}/sponsored/${id}`, {
      withCredentials: true,
    });
    return response.data;
  },

  updateSponsoredPost: async (id: string, formData: FormData) => {
    const response = await axios.patch(
      `${apiUrl}/sponsored/${id}`,
      {
        title: formData.get("title"),
        content: formData.get("content"),
        link: formData.get("link"),
        status: formData.get("status"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};

// Post services
export const postService = {
  // Get timeline posts (including posts from followed pages)
  getTimelinePosts: async (page: number = 1, limit: number = 5) => {
    const response = await axios.get(
      `${apiUrl}/posts/timeline?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get posts from followed pages only
  getFollowedPagesPosts: async (page: number = 1, limit: number = 5) => {
    const response = await axios.get(
      `${apiUrl}/posts/followed-pages?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get posts by username
  getPostsByUsername: async (
    username: string,
    page: number = 1,
    limit: number = 5
  ) => {
    const response = await axios.get(
      `${apiUrl}/posts/user/username/${username}?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get posts by user ID
  getPostsByUserId: async (
    userId: string,
    page: number = 1,
    limit: number = 5
  ) => {
    const response = await axios.get(
      `${apiUrl}/posts/user/${userId}?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Create a new post
  createPost: async (content: string, media?: File[]) => {
    const formData = new FormData();
    formData.append("content", content);

    if (media && media.length > 0) {
      media.forEach((file) => {
        formData.append("media", file);
      });
    }

    const response = await axios.post(`${apiUrl}/posts`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete a post
  deletePost: async (postId: string) => {
    const response = await axios.delete(`${apiUrl}/posts/${postId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Update a post
  updatePost: async (postId: string, content: string) => {
    const response = await axios.put(
      `${apiUrl}/posts/${postId}`,
      { content },
      { withCredentials: true }
    );
    return response.data;
  },
};

// Reaction services
export const reactionService = {
  // React to a post
  reactToPost: async (postId: string, reactionType: string) => {
    const response = await axios.post(
      `${apiUrl}/like/${postId}/react`,
      { type: reactionType },
      { withCredentials: true }
    );
    return response.data;
  },
};

// Comment services
export const commentService = {
  // Add comment to post
  addComment: async (postId: string, content: string) => {
    const response = await axios.post(
      `${apiUrl}/comment/${postId}`,
      { content },
      { withCredentials: true }
    );
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const response = await axios.delete(`${apiUrl}/comment/${commentId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Update comment
  updateComment: async (commentId: string, content: string) => {
    const response = await axios.put(
      `${apiUrl}/comment/${commentId}`,
      { content },
      { withCredentials: true }
    );
    return response.data;
  },

  // Report comment
  reportComment: async (commentId: string, reason: string) => {
    const response = await axios.post(
      `${apiUrl}/comment/${commentId}/report`,
      { reason },
      { withCredentials: true }
    );
    return response.data;
  },
};

// Additional services for other actions
export const actionService = {
  // Save/unsave post
  savePost: async (postId: string) => {
    const response = await axios.post(
      `${apiUrl}/posts/${postId}/save`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Follow user
  followUser: async (userId: string) => {
    const response = await axios.post(
      `${apiUrl}/friendship/follow/${userId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId: string) => {
    const response = await axios.post(
      `${apiUrl}/users/${userId}/unfollow`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Report post
  reportPost: async (postId: string, reason: string) => {
    const response = await axios.post(
      `${apiUrl}/posts/${postId}/report`,
      { reason },
      { withCredentials: true }
    );
    return response.data;
  },
};

// Friend services
export const friendService = {
  // Get current user's friends
  getMyFriends: async () => {
    const response = await axios.get(`${apiUrl}/friendship/`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get specific user's friends
  getUserFriends: async (userId: string) => {
    const response = await axios.get(`${apiUrl}/friendship/friends/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get friendship status with another user
  getFriendshipStatus: async (userId: string) => {
    const response = await axios.get(`${apiUrl}/friendship/status/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get received friend requests
  getReceivedFriendRequests: async () => {
    const response = await axios.get(`${apiUrl}/friendship/requests/received`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Send friend request
  sendFriendRequest: async (userId: string) => {
    const response = await axios.post(
      `${apiUrl}/friendship/request/${userId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: string) => {
    console.log("Accepting friend request with ID:", friendshipId);
    const response = await axios.put(
      `${apiUrl}/friendship/accept/${friendshipId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Reject friend request
  rejectFriendRequest: async (friendshipId: string) => {
    const response = await axios.delete(
      `${apiUrl}/friendship/reject/${friendshipId}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Remove friend / Cancel friend request
  removeFriend: async (friendshipId: string) => {
    const response = await axios.delete(
      `${apiUrl}/friendship/${friendshipId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Unfriend a user (explicit method for better clarity)
  unfriendUser: async (userId: string) => {
    const response = await axios.delete(
      `${apiUrl}/friendship/unfriend/${userId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Cancel friend request (using the endpoint for pending requests)
  cancelFriendRequest: async (friendshipId: string) => {
    const response = await axios.delete(
      `${apiUrl}/friendship/cancel/${friendshipId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};

// Page services
export const pageService = {
  // Get all pages
  getAllPages: async (page: number = 1, limit: number = 10) => {
    const response = await axios.get(
      `${apiUrl}/page/getpages?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get page by ID
  getPageById: async (pageId: string) => {
    console.log("Fetching page with ID:", pageId);
    const response = await axios.get(`${apiUrl}/page/${pageId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Create new page
  createPage: async (pageData: {
    name: string;
    description: string;
    category: string;
    profileImage?: File;
    coverImage?: File;
  }) => {
    const formData = new FormData();
    formData.append("name", pageData.name);
    formData.append("description", pageData.description);
    formData.append("category", pageData.category);

    if (pageData.profileImage) {
      formData.append("profileImage", pageData.profileImage);
    }

    if (pageData.coverImage) {
      formData.append("coverImage", pageData.coverImage);
    }
    const response = await axios.post(`${apiUrl}/page/create`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update page
  updatePage: async (
    pageId: string,
    pageData: {
      name?: string;
      description?: string;
      category?: string;
      website?: string;
      email?: string;
      phone?: string;
      address?: string;
      profilePicture?: File;
      coverPhoto?: File;
    }
  ) => {
    const formData = new FormData();

    if (pageData.name) formData.append("name", pageData.name);
    if (pageData.description)
      formData.append("description", pageData.description);
    if (pageData.category) formData.append("category", pageData.category);
    if (pageData.website) formData.append("website", pageData.website);
    if (pageData.email) formData.append("email", pageData.email);
    if (pageData.phone) formData.append("phone", pageData.phone);
    if (pageData.address) formData.append("address", pageData.address);
    if (pageData.profilePicture)
      formData.append("profileImage", pageData.profilePicture);
    if (pageData.coverPhoto) formData.append("coverImage", pageData.coverPhoto);

    const response = await axios.patch(`${apiUrl}/page/${pageId}`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.success("Page updated successfully");
    return response.data;
  },

  // Delete page
  deletePage: async (pageId: string) => {
    const response = await axios.delete(`${apiUrl}/page/${pageId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Follow/Like page
  followPage: async (pageId: string) => {
    const response = await axios.post(
      `${apiUrl}/page/${pageId}/follow`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Unfollow page
  unfollowPage: async (pageId: string) => {
    const response = await axios.delete(`${apiUrl}/page/${pageId}/unfollow`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get page posts
  getPagePosts: async (
    pageId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await axios.get(
      `${apiUrl}/page/${pageId}/posts?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Create post on page (for page members/admins)
  createPagePost: async (
    pageId: string,
    postData: {
      content: string;
      media?: File[];
    }
  ) => {
    const formData = new FormData();
    formData.append("content", postData.content);

    if (postData.media && postData.media.length > 0) {
      postData.media.forEach((file) => {
        formData.append("media", file);
      });
    }

    const response = await axios.post(
      `${apiUrl}/page/${pageId}/post`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Get page members
  getPageMembers: async (
    pageId: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const response = await axios.get(
      `${apiUrl}/page/${pageId}/members?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get page followers
  getPageFollowers: async (
    pageId: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const response = await axios.get(
      `${apiUrl}/page/${pageId}/followers?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Check if user is member of page (not needed for public pages)
  checkMembership: async (_pageId: string) => {
    // For public pages, everyone is considered a member
    return { membership: { role: "member" } };
  },

  // Join page (request membership)
  joinPage: async (pageId: string) => {
    const response = await axios.post(
      `${apiUrl}/page/${pageId}/join`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Leave page
  leavePage: async (pageId: string) => {
    const response = await axios.delete(`${apiUrl}/page/${pageId}/leave`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Search pages
  searchPages: async (query: string) => {
    const response = await axios.get(
      `${apiUrl}/page/search-by-name?q=${encodeURIComponent(query)}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get user's followed pages
  getUserFollowedPages: async () => {
    const response = await axios.get(`${apiUrl}/page/followed`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get pending requests for a page (Admin/Owner only)
  getPendingRequests: async (
    pageId: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const response = await axios.get(
      `${apiUrl}/page/${pageId}/pending-requests?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Approve join request (Admin/Owner only)
  approveJoinRequest: async (pageId: string, userId: string) => {
    const response = await axios.patch(
      `${apiUrl}/page/${pageId}/approve-request/${userId}`,
      {},
      { withCredentials: true }
    );
    toast.success("Join request approved successfully");
    return response.data;
  },

  // Reject join request (Admin/Owner only)
  rejectJoinRequest: async (pageId: string, userId: string) => {
    const response = await axios.patch(
      `${apiUrl}/page/${pageId}/reject-request/${userId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Get user's pending requests
  getMyPendingRequests: async (page: number = 1, limit: number = 20) => {
    const response = await axios.get(
      `${apiUrl}/page/my-pending-requests?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },
};

// Notification services
export const notificationService = {
  // Get notifications
  getNotifications: async (page: number = 1, limit: number = 5) => {
    const response = await axios.get(
      `${apiUrl}/notifications/?page=${page}&limit=${limit}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await axios.put(
      `${apiUrl}/notifications/read`,
      {
        notificationIds: [notificationId],
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axios.put(
      `${apiUrl}/notifications/read-all`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};

// Search services
export const searchService = {
  // Unified search across users, pages, and posts
  search: async (
    query: string,
    type: "all" | "users" | "pages" | "posts" = "all",
    limit: number = 10
  ) => {
    const response = await axios.get(
      `${apiUrl}/search/?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },
};

// Verification services
export const verificationService = {
  // Submit verification request
  submitRequest: async (requestData: {
    requestType: "verified" | "pro";
    reason: string;
    documents?: File[];
  }) => {
    const formData = new FormData();
    formData.append("requestType", requestData.requestType);
    formData.append("reason", requestData.reason);

    if (requestData.documents) {
      requestData.documents.forEach((file) => {
        formData.append("documents", file);
      });
    }

    const response = await axios.post(
      `${apiUrl}/verification/submit`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Get current user's verification requests
  getMyRequests: async (page: number = 1, limit: number = 10) => {
    const response = await axios.get(
      `${apiUrl}/verification/my-requests?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get all verification requests (Admin only)
  getAllRequests: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: "pending" | "approved" | "rejected" | "under-review";
      requestType?: "verified" | "pro";
      search?: string;
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.status) params.append("status", filters.status);
    if (filters?.requestType) params.append("requestType", filters.requestType);
    if (filters?.search) params.append("search", filters.search);

    const response = await axios.get(
      `${apiUrl}/verification/all?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get verification request details
  getRequestById: async (requestId: string) => {
    const response = await axios.get(`${apiUrl}/verification/${requestId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Approve verification request (Admin only)
  approveRequest: async (requestId: string, notes?: string) => {
    const response = await axios.patch(
      `${apiUrl}/verification/${requestId}/approve`,
      { notes },
      { withCredentials: true }
    );
    return response.data;
  },

  // Reject verification request (Admin only)
  rejectRequest: async (
    requestId: string,
    rejectionReason: string,
    notes?: string
  ) => {
    const response = await axios.patch(
      `${apiUrl}/verification/${requestId}/reject`,
      { rejectionReason, notes },
      { withCredentials: true }
    );
    return response.data;
  },

  // Get verification stats overview (Admin only)
  getStatsOverview: async () => {
    const response = await axios.get(`${apiUrl}/verification/stats/overview`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Update request status to under review (Admin only)
  setUnderReview: async (requestId: string, notes?: string) => {
    const response = await axios.patch(
      `${apiUrl}/verification/${requestId}/under-review`,
      { notes },
      { withCredentials: true }
    );
    return response.data;
  },
};

// Boosted Posts Service
export const boostedPostsService = {
  // Get boosted posts stats
  getStats: async () => {
    const response = await axios.get(`${apiUrl}/boosted-posts/stats`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Boost a post
  boostPost: async (postId: string, endDate: Date) => {
    const response = await axios.post(
      `${apiUrl}/boosted-posts/`,
      {
        postId,
        endDate,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Get user's boosted posts
  getMyBoosts: async () => {
    const response = await axios.get(`${apiUrl}/boosted-posts/my-boosts`, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get all boosted posts (for timeline)
  getAllBoostedPosts: async () => {
    const response = await axios.get(`${apiUrl}/boosted-posts/`, {
      withCredentials: true,
    });
    return response.data;
  },
};

// Export all services
export const apiService = {
  user: userService,
  post: postService,
  reaction: reactionService,
  comment: commentService,
  action: actionService,
  friend: friendService,
  page: pageService,
  notification: notificationService,
  search: searchService,
  verification: verificationService,
  boostedPosts: boostedPostsService,
};

export default apiService;
