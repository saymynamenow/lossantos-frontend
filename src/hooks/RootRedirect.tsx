import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

export default function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-red-600 rounded-full animate-bounce"></div>
            <div
              className="w-4 h-4 bg-red-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-4 h-4 bg-red-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-gray-500 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/timeline" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
