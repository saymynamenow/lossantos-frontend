export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  bio?: string | null;
  profilePicture?: string | null;
  isVerified: boolean;
  isProUser?: boolean;
  isPro?: boolean; // Alias for isProUser
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;

  posts?: Post[];
  stories?: Story[];
  followers?: Follower[];
  following?: Follower[];
  friends?: Friendship[];
  friendsWith?: Friendship[];
  pageMembers?: PageMember[];
  ownedPages?: Page[];
};

export type Post = {
  id: string;
  content?: string | null;
  authorId: string;
  createdAt: string;
  author: User;
  media: Media[];
  reactions: Reaction[];
  comments: Comments[];

  // Optional page information for posts from pages
  page?: Page;
  pageId?: string;
};

export type Comments = {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
};

export type Reaction = {
  id: string;
  type: string;
  userId: string;
  postId: string;
  createdAt: string;

  user: User;
  post?: Post;
};
export type Media = {
  id: string;
  url: string;
  type: string; // e.g., "image", "video"
  postId: string;
  createdAt: string;
  post?: Post;
};
export type Story = {
  id: string;
  mediaUrl: string;
  caption?: string | null;
  expiresAt: string;
  authorId: string;
  author: User;
};
export type Follower = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;

  follower: User;
  following: User;
};
export type Friendship = {
  id: string;
  userAId: string;
  userBId: string;
  status: string; // "pending", "accepted", "rejected"
  createdAt: string;

  userA: User;
  userB: User;
};
export type Page = {
  id: string;
  name: string;
  description?: string | null;
  category: string; // Business, Community, Public Figure, etc.
  profileImage?: string | null;
  coverImage?: string | null;
  isVerified?: boolean;
  followerCount?: number;
  postCount?: number;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  ownerId: string;
  _count: {
    followers?: number;
    posts?: number;
    members?: number;
  };
  createdAt: string;
  updatedAt: string;

  owner: User;
  members: PageMember[];
  posts?: PagePost[];
  isFollowing?: boolean; // Whether current user follows this page
  membershipStatus?: "member" | "admin" | "moderator" | "none" | "pending";
};

export type PageMember = {
  id: string;
  userId: string;
  pageId: string;
  role: "member" | "admin" | "moderator";
  status: "active" | "pending" | "banned";
  joinedAt: string;

  user: User;
  page: Page;
};

export type PagePost = {
  id: string;
  content?: string | null;
  pageId: string;
  authorId: string; // User who posted on behalf of page
  createdAt: string;
  updatedAt: string;

  page: Page;
  author: User;
  media: Media[];
  reactions: Reaction[];
  comments: Comments[];
};

export type PageJoinRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  user: User;
  page?: Page;
};

export type PendingRequestsResponse = {
  pendingRequests: PageJoinRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
};

export type ApproveRequestResponse = {
  message: string;
  member: {
    id: string;
    status: "accepted";
    role: "member" | "admin" | "moderator";
    user: User;
  };
};

export type RejectRequestResponse = {
  message: string;
};
