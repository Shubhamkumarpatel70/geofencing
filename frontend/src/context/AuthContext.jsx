import { createContext, useContext, useState, useEffect } from "react";
import api, { locationsAPI, alertsAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
          const response = await api.get("/auth/me");
          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          console.error("Auth initialization error:", error);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      // If user is a child with a parent, share last location before logout
      if (user?.role === "child" && user?.parent) {
        try {
          // Get current location
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });

          // Send last known location to server
          await locationsAPI.updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isLogoutLocation: true,
          });

          // Create an offline alert for the parent
          await api.post("/alerts/offline", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            message: `${user.name} has logged out`,
          });
        } catch (geoError) {
          console.error("Could not get location on logout:", geoError);
          // Still notify parent about logout even without location
          try {
            await api.post("/alerts/offline", {
              message: `${user.name} has logged out (location unavailable)`,
            });
          } catch (e) {}
        }
      }

      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Refresh user error:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
