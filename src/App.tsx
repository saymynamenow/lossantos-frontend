// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Timeline from "./pages/timeline_fixed";
import { ToastContainer } from "react-toastify";
import Register from "./pages/register";
import ProtectedRoute from "./hooks/authenticated";
import PostDetail from "./pages/postDetail";
import ProfilePage from "./pages/profilePage";
import RootRedirect from "./hooks/RootRedirect";
import AdminPage from "./pages/adminPage";
import PageTimeline from "./pages/pageTimeline";
import PageBrowser from "./pages/pageBrowserNew";
import PageCreate from "./pages/pageCreate";
import PageDashboard from "./pages/pageDashboard";
import PeoplePage from "./pages/peoplePage";
import PendingRequestsPage from "./pages/pendingRequestsPage";
import SettingsPage from "./pages/settingsPage";
import AboutUs from "./pages/aboutUs";
import ComingSoon from "./pages/comingSoon";
import BoostedPosts from "./pages/boostedPosts";
import Rules from "./pages/rules";

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/pages" element={<PageBrowser />} />
          <Route path="/page/create" element={<PageCreate />} />
          <Route path="/page/:pageId" element={<PageTimeline />} />
          <Route path="/page/:pageId/dashboard" element={<PageDashboard />} />
          <Route
            path="/page/:pageId/pending-requests"
            element={<PendingRequestsPage />}
          />
          <Route
            path="/my-pending-requests"
            element={<PendingRequestsPage />}
          />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/comingsoon" element={<ComingSoon />} />
          <Route path="/boosted-posts" element={<BoostedPosts />} />
          <Route path="/rules" element={<Rules />} />
        </Route>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}
