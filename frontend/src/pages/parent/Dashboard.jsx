import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { childrenAPI, alertsAPI, geofencesAPI } from "../../services/api";
import {
  HiOutlineLocationMarker,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineStatusOnline,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";

const ParentDashboard = () => {
  const { user } = useAuth();
  const { childrenLocations, isConnected } = useSocket();
  const [children, setChildren] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChildren: 0,
    onlineChildren: 0,
    activeGeofences: 0,
    unreadAlerts: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [childrenRes, alertsRes, geofencesRes] = await Promise.all([
        childrenAPI.getAll(),
        alertsAPI.getAll({ limit: 5 }),
        geofencesAPI.getAll(),
      ]);

      const childrenData = childrenRes.data.children;
      setChildren(childrenData);
      setAlerts(alertsRes.data.alerts);
      setGeofences(geofencesRes.data.geofences);

      setStats({
        totalChildren: childrenData.length,
        onlineChildren: childrenData.filter((c) => c.deviceInfo?.isOnline)
          .length,
        activeGeofences: geofencesRes.data.geofences.filter((g) => g.isActive)
          .length,
        unreadAlerts: alertsRes.data.unreadCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChildLocation = (childId) => {
    return childrenLocations[childId] || null;
  };

  const getBatteryColor = (level) => {
    if (level <= 20) return "text-danger";
    if (level <= 50) return "text-warning";
    return "text-success";
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? "bg-success" : "bg-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-white/80 text-sm sm:text-base">
          Here's an overview of your family's safety status.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <HiOutlineUsers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-text">
            {stats.totalChildren}
          </p>
          <p className="text-xs sm:text-sm text-muted">Total Children</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <HiOutlineStatusOnline className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-text">
            {stats.onlineChildren}
          </p>
          <p className="text-xs sm:text-sm text-muted">Online Now</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <HiOutlineLocationMarker className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-text">
            {stats.activeGeofences}
          </p>
          <p className="text-xs sm:text-sm text-muted">Active Geofences</p>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 ${stats.unreadAlerts > 0 ? "bg-danger/10" : "bg-gray-100"} rounded-lg sm:rounded-xl flex items-center justify-center`}
            >
              <HiOutlineBell
                className={`w-4 h-4 sm:w-5 sm:h-5 ${stats.unreadAlerts > 0 ? "text-danger" : "text-muted"}`}
              />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-text">
            {stats.unreadAlerts}
          </p>
          <p className="text-xs sm:text-sm text-muted">Unread Alerts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Children Status */}
        <div className="bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-text">Children Status</h2>
            <Link
              to="/parent/children"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {children.length === 0 ? (
              <div className="text-center py-8">
                <HiOutlineUsers className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No children linked yet</p>
                <Link to="/parent/children" className="btn btn-primary mt-3">
                  Add Child
                </Link>
              </div>
            ) : (
              children.map((child) => (
                <div
                  key={child._id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold">
                      {child.name?.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(child.deviceInfo?.isOnline)}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">
                      {child.name}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {child.currentLocation?.address || "Location unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${getBatteryColor(child.deviceInfo?.batteryLevel)}`}
                    >
                      {child.deviceInfo?.batteryLevel}%
                    </div>
                    <p className="text-xs text-muted">
                      {child.deviceInfo?.isOnline
                        ? "Online"
                        : child.deviceInfo?.lastSeen
                          ? formatDistanceToNow(
                              new Date(child.deviceInfo.lastSeen),
                              { addSuffix: true },
                            )
                          : "Offline"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-text">Recent Alerts</h2>
            <Link
              to="/parent/alerts"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <HiOutlineShieldCheck className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-muted">No alerts - Everything is safe!</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert._id}
                  className={`flex items-start gap-3 p-3 rounded-xl ${alert.isRead ? "bg-gray-50" : "bg-danger/5 border border-danger/20"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      alert.type === "sos"
                        ? "bg-danger/20 text-danger"
                        : alert.type === "battery_low"
                          ? "bg-warning/20 text-warning"
                          : alert.type === "offline"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-primary/20 text-primary"
                    }`}
                  >
                    {alert.type === "sos" ? (
                      <HiOutlineExclamationCircle className="w-5 h-5" />
                    ) : alert.type === "battery_low" ? (
                      "🔋"
                    ) : (
                      <HiOutlineLocationMarker className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text text-sm">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
        <h2 className="font-semibold text-text mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Link
            to="/parent/tracking"
            className="p-3 sm:p-4 bg-primary/5 rounded-xl text-center hover:bg-primary/10 transition-colors"
          >
            <HiOutlineLocationMarker className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-1 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-text">
              Live Tracking
            </p>
          </Link>
          <Link
            to="/parent/geofences"
            className="p-3 sm:p-4 bg-secondary/5 rounded-xl text-center hover:bg-secondary/10 transition-colors"
          >
            <HiOutlineShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mx-auto mb-1 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-text">
              Geofences
            </p>
          </Link>
          <Link
            to="/parent/history"
            className="p-3 sm:p-4 bg-warning/5 rounded-xl text-center hover:bg-warning/10 transition-colors"
          >
            <HiOutlineClock className="w-6 h-6 sm:w-8 sm:h-8 text-warning mx-auto mb-1 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-text">History</p>
          </Link>
          <Link
            to="/parent/children"
            className="p-3 sm:p-4 bg-success/5 rounded-xl text-center hover:bg-success/10 transition-colors"
          >
            <HiOutlineUsers className="w-6 h-6 sm:w-8 sm:h-8 text-success mx-auto mb-1 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-text">Children</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
