import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineCamera,
  HiOutlineCheck,
} from "react-icons/hi";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await usersAPI.updateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setUser(response.data.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await usersAPI.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="text-muted">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary h-24" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                <HiOutlineCamera className="w-4 h-4 text-muted" />
              </button>
            </div>
            <div className="pt-2">
              <h2 className="text-xl font-bold text-text">{user?.name}</h2>
              <p className="text-muted capitalize">{user?.role} Account</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Account Type
                </label>
                <div className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                  <span className="capitalize font-medium text-text">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-6 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-text">Password</h3>
            <p className="text-sm text-muted">Update your account password</p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn btn-outline"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4 pt-4 border-t border-gray-100"
          >
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Current Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  New Password
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswords({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Link Code (for children) */}
      {user?.role === "child" && user?.linkCode && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-text mb-2">Your Link Code</h3>
          <p className="text-sm text-muted mb-4">
            Share this code with your parent to connect your accounts.
          </p>
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-primary/5 rounded-xl border-2 border-dashed border-primary text-2xl font-mono font-bold tracking-widest text-primary">
              {user.linkCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.linkCode);
                toast.success("Code copied!");
              }}
              className="btn btn-outline"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-card p-6 border border-danger/20">
        <h3 className="font-semibold text-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-muted mb-4">
          Permanently delete your account and all associated data.
        </p>
        <button className="btn bg-danger/10 text-danger hover:bg-danger/20">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Profile;
