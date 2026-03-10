import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Link } from "react-router-dom";
import {
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineBell,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle,
  HiOutlineStatusOnline,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: HiOutlineUsers,
      color: "bg-primary",
      change: stats?.recentUsers || 0,
      changeLabel: "new this week",
    },
    {
      title: "Parents",
      value: stats?.totalParents || 0,
      icon: HiOutlineUserGroup,
      color: "bg-success",
    },
    {
      title: "Children",
      value: stats?.totalChildren || 0,
      icon: HiOutlineUserGroup,
      color: "bg-secondary",
    },
    {
      title: "Active Now",
      value: stats?.activeUsers || 0,
      icon: HiOutlineStatusOnline,
      color: "bg-warning",
    },
    {
      title: "Total Alerts",
      value: stats?.totalAlerts || 0,
      icon: HiOutlineBell,
      color: "bg-danger",
      change: stats?.recentAlerts || 0,
      changeLabel: "this week",
    },
    {
      title: "SOS Alerts",
      value: stats?.sosAlerts || 0,
      icon: HiOutlineExclamationCircle,
      color: "bg-red-600",
    },
    {
      title: "Geofences",
      value: stats?.totalGeofences || 0,
      icon: HiOutlineLocationMarker,
      color: "bg-indigo-600",
    },
  ];

  const alertTypeLabels = {
    sos: "SOS Alerts",
    geofence_entry: "Geofence Entry",
    geofence_exit: "Geofence Exit",
    battery_low: "Low Battery",
    offline: "Offline",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
          <p className="text-muted">System overview and statistics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-outline flex items-center gap-2"
        >
          <HiOutlineRefresh
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-card p-4 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-text">
              {stat.value}
            </p>
            <p className="text-sm text-muted">{stat.title}</p>
            {stat.change !== undefined && (
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <HiOutlineTrendingUp className="w-3 h-3" />+{stat.change}{" "}
                {stat.changeLabel}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts by Type */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Alerts by Type
          </h2>
          <div className="space-y-3">
            {stats?.alertsByType?.map((item, index) => {
              const total = stats.totalAlerts || 1;
              const percentage = Math.round((item.count / total) * 100);
              const colors = {
                sos: "bg-red-500",
                geofence_entry: "bg-green-500",
                geofence_exit: "bg-orange-500",
                battery_low: "bg-yellow-500",
                offline: "bg-gray-500",
              };
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted">
                      {alertTypeLabels[item._id] || item._id}
                    </span>
                    <span className="text-sm font-medium text-text">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[item._id] || "bg-primary"} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.alertsByType || stats.alertsByType.length === 0) && (
              <p className="text-center text-muted py-4">
                No alerts data available
              </p>
            )}
          </div>
        </div>

        {/* Daily Registrations */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Daily Registrations (Last 7 Days)
          </h2>
          <div className="space-y-2">
            {stats?.dailyRegistrations?.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-muted">
                  {format(new Date(item._id), "MMM dd, yyyy")}
                </span>
                <span className="text-sm font-medium text-text">
                  {item.count} {item.count === 1 ? "user" : "users"}
                </span>
              </div>
            ))}
            {(!stats?.dailyRegistrations ||
              stats.dailyRegistrations.length === 0) && (
              <p className="text-center text-muted py-4">
                No registration data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors text-center"
          >
            <HiOutlineUsers className="w-8 h-8 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-text">Manage Users</span>
          </Link>
          <Link
            to="/admin/alerts"
            className="p-4 bg-danger/5 rounded-xl hover:bg-danger/10 transition-colors text-center"
          >
            <HiOutlineBell className="w-8 h-8 text-danger mx-auto mb-2" />
            <span className="text-sm font-medium text-text">View Alerts</span>
          </Link>
          <Link
            to="/admin/activity"
            className="p-4 bg-warning/5 rounded-xl hover:bg-warning/10 transition-colors text-center"
          >
            <HiOutlineTrendingUp className="w-8 h-8 text-warning mx-auto mb-2" />
            <span className="text-sm font-medium text-text">Activity Log</span>
          </Link>
          <Link
            to="/admin/settings"
            className="p-4 bg-secondary/5 rounded-xl hover:bg-secondary/10 transition-colors text-center"
          >
            <HiOutlineLocationMarker className="w-8 h-8 text-secondary mx-auto mb-2" />
            <span className="text-sm font-medium text-text">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
