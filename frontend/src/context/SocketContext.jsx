import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { audioService } from "../services/audioService";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [childrenLocations, setChildrenLocations] = useState({});
  const [sosAlertActive, setSOSAlertActive] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.PROD ? undefined : "http://localhost:5000"),
      {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    );

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Parent-specific events
    if (user.role === "parent") {
      newSocket.on("locationUpdate", (data) => {
        setChildrenLocations((prev) => ({
          ...prev,
          [data.childId]: {
            ...data.location,
            name: data.childName,
          },
        }));
      });

      newSocket.on("batteryUpdate", (data) => {
        setChildrenLocations((prev) => ({
          ...prev,
          [data.childId]: {
            ...prev[data.childId],
            batteryLevel: data.batteryLevel,
          },
        }));
      });

      newSocket.on("sos", (data) => {
        // Play SOS alarm sound
        audioService.playSOS();
        setSOSAlertActive(true);

        toast.error(
          <div
            onClick={() => {
              audioService.stopSOS();
              setSOSAlertActive(false);
            }}
            className="cursor-pointer"
          >
            <strong>🚨 SOS Alert!</strong>
            <p>{data.child.name} needs help!</p>
            {data.images?.frontCamera && (
              <p className="text-xs mt-1">📷 Camera images captured</p>
            )}
            <p className="text-xs mt-1 text-gray-300">Click to stop alarm</p>
          </div>,
          { duration: 30000 },
        );

        // Auto-stop sound after 30 seconds
        setTimeout(() => {
          audioService.stopSOS();
          setSOSAlertActive(false);
        }, 30000);
      });

      newSocket.on("alert", (data) => {
        const alertMessages = {
          geofence_entry: `${data.childId} entered ${data.geofence?.name}`,
          geofence_exit: `${data.childId} left ${data.geofence?.name}`,
          battery_low: `Low battery alert`,
        };
        toast(alertMessages[data.type] || "New alert", {
          icon: data.type === "battery_low" ? "🔋" : "📍",
        });
      });

      newSocket.on("childOffline", (data) => {
        toast(`${data.childName} went offline`, { icon: "📴" });
      });
    }

    // Child-specific events
    if (user.role === "child") {
      newSocket.on("locationRequested", () => {
        // Parent requested location - trigger update
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              newSocket.emit("updateLocation", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                heading: position.coords.heading,
              });
            },
            (error) => console.error("Geolocation error:", error),
          );
        }
      });

      newSocket.on("sosAcknowledged", (data) => {
        toast.success("Your parent has acknowledged your SOS!", {
          duration: 10000,
        });
      });
    }

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const updateLocation = useCallback(
    (location) => {
      if (socket && isConnected) {
        socket.emit("updateLocation", location);
      }
    },
    [socket, isConnected],
  );

  const updateBatteryLevel = useCallback(
    (batteryLevel) => {
      if (socket && isConnected) {
        socket.emit("updateBatteryLevel", { batteryLevel });
      }
    },
    [socket, isConnected],
  );

  const triggerSOS = useCallback(
    (locationData) => {
      if (socket && isConnected) {
        socket.emit("triggerSOS", locationData);
      }
    },
    [socket, isConnected],
  );

  const requestChildLocation = useCallback(
    (childId) => {
      if (socket && isConnected) {
        socket.emit("requestChildLocation", { childId });
      }
    },
    [socket, isConnected],
  );

  const stopSOSAlarm = useCallback(() => {
    audioService.stopSOS();
    setSOSAlertActive(false);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        childrenLocations,
        sosAlertActive,
        updateLocation,
        updateBatteryLevel,
        triggerSOS,
        requestChildLocation,
        stopSOSAlarm,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
