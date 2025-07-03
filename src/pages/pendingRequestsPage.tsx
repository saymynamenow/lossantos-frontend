import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RightSidebar from "./components/RightSidebar";
import MyPendingRequests from "./components/MyPendingRequests";
import PendingRequestsPageContent from "./components/PendingRequestsPageContent";
import type { Page, User } from "../type";
import apiService from "../services/api";

const PendingRequestsPage: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<Page | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<
    "admin" | "moderator" | "member" | "none"
  >("none");
  const hasInitialized = useRef(false);

  // If no pageId is provided, show user's own pending requests
  const isManagingPageRequests = !!pageId;

  useEffect(() => {
    if (!pageId) {
      // No pageId means user wants to see their own pending requests
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current user
        const userData = await apiService.user.getCurrentUser();
        setCurrentUser(userData);

        // Fetch page data
        const pageData = await apiService.page.getPageById(pageId);
        setPage(pageData.page);

        // Fetch page members to check current user's role
        const membersData = await apiService.page.getPageMembers(pageId);
        const currentUserMember = (membersData.members || []).find(
          (member: any) => member.id === userData.id
        );

        if (currentUserMember) {
          setCurrentUserRole(currentUserMember.role || "member");
        } else {
          setCurrentUserRole("none");
        }
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
  }, [pageId]);

  const isOwner = currentUser?.id === page?.ownerId;
  const canManageRequests =
    isOwner || currentUserRole === "admin" || currentUserRole === "moderator";

  // Loading state
  if (loading && pageId) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow-md p-8 animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-64"></div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <RightSidebar />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
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

          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
          {isManagingPageRequests ? (
            // Show page's pending requests management (for admin/moderator/owner)
            <PendingRequestsPageContent
              pageId={pageId!}
              pageName={page?.name}
              canManageRequests={canManageRequests}
            />
          ) : (
            // Show user's own pending requests
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Pending Requests
                </h1>
                <p className="text-gray-600">
                  View the status of your page join requests that are waiting
                  for approval.
                </p>
              </div>

              <MyPendingRequests />
            </>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default PendingRequestsPage;
