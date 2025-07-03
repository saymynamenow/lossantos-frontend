import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Page } from "../type";
import PageCard from "./components/PageCard";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RigthSidebar from "./components/RightSidebar";
import { MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import apiService from "../services/api";

const PageBrowser: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [followingStates, setFollowingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const categories = [
    "All",
    "Technology",
    "Health & Fitness",
    "Food & Dining",
    "Arts & Culture",
    "Business",
    "Entertainment",
  ];

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        const response = await apiService.page.getAllPages(1, 50); // Get more pages for browsing
        setPages(response.pages || []);

        // Initialize following states
        const initialFollowingStates: { [key: string]: boolean } = {};
        (response.pages || []).forEach((page: Page) => {
          initialFollowingStates[page.id] = page.isFollowing || false;
        });
        setFollowingStates(initialFollowingStates);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  const handleFollow = async (pageId: string) => {
    try {
      await apiService.page.followPage(pageId);
      setFollowingStates((prev) => ({ ...prev, [pageId]: true }));
      setPages((prev) =>
        prev.map((page) =>
          page.id === pageId
            ? { ...page, followerCount: (page.followerCount || 0) + 1 }
            : page
        )
      );
    } catch (error) {
      console.error("Failed to follow page:", error);
    }
  };

  const handleUnfollow = async (pageId: string) => {
    try {
      await apiService.page.unfollowPage(pageId);
      setFollowingStates((prev) => ({ ...prev, [pageId]: false }));
      setPages((prev) =>
        prev.map((page) =>
          page.id === pageId
            ? {
                ...page,
                followerCount: Math.max((page.followerCount || 0) - 1, 0),
              }
            : page
        )
      );
    } catch (error) {
      console.error("Failed to unfollow page:", error);
    }
  };

  const handleCreatePage = () => {
    navigate("/page/create");
  };

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || page.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <div className="w-full max-w-6xl mx-20 my-12 relative z-20">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Discover Pages
                </h1>
                <p className="text-gray-600 mt-2">
                  Find and join communities that match your interests
                </p>
              </div>

              <button
                onClick={handleCreatePage}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Page</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-xl shadow-md">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pages Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 animate-pulse"
                >
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPages.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onFollow={() => handleFollow(page.id)}
                  onUnfollow={() => handleUnfollow(page.id)}
                  isFollowing={followingStates[page.id] || false}
                  showActions={true}
                  size="medium"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No pages found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <RigthSidebar />
      </div>
    </div>
  );
};

export default PageBrowser;
