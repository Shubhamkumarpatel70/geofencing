import { useState, useEffect } from "react";
import { childrenAPI } from "../../services/api";
import {
  HiOutlinePlus,
  HiOutlineLink,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
} from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const Children = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("link"); // 'link' or 'create'
  const [linkCode, setLinkCode] = useState("");
  const [newChild, setNewChild] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await childrenAPI.getAll();
      setChildren(response.data.children);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      toast.error("Please enter a link code");
      return;
    }

    setSubmitting(true);
    try {
      await childrenAPI.linkChild(linkCode.trim());
      toast.success("Child account linked successfully!");
      setShowModal(false);
      setLinkCode("");
      fetchChildren();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to link child");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    if (!newChild.name || !newChild.email || !newChild.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newChild.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await childrenAPI.createChild(newChild);
      toast.success(
        `Child account created! Link code: ${response.data.child.linkCode}`,
      );
      setShowModal(false);
      setNewChild({ name: "", email: "", password: "" });
      fetchChildren();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create child account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkChild = async (child) => {
    if (!confirm(`Are you sure you want to unlink ${child.name}?`)) return;

    try {
      await childrenAPI.unlinkChild(child._id);
      toast.success("Child account unlinked");
      fetchChildren();
    } catch (error) {
      toast.error("Failed to unlink child");
    }
  };

  const getBatteryColor = (level) => {
    if (!level) return "text-muted";
    if (level <= 20) return "text-danger";
    if (level <= 50) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Children</h1>
          <p className="text-muted">Manage your children's accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Add Child
        </button>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <HiOutlineUsers className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Children Linked
          </h3>
          <p className="text-muted mb-6">
            Add your children's accounts to start tracking their safety.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            Add Your First Child
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div
              key={child._id}
              className="bg-white rounded-xl shadow-card overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {child.name?.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white ${
                        child.deviceInfo?.isOnline
                          ? "bg-success"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-text">
                      {child.name}
                    </h3>
                    <p className="text-sm text-muted">{child.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Status</span>
                    <span
                      className={
                        child.deviceInfo?.isOnline
                          ? "text-success font-medium"
                          : "text-muted"
                      }
                    >
                      {child.deviceInfo?.isOnline ? "🟢 Online" : "⚫ Offline"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Battery</span>
                    <span
                      className={`font-medium ${getBatteryColor(child.deviceInfo?.batteryLevel)}`}
                    >
                      🔋 {child.deviceInfo?.batteryLevel || "--"}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Last Seen</span>
                    <span className="text-text">
                      {child.deviceInfo?.lastSeen
                        ? formatDistanceToNow(
                            new Date(child.deviceInfo.lastSeen),
                            { addSuffix: true },
                          )
                        : "Never"}
                    </span>
                  </div>
                  {child.currentLocation?.address && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-muted">Last Location</p>
                      <p className="text-sm text-text truncate">
                        {child.currentLocation.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-muted">
                  Device: {child.deviceInfo?.deviceType || "Unknown"}
                </span>
                <button
                  onClick={() => handleUnlinkChild(child)}
                  className="text-danger hover:text-danger-700 text-sm font-medium"
                >
                  Unlink
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Add Child</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setLinkCode("");
                  setNewChild({ name: "", email: "", password: "" });
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setModalMode("link")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  modalMode === "link"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-text"
                }`}
              >
                <HiOutlineLink className="w-5 h-5 inline mr-2" />
                Link Existing
              </button>
              <button
                onClick={() => setModalMode("create")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  modalMode === "create"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-text"
                }`}
              >
                <HiOutlinePlus className="w-5 h-5 inline mr-2" />
                Create New
              </button>
            </div>

            <div className="p-6">
              {modalMode === "link" ? (
                <form onSubmit={handleLinkChild} className="space-y-4">
                  <p className="text-sm text-muted">
                    Enter the link code from your child's device to connect
                    their account.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Link Code
                    </label>
                    <input
                      type="text"
                      value={linkCode}
                      onChange={(e) =>
                        setLinkCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 6-character code"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-mono uppercase focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || linkCode.length < 6}
                    className="w-full btn btn-primary py-3 disabled:opacity-50"
                  >
                    {submitting ? "Linking..." : "Link Account"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateChild} className="space-y-4">
                  <p className="text-sm text-muted">
                    Create a new account for your child. They can use these
                    credentials to log in.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Child's Name
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type="text"
                        value={newChild.name}
                        onChange={(e) =>
                          setNewChild({ ...newChild, name: e.target.value })
                        }
                        placeholder="Enter name"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type="email"
                        value={newChild.email}
                        onChange={(e) =>
                          setNewChild({ ...newChild, email: e.target.value })
                        }
                        placeholder="Enter email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        type="password"
                        value={newChild.password}
                        onChange={(e) =>
                          setNewChild({ ...newChild, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn btn-primary py-3 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Children;
