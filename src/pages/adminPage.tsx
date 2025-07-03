import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import AdminSidebar from "./components/AdminSidebar";
import SponsoredManagement from "./components/SponsoredManagement";
import AdsManagement from "./components/AdsManagement";
import UserManagement from "./components/UserManagement";
import AdminDashboard from "./components/AdminDashboard";
import ReportingManagement from "./components/ReportingManagement";
import VerifiedRequestManagement from "./components/VerifiedRequestManagement";
import type { User } from "../type";
import apiService from "../services/api";

type AdminSection =
  | "dashboard"
  | "sponsored"
  | "ads"
  | "users"
  | "reporting"
  | "verified-requests";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await apiService.user.getCurrentUser();
        setCurrentUser(userData);
        if (!userData.isAdmin) {
          navigate("/timeline");
          return;
        }
      } catch (error) {
        console.error("Failed to fetch current user", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "sponsored":
        return <SponsoredManagement />;
      case "ads":
        return <AdsManagement />;
      case "users":
        return <UserManagement />;
      case "reporting":
        return <ReportingManagement />;
      case "verified-requests":
        return <VerifiedRequestManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavigationBar
        username={currentUser.username}
        profilePicture={currentUser.profilePicture || undefined}
      />

      <div className="flex flex-1 pt-16">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your platform content and users
              </p>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
