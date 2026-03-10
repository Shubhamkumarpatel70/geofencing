import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useSocket } from "../../context/SocketContext";
import { childrenAPI, locationsAPI, geofencesAPI } from "../../services/api";
import {
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const createChildIcon = (isOnline) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${isOnline ? "linear-gradient(135deg, #2563EB, #06B6D4)" : "#94A3B8"};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Map controller component
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
};

const LiveTracking = () => {
  const { childrenLocations, requestChildLocation, isConnected } = useSocket();
  const [children, setChildren] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [childrenRes, geofencesRes] = await Promise.all([
        locationsAPI.getAllChildrenLocations(),
        geofencesAPI.getAll(),
      ]);
      setChildren(childrenRes.data.children);
      setGeofences(geofencesRes.data.geofences);

      // Center map on first child with location
      const firstChild = childrenRes.data.children.find(
        (c) => c.currentLocation?.latitude,
      );
      if (firstChild?.currentLocation) {
        setMapCenter([
          firstChild.currentLocation.latitude,
          firstChild.currentLocation.longitude,
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    children.forEach((child) => {
      requestChildLocation(child._id);
    });
  };

  const focusOnChild = (child) => {
    const location = childrenLocations[child._id] || child.currentLocation;
    if (location?.latitude) {
      setMapCenter([location.latitude, location.longitude]);
      setMapZoom(16);
      setSelectedChild(child._id);
    }
  };

  const getChildLocation = (child) => {
    return childrenLocations[child._id] || child.currentLocation;
  };

  const getBatteryColor = (level) => {
    if (!level) return "text-muted";
    if (level <= 20) return "text-danger";
    if (level <= 50) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            Live Tracking
          </h1>
          <p className="text-sm sm:text-base text-muted">
            Real-time location of your children
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`btn text-sm ${showGeofences ? "btn-primary" : "btn-outline"}`}
          >
            {showGeofences ? (
              <HiOutlineEye className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            ) : (
              <HiOutlineEyeOff className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Geofences</span>
          </button>
          <button onClick={handleRefresh} className="btn btn-outline text-sm">
            <HiOutlineRefresh className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile Children Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {children.map((child) => {
            const location = getChildLocation(child);
            return (
              <button
                key={child._id}
                onClick={() => focusOnChild(child)}
                className={`flex-shrink-0 p-3 rounded-xl transition-all min-w-[140px] ${
                  selectedChild === child._id
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-white border-2 border-gray-100 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {child.name?.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        child.deviceInfo?.isOnline
                          ? "bg-success"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text text-sm truncate">
                      {child.name}
                    </p>
                    <p
                      className={`text-xs ${getBatteryColor(child.deviceInfo?.batteryLevel)}`}
                    >
                      🔋 {child.deviceInfo?.batteryLevel || "--"}%
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
          {children.length === 0 && (
            <p className="text-center text-muted py-4 w-full">
              No children linked
            </p>
          )}
        </div>
        {/* Connection Status Mobile */}
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"}`}
          />
          <span className="text-xs text-muted">
            {isConnected ? "Real-time active" : "Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
        {/* Children List - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-3">
          <div className="bg-white rounded-xl shadow-card p-4">
            <h2 className="font-semibold text-text mb-3">
              Children ({children.length})
            </h2>
            <div className="space-y-2">
              {children.map((child) => {
                const location = getChildLocation(child);
                return (
                  <button
                    key={child._id}
                    onClick={() => focusOnChild(child)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedChild === child._id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium">
                          {child.name?.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            child.deviceInfo?.isOnline
                              ? "bg-success"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text truncate">
                          {child.name}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {location?.address || "Location updating..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span
                        className={getBatteryColor(
                          child.deviceInfo?.batteryLevel,
                        )}
                      >
                        🔋 {child.deviceInfo?.batteryLevel || "--"}%
                      </span>
                      <span className="text-muted">
                        {child.deviceInfo?.lastSeen
                          ? formatDistanceToNow(
                              new Date(child.deviceInfo.lastSeen),
                              { addSuffix: true },
                            )
                          : "Never"}
                      </span>
                    </div>
                  </button>
                );
              })}
              {children.length === 0 && (
                <p className="text-center text-muted py-4">
                  No children linked
                </p>
              )}
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"}`}
              />
              <span className="text-sm text-muted">
                {isConnected ? "Real-time updates active" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div
          className="lg:col-span-3 bg-white rounded-xl shadow-card overflow-hidden order-first lg:order-last"
          style={{ height: "calc(100vh - 320px)", minHeight: "350px" }}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            ref={mapRef}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Geofences */}
            {showGeofences &&
              geofences.map(
                (geofence) =>
                  geofence.isActive && (
                    <Circle
                      key={geofence._id}
                      center={[
                        geofence.center.latitude,
                        geofence.center.longitude,
                      ]}
                      radius={geofence.radius}
                      pathOptions={{
                        color: geofence.color || "#2563EB",
                        fillColor: geofence.color || "#2563EB",
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">{geofence.name}</p>
                          <p className="text-sm text-muted capitalize">
                            {geofence.type}
                          </p>
                          <p className="text-xs text-muted">
                            {geofence.radius}m radius
                          </p>
                        </div>
                      </Popup>
                    </Circle>
                  ),
              )}

            {/* Child Markers */}
            {children.map((child) => {
              const location = getChildLocation(child);
              if (!location?.latitude) return null;

              return (
                <Marker
                  key={child._id}
                  position={[location.latitude, location.longitude]}
                  icon={createChildIcon(child.deviceInfo?.isOnline)}
                >
                  <Popup>
                    <div className="text-center min-w-[150px]">
                      <p className="font-semibold text-lg">{child.name}</p>
                      <p className="text-sm text-muted">
                        {location.address || "Unknown location"}
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <span
                          className={`text-sm ${getBatteryColor(child.deviceInfo?.batteryLevel)}`}
                        >
                          🔋 {child.deviceInfo?.batteryLevel || "--"}%
                        </span>
                        <span
                          className={`text-sm ${child.deviceInfo?.isOnline ? "text-success" : "text-muted"}`}
                        >
                          {child.deviceInfo?.isOnline
                            ? "🟢 Online"
                            : "⚫ Offline"}
                        </span>
                      </div>
                      {location.timestamp && (
                        <p className="text-xs text-muted mt-2">
                          Updated{" "}
                          {formatDistanceToNow(new Date(location.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
