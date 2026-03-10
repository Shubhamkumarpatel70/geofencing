import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { locationsAPI, alertsAPI } from "../../services/api";
import { cameraService } from "../../services/cameraService";
import { audioService } from "../../services/audioService";
import {
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineCamera,
} from "react-icons/hi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const ChildDashboard = () => {
  const { user } = useAuth();
  const { updateLocation, updateBatteryLevel, triggerSOS, isConnected } =
    useSocket();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [sosActive, setSOSActive] = useState(false);
  const [sosCapturing, setSOSCapturing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  useEffect(() => {
    // Check camera availability
    cameraService.isCameraAvailable().then(setCameraAvailable);

    // Get battery level
    if ("getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        updateBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener("levelchange", () => {
          updateBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Get initial location
    getCurrentLocation();

    // Cleanup on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      audioService.stopSOS();
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        setCurrentLocation(locationData);
        setLastUpdate(new Date());

        // Send to server
        try {
          await locationsAPI.updateLocation(locationData);
          updateLocation(locationData);
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        setCurrentLocation(locationData);
        setLastUpdate(new Date());

        // Send to server
        try {
          await locationsAPI.updateLocation(locationData);
          updateLocation(locationData);
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success("Location sharing started");
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.success("Location sharing stopped");
  };

  const handleSOS = async () => {
    if (sosActive || sosCapturing) return;

    setSOSCapturing(true);
    setSOSActive(true);

    // Play SOS sound immediately
    audioService.playSOS();
    toast.loading("Capturing emergency data...", { id: "sos-toast" });

    try {
      // Capture camera images in parallel with location
      const [cameraImages, position] = await Promise.all([
        cameraAvailable
          ? cameraService.captureFromBothCameras()
          : { frontCamera: null, backCamera: null },
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 },
          );
        }),
      ]);

      const sosData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message: `Emergency! ${user?.name} needs help!`,
        frontCameraBase64: cameraImages.frontCamera,
        backCameraBase64: cameraImages.backCamera,
      };

      // Send SOS with images
      await alertsAPI.triggerSOS(sosData);
      triggerSOS({
        ...sosData,
        frontCameraBase64: undefined, // Don't send images via socket
        backCameraBase64: undefined,
      });

      toast.success(
        <div>
          <strong>🚨 SOS Alert Sent!</strong>
          <p className="text-sm">Your parent has been notified</p>
          {cameraImages.frontCamera && (
            <p className="text-xs">Camera images captured</p>
          )}
        </div>,
        { duration: 5000, id: "sos-toast" },
      );

      // Stop sound after 5 seconds
      setTimeout(() => {
        audioService.stopSOS();
      }, 5000);
    } catch (error) {
      console.error("SOS Error:", error);
      toast.error("Failed to send SOS. Please try again.", { id: "sos-toast" });
      audioService.stopSOS();
    } finally {
      setSOSCapturing(false);
      // Reset SOS after 30 seconds
      setTimeout(() => setSOSActive(false), 30000);
    }
  };

  const stopSOSSound = () => {
    audioService.stopSOS();
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-1">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Hi, {user?.name}!
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Your safety matters to us
            </p>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-400"}`}
          />
        </div>
      </div>

      {/* SOS Button */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-card p-6 sm:p-8 text-center">
        <h2 className="text-base sm:text-lg font-semibold text-text mb-4 sm:mb-6">
          Emergency SOS
        </h2>
        <button
          onClick={handleSOS}
          disabled={sosActive || sosCapturing}
          className={`
            w-28 h-28 sm:w-40 sm:h-40 rounded-full sos-button text-white font-bold text-lg sm:text-xl
            flex flex-col items-center justify-center mx-auto transition-all
            ${sosActive || sosCapturing ? "opacity-50 cursor-not-allowed animate-pulse" : "hover:scale-105"}
          `}
        >
          {sosCapturing ? (
            <>
              <HiOutlineCamera className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 animate-pulse" />
              <span className="text-sm">Capturing...</span>
            </>
          ) : sosActive ? (
            <>
              <HiOutlineExclamationCircle className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2" />
              <span>Sent!</span>
            </>
          ) : (
            <>
              <HiOutlineExclamationCircle className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2" />
              <span>SOS</span>
            </>
          )}
        </button>

        {sosActive && (
          <button
            onClick={stopSOSSound}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Stop Sound
          </button>
        )}

        <p className="text-xs sm:text-sm text-muted mt-4 sm:mt-6">
          {sosCapturing
            ? "Capturing camera images and location..."
            : sosActive
              ? "Your parent has been notified of your emergency"
              : "Press in case of emergency - captures location and camera images"}
        </p>

        {cameraAvailable && (
          <p className="text-xs text-success mt-2 flex items-center justify-center gap-1">
            <HiOutlineCamera className="w-4 h-4" />
            Camera ready for emergency capture
          </p>
        )}
      </div>

      {/* Location Status */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Location Sharing</h2>
          <button
            onClick={getCurrentLocation}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineRefresh className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Location */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <HiOutlineLocationMarker className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text">Current Location</p>
              {currentLocation ? (
                <>
                  <p className="text-sm text-muted">
                    Lat: {currentLocation.latitude.toFixed(6)}, Lng:{" "}
                    {currentLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Accuracy: ~{Math.round(currentLocation.accuracy)}m
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Getting location...</p>
              )}
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-center text-sm text-muted">
              Last updated{" "}
              {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </div>
          )}

          {/* Tracking Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-text">Continuous Tracking</p>
              <p className="text-sm text-muted">
                Share your location in real-time
              </p>
            </div>
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  isTracking
                    ? "bg-danger text-white hover:bg-danger-700"
                    : "bg-success text-white hover:bg-success-700"
                }
              `}
            >
              {isTracking ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-semibold text-text mb-4">Safety Tips</h2>
        <div className="space-y-3">
          {[
            "Always keep your phone charged above 20%",
            "Share your location when traveling alone",
            "Use SOS in any emergency situation",
            "Keep your parent informed of your whereabouts",
          ].map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <HiOutlineShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Link Code Display */}
      {user?.linkCode && !user?.parent && (
        <div className="bg-primary/5 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted mb-2">Your Link Code</p>
          <p className="text-3xl font-bold text-primary tracking-widest">
            {user.linkCode}
          </p>
          <p className="text-sm text-muted mt-2">
            Share this code with your parent to connect
          </p>
        </div>
      )}
    </div>
  );
};

export default ChildDashboard;
