import { useState, useEffect } from "react";
import {
  PersonIcon,
  StarIcon,
  EyeOpenIcon,
  BarChartIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import apiService from "../../services/api";

// Function to parse and render user tags in content
const parseUserTags = (content: string) => {
  // Regular expression to match @[username](username) pattern
  const userTagRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = userTagRegex.exec(content)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the formatted tag
    const username = match[1];
    parts.push(
      <span
        key={match.index}
        className="text-blue-600 font-medium hover:text-blue-800 cursor-pointer"
      >
        @{username}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  sponsoredPosts: number;
  adRevenue: number;
  engagement: number;
}

interface RecentPost {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    name: string;
  };
  createdAt: string;
  _count?: {
    likes: number;
    comments: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    sponsoredPosts: 0,
    adRevenue: 0,
    engagement: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard stats (simulated for now)
        const statsPromise = new Promise<DashboardStats>((resolve) => {
          setTimeout(() => {
            resolve({
              totalUsers: 1247,
              activeUsers: 892,
              totalPosts: 3456,
              sponsoredPosts: 23,
              adRevenue: 4582.5,
              engagement: 78.5,
            });
          }, 1000);
        });

        // Fetch recent posts from API
        const postsPromise = apiService.post.getTimelinePosts(1, 5);

        const [statsData, postsData] = await Promise.all([
          statsPromise,
          postsPromise,
        ]);

        setStats(statsData);

        // Map posts data to our interface - API returns 'post' not 'posts'
        const mappedPosts: RecentPost[] = postsData.post.map((post: any) => ({
          id: post.id,
          content: post.content,
          author: {
            id: post.author.id,
            username: post.author.username,
            name: post.author.name || post.author.username,
          },
          createdAt: post.createdAt,
          _count: {
            likes: post.Reaction?.length || 0,
            comments: post.comments?.length || 0,
          },
        }));

        setRecentPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        // Set fallback empty data
        setRecentPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: PersonIcon,
      color: "blue",
      trend: "+12% from last month",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: PersonIcon,
      color: "green",
      trend: "+8% from last month",
    },
    {
      title: "Total Posts",
      value: stats.totalPosts.toLocaleString(),
      icon: BarChartIcon,
      color: "purple",
      trend: "+15% from last month",
    },
    {
      title: "Sponsored Posts",
      value: stats.sponsoredPosts.toString(),
      icon: StarIcon,
      color: "yellow",
      trend: "+3 this week",
    },
    {
      title: "Ad Revenue",
      value: `$${stats.adRevenue.toLocaleString()}`,
      icon: EyeOpenIcon,
      color: "indigo",
      trend: "+22% from last month",
    },
    {
      title: "Engagement Rate",
      value: `${stats.engagement}%`,
      icon: BarChartIcon,
      color: "pink",
      trend: "+5.2% from last month",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
      pink: "bg-pink-50 text-pink-700 border-pink-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      yellow: "text-yellow-600",
      indigo: "text-indigo-600",
      pink: "text-pink-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Recent Activity Loading */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start space-x-4 p-4 animate-pulse"
                >
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}
                >
                  <Icon
                    className={`w-6 h-6 ${getIconColorClasses(stat.color)}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-green-600">{stat.trend}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Posts Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent posts available</p>
              </div>
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">
                        New post by @{post.author.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({post.author.name})
                      </span>
                    </div>
                    <div
                      className="text-sm text-gray-700 mb-2 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {parseUserTags(
                        post.content.length > 150
                          ? `${post.content.substring(0, 150)}...`
                          : post.content
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>{post._count?.likes || 0} likes</span>
                      <span>{post._count?.comments || 0} comments</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
