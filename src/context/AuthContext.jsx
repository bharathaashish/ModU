import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
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
      localStorage.setItem('currentUser', JSON.stringify(data));
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
      localStorage.setItem('currentUser', JSON.stringify(data));
      return { success: true };
    } catch {
      return { success: false, message: 'Server connection error' };
    }
  };

  const loginWithGoogle = (googleUser) => {
    setUser(googleUser);
    localStorage.setItem('currentUser', JSON.stringify(googleUser));
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
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error saving settings', err);
    }
  };

  const updateUserProfile = async ({ username: newUsername, name, email, age, phone, bio }) => {
    if (!user) return { success: false, message: 'Not logged in' };
    
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, name, email, age, phone, bio })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Error updating profile' };
      
      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
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
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, register, loginWithGoogle, logout, updateUserSettings, updateUserProfile, refreshNotifications }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
