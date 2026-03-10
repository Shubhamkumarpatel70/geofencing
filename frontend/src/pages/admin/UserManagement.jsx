import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import {
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineUserAdd,
  HiOutlineFilter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter,
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await adminAPI.getUser(userId);
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (error) {
      toast.error("Failed to load user details");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createAdmin(newAdmin);
      toast.success("Admin user created successfully");
      setShowCreateAdmin(false);
      setNewAdmin({ name: "", email: "", password: "", phone: "" });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create admin");
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      parent: "bg-blue-100 text-blue-800",
      child: "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">User Management</h1>
          <p className="text-muted">Manage all users in the system</p>
        </div>
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <HiOutlineUserAdd className="w-5 h-5" />
          Create Admin
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-5 h-5 text-muted" />
            <div className="flex gap-1">
              {["all", "parent", "child", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleFilter(role)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === role
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-muted hover:bg-gray-200"
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text hidden md:table-cell">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-text">{user.name}</p>
                            <p className="text-sm text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.deviceInfo?.isOnline
                                ? "bg-success"
                                : "bg-gray-300"
                            }`}
                          />
                          <span className="text-sm text-muted">
                            {user.deviceInfo?.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-muted">
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewUser(user._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <HiOutlineEye className="w-5 h-5 text-muted" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(user._id, user.name)
                            }
                            className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                            title="Delete User"
                            disabled={user.role === "admin"}
                          >
                            <HiOutlineTrash
                              className={`w-5 h-5 ${user.role === "admin" ? "text-gray-300" : "text-danger"}`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-muted">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
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
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">User Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-primary font-semibold">
                    {selectedUser.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text">
                    {selectedUser.user?.name}
                  </h3>
                  <p className="text-muted">{selectedUser.user?.email}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.user?.role)}`}
                  >
                    {selectedUser.user?.role}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-muted mb-1">Phone</p>
                  <p className="font-medium text-text">
                    {selectedUser.user?.phone || "Not provided"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-muted mb-1">Status</p>
                  <p className="font-medium text-text">
                    {selectedUser.user?.deviceInfo?.isOnline
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-muted mb-1">Joined</p>
                  <p className="font-medium text-text">
                    {format(
                      new Date(selectedUser.user?.createdAt),
                      "MMM dd, yyyy",
                    )}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-muted mb-1">Last Seen</p>
                  <p className="font-medium text-text">
                    {selectedUser.user?.deviceInfo?.lastSeen
                      ? formatDistanceToNow(
                          new Date(selectedUser.user.deviceInfo.lastSeen),
                          { addSuffix: true },
                        )
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Related Users */}
              {selectedUser.user?.role === "parent" &&
                selectedUser.user?.children?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-text mb-3">Children</h4>
                    <div className="space-y-2">
                      {selectedUser.user.children.map((child) => (
                        <div
                          key={child._id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                            <span className="text-success font-medium">
                              {child.name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-text">
                              {child.name}
                            </p>
                            <p className="text-sm text-muted">{child.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedUser.user?.role === "child" &&
                selectedUser.user?.parent && (
                  <div>
                    <h4 className="font-semibold text-text mb-3">Parent</h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {selectedUser.user.parent.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text">
                          {selectedUser.user.parent.name}
                        </p>
                        <p className="text-sm text-muted">
                          {selectedUser.user.parent.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Recent Activity */}
              {selectedUser.activity?.recentAlerts?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-text mb-3">
                    Recent Alerts
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedUser.activity.recentAlerts.map((alert) => (
                      <div
                        key={alert._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-medium text-text">
                            {alert.title}
                          </p>
                          <p className="text-xs text-muted">{alert.type}</p>
                        </div>
                        <span className="text-xs text-muted">
                          {formatDistanceToNow(new Date(alert.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Create Admin User</h2>
              <button
                onClick={() => setShowCreateAdmin(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newAdmin.phone}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <HiOutlineCheck className="w-5 h-5 mr-2" />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
