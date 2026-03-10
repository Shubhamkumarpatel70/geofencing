import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { childrenAPI, locationsAPI } from "../../services/api";
import {
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

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

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
};

const LocationHistory = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [customDate, setCustomDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchLocationHistory();
    }
  }, [selectedChild, dateRange, customDate]);

  const fetchChildren = async () => {
    try {
      const response = await childrenAPI.getAll();
      setChildren(response.data.children);
      if (response.data.children.length > 0) {
        setSelectedChild(response.data.children[0]._id);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationHistory = async () => {
    if (!selectedChild) return;

    try {
      let startDate, endDate;
      const now = new Date();

      switch (dateRange) {
        case "today":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "yesterday":
          startDate = startOfDay(subDays(now, 1));
          endDate = endOfDay(subDays(now, 1));
          break;
        case "week":
          startDate = startOfDay(subDays(now, 7));
          endDate = endOfDay(now);
          break;
        case "custom":
          startDate = startOfDay(new Date(customDate));
          endDate = endOfDay(new Date(customDate));
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }

      const response = await locationsAPI.getHistory(selectedChild, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 200,
      });

      setLocations(response.data.locations || []);

      // Center map on first location
      if (response.data.locations?.length > 0) {
        setMapCenter([
          response.data.locations[0].latitude,
          response.data.locations[0].longitude,
        ]);
      }
    } catch (error) {
      console.error("Error fetching location history:", error);
    }
  };

  const getRouteCoordinates = () => {
    return locations.map((loc) => [loc.latitude, loc.longitude]).reverse();
  };

  const selectedChildData = children.find((c) => c._id === selectedChild);

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
          <h1 className="text-2xl font-bold text-text">Location History</h1>
          <p className="text-muted">View past locations and travel routes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-wrap gap-4">
          {/* Child Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted mb-2">
              Select Child
            </label>
            <div className="relative">
              <select
                value={selectedChild || ""}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl appearance-none focus:border-primary"
              >
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.name}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted mb-2">
              Time Period
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-xl appearance-none focus:border-primary"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="custom">Custom Date</option>
              </select>
              <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Custom Date */}
          {dateRange === "custom" && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-muted mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Location List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-text">
              Locations ({locations.length})
            </h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {locations.length === 0 ? (
              <div className="p-8 text-center">
                <HiOutlineLocationMarker className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No location data for this period</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {locations.map((location, index) => (
                  <button
                    key={location._id}
                    onClick={() =>
                      setMapCenter([location.latitude, location.longitude])
                    }
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">
                          {location.address ||
                            `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                          <HiOutlineClock className="w-3 h-3" />
                          {format(new Date(location.timestamp), "HH:mm:ss")}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div
          className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden"
          style={{ height: "600px" }}
        >
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController center={mapCenter} zoom={14} />

            {/* Route line */}
            {locations.length > 1 && (
              <Polyline
                positions={getRouteCoordinates()}
                pathOptions={{
                  color: "#2563EB",
                  weight: 4,
                  opacity: 0.7,
                  dashArray: "10, 10",
                }}
              />
            )}

            {/* Location markers */}
            {locations.map((location, index) => (
              <Marker
                key={location._id}
                position={[location.latitude, location.longitude]}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Point {index + 1}</p>
                    <p className="text-sm text-muted">
                      {format(
                        new Date(location.timestamp),
                        "MMM d, yyyy HH:mm",
                      )}
                    </p>
                    {location.address && (
                      <p className="text-xs text-muted mt-1">
                        {location.address}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default LocationHistory;
