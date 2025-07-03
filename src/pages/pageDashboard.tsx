import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import PageSidebar from "./components/PageSidebar";
import PageDashboardOverview from "./components/PageDashboardOverview";
import PageEditManagement from "./components/PageEditManagement";
import PageMembersManagement from "./components/PageMembersManagement";
import PagePendingRequestsManagement from "./components/PagePendingRequestsManagement";
import PagePostsManagement from "./components/PagePostsManagement";
import PageSettingsManagement from "./components/PageSettingsManagement";
import type { User, Page } from "../type";
import apiService from "../services/api";

type PageSection =
  | "overview"
  | "edit"
  | "members"
  | "pending-requests"
  | "posts"
  | "settings";

const PageDashboard: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [activeSection, setActiveSection] = useState<PageSection>("overview");
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<
    "admin" | "moderator" | "member" | "none"
  >("none");
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const url = import.meta.env.VITE_UPLOADS_URL;
  useEffect(() => {
    const fetchData = async () => {
      if (!pageId) {
        navigate("/pages");
        return;
      }

      try {
        setLoading(true);

        // Fetch current user
        const userData = await apiService.user.getCurrentUser();
        setCurrentUser(userData);

        // Fetch page data
        const pageData = await apiService.page.getPageById(pageId);
        setPage(pageData.page);

        // Check if user has permission to access this dashboard
        const isOwner = userData.id === pageData.page.ownerId;

        if (!isOwner) {
          // Check if user is admin or moderator
          const membersData = await apiService.page.getPageMembers(pageId);
          const currentUserMember = (membersData.members || []).find(
            (member: any) => member.id === userData.id
          );

          if (currentUserMember) {
            setCurrentUserRole(currentUserMember.role || "member");

            // Only allow admin, moderator, or owner to access dashboard
            if (
              currentUserMember.role !== "admin" &&
              currentUserMember.role !== "moderator"
            ) {
              navigate(`/page/${pageId}`);
              return;
            }
          } else {
            // User is not even a member
            navigate(`/page/${pageId}`);
            return;
          }
        } else {
          setCurrentUserRole("admin"); // Owner has admin privileges
        }

        // Fetch pending requests count for the badge
        if (
          isOwner ||
          currentUserRole === "admin" ||
          currentUserRole === "moderator"
        ) {
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
      } catch (error) {
        console.error("Failed to fetch data:", error);
        navigate("/pages");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pageId, navigate, currentUserRole]);
  const renderContent = () => {
    if (!page || !currentUser) return null;

    const isOwner = currentUser.id === page.ownerId;

    switch (activeSection) {
      case "overview":
        return (
          <PageDashboardOverview
            page={page}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
            pendingRequestsCount={pendingRequestsCount}
          />
        );
      case "edit":
        return (
          <PageEditManagement
            page={page}
            onPageUpdate={setPage}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
          />
        );
      case "members":
        return (
          <PageMembersManagement
            pageId={page.id}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
          />
        );
      case "pending-requests":
        return (
          <PagePendingRequestsManagement
            pageId={page.id}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
            pendingRequestsCount={pendingRequestsCount}
            onRequestsCountChange={setPendingRequestsCount}
          />
        );
      case "posts":
        return (
          <PagePostsManagement
            pageId={page.id}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
          />
        );
      case "settings":
        return (
          <PageSettingsManagement
            page={page}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
          />
        );
      default:
        return (
          <PageDashboardOverview
            page={page}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
            pendingRequestsCount={pendingRequestsCount}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page dashboard.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = currentUser.id === page.ownerId;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavigationBar />

      <div className="flex flex-1 pt-16">
        <PageSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          currentUserRole={currentUserRole}
          isOwner={isOwner}
          pendingRequestsCount={pendingRequestsCount}
          page={page}
        />

        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={
                      `${url}/${page.profileImage}` ||
                      "/default-page-avatar.png"
                    }
                    alt={page.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {page.name} Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your page content, members, and settings
                  </p>
                </div>
              </div>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageDashboard;
