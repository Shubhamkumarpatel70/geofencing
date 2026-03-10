import { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { childrenAPI, geofencesAPI } from "../../services/api";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineLocationMarker,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineBan,
  HiOutlineSearch,
  HiOutlineMap,
} from "react-icons/hi";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Map click handler
const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => onClick(e.latlng),
  });
  return null;
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
};

// Location Search Component
const LocationSearch = ({ onLocationSelect, onSearchResult }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const map = useMap();

  // Debounced search function
  const searchLocation = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search location");
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [],
  );

  useEffect(() => {
    searchLocation(searchQuery);
  }, [searchQuery, searchLocation]);

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    map.flyTo([lat, lng], 16, { duration: 1.5 });

    if (onLocationSelect) {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: result.display_name,
      });
    }

    setShowResults(false);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 16, { duration: 1.5 });
          if (onLocationSelect) {
            onLocationSelect({ latitude, longitude, address: "" });
          }
          toast.success("Moved to your current location");
        },
        (error) => {
          toast.error("Unable to get your location");
        },
      );
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search location (e.g., school, address)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleCurrentLocation}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
            title="Use current location"
          >
            <HiOutlineMap className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <HiOutlineLocationMarker className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-text truncate">
                      {result.display_name.split(",")[0]}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {result.display_name.split(",").slice(1, 4).join(",")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const geofenceTypes = [
  { value: "home", label: "Home", icon: HiOutlineHome, color: "#16A34A" },
  {
    value: "school",
    label: "School",
    icon: HiOutlineAcademicCap,
    color: "#2563EB",
  },
  {
    value: "tuition",
    label: "Tuition",
    icon: HiOutlineBookOpen,
    color: "#F59E0B",
  },
  {
    value: "restricted",
    label: "Restricted",
    icon: HiOutlineBan,
    color: "#DC2626",
  },
  {
    value: "custom",
    label: "Custom",
    icon: HiOutlineLocationMarker,
    color: "#06B6D4",
  },
];

const GeofenceManagement = () => {
  const [geofences, setGeofences] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

  const [formData, setFormData] = useState({
    name: "",
    type: "custom",
    center: { latitude: 20.5937, longitude: 78.9629 },
    radius: 200,
    address: "",
    color: "#2563EB",
    children: [],
    notifyOnEntry: true,
    notifyOnExit: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [geofencesRes, childrenRes] = await Promise.all([
        geofencesAPI.getAll(),
        childrenAPI.getAll(),
      ]);
      setGeofences(geofencesRes.data.geofences);
      setChildren(childrenRes.data.children);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (showModal && latlng) {
      const lat = parseFloat(latlng.lat);
      const lng = parseFloat(latlng.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        setFormData({
          ...formData,
          center: { latitude: lat, longitude: lng },
        });
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      type: "custom",
      center: { latitude: mapCenter[0], longitude: mapCenter[1] },
      radius: 200,
      address: "",
      color: "#2563EB",
      children: children.map((c) => c._id),
      notifyOnEntry: true,
      notifyOnExit: true,
    });
    setIsEditing(false);
    setSelectedGeofence(null);
    setShowModal(true);
  };

  const openEditModal = (geofence) => {
    // Ensure center coordinates are valid numbers
    const lat = parseFloat(geofence.center?.latitude) || 20.5937;
    const lng = parseFloat(geofence.center?.longitude) || 78.9629;

    setFormData({
      name: geofence.name,
      type: geofence.type,
      center: { latitude: lat, longitude: lng },
      radius: geofence.radius,
      address: geofence.address || "",
      color: geofence.color || "#2563EB",
      children: geofence.children.map((c) => c._id || c),
      notifyOnEntry: geofence.notifyOnEntry,
      notifyOnExit: geofence.notifyOnExit,
    });
    setSelectedGeofence(geofence);
    setIsEditing(true);
    setShowModal(true);
    setMapCenter([lat, lng]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await geofencesAPI.update(selectedGeofence._id, formData);
        toast.success("Geofence updated successfully");
      } else {
        await geofencesAPI.create(formData);
        toast.success("Geofence created successfully");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save geofence");
    }
  };

  const handleDelete = async (geofence) => {
    if (!confirm(`Are you sure you want to delete "${geofence.name}"?`)) return;

    try {
      await geofencesAPI.delete(geofence._id);
      toast.success("Geofence deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete geofence");
    }
  };

  const handleToggle = async (geofence) => {
    try {
      await geofencesAPI.toggle(geofence._id);
      fetchData();
    } catch (error) {
      toast.error("Failed to toggle geofence");
    }
  };

  const getTypeIcon = (type) => {
    const typeInfo = geofenceTypes.find((t) => t.value === type);
    return typeInfo?.icon || HiOutlineLocationMarker;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Geofence Management</h1>
          <p className="text-muted">Create safe zones and restricted areas</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Create Geofence
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Geofence List */}
        <div className="lg:col-span-1 space-y-3">
          {geofences.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card p-8 text-center">
              <HiOutlineLocationMarker className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted mb-4">No geofences created yet</p>
              <button onClick={openCreateModal} className="btn btn-primary">
                Create First Geofence
              </button>
            </div>
          ) : (
            geofences.map((geofence) => {
              const TypeIcon = getTypeIcon(geofence.type);
              return (
                <div
                  key={geofence._id}
                  className="bg-white rounded-xl shadow-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${geofence.color}20` }}
                    >
                      <TypeIcon
                        className="w-5 h-5"
                        style={{ color: geofence.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text truncate">
                          {geofence.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${geofence.isActive ? "bg-success" : "bg-gray-300"}`}
                        />
                      </div>
                      <p className="text-sm text-muted capitalize">
                        {geofence.type} • {geofence.radius}m
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {geofence.children?.length || 0} children assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggle(geofence)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        geofence.isActive
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-gray-100 text-muted hover:bg-gray-200"
                      }`}
                    >
                      {geofence.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => openEditModal(geofence)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <HiOutlinePencil className="w-5 h-5 text-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(geofence)}
                      className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                    >
                      <HiOutlineTrash className="w-5 h-5 text-danger" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map */}
        <div
          className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden relative"
          style={{ height: "600px" }}
        >
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController center={mapCenter} />
            <MapClickHandler onClick={handleMapClick} />

            {/* Location Search */}
            <LocationSearch
              onLocationSelect={(location) => {
                const lat = parseFloat(location.latitude);
                const lng = parseFloat(location.longitude);

                if (isNaN(lat) || isNaN(lng)) {
                  toast.error("Invalid location coordinates");
                  return;
                }

                if (showModal) {
                  setFormData({
                    ...formData,
                    center: {
                      latitude: lat,
                      longitude: lng,
                    },
                    address: location.address || formData.address,
                  });
                }
                setMapCenter([lat, lng]);
              }}
            />

            {/* Existing geofences */}
            {geofences
              .filter(
                (geofence) =>
                  geofence.center &&
                  !isNaN(geofence.center.latitude) &&
                  !isNaN(geofence.center.longitude),
              )
              .map((geofence) => (
                <Circle
                  key={geofence._id}
                  center={[geofence.center.latitude, geofence.center.longitude]}
                  radius={geofence.radius}
                  pathOptions={{
                    color: geofence.isActive ? geofence.color : "#94A3B8",
                    fillColor: geofence.isActive ? geofence.color : "#94A3B8",
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
              ))}

            {/* New/editing geofence preview */}
            {showModal &&
              formData.center &&
              !isNaN(formData.center.latitude) &&
              !isNaN(formData.center.longitude) && (
                <>
                  <Circle
                    center={[
                      formData.center.latitude,
                      formData.center.longitude,
                    ]}
                    radius={formData.radius}
                    pathOptions={{
                      color: formData.color,
                      fillColor: formData.color,
                      fillOpacity: 0.2,
                      weight: 3,
                      dashArray: "5, 10",
                    }}
                  />
                  <Marker
                    position={[
                      formData.center.latitude,
                      formData.center.longitude,
                    ]}
                  />
                </>
              )}
          </MapContainer>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-text">
                {isEditing ? "Edit Geofence" : "Create Geofence"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Home, School"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {geofenceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: type.value,
                          color: type.color,
                        })
                      }
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.type === type.value
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <type.icon
                        className="w-5 h-5 mx-auto mb-1"
                        style={{ color: type.color }}
                      />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Radius: {formData.radius}m
                </label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={formData.radius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      radius: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>50m</span>
                  <span>2000m</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Location
                </label>
                <p className="text-sm text-muted mb-2">
                  Click on the map to set location
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={formData.center.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        center: {
                          ...formData.center,
                          latitude: parseFloat(e.target.value),
                        },
                      })
                    }
                    placeholder="Latitude"
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    step="any"
                    value={formData.center.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        center: {
                          ...formData.center,
                          longitude: parseFloat(e.target.value),
                        },
                      })
                    }
                    placeholder="Longitude"
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Children */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Assign Children
                </label>
                <div className="space-y-2">
                  {children.map((child) => (
                    <label
                      key={child._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.children.includes(child._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              children: [...formData.children, child._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              children: formData.children.filter(
                                (id) => id !== child._id,
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-text">
                        {child.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Notifications
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnEntry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyOnEntry: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted">
                      Notify when entering
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnExit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyOnExit: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted">
                      Notify when leaving
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <HiOutlineCheck className="w-5 h-5 mr-2" />
                  {isEditing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceManagement;
