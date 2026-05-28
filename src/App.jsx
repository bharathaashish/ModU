import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Home from './pages/Home'
import Discover from './pages/Discover'
import SuggestedConnections from './pages/SuggestedConnections'
import SharedInterestPosts from './pages/SharedInterestPosts'
import DiscussionThread from './pages/DiscussionThread'
import Discussions from './pages/Discussions'
import Hubs from './pages/Hubs'
import Community from './pages/Community'
import CommunityServer from './pages/CommunityServer'
import CreateCommunity from './pages/CreateCommunity'
import Communities from './pages/Communities'
import Notifications from './pages/Notifications'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import EditInterests from './pages/EditInterests'
import FeedControl from './pages/FeedControl'
import Appearance from './pages/Appearance'
import Liked from './pages/Liked'
import Privacy from './pages/Privacy'
import Messages from './pages/Messages'
import Saved from './pages/Saved'
import Followers from './pages/Followers'
import Following from './pages/Following'


function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requireOnboarding && !user.interests) return <Navigate to="/onboarding" replace />
  if (!requireOnboarding && user.interests) return <Navigate to="/" replace />
  return children
}

function AppROUTES() {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/onboarding" element={
        <ProtectedRoute requireOnboarding={false}>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      {/* Wrapped in Global Bottom Nav Layout */}
<Route element={<ProtectedRoute requireOnboarding={true}><Layout /></ProtectedRoute>}>
<Route path="/messages" element={<Messages />} />
        <Route path="/messages/:username" element={<Messages />} />
        
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/discover/connections" element={<SuggestedConnections />} />
        <Route path="/discover/posts" element={<SharedInterestPosts />} />
        <Route path="/discussion/:id" element={<DiscussionThread />} />
        <Route path="/discussions" element={<Discussions />} />
        <Route path="/hubs" element={<Hubs />} />
        <Route path="/community/:communityId" element={<CommunityServer />} />
        <Route path="/community/create" element={<CreateCommunity />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/followers" element={<Followers />} />
        <Route path="/profile/:username/following" element={<Following />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/interests" element={<EditInterests />} />
        <Route path="/settings/privacy" element={<Privacy />} />
        <Route path="/settings/feed" element={<FeedControl />} />
        <Route path="/settings/appearance" element={<Appearance />} />
        <Route path="/settings/liked" element={<Liked />} />
        <Route path="/settings/saved" element={<Saved />} />
      </Route>

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    // Task 1: Local Storage Purge (Remove old mock data)
    ['modu_users', 'modu_posts', 'modu_stories'].forEach(k => localStorage.removeItem(k));
    
    // Task 3: Theme persistence
    const savedTheme = localStorage.getItem('modu_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <AuthProvider>
      <AppROUTES />
    </AuthProvider>
  )
}

export default App
