import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create User Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Setup axios interceptor for authentication
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.token) {
              config.headers["Authorization"] = `Bearer ${userData.token}`;
            }
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Keep track of if we're already redirecting to prevent loops
      let isRedirecting = false;
      
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response && error.response.status === 401 && !isRedirecting) {
            // Token expired or invalid, log out user
            isRedirecting = true;
            logout();
            // Use navigate from react-router instead of window.location for better handling
            setTimeout(() => {
              window.location.href = "/";
              isRedirecting = false;
            }, 100);
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          if (userData.token) {
            // Verify token with backend
            try {
              const response = await axios.get(`/api/auth/me`, {
                headers: {
                  Authorization: `Bearer ${userData.token}`
                }
              });
              
              // Update user data with latest from server
              const updatedUserData = {
                ...userData,
                ...response.data.user,
                token: userData.token // Keep the token
              };
              
              setUser(updatedUserData);
              setIsAuthenticated(true);
              localStorage.setItem("user", JSON.stringify(updatedUserData));
            } catch (error) {
              console.error("Token verification failed:", error);
              // Token invalid, clear user data
              localStorage.removeItem("user");
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // No token, clear user data
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Apply font size preference
  useEffect(() => {
    if (user?.preferences?.fontSize) {
      const sizes = {
        small: "14px",
        medium: "16px",
        large: "18px"
      };
      document.documentElement.style.fontSize = sizes[user.preferences.fontSize];
    }
  }, [user?.preferences?.fontSize]);

  // Login function
  const login = (userData) => {
    const userWithDefaults = {
      ...userData,
      preferences: userData.preferences || {
        fontSize: "medium",
        language: "en",
        twoFactorEnabled: false
      }
    };
    
    setUser(userWithDefaults);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithDefaults));
  };

  // Logout function
  const logout = async () => {
    try {
      if (user && user.token) {
        // Call logout API using the proxy
        await axios.post(`/api/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user data regardless of API success
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
    }
  };

  // Update user profile
  const updateProfile = (updatedData) => {
    setUser(prev => {
      const updatedUser = {
        ...prev,
        ...updatedData
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Update user preferences
  const updatePreferences = (preferences) => {
    setUser(prev => {
      if (!prev) return prev;
      
      const updatedUser = {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferences
        }
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Update avatar
  const updateAvatar = (avatarUrl) => {
    setUser(prev => {
      if (!prev) return prev;
      
      const updatedUser = {
        ...prev,
        avatar: avatarUrl
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Change password (mock function)
  const changePassword = (currentPassword, newPassword) => {
    // In a real app, you would send this to your backend
    // Here we just return a success response
    return { success: true, message: "Password updated successfully" };
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading,
        login,
        logout,
        updateProfile,
        updatePreferences,
        updateAvatar,
        changePassword
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider; 