import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { alertsAPI } from "../services/api";
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShieldCheck,
} from "react-icons/hi";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (user?.role === "parent") {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await alertsAPI.getUnreadCount();
      setUnreadAlerts(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const parentNavItems = [
    { to: "/parent", icon: HiOutlineHome, label: "Dashboard", end: true },
    { to: "/parent/tracking", icon: HiOutlineMap, label: "Live Tracking" },
    { to: "/parent/history", icon: HiOutlineClock, label: "Location History" },
    {
      to: "/parent/geofences",
      icon: HiOutlineLocationMarker,
      label: "Geofences",
    },
    {
      to: "/parent/alerts",
      icon: HiOutlineBell,
      label: "Alerts",
      badge: unreadAlerts,
    },
    { to: "/parent/children", icon: HiOutlineUsers, label: "Children" },
  ];

  const childNavItems = [
    { to: "/child", icon: HiOutlineHome, label: "Dashboard", end: true },
  ];

  const navItems = user?.role === "parent" ? parentNavItems : childNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-text">GuardianPath</h1>
              <p className="text-xs text-muted capitalize">
                {user?.role} Account
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                sidebar-link relative
                ${isActive ? "active" : ""}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-4 bg-danger text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <NavLink
            to={`/${user?.role}/profile`}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <HiOutlineUser className="w-5 h-5" />
            <span>Profile</span>
          </NavLink>
          <NavLink
            to={`/${user?.role}/settings`}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <HiOutlineCog className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          {/* Only show logout for parent accounts */}
          {user?.role === "parent" && (
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-danger hover:bg-danger/10 hover:text-danger"
            >
              <HiOutlineLogout className="w-5 h-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineMenu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block">
                <p className="text-sm text-muted">Welcome back,</p>
                <p className="font-semibold text-text">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "status-online" : "status-offline"}`}
                />
                <span className="text-sm text-muted hidden sm:inline">
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>

              {/* User avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
