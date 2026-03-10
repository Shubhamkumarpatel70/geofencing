import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import {
  HiOutlineBell,
  HiOutlineLocationMarker,
  HiOutlineShieldCheck,
  HiOutlineMoon,
  HiOutlineDeviceMobile,
} from "react-icons/hi";
import toast from "react-hot-toast";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sos: true,
      geofence: true,
      battery: true,
      offline: false,
    },
    location: {
      updateInterval: 30,
      highAccuracy: true,
      backgroundTracking: true,
      shareWithParent: true,
    },
    privacy: {
      showOnlineStatus: true,
      allowLocationHistory: true,
    },
    appearance: {
      darkMode: false,
    },
  });

  useEffect(() => {
    // Load user settings if they exist
    if (user?.settings) {
      setSettings((prev) => ({ ...prev, ...user.settings }));
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersAPI.updateSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p className="text-muted">Customize your GuardianPath experience</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <HiOutlineBell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Notifications</h2>
            <p className="text-sm text-muted">
              Configure how you receive alerts
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">Email Notifications</p>
              <p className="text-sm text-muted">Receive alerts via email</p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.email}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "email",
                  !settings.notifications.email,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">Push Notifications</p>
              <p className="text-sm text-muted">
                Receive alerts on your device
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.push}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "push",
                  !settings.notifications.push,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">SOS Alerts</p>
              <p className="text-sm text-muted">
                Emergency alerts (recommended on)
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.sos}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "sos",
                  !settings.notifications.sos,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">Geofence Alerts</p>
              <p className="text-sm text-muted">
                Zone entry/exit notifications
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.geofence}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "geofence",
                  !settings.notifications.geofence,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">Low Battery Alerts</p>
              <p className="text-sm text-muted">
                When device battery is below 20%
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.battery}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "battery",
                  !settings.notifications.battery,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text">Offline Alerts</p>
              <p className="text-sm text-muted">When device goes offline</p>
            </div>
            <ToggleSwitch
              enabled={settings.notifications.offline}
              onToggle={() =>
                updateSetting(
                  "notifications",
                  "offline",
                  !settings.notifications.offline,
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Location Settings (Child only) */}
      {user?.role === "child" && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <HiOutlineLocationMarker className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-text">Location Settings</h2>
              <p className="text-sm text-muted">
                Control how your location is tracked
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-text">
                  Share Location with Parent
                </p>
                <p className="text-sm text-muted">
                  Allow your parent to see your location
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.location.shareWithParent}
                onToggle={() =>
                  updateSetting(
                    "location",
                    "shareWithParent",
                    !settings.location.shareWithParent,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-text">Background Tracking</p>
                <p className="text-sm text-muted">
                  Track location when app is closed
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.location.backgroundTracking}
                onToggle={() =>
                  updateSetting(
                    "location",
                    "backgroundTracking",
                    !settings.location.backgroundTracking,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-text">High Accuracy Mode</p>
                <p className="text-sm text-muted">
                  Use GPS for precise location (uses more battery)
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.location.highAccuracy}
                onToggle={() =>
                  updateSetting(
                    "location",
                    "highAccuracy",
                    !settings.location.highAccuracy,
                  )
                }
              />
            </div>
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-text">Update Interval</p>
                <span className="text-sm text-primary font-medium">
                  {settings.location.updateInterval}s
                </span>
              </div>
              <p className="text-sm text-muted mb-3">
                How often to send location updates
              </p>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={settings.location.updateInterval}
                onChange={(e) =>
                  updateSetting(
                    "location",
                    "updateInterval",
                    Number(e.target.value),
                  )
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>10s</span>
                <span>60s</span>
                <span>120s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
            <HiOutlineShieldCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Privacy</h2>
            <p className="text-sm text-muted">
              Manage your privacy preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-text">Show Online Status</p>
              <p className="text-sm text-muted">
                Let others see when you're active
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.privacy.showOnlineStatus}
              onToggle={() =>
                updateSetting(
                  "privacy",
                  "showOnlineStatus",
                  !settings.privacy.showOnlineStatus,
                )
              }
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text">Location History</p>
              <p className="text-sm text-muted">
                Store location history for review
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.privacy.allowLocationHistory}
              onToggle={() =>
                updateSetting(
                  "privacy",
                  "allowLocationHistory",
                  !settings.privacy.allowLocationHistory,
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
            <HiOutlineMoon className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Appearance</h2>
            <p className="text-sm text-muted">Customize the app appearance</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-text">Dark Mode</p>
            <p className="text-sm text-muted">Use dark theme (coming soon)</p>
          </div>
          <ToggleSwitch
            enabled={settings.appearance.darkMode}
            onToggle={() =>
              updateSetting(
                "appearance",
                "darkMode",
                !settings.appearance.darkMode,
              )
            }
          />
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <HiOutlineDeviceMobile className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Device Information</h2>
            <p className="text-sm text-muted">Your current device details</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-muted">Browser</p>
            <p className="font-medium text-text">
              {navigator.userAgent.split(" ").slice(-1)[0].split("/")[0] ||
                "Unknown"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-muted">Platform</p>
            <p className="font-medium text-text">
              {navigator.platform || "Unknown"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-muted">Language</p>
            <p className="font-medium text-text">
              {navigator.language || "Unknown"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-muted">Online Status</p>
            <p className="font-medium text-success">Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
