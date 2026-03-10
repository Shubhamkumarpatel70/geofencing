import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import {
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineLocationMarker,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFilter,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchAlerts();
  }, [pagination.page, typeFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAlerts({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter,
      });
      setAlerts(response.data.alerts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const alertTypes = [
    { value: "", label: "All Types" },
    { value: "sos", label: "SOS" },
    { value: "geofence_entry", label: "Geofence Entry" },
    { value: "geofence_exit", label: "Geofence Exit" },
    { value: "battery_low", label: "Low Battery" },
    { value: "offline", label: "Offline" },
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case "sos":
        return <HiOutlineExclamationCircle className="w-5 h-5 text-red-600" />;
      case "geofence_entry":
      case "geofence_exit":
        return <HiOutlineLocationMarker className="w-5 h-5 text-blue-600" />;
      default:
        return <HiOutlineBell className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Alerts Management</h1>
          <p className="text-muted">View all system alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <HiOutlineFilter className="w-5 h-5 text-muted" />
          <div className="flex gap-2 flex-wrap">
            {alertTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setTypeFilter(type.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <HiOutlineBell className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No alerts found</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-text">
                              {alert.title}
                            </p>
                            <p className="text-sm text-muted mt-1">
                              {alert.message}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityBadge(alert.priority)}`}
                          >
                            {alert.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted">
                          <span>
                            Child:{" "}
                            <span className="font-medium text-text">
                              {alert.child?.name || "Unknown"}
                            </span>
                          </span>
                          <span>
                            Parent:{" "}
                            <span className="font-medium text-text">
                              {alert.parent?.name || "Unknown"}
                            </span>
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {alert.location?.latitude &&
                          alert.location?.longitude && (
                            <p className="text-xs text-muted mt-2">
                              📍 {alert.location.latitude.toFixed(6)},{" "}
                              {alert.location.longitude.toFixed(6)}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-muted">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} alerts
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiOutlineChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiOutlineChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsManagement;
