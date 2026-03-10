import { useState, useEffect } from "react";
import { alertsAPI } from "../../services/api";
import {
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineLocationMarker,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlineCheckCircle,
  HiOutlinePhotograph,
  HiOutlineX,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// In production (same origin), use empty string. In dev, use localhost:5000
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:5000");

const alertTypeConfig = {
  sos: {
    label: "SOS Emergency",
    color: "danger",
    icon: HiOutlineExclamationCircle,
    bgColor: "bg-danger/10",
    textColor: "text-danger",
  },
  geofence_entry: {
    label: "Zone Entry",
    color: "primary",
    icon: HiOutlineLocationMarker,
    bgColor: "bg-primary/10",
    textColor: "text-primary",
  },
  geofence_exit: {
    label: "Zone Exit",
    color: "warning",
    icon: HiOutlineLocationMarker,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  battery_low: {
    label: "Low Battery",
    color: "warning",
    icon: () => <span>🔋</span>,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  offline: {
    label: "Device Offline",
    color: "gray",
    icon: () => <span>📴</span>,
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  online: {
    label: "Device Online",
    color: "success",
    icon: () => <span>📱</span>,
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, [filter, page]);

  const fetchAlerts = async () => {
    try {
      const params = { limit: 20, page };
      if (filter !== "all") {
        if (filter === "unread") {
          params.isRead = false;
        } else {
          params.type = filter;
        }
      }

      const response = await alertsAPI.getAll(params);
      setAlerts(response.data.alerts);
      setUnreadCount(response.data.unreadCount);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts(
        alerts.map((a) => (a._id === alertId ? { ...a, isRead: true } : a)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsAPI.acknowledge(alertId);
      setAlerts(
        alerts.map((a) =>
          a._id === alertId ? { ...a, isRead: true, isAcknowledged: true } : a,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertsAPI.markAllAsRead();
      setAlerts(alerts.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
      toast.success("All alerts marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await alertsAPI.delete(alertId);
      setAlerts(alerts.filter((a) => a._id !== alertId));
      toast.success("Alert deleted");
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all alerts?")) return;

    try {
      await alertsAPI.deleteAll();
      setAlerts([]);
      setUnreadCount(0);
      toast.success("All alerts deleted");
    } catch (error) {
      toast.error("Failed to delete alerts");
    }
  };

  const getAlertConfig = (type) => {
    return alertTypeConfig[type] || alertTypeConfig.offline;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Alerts</h1>
          <p className="text-sm sm:text-base text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread alerts`
              : "No unread alerts"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-outline text-sm"
            >
              <HiOutlineCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}
          {alerts.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="btn bg-danger/10 text-danger hover:bg-danger/20 text-sm"
            >
              <HiOutlineTrash className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-3 sm:p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <HiOutlineFilter className="w-5 h-5 text-muted flex-shrink-0" />
          {[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "sos", label: "SOS" },
            { value: "geofence_entry", label: "Zone Entry" },
            { value: "geofence_exit", label: "Zone Exit" },
            { value: "battery_low", label: "Battery" },
            { value: "offline", label: "Offline" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineBell className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No Alerts</h3>
            <p className="text-muted">
              {filter === "all"
                ? "You're all caught up! No alerts at the moment."
                : "No alerts match your filter criteria."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => {
              const config = getAlertConfig(alert.type);
              const AlertIcon = config.icon;

              return (
                <div
                  key={alert._id}
                  className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${
                    !alert.isRead ? "bg-primary/5" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                  >
                    <AlertIcon className={`w-6 h-6 ${config.textColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text">
                            {alert.title}
                          </h3>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted mt-1">
                          {alert.message}
                        </p>

                        {alert.child && (
                          <p className="text-sm text-muted mt-2">
                            <span className="font-medium text-text">
                              {alert.child.name}
                            </span>
                            {alert.geofence && ` • ${alert.geofence.name}`}
                          </p>
                        )}

                        {alert.location?.address && (
                          <p className="text-xs text-muted mt-1 flex items-center gap-1">
                            <HiOutlineLocationMarker className="w-3 h-3" />
                            {alert.location.address}
                          </p>
                        )}

                        {/* SOS Camera Images */}
                        {alert.type === "sos" &&
                          alert.images &&
                          (alert.images.frontCamera ||
                            alert.images.backCamera) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {alert.images.frontCamera?.path && (
                                <button
                                  onClick={() =>
                                    setSelectedImage(
                                      `${API_URL}${alert.images.frontCamera.path}`,
                                    )
                                  }
                                  className="relative group"
                                >
                                  <img
                                    src={`${API_URL}${alert.images.frontCamera.path}`}
                                    alt="Front camera"
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-primary transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <HiOutlinePhotograph className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                                    Front
                                  </span>
                                </button>
                              )}
                              {alert.images.backCamera?.path && (
                                <button
                                  onClick={() =>
                                    setSelectedImage(
                                      `${API_URL}${alert.images.backCamera.path}`,
                                    )
                                  }
                                  className="relative group"
                                >
                                  <img
                                    src={`${API_URL}${alert.images.backCamera.path}`}
                                    alt="Back camera"
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-primary transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <HiOutlinePhotograph className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                                    Back
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alert.type === "sos" && !alert.isAcknowledged && (
                          <button
                            onClick={() => handleAcknowledge(alert._id)}
                            className="btn btn-danger text-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!alert.isRead && alert.type !== "sos" && (
                          <button
                            onClick={() => handleMarkAsRead(alert._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Mark as read"
                          >
                            <HiOutlineCheck className="w-5 h-5 text-muted" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(alert._id)}
                          className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-5 h-5 text-danger" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                      <span>
                        {format(new Date(alert.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {alert.isAcknowledged && (
                        <span className="text-success">✓ Acknowledged</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <HiOutlineX className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="SOS captured image"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Alerts;
