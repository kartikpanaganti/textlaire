import { createContext, useState, useEffect } from "react";

// Create User Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedAuth = localStorage.getItem("isAuthenticated");
      const storedUser = localStorage.getItem("user");
      
      if (storedAuth) {
        // In a real app, you would verify the token with your backend
        // For now, we'll just simulate a user
        const userData = storedUser ? JSON.parse(storedUser) : {
          id: "user123",
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: null,
          role: "user",
          preferences: {
            notifications: true,
            emailAlerts: true,
            fontSize: "medium",
            language: "en",
            twoFactorEnabled: false
          }
        };
        
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

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
        notifications: true,
        emailAlerts: true,
        fontSize: "medium",
        language: "en",
        twoFactorEnabled: false
      }
    };
    
    setUser(userWithDefaults);
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(userWithDefaults));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
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