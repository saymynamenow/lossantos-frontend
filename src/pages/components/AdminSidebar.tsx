import {
  DashboardIcon,
  StarIcon,
  EyeOpenIcon,
  PersonIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";

type AdminSection =
  | "dashboard"
  | "sponsored"
  | "ads"
  | "users"
  | "reporting"
  | "verified-requests";

interface AdminSidebarProps {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
}

export default function AdminSidebar({
  activeSection,
  setActiveSection,
}: AdminSidebarProps) {
  const menuItems = [
    {
      id: "dashboard" as AdminSection,
      name: "Dashboard",
      icon: DashboardIcon,
      description: "Overview & analytics",
    },
    {
      id: "sponsored" as AdminSection,
      name: "Sponsored Content",
      icon: StarIcon,
      description: "Manage sponsored posts",
    },
    {
      id: "ads" as AdminSection,
      name: "Advertisements",
      icon: EyeOpenIcon,
      description: "Ad campaigns & banners",
    },
    {
      id: "users" as AdminSection,
      name: "User Management",
      icon: PersonIcon,
      description: "Control user accounts",
    },
    {
      id: "reporting" as AdminSection,
      name: "Reports",
      icon: ExclamationTriangleIcon,
      description: "Handle user reports",
    },
    {
      id: "verified-requests" as AdminSection,
      name: "Verification Requests",
      icon: CheckCircledIcon,
      description: "Approve verification badges",
    },
  ];

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-sm z-30">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Admin Panel
        </h2>

        <nav className="space-y-2">
          {menuItems.map((item) => {
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
                  <div
                    className={`font-medium ${
                      isActive ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {item.name}
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
}
