import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Parent pages
import ParentDashboard from "./pages/parent/Dashboard";
import LiveTracking from "./pages/parent/LiveTracking";
import LocationHistory from "./pages/parent/LocationHistory";
import GeofenceManagement from "./pages/parent/GeofenceManagement";
import Alerts from "./pages/parent/Alerts";
import Children from "./pages/parent/Children";

// Child pages
import ChildDashboard from "./pages/child/Dashboard";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import AlertsManagement from "./pages/admin/AlertsManagement";

// Shared pages
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === "admin"
        ? "/admin"
        : user.role === "parent"
          ? "/parent"
          : "/child";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Helper function to get redirect path based on role
const getRedirectPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    case "child":
      return "/child";
    default:
      return "/";
  }
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading GuardianPath...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getRedirectPath(user.role)} replace />
          ) : (
            <Landing />
          )
        }
      />

      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getRedirectPath(user.role)} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to={getRedirectPath(user.role)} replace />
            ) : (
              <Signup />
            )
          }
        />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="alerts" element={<AlertsManagement />} />
        <Route path="activity" element={<AlertsManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Parent routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="tracking" element={<LiveTracking />} />
        <Route path="history" element={<LocationHistory />} />
        <Route path="geofences" element={<GeofenceManagement />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="children" element={<Children />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Child routes */}
      <Route
        path="/child"
        element={
          <ProtectedRoute allowedRoles={["child"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ChildDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
