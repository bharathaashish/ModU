import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

// Helper to store only essential user fields (avoid localStorage quota exceeded)
function storeUserEssentials(user) {
  try {
    const essentialUser = {
      username: user.username,
      name: user.name,
      profilePhoto: user.profilePhoto,
      interests: user.interests,
      isPrivate: user.isPrivate,
      notifications: user.notifications || []
    };
    localStorage.setItem('currentUser', JSON.stringify(essentialUser));
  } catch (err) {
    console.error('Failed to store user:', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const updateUser = (newData) => {
    setUser(newData);
    localStorage.setItem('currentUser', JSON.stringify(newData));
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Invalid username or password' };
      
      setUser(data);
      storeUserEssentials(data);
      return { success: true };
    } catch {
      return { success: false, message: 'Server connection error' };
    }
  };

  const register = async ({ username, name, password, email, age, phone }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, email, age, phone })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Username already exists' };
      
      setUser(data);
      storeUserEssentials(data);
      return { success: true };
    } catch {
      return { success: false, message: 'Server connection error' };
    }
  };

  const loginWithGoogle = (googleUser) => {
    setUser(googleUser);
    storeUserEssentials(googleUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUserSettings = async ({ interests, feedPreference }) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, interests, feedPreference })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        storeUserEssentials(updatedUser);
      }
    } catch (err) {
      console.error('Error saving settings', err);
    }
  };

  const updateUserProfile = async ({ username: newUsername, name, email, age, phone, bio, photoVisibility, interestVisibility }) => {
    if (!user) return { success: false, message: 'Not logged in' };
    
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, name, email, age, phone, bio, photoVisibility, interestVisibility })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error updating profile' };
      
      setUser(data);
      storeUserEssentials(data);
      return { success: true };
    } catch {
      return { success: false, message: 'Server connection error' };
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.username}/notifications`);
      if (res.ok) {
        const notifications = await res.json();
        const updatedUser = { ...user, notifications };
        setUser(updatedUser);
        storeUserEssentials(updatedUser);
      }
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, register, loginWithGoogle, logout, updateUserSettings, updateUserProfile, refreshNotifications }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
