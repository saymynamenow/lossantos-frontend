import React from "react";
import {
  DashboardIcon,
  Pencil1Icon,
  PersonIcon,
  ClockIcon,
  FileTextIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import type { Page } from "../../type";

type PageSection =
  | "overview"
  | "edit"
  | "members"
  | "pending-requests"
  | "posts"
  | "settings";

interface PageSidebarProps {
  activeSection: PageSection;
  setActiveSection: (section: PageSection) => void;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
  pendingRequestsCount: number;
  page: Page;
}

const PageSidebar: React.FC<PageSidebarProps> = ({
  activeSection,
  setActiveSection,
  currentUserRole,
  isOwner,
  pendingRequestsCount,
  page,
}) => {
  const canManageAll = isOwner || currentUserRole === "admin";
  const canManageRequests = canManageAll || currentUserRole === "moderator";

  const menuItems = [
    {
      id: "overview" as PageSection,
      name: "Overview",
      icon: DashboardIcon,
      description: "Dashboard & analytics",
      available: true,
    },
    {
      id: "edit" as PageSection,
      name: "Edit Page",
      icon: Pencil1Icon,
      description: "Update page details",
      available: canManageAll,
    },
    {
      id: "members" as PageSection,
      name: "Members",
      icon: PersonIcon,
      description: "Manage page members",
      available: canManageAll,
    },
    {
      id: "pending-requests" as PageSection,
      name: "Pending Requests",
      icon: ClockIcon,
      description: "Review join requests",
      available: canManageRequests,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      id: "posts" as PageSection,
      name: "Posts",
      icon: FileTextIcon,
      description: "Manage page content",
      available: canManageAll,
    },
    {
      id: "settings" as PageSection,
      name: "Settings",
      icon: GearIcon,
      description: "Page configuration",
      available: canManageAll,
    },
  ];

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-sm z-30">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Page Dashboard
          </h2>
          <Link
            to={`/page/${page.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Page
          </Link>
        </div>

        <nav className="space-y-2">
          {menuItems
            .filter((item) => item.available)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-start p-3 rounded-lg text-left transition-colors group ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div
                        className={`font-medium ${
                          isActive ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
        </nav>
      </div>
    </div>
  );
};

export default PageSidebar;
