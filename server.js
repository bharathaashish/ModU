import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';

dotenv.config();
const app = express();

app.use(cors({
    origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'modu-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser(async (username, done) => {
  try {
    const user = await User.findOne({ username }).lean();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set up MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log("Successfully connected to MongoDB");
  // Remove communities created by fake user 'modu_admin' or empty seeded placeholders
  try {
    const fakeCommunities = await Community.find({ $or: [{ creator: 'modu_admin' }, { creator: '' }, { creator: { $exists: false } }] });
    if (fakeCommunities.length > 0) {
      const communityIds = fakeCommunities.map(c => c._id);
      await ChannelMessage.deleteMany({ communityId: { $in: communityIds } });
      await Community.deleteMany({ _id: { $in: communityIds } });
      console.log(`Removed ${fakeCommunities.length} fake/seeded placeholder communities and related channel messages`);
    }
  } catch (e) { console.log('Community cleanup notice:', e.message); }
  // Remove orphaned communities where creator user no longer exists
  try {
    const allUsers = await User.find({}).lean();
    const realUsernames = new Set(allUsers.map(u => u.username));
    const orphaned = await Community.find({ creator: { $nin: [...realUsernames], $exists: true, $ne: '' } });
    if (orphaned.length > 0) {
      const orphanIds = orphaned.map(c => c._id);
      await ChannelMessage.deleteMany({ communityId: { $in: orphanIds } });
      await Community.deleteMany({ _id: { $in: orphanIds } });
      console.log(`Removed ${orphaned.length} orphaned communities (creator user no longer exists)`);
    }
  } catch (e) { console.log('Orphaned community cleanup notice:', e.message); }
  // Remove fake user account 'modu_admin'
  try {
    const result = await User.deleteMany({ username: 'modu_admin' });
    if (result.deletedCount > 0) {
      console.log("Successfully removed fake user account 'modu_admin'");
    }
  } catch (e) { console.log('Fake user cleanup notice:', e.message); }
  // Remove all posts and related data by fake user 'modu_admin'
  try {
    const moduPosts = await Post.find({ username: 'modu_admin' });
    if (moduPosts.length > 0) {
      const postIds = moduPosts.map(p => p._id);
      await Comment.deleteMany({ postId: { $in: postIds } });
      await Like.deleteMany({ postId: { $in: postIds } });
      await Saved.deleteMany({ postId: { $in: postIds } });
      await Notification.deleteMany({ postId: { $in: postIds } });
      await Post.deleteMany({ _id: { $in: postIds } });
      console.log(`Removed ${moduPosts.length} post(s) and related data by fake user 'modu_admin'`);
    }
  } catch (e) { console.log('Post cleanup notice:', e.message); }
  // Remove old story-type posts (stories are now in independent Story collection)
  try {
    const oldStories = await Post.find({ type: 'story' });
    if (oldStories.length > 0) {
      const storyIds = oldStories.map(p => p._id);
      await Comment.deleteMany({ postId: { $in: storyIds } });
      await Like.deleteMany({ postId: { $in: storyIds } });
      await Saved.deleteMany({ postId: { $in: storyIds } });
      await Notification.deleteMany({ postId: { $in: storyIds } });
      await Post.deleteMany({ _id: { $in: storyIds } });
      console.log(`Cleaned up ${oldStories.length} old story-type posts migrated to Story collection`);
    }
  } catch (e) { console.log('Story migration notice:', e.message); }
  // Routes and server startup will happen after models are defined
})
.catch(error => {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
});

// MODELS
const NotificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['like', 'comment', 'follow', 'follow_request', 'post', 'message'], required: true },
  fromUser: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  name: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, default: null },
  email: { type: String, unique: true, sparse: true },
  age: { type: Number },
  phone: { type: String },
  interests: [{ type: String }],
  blockedInterests: [{ type: String }],
  bio: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  photoCrop: {
    type: { x: Number, y: Number, width: Number, height: Number, zoom: Number },
    default: null
  },
  photoVisibility: { type: String, enum: ['everyone', 'followers'], default: 'everyone' },
  interestVisibility: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
  followersVisibility: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
  followingVisibility: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
  isPrivate: { type: Boolean, default: false },
  feedPreference: { type: String, default: 'Friends', enum: ['Balanced', 'Friends', 'Suggested'] },
  discoverWidgets: {
    type: [{
      id: { type: String },
      visible: { type: Boolean, default: true },
      pinned: { type: Boolean, default: false }
    }],
    default: () => [
      { id: 'interestPosts', visible: true, pinned: false },
      { id: 'activeDiscussions', visible: true, pinned: false },
      { id: 'suggestedConnections', visible: true, pinned: false },
      { id: 'interestHubs', visible: true, pinned: false },
    ]
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  followers: [{ type: String }],
  following: [{ type: String }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  notifications: [NotificationSchema],
  followRequests: [{
    fromUsername: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  recentSearches: [{
    username: String,
    name: String,
    searchedAt: { type: Date, default: Date.now }
  }],
  blockedUsers: [{
    username: String,
    blockedAt: { type: Date, default: Date.now }
  }],
  profileMutedUsers: [{
    username: String,
    duration: { type: String, enum: ['8h', '24h', '7d', 'forever'] },
    mutedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
  }],
  dmMutedUsers: [{
    username: String,
    duration: { type: String, enum: ['8h', '24h', '7d', 'forever'] },
    mutedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
  }],
  closeFriends: [{ type: String }],
  nicknames: [{ partner: String, nickname: String }],
  acceptedConversations: [{
    partner: String,
    acceptedAt: { type: Date, default: Date.now }
  }],
  hiddenConversations: [{ partner: String, hiddenAt: { type: Date, default: Date.now } }],
});

UserSchema.index({ username: 1 });
UserSchema.index({ 'blockedUsers.username': 1 });
UserSchema.index({ 'profileMutedUsers.username': 1 });
UserSchema.index({ username: 'text', name: 'text' });

// ── Visibility helper functions ──
function canViewPhoto(user, viewerUsername) {
  if (!viewerUsername || !user) return false;
  if (user.username === viewerUsername) return true;
  if ((user.photoVisibility || 'everyone') !== 'followers') return true;
  return (user.followers || []).includes(viewerUsername);
}

function canViewInterests(user, viewerUsername) {
  if (!viewerUsername || !user) return false;
  if (user.username === viewerUsername) return true;
  if ((user.interestVisibility || 'everyone') !== 'followers') return true;
  return (user.followers || []).includes(viewerUsername);
}

function filterBlockedInterests(items, blockedInterests) {
  if (!blockedInterests || blockedInterests.length === 0) return items;
  const blocked = blockedInterests.map(b => b.toLowerCase().replace(/^#/, ''));
  return items.filter(item => {
    const tags = (item.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
    return !tags.some(tag => blocked.includes(tag));
  });
}

const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: [{ type: String }]
}, { _id: true });

const PostSchema = new mongoose.Schema({
  username: { type: String, required: true },
  title: { type: String },
  content: { type: String },
  image: { type: String },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  upvoteCount: { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }],
  comments: { type: Number, default: 0 },
  type: { type: String, enum: ['post', 'story', 'discussion'], default: 'post' },
  communityId: { type: String },
  channel: { type: String },
  poll: {
    options: [PollOptionSchema],
    totalVotes: { type: Number, default: 0 }
  },
  tags: [{ type: String }]
}, { timestamps: true });

PostSchema.index({ username: 1 });
PostSchema.index({ type: 1 });
PostSchema.index({ username: 1, type: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ communityId: 1 });

const VoteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
VoteSchema.index({ userId: 1, postId: 1, commentId: 1 }, { unique: true });

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 1 },
  upvotedBy: [{ type: String }],
  downvotes: { type: Number, default: 0 },
  downvotedBy: [{ type: String }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }]
});

const LikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SavedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date },
  editHistory: [{ content: String, editedAt: Date }]
});

MessageSchema.index({ sender: 1, receiver: 1 });
MessageSchema.index({ timestamp: -1 });

const MessageRequestSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String, default: null },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

const ChannelMessageSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  channelName: { type: String, required: true },
  senderUsername: { type: String, required: true },
  message: { type: String, default: '' },
  image: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'text' }
});

const CommunitySchema = new mongoose.Schema({
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  tags: [{ type: String }],
  creator: { type: String, default: '' },
  memberCount: { type: Number, default: 1 },
  members: [{
    username: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  channels: [ChannelSchema],
  inviteLinks: [{
    code: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    uses: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now }
});

CommunitySchema.index({ name: 'text', description: 'text', tags: 'text' });

const HubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  interests: [{ type: String }],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const StorySchema = new mongoose.Schema({
  author: { type: String, required: true },
  media: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, default: '' },
  audience: { type: String, enum: ['public', 'followers', 'close_friends'], default: 'followers' },
  viewers: [{ type: String }],
  reactions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 }
});

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', StorySchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const Vote = mongoose.model('Vote', VoteSchema);
const Like = mongoose.model('Like', LikeSchema);
const Saved = mongoose.model('Saved', SavedSchema);
const Message = mongoose.model('Message', MessageSchema);
const MessageRequest = mongoose.model('MessageRequest', MessageRequestSchema);
const ChannelMessage = mongoose.model('ChannelMessage', ChannelMessageSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const User = mongoose.model('User', UserSchema);
const Hub = mongoose.model('Hub', HubSchema);
const Community = mongoose.model('Community', CommunitySchema);

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

// GOOGLE OAUTH
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';
const FRONTEND_URL = 'http://localhost:5173';
const googleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET;

if (googleConfigured) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails?.[0]?.value });
      }
      if (!user) {
        const baseUsername = (profile.displayName || 'user').replace(/\s+/g, '_').toLowerCase();
        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}_${suffix}`;
          suffix++;
        }
        user = new User({
          username,
          name: profile.displayName,
          email: profile.emails?.[0]?.value || '',
          password: `google_${profile.id}`,
          googleId: profile.id
        });
        await user.save();
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

app.get('/api/auth/google', (req, res, next) => {
  if (!googleConfigured) {
    // Serve high-fidelity simulated Google OAuth Sign-in Page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in with Google</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            background-color: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #202124;
          }
          .card {
            background: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 8px;
            width: 450px;
            padding: 40px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            box-sizing: border-box;
            text-align: center;
          }
          .google-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2px;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          .logo-g { color: #4285F4; }
          .logo-o1 { color: #EA4335; }
          .logo-o2 { color: #FBBC05; }
          .logo-g2 { color: #4285F4; }
          .logo-l { color: #34A853; }
          .logo-e { color: #EA4335; }
          
          h2 {
            font-size: 24px;
            font-weight: 400;
            margin: 0 0 8px 0;
          }
          .subtitle {
            font-size: 16px;
            color: #5f6368;
            margin-bottom: 30px;
          }
          .account-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
            text-align: left;
          }
          .account-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s, border-color 0.2s;
          }
          .account-row:hover {
            background-color: #f8f9fa;
            border-color: #aecbfa;
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #4285F4;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
          }
          .account-info {
            display: flex;
            flex-direction: column;
          }
          .account-name {
            font-weight: 500;
            font-size: 14px;
          }
          .account-email {
            font-size: 12px;
            color: #5f6368;
          }
          .divider {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 20px 0;
            color: #5f6368;
            font-size: 13px;
          }
          .divider-line {
            flex: 1;
            height: 1px;
            background-color: #dadce0;
          }
          .custom-form {
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .input-field {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
          }
          .input-field:focus {
            border-color: #1a73e8;
          }
          .submit-btn {
            background-color: #1a73e8;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 12px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            width: 100%;
            text-align: center;
          }
          .submit-btn:hover {
            background-color: #1557b0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="google-logo">
            <span class="logo-g">G</span>
            <span class="logo-o1">o</span>
            <span class="logo-o2">o</span>
            <span class="logo-g2">g</span>
            <span class="logo-l">l</span>
            <span class="logo-e">e</span>
          </div>
          <h2>Choose an account</h2>
          <div class="subtitle">to continue to ModU</div>
          
          <div class="account-list">
            <div class="account-row" onclick="selectAccount('Bharath', 'bharathaashish@gmail.com', 'google_mock_1')">
              <div class="avatar" style="background-color: #e67e22;">B</div>
              <div class="account-info">
                <span class="account-name">Bharath</span>
                <span class="account-email">bharathaashish@gmail.com</span>
              </div>
            </div>
            <div class="account-row" onclick="selectAccount('Guest User', 'guest.modu@gmail.com', 'google_mock_2')">
              <div class="avatar" style="background-color: #34495e;">G</div>
              <div class="account-info">
                <span class="account-name">Guest User</span>
                <span class="account-email">guest.modu@gmail.com</span>
              </div>
            </div>
          </div>
          
          <div class="divider">
            <div class="divider-line"></div>
            <span>or use another account</span>
            <div class="divider-line"></div>
          </div>
          
          <form class="custom-form" onsubmit="handleCustomSubmit(event)">
            <input type="text" id="custom-name" class="input-field" placeholder="Full Name" required>
            <input type="email" id="custom-email" class="input-field" placeholder="Email Address" required>
            <button type="submit" class="submit-btn">Continue</button>
          </form>
        </div>

        <script>
          function selectAccount(name, email, googleId) {
            const redirectUrl = '/api/auth/google/callback?mock=true&name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&googleId=' + encodeURIComponent(googleId);
            window.location.href = redirectUrl;
          }
          
          function handleCustomSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('custom-name').value;
            const email = document.getElementById('custom-email').value;
            const mockId = 'google_mock_' + Math.random().toString(36).substr(2, 9);
            selectAccount(name, email, mockId);
          }
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

app.get('/api/auth/google/callback', async (req, res, next) => {
  const { mock, name, email, googleId } = req.query;
  if (mock === 'true' && email) {
    try {
      let user = await User.findOne({ googleId });
      if (!user) {
        user = await User.findOne({ email });
      }
      if (!user) {
        // Create a new simulated google user
        const baseUsername = (name || 'user').replace(/\s+/g, '_').toLowerCase();
        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}_${suffix}`;
          suffix++;
        }
        user = new User({
          username,
          name: name || 'Mock User',
          email,
          password: `google_${googleId}`,
          googleId,
          interests: [] // Triggers onboarding if empty
        });
        await user.save();
      } else if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      const userData = encodeURIComponent(JSON.stringify(user));
      return res.redirect(`${FRONTEND_URL}/login?google_user=${userData}`);
    } catch (err) {
      console.error("[GOOGLE MOCK] error:", err);
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }

  if (!googleConfigured) {
    return res.status(501).json({ error: 'Google OAuth not configured.' });
  }
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
    const userData = encodeURIComponent(JSON.stringify(user));
    res.redirect(`${FRONTEND_URL}/login?google_user=${userData}`);
  })(req, res, next);
});

app.get('/api/auth/status', (req, res) => {
  res.json({ google: true }); // Always return true so Google OAuth buttons are fully testable
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, name, password, email, age, phone } = req.body;

    if (!username || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, underscores, and periods' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (age !== undefined && age !== null && age !== '') {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 12 || ageNum > 120) {
        return res.status(400).json({ message: 'Please provide a valid age (12+)' });
      }
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ message: 'Email already in use' });
    }

    let user = await User.findOne({ username });
    if (user) {
      // If the found document lacks a password, it's a stale zombie from a partial delete — purge it
      if (!user.password) {
        await User.deleteOne({ _id: user._id });
      } else {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    user = new User({ username, name, password, email, age, phone });
    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const query = email ? { email } : username ? { username } : null;
    if (!query) return res.status(400).json({ message: 'Email or username required' });
    
    const user = await User.findOne(query);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json(user);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// USER ROUTES
app.get('/api/users', async (req, res) => {
  try {
    const { currentUsername } = req.query;
    let users = await User.find().select('-password');
    // Block filter
    if (currentUsername) {
      const currentUser = await User.findOne({ username: currentUsername }).select('blockedUsers').lean();
      const blockedSet = new Set((currentUser?.blockedUsers || []).map(b => b.username));
      const blockers = await User.find({ 'blockedUsers.username': currentUsername }).select('username').lean();
      blockers.forEach(b => blockedSet.add(b.username));
      if (blockedSet.size > 0) {
        users = users.filter(u => !blockedSet.has(u.username));
      }
    }
    const usersDict = {};
    for (const u of users) {
      let hasPendingRequest = false;
      if (currentUsername) {
        hasPendingRequest = u.followRequests?.some(r => r.fromUsername === currentUsername) || false;
      }
      const userObj = u.toObject();
      delete userObj.followRequests;
      userObj.hasPendingRequest = hasPendingRequest;
      // Apply visibility filters
      if (!canViewPhoto(u, currentUsername)) userObj.profilePhoto = '';
      if (!canViewInterests(u, currentUsername)) userObj.interests = [];
      usersDict[u.username] = userObj;
    }
    res.json(usersDict);
  } catch (err) {
    console.error('[USERS] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SEARCH ROUTE — MUST be before /api/users/:username to avoid route clash
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, currentUsername } = req.query;
    if (!q || !q.trim()) return res.json([]);
    const terms = q.trim().split(/\s+/).filter(Boolean);
    const conditions = [];
    terms.forEach(term => {
      conditions.push({ username: { $regex: term, $options: 'i' } });
      conditions.push({ name: { $regex: term, $options: 'i' } });
    });
    let users = await User.find(conditions.length > 0 ? { $or: conditions } : {})
      .select('-password -followRequests').limit(20);
    // Block filter
    if (currentUsername) {
      const currentUser = await User.findOne({ username: currentUsername }).select('blockedUsers').lean();
      const blockedSet = new Set((currentUser?.blockedUsers || []).map(b => b.username));
      const blockers = await User.find({ 'blockedUsers.username': currentUsername }).select('username').lean();
      blockers.forEach(b => blockedSet.add(b.username));
      if (blockedSet.size > 0) {
        users = users.filter(u => !blockedSet.has(u.username));
      }
    }
    // Attach hasPendingRequest flag for each result
    const enriched = await Promise.all(users.map(async (u) => {
      const userDoc = await User.findOne({ username: u.username }).select('followRequests');
      const hasPending = currentUsername
        ? userDoc?.followRequests?.some(r => r.fromUsername === currentUsername)
        : false;
      const obj = { ...u.toObject(), hasPendingRequest: !!hasPending };
      if (!canViewPhoto(u, currentUsername)) obj.profilePhoto = '';
      if (!canViewInterests(u, currentUsername)) obj.interests = [];
      return obj;
    }));
    res.json(enriched);
  } catch (err) {
    console.error('[SEARCH] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { currentUsername } = req.query;
    if (currentUsername && currentUsername !== req.params.username) {
      const currentUser = await User.findOne({ username: currentUsername }).select('blockedUsers').lean();
      const targetUser = await User.findOne({ username: req.params.username }).select('blockedUsers').lean();
      const currentBlockedTarget = (currentUser?.blockedUsers || []).find(b => b.username === req.params.username);
      const targetBlockedCurrent = (targetUser?.blockedUsers || []).find(b => b.username === currentUsername);
      // If current user blocked the target: return limited profile with isBlockedByMe flag
      if (currentBlockedTarget) {
        return res.json({
          username: user.username,
          name: user.name,
          isBlockedByMe: true,
          blockedAt: currentBlockedTarget.blockedAt,
          profileMutedUsers: user.profileMutedUsers,
          dmMutedUsers: user.dmMutedUsers,
          blockedUsers: user.blockedUsers
        });
      }
      // If target blocked current user: return profile silently (no block indication)
      if (targetBlockedCurrent) {
        return res.json({
          username: user.username,
          name: user.name,
          bio: user.bio,
          profilePhoto: user.profilePhoto,
          photoVisibility: user.photoVisibility,
          profileMutedUsers: user.profileMutedUsers,
          dmMutedUsers: user.dmMutedUsers,
          blockedUsers: user.blockedUsers
        });
      }
    }
    // Apply privacy filters
    if (currentUsername && currentUsername !== req.params.username) {
      const isFollower = (user.followers || []).includes(currentUsername);

      // Profile photo visibility
      if ((user.photoVisibility || 'everyone') === 'followers' && !isFollower) {
        user.profilePhoto = '';
      }
      // Interest visibility
      const iv = user.interestVisibility || 'everyone';
      if (iv === 'nobody' || (iv === 'followers' && !isFollower)) {
        user.interests = [];
      }
      // Followers visibility
      const fv = user.followersVisibility || 'everyone';
      if (fv === 'nobody' || (fv === 'followers' && !isFollower)) {
        user.followers = [];
      }
      // Following visibility
      const fov = user.followingVisibility || 'everyone';
      if (fov === 'nobody' || (fov === 'followers' && !isFollower)) {
        user.following = [];
      }
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROFILE PHOTO UPLOAD
app.post('/api/users/:username/photo', async (req, res) => {
  try {
    const { image, cropX, cropY, zoom, cropAreaPixels } = req.body;
    const update = { profilePhoto: image || '' };
    if (cropAreaPixels) {
      update.photoCrop = {
        x: cropAreaPixels.x, y: cropAreaPixels.y,
        width: cropAreaPixels.width, height: cropAreaPixels.height,
        zoom
      };
    }
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: update },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PROFILE PHOTO REMOVE
app.delete('/api/users/:username/photo', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { profilePhoto: '' } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Photo remove error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    const { name, username: newUsername, email, age, phone, bio, interests, blockedInterests, feedPreference, isPrivate } = req.body;

    // Only set fields that were actually provided — skip undefined to avoid overwriting existing data
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 12 || ageNum > 120) {
        return res.status(400).json({ message: 'Please provide a valid age (12+)' });
      }
      updateFields.age = ageNum;
    }
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    if (interests !== undefined) updateFields.interests = interests;
    if (blockedInterests !== undefined) updateFields.blockedInterests = blockedInterests;
    if (feedPreference !== undefined) updateFields.feedPreference = feedPreference;
    if (isPrivate !== undefined) updateFields.isPrivate = isPrivate;
    if (req.body.photoVisibility !== undefined) updateFields.photoVisibility = req.body.photoVisibility;
    if (req.body.interestVisibility !== undefined) updateFields.interestVisibility = req.body.interestVisibility;

    // Auto-set visibility to followers when switching to private (unless explicitly provided)
    if (isPrivate === true) {
      if (req.body.photoVisibility === undefined) updateFields.photoVisibility = 'followers';
      if (req.body.interestVisibility === undefined) updateFields.interestVisibility = 'followers';
    }

    const oldUsername = req.params.username;

    // Validate new username format if changing
    if (newUsername !== undefined && newUsername !== oldUsername) {
      if (!newUsername || !USERNAME_REGEX.test(newUsername)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, underscores, and periods' });
      }
      if (newUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
    }

    // Handle username change — update everywhere it's referenced
    if (newUsername && newUsername !== oldUsername) {
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      updateFields.username = newUsername;

      await Post.updateMany({ username: oldUsername }, { $set: { username: newUsername } });
      await Comment.updateMany({ username: oldUsername }, { $set: { username: newUsername } });
      await Message.updateMany({ sender: oldUsername }, { $set: { sender: newUsername } });
      await Message.updateMany({ receiver: oldUsername }, { $set: { receiver: newUsername } });

      await User.updateMany(
        { 'notifications.fromUser': oldUsername },
        { $set: { 'notifications.$[].fromUser': newUsername } }
      );
      await User.updateMany(
        { followers: oldUsername },
        { $set: { 'followers.$': newUsername } }
      );
      await User.updateMany(
        { following: oldUsername },
        { $set: { 'following.$': newUsername } }
      );
      // Update likedBy arrays in posts
      await Post.updateMany(
        { likedBy: oldUsername },
        { $set: { 'likedBy.$': newUsername } }
      );
    }

    const user = await User.findOneAndUpdate(
      { username: oldUsername },
      { $set: updateFields },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found after update' });
    }
    res.json(user);
  } catch (err) {
    console.error('[UPDATE] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE ACCOUNT — hard delete of user and all associated data
app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log('[DELETE ACCOUNT] looking up:', username);

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log('[DELETE ACCOUNT] found, userId:', user._id);

    const userId = user._id;

    // Delete the user document FIRST so re-registration with same username works
    await User.deleteOne({ _id: userId });
    console.log('[DELETE ACCOUNT] user document deleted');

    // Best-effort cleanup of associated data — each step has its own try-catch
    try { await Post.deleteMany({ username }); } catch (e) { console.error('[CLEANUP posts]', e.message); }
    try { await Comment.deleteMany({ username }); } catch (e) { console.error('[CLEANUP comments]', e.message); }
    try { await Message.deleteMany({ $or: [{ sender: username }, { receiver: username }] }); } catch (e) { console.error('[CLEANUP messages]', e.message); }
    try { await MessageRequest.deleteMany({ $or: [{ sender: username }, { receiver: username }] }); } catch (e) { console.error('[CLEANUP msgRequests]', e.message); }
    try { await Story.deleteMany({ author: username }); } catch (e) { console.error('[CLEANUP stories]', e.message); }
    try { await ChannelMessage.deleteMany({ senderUsername: username }); } catch (e) { console.error('[CLEANUP channelMessages]', e.message); }
    try { await Vote.deleteMany({ userId: username }); } catch (e) { console.error('[CLEANUP votes]', e.message); }

    try {
      await User.updateMany({}, {
        $pull: {
          followers: username, following: username, closeFriends: username,
          'blockedUsers': { username }, 'profileMutedUsers': { username }, 'dmMutedUsers': { username },
          nicknames: { partner: username }, acceptedConversations: { partner: username },
          hiddenConversations: { partner: username }, notifications: { fromUser: username },
          followRequests: { fromUsername: username },
        }
      });
    } catch (e) { console.error('[CLEANUP userRels]', e.message); }

    try {
      await Post.updateMany({ likedBy: username }, { $pull: { likedBy: username }, $inc: { likes: -1 } });
      await Post.updateMany({}, { $pull: { upvotedBy: username, downvotedBy: username } });
      await Comment.updateMany({}, { $pull: { likedBy: username, upvotedBy: username, downvotedBy: username } });
      await Community.updateMany({}, { $pull: { members: { username } } });
    } catch (e) { console.error('[CLEANUP postRels]', e.message); }

    console.log('[DELETE ACCOUNT] cleanup complete, sending success');
    res.json({ success: true, message: 'Account and all associated data deleted permanently' });
  } catch (err) {
    console.error('[DELETE ACCOUNT] error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:username/follow', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const user = await User.findOne({ username: req.params.username });
    const target = await User.findOne({ username: targetUsername });

    if (!user || !target) return res.status(404).json({ message: 'User not found' });

    // BLOCK CHECK: if either user has blocked the other, block the follow
    const targetBlockedByUser = (user.blockedUsers || []).find(b => b.username === targetUsername);
    const userBlockedByTarget = (target.blockedUsers || []).find(b => b.username === user.username);
    if (targetBlockedByUser || userBlockedByTarget) {
      return res.json(user); // Return unchanged user
    }

    // Ensure arrays exist on both
    if (!user.following) user.following = [];
    if (!target.followers) target.followers = [];
    if (!target.followRequests) target.followRequests = [];
    if (!target.notifications) target.notifications = [];

    const isFollowing = user.following.includes(targetUsername);
    const hasPendingRequest = target.followRequests?.some(r => r.fromUsername === user.username);

    if (isFollowing) {
      // UNFOLLOW
      await User.updateOne({ username: req.params.username }, { $pull: { following: targetUsername } });
      await User.updateOne({ username: targetUsername }, { $pull: { followers: req.params.username } });
    } else if (hasPendingRequest) {
      // CANCEL pending request — also remove the notification
      await User.updateOne(
        { username: targetUsername },
        { $pull: { followRequests: { fromUsername: user.username } } }
      );
      await User.updateOne(
        { username: targetUsername },
        { $pull: { notifications: { type: 'follow_request', fromUser: user.username } } }
      );
    } else if (target.isPrivate) {
      // SEND follow request (private account) — atomically prevent duplicates
      const request = { fromUsername: user.username, timestamp: new Date() };
      const reqResult = await User.updateOne(
        {
          username: targetUsername,
          followRequests: { $not: { $elemMatch: { fromUsername: user.username } } }
        },
        { $push: { followRequests: request } }
      );

      if (reqResult.modifiedCount > 0) {

        // Only add notification if it doesn't already exist
        const notification = {
          type: 'follow_request',
          fromUser: user.username,
          createdAt: new Date(),
          isRead: false
        };
        await User.updateOne(
          {
            username: targetUsername,
            notifications: { $not: { $elemMatch: { type: 'follow_request', fromUser: user.username } } }
          },
          { $push: { notifications: { $each: [notification], $position: 0 } } }
        );
      }
    } else {
      // FOLLOW instantly (public account)
      await User.updateOne({ username: req.params.username }, { $addToSet: { following: targetUsername } });
      await User.updateOne({ username: targetUsername }, { $addToSet: { followers: req.params.username } });

      // Add follow notification
      const notification = {
        type: 'follow',
        fromUser: user.username,
        createdAt: new Date(),
        isRead: false
      };
      await User.findOneAndUpdate(
        { username: targetUsername },
        { $push: { notifications: { $each: [notification], $position: 0 } } }
      );
    }

    const updatedUser = await User.findOne({ username: req.params.username }).lean();
    res.json(updatedUser);
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT FOLLOW REQUEST
app.post('/api/users/:username/follow-requests/accept', async (req, res) => {
  try {
    const { fromUsername } = req.body;
    const user = await User.findOne({ username: req.params.username });
    const requester = await User.findOne({ username: fromUsername });

    if (!user || !requester) return res.status(404).json({ message: 'User not found' });

    // BLOCK CHECK: if either user has blocked the other, reject the accept
    const userBlocked = (user.blockedUsers || []).find(b => b.username === fromUsername);
    const requesterBlocked = (requester.blockedUsers || []).find(b => b.username === req.params.username);
    if (userBlocked || requesterBlocked) {
      return res.status(403).json({ error: 'Cannot accept follow request from a blocked user' });
    }

    // Remove request, add follower/following, remove the follow_request notification
    await User.updateOne(
      { username: req.params.username },
      { $pull: { followRequests: { fromUsername } } }
    );
    await User.updateOne(
      { username: req.params.username },
      { $pull: { notifications: { type: 'follow_request', fromUser: fromUsername } } }
    );
    await User.updateOne(
      { username: req.params.username },
      { $addToSet: { followers: fromUsername } }
    );
    await User.updateOne(
      { username: fromUsername },
      { $addToSet: { following: req.params.username } }
    );

    // Add follow notification to requester (so they know they were accepted)
    const notification = {
      type: 'follow',
      fromUser: req.params.username,
      createdAt: new Date(),
      isRead: false
    };
    await User.findOneAndUpdate(
      { username: fromUsername },
      { $push: { notifications: { $each: [notification], $position: 0 } } }
    );

    const updatedUser = await User.findOne({ username: req.params.username }).lean();
    res.json(updatedUser);
  } catch (err) {
    console.error('Accept follow request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// REJECT FOLLOW REQUEST
app.post('/api/users/:username/follow-requests/reject', async (req, res) => {
  try {
    const { fromUsername } = req.body;

    await User.updateOne(
      { username: req.params.username },
      { $pull: { followRequests: { fromUsername } } }
    );
    await User.updateOne(
      { username: req.params.username },
      { $pull: { notifications: { type: 'follow_request', fromUser: fromUsername } } }
    );

    const updatedUser = await User.findOne({ username: req.params.username }).lean();
    res.json(updatedUser);
  } catch (err) {
    console.error('Reject follow request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// BLOCK / MUTE ROUTES
// BLOCK USER
app.post('/api/users/:username/block', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername || targetUsername === req.params.username) return res.status(400).json({ error: 'Invalid target' });
    const user = await User.findOne({ username: req.params.username });
    const target = await User.findOne({ username: targetUsername });
    if (!user || !target) return res.status(404).json({ error: 'User not found' });
    if ((user.blockedUsers || []).find(b => b.username === targetUsername)) {
      return res.json(user);
    }
    // Remove from following/followers
    await User.updateOne({ username: req.params.username }, { $pull: { following: targetUsername } });
    await User.updateOne({ username: targetUsername }, { $pull: { followers: req.params.username } });
    await User.updateOne({ username: req.params.username }, { $pull: { followers: targetUsername } });
    await User.updateOne({ username: targetUsername }, { $pull: { following: req.params.username } });
    // Add to blocked list
    await User.updateOne(
      { username: req.params.username },
      { $push: { blockedUsers: { username: targetUsername, blockedAt: new Date() } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    // Remove any follow requests between them
    await User.updateOne({ username: targetUsername }, { $pull: { followRequests: { fromUsername: req.params.username } } });
    await User.updateOne({ username: req.params.username }, { $pull: { followRequests: { fromUsername: targetUsername } } });
    res.json(updated);
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UNBLOCK USER
app.post('/api/users/:username/unblock', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    await User.updateOne(
      { username: req.params.username },
      { $pull: { blockedUsers: { username: targetUsername } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    res.json(updated);
  } catch (err) {
    console.error('Unblock error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET BLOCKED USERS
app.get('/api/users/:username/blocked', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('blockedUsers').lean();
    res.json(user?.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHECK BLOCK STATUS
app.get('/api/users/:username/block-check/:targetUsername', async (req, res) => {
  try {
    const { username, targetUsername } = req.params;
    const user = await User.findOne({ username }).select('blockedUsers').lean();
    const blockedByMe = !!(user?.blockedUsers || []).find(b => b.username === targetUsername);
    res.json({ blockedByMe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROFILE MUTE
app.post('/api/users/:username/profile-mute', async (req, res) => {
  try {
    const { targetUsername, duration = 'forever' } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
    let expiresAt = null;
    if (duration === '8h') expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    else if (duration === '24h') expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    else if (duration === '7d') expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await User.updateOne(
      { username: req.params.username },
      { $pull: { profileMutedUsers: { username: targetUsername } } }
    );
    await User.updateOne(
      { username: req.params.username },
      { $push: { profileMutedUsers: { username: targetUsername, duration, mutedAt: new Date(), expiresAt } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    res.json(updated);
  } catch (err) {
    console.error('Profile mute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PROFILE UNMUTE
app.post('/api/users/:username/profile-unmute', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    await User.updateOne(
      { username: req.params.username },
      { $pull: { profileMutedUsers: { username: targetUsername } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    res.json(updated);
  } catch (err) {
    console.error('Profile unmute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET PROFILE MUTED USERS
app.get('/api/users/:username/profile-muted', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('profileMutedUsers').lean();
    res.json(user?.profileMutedUsers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DM MUTE
app.post('/api/users/:username/dm-mute', async (req, res) => {
  try {
    const { targetUsername, duration = 'forever' } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
    let expiresAt = null;
    if (duration === '8h') expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    else if (duration === '24h') expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    else if (duration === '7d') expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await User.updateOne(
      { username: req.params.username },
      { $pull: { dmMutedUsers: { username: targetUsername } } }
    );
    await User.updateOne(
      { username: req.params.username },
      { $push: { dmMutedUsers: { username: targetUsername, duration, mutedAt: new Date(), expiresAt } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    res.json(updated);
  } catch (err) {
    console.error('DM mute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DM UNMUTE
app.post('/api/users/:username/dm-unmute', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    await User.updateOne(
      { username: req.params.username },
      { $pull: { dmMutedUsers: { username: targetUsername } } }
    );
    const updated = await User.findOne({ username: req.params.username }).lean();
    res.json(updated);
  } catch (err) {
    console.error('DM unmute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET DM-MUTED USERS
app.get('/api/users/:username/dm-muted', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('dmMutedUsers').lean();
    res.json(user?.dmMutedUsers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLOSE FRIENDS ROUTES
app.post('/api/users/:username/close-friends/add', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
    if (targetUsername === req.params.username) return res.status(400).json({ error: 'Cannot add yourself' });
    // Verify target is a follower, following, or mutual
    const user = await User.findOne({ username: req.params.username }).select('followers following').lean();
    const isFollower = (user?.followers || []).includes(targetUsername);
    const isFollowing = (user?.following || []).includes(targetUsername);
    if (!isFollower && !isFollowing) {
      return res.status(400).json({ error: 'Can only add connected users (followers/following)' });
    }
    await User.updateOne(
      { username: req.params.username },
      { $addToSet: { closeFriends: targetUsername } }
    );
    const updated = await User.findOne({ username: req.params.username }).select('closeFriends').lean();
    // Return enriched close friend info
    const closeFriends = updated?.closeFriends || [];
    const users = await User.find({ username: { $in: closeFriends } }).select('username name profilePhoto photoVisibility followers').lean();
    const viewer = req.params.username;
    const enriched = users.map(u => {
      const obj = { ...u };
      if (!canViewPhoto(u, viewer)) obj.profilePhoto = '';
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    console.error('Close friends add error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:username/close-friends/remove', async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
    await User.updateOne(
      { username: req.params.username },
      { $pull: { closeFriends: targetUsername } }
    );
    const updated = await User.findOne({ username: req.params.username }).select('closeFriends').lean();
    const closeFriends = updated?.closeFriends || [];
    const users = await User.find({ username: { $in: closeFriends } }).select('username name profilePhoto photoVisibility followers').lean();
    const viewer = req.params.username;
    const enriched = users.map(u => {
      const obj = { ...u };
      if (!canViewPhoto(u, viewer)) obj.profilePhoto = '';
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    console.error('Close friends remove error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:username/close-friends', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('closeFriends').lean();
    const closeFriends = user?.closeFriends || [];
    const users = await User.find({ username: { $in: closeFriends } }).select('username name profilePhoto photoVisibility followers').lean();
    const viewer = req.params.username;
    const enriched = users.map(u => {
      const obj = { ...u };
      if (!canViewPhoto(u, viewer)) obj.profilePhoto = '';
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    console.error('Close friends list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// NICKNAMES ROUTES
app.post('/api/users/:username/nicknames', async (req, res) => {
  try {
    const { partner, nickname } = req.body;
    if (!partner) return res.status(400).json({ error: 'partner required' });
    // Remove existing nickname for this partner, then add new one
    await User.updateOne(
      { username: req.params.username },
      { $pull: { nicknames: { partner } } }
    );
    if (nickname && nickname.trim()) {
      await User.updateOne(
        { username: req.params.username },
        { $push: { nicknames: { partner, nickname: nickname.trim() } } }
      );
    }
    const updated = await User.findOne({ username: req.params.username }).select('nicknames').lean();
    res.json(updated?.nicknames || []);
  } catch (err) {
    console.error('Nickname set error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:username/nicknames/:partner', async (req, res) => {
  try {
    await User.updateOne(
      { username: req.params.username },
      { $pull: { nicknames: { partner: req.params.partner } } }
    );
    const updated = await User.findOne({ username: req.params.username }).select('nicknames').lean();
    res.json(updated?.nicknames || []);
  } catch (err) {
    console.error('Nickname remove error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:username/nicknames', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('nicknames').lean();
    res.json(user?.nicknames || []);
  } catch (err) {
    console.error('Nicknames list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// RECENT SEARCHES ROUTES
app.get('/api/users/:username/search/recent', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('recentSearches');
    res.json(user?.recentSearches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:username/search/recent', async (req, res) => {
  try {
    const { targetUsername, targetName } = req.body;
    // Remove existing entry for this user (to avoid dupes) then prepend
    await User.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { recentSearches: { username: targetUsername } } }
    );
    await User.findOneAndUpdate(
      { username: req.params.username },
      {
        $push: {
          recentSearches: {
            $each: [{ username: targetUsername, name: targetName || '', searchedAt: new Date() }],
            $position: 0,
            $slice: 20
          }
        }
      }
    );
    const updated = await User.findOne({ username: req.params.username }).select('recentSearches');
    res.json(updated?.recentSearches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:username/search/recent/:targetUsername', async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { recentSearches: { username: req.params.targetUsername } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:username/search/recent', async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { recentSearches: [] } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT MESSAGES FROM NON-FOLLOWER
app.post('/api/users/:username/accept-messages', async (req, res) => {
  try {
    const { username } = req.params;
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'targetUsername required' });
    await User.updateOne(
      { username },
      { $pull: { acceptedConversations: { partner: targetUsername } } }
    );
    await User.updateOne(
      { username },
      { $push: { acceptedConversations: { partner: targetUsername, acceptedAt: new Date() } } }
    );
    const updated = await User.findOne({ username }).select('acceptedConversations').lean();
    res.json(updated?.acceptedConversations || []);
  } catch (err) {
    console.error('Accept messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// MESSAGE ROUTES
app.get('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    // BLOCK CHECK
    const user1Doc = await User.findOne({ username: user1 }).select('blockedUsers').lean();
    const user2Doc = await User.findOne({ username: user2 }).select('blockedUsers').lean();
    const u1Blocked = (user1Doc?.blockedUsers || []).find(b => b.username === user2);
    const u2Blocked = (user2Doc?.blockedUsers || []).find(b => b.username === user1);
    if (u1Blocked || u2Blocked) {
      return res.json({ messages: [], needsAcceptance: false });
    }
    // Fetch messages (excluding those deleted for viewer)
    const allMessages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 });
    const messages = allMessages;
    // Check if viewer (user1) needs to accept messages from partner (user2)
    const partnerDoc = await User.findOne({ username: user2 }).select('following').lean();
    const viewerDoc = await User.findOne({ username: user1 }).select('following acceptedConversations').lean();
    const viewerFollows = viewerDoc?.following?.includes(user2);
    const partnerFollows = partnerDoc?.following?.includes(user1);
    const viewerAccepted = (viewerDoc?.acceptedConversations || []).some(a => a.partner === user2);
    const needsAcceptance = !viewerFollows && !partnerFollows && !viewerAccepted;
    res.json({ messages, needsAcceptance });
  } catch (err) {
    console.error('Messages fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { sender, receiver, content, image } = req.body;
    // BLOCK CHECK + DM MUTE CHECK
    const senderUser = await User.findOne({ username: sender }).select('blockedUsers following followers dmMutedUsers').lean();
    const receiverUser = await User.findOne({ username: receiver }).select('blockedUsers following followers dmMutedUsers').lean();
    const senderBlocked = (senderUser?.blockedUsers || []).find(b => b.username === receiver);
    const receiverBlocked = (receiverUser?.blockedUsers || []).find(b => b.username === sender);
    if (senderBlocked || receiverBlocked) {
      return res.status(403).json({ error: 'Message could not be sent' });
    }
    // Always create Message (mute NEVER blocks delivery)
    const message = new Message({ sender, receiver, content: content || '', image: image || null });
    await message.save();
    // DM MUTE CHECK: if receiver has dm-muted sender, suppress notification only
    const dmMuted = (receiverUser?.dmMutedUsers || []).find(m => m.username === sender);
    const isDmMuted = dmMuted && (dmMuted.duration === 'forever' || (dmMuted.expiresAt && new Date(dmMuted.expiresAt) > new Date()));
    if (!isDmMuted) {
      const notif = {
        type: 'message',
        fromUser: sender,
        username: receiver,
        createdAt: new Date(),
        isRead: false
      };
      await User.updateOne(
        { username: receiver },
        { $push: { notifications: { $each: [notif], $position: 0 } } }
      );
    }
    res.json({ type: 'message', data: message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message });
  }
});

// CONVERSATIONS ROUTES
app.get('/api/conversations/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const conversations = await Message.aggregate([
      { $match: {
        $or: [
          { sender: username },
          { receiver: username }
        ]
      }},
      {
        $group: {
          _id: {
            partner: {
              $cond: [
                { $eq: ['$sender', username] },
                '$receiver',
                '$sender'
              ]
            }
          },
          lastMessage: { $last: '$content' },
          lastTimestamp: { $last: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { 'lastTimestamp': -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          let: { partner: '$_id.partner' },
          pipeline: [
            { $match: { $expr: { $eq: ['$username', '$$partner'] } } },
            { $project: { username: 1, name: 1, bio: 1, profilePhoto: 1, photoVisibility: 1, followers: 1 } }
          ],
          as: 'partnerInfo'
        }
      },
      { $unwind: { path: '$partnerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          partner: '$_id.partner',
          partnerInfo: { $ifNull: ['$partnerInfo', { username: '$_id.partner' }] },
          lastMessage: 1,
          lastTimestamp: 1,
          unreadCount: { $cond: [{ $gt: ['$count', 0] }, 1, 0] }
        }
      }
    ]);
    // BLOCK FILTER + DM MUTE INFO
    const currentUserDoc = await User.findOne({ username }).select('blockedUsers dmMutedUsers').lean();
    const blockedSet = new Set((currentUserDoc?.blockedUsers || []).map(b => b.username));
    // Also find users who blocked currentUser
    const blockers = await User.find({ 'blockedUsers.username': username }).select('username').lean();
    blockers.forEach(b => blockedSet.add(b.username));
    // Build dm-muted set (non-expired)
    const dmMutedSet = new Set();
    for (const m of (currentUserDoc?.dmMutedUsers || [])) {
      if (m.duration === 'forever' || (m.expiresAt && new Date(m.expiresAt) > new Date())) {
        dmMutedSet.add(m.username);
      }
    }
    // Filter hidden conversations (deleted chats) — re-appear if new messages after hiddenAt
    const currentFullUser = await User.findOne({ username }).select('following acceptedConversations hiddenConversations').lean();
    const hiddenMap = new Map((currentFullUser?.hiddenConversations || []).map(h => [h.partner, h.hiddenAt]));
    let filtered = conversations.filter(c => {
      if (blockedSet.has(c.partner)) return false;
      const hiddenAt = hiddenMap.get(c.partner);
      if (!hiddenAt) return true;
      return c.lastTimestamp && new Date(c.lastTimestamp) > new Date(hiddenAt);
    });
    const partnerNames = filtered.map(c => c.partner);
    const partners = await User.find({ username: { $in: partnerNames } }).select('username following').lean();
    const partnerFollowMap = {};
    for (const p of partners) {
      partnerFollowMap[p.username] = (p.following || []).includes(username);
    }
    filtered = filtered.map(c => {
      const viewFollows = currentFullUser?.following?.includes(c.partner);
      const partnerFollows = partnerFollowMap[c.partner] || false;
      const viewerAccepted = (currentFullUser?.acceptedConversations || []).some(a => a.partner === c.partner);
      const needsAcceptance = !viewFollows && !partnerFollows && !viewerAccepted;
      return { ...c, dmMuted: dmMutedSet.has(c.partner), needsAcceptance };
    });
    // Apply photo visibility to conversation partner avatars
    filtered = filtered.map(c => {
      if (c.partnerInfo && !canViewPhoto(c.partnerInfo, username)) {
        c.partnerInfo.profilePhoto = '';
      }
      return c;
    });
    res.json(filtered);
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE CHAT (hide conversation from user's inbox)
app.post('/api/conversations/:username/:partner/delete', async (req, res) => {
  try {
    const { username, partner } = req.params;
    await User.updateOne(
      { username },
      { $pull: { hiddenConversations: { partner } } }
    );
    await User.updateOne(
      { username },
      { $addToSet: { hiddenConversations: { partner, hiddenAt: new Date() } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE MESSAGE FOR EVERYONE
app.post('/api/messages/:messageId/delete-everyone', async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const age = Date.now() - new Date(msg.timestamp).getTime();
    if (age > 30 * 60 * 1000) {
      return res.status(403).json({ error: 'Time limit expired' });
    }
    msg.isDeleted = true;
    msg.content = 'The user deleted this message';
    msg.image = null;
    await msg.save();
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDIT MESSAGE (within 30 min)
app.put('/api/messages/:messageId/edit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const age = Date.now() - new Date(msg.timestamp).getTime();
    if (age > 30 * 60 * 1000) {
      return res.status(403).json({ error: 'Time limit expired' });
    }
    msg.editHistory.push({ content: msg.content, editedAt: new Date() });
    msg.content = content;
    msg.editedAt = new Date();
    await msg.save();
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER POSTS — dedicated endpoint so the Profile page doesn't need to fetch the entire feed
app.get('/api/users/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const { currentUsername } = req.query;

    const posts = await Post.find({ username, type: { $in: ['post'] } })
      .sort({ createdAt: -1 })
      .lean();

    // Blocked interests filter for the viewer
    let filtered = posts;
    if (currentUsername) {
      const viewer = await User.findOne({ username: currentUsername }).select('blockedInterests').lean();
      if (viewer?.blockedInterests?.length > 0) {
        filtered = filterBlockedInterests(filtered, viewer.blockedInterests);
      }
    }

    // Attach profilePhoto
    const userDoc = await User.findOne({ username }).select('username profilePhoto photoVisibility followers').lean();
    const photo = userDoc && canViewPhoto(userDoc, currentUsername) ? userDoc.profilePhoto || '' : '';
    const result = filtered.map(p => ({ ...p, profilePhoto: photo }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ROUTES
app.get('/api/posts', async (req, res) => {
  try {
    const { currentUsername } = req.query;

    const [stories, allPosts] = await Promise.all([
      Post.find({ type: 'story', createdAt: { $gte: new Date(Date.now() - 86400000) } })
        .sort({ createdAt: -1 })
        .lean(),
      Post.find({ type: { $ne: 'story' } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    let allContent = [...stories, ...allPosts];

    // PRIVACY FILTER
    if (currentUsername) {
      const allUsers = await User.find().select('username isPrivate followers').lean();
      const privacyMap = {};
      for (const u of allUsers) {
        privacyMap[u.username] = { isPrivate: u.isPrivate, followers: u.followers || [] };
      }
      allContent = allContent.filter(item => {
        const owner = privacyMap[item.username];
        if (!owner) return true;
        if (!owner.isPrivate) return true;
        if (item.username === currentUsername) return true;
        return owner.followers.includes(currentUsername);
      });
    }

    // BLOCK FILTER + PROFILE MUTE FILTER + BLOCKED INTERESTS FILTER
    if (currentUsername) {
      const [currentUser, blockers] = await Promise.all([
        User.findOne({ username: currentUsername }).select('blockedUsers profileMutedUsers blockedInterests').lean(),
        User.find({ 'blockedUsers.username': currentUsername }).select('username').lean(),
      ]);
      const blockedUsernames = (currentUser?.blockedUsers || []).map(b => b.username);
      const blockerUsernames = blockers.map(b => b.username);
      const allBlocked = new Set([...blockedUsernames, ...blockerUsernames]);
      const mutedUsernames = new Set();
      for (const m of (currentUser?.profileMutedUsers || [])) {
        if (m.duration === 'forever' || (m.expiresAt && new Date(m.expiresAt) > new Date())) {
          mutedUsernames.add(m.username);
        }
      }
      const hidden = new Set([...allBlocked, ...mutedUsernames]);
      if (hidden.size > 0) {
        allContent = allContent.filter(item => !hidden.has(item.username));
      }
      if (currentUser?.blockedInterests?.length > 0) {
        allContent = filterBlockedInterests(allContent, currentUser.blockedInterests);
      }
    }

    // Attach profilePhoto (respecting photo visibility)
    const allUsernames = [...new Set(allContent.map(p => p.username))];
    const userPhotos = await User.find({ username: { $in: allUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const photoMap = {};
    for (const u of userPhotos) {
      photoMap[u.username] = canViewPhoto(u, currentUsername) ? (u.profilePhoto || '') : '';
    }
    allContent = allContent.map(p => ({ ...p, profilePhoto: photoMap[p.username] || '' }));

    res.json(allContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { username, title, content, image, type = 'post', poll, tags } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    if (type !== 'discussion' && !image) return res.status(400).json({ error: 'Image required for this post type' });
    const postData = { username, title, content, image, type };
    if (poll) postData.poll = poll;
    if (tags) postData.tags = Array.isArray(tags) ? tags : [tags];
    const post = new Post(postData);
    await post.save();
    // Link to user
    await User.findOneAndUpdate(
      { username },
      { $push: { posts: post._id } }
    );
    const populatedPost = await Post.findById(post._id).lean();

    // FRIEND POST NOTIFICATION: notify all followers (except those who profile-muted the author)
    if (type !== 'discussion') {
      const authorUser = await User.findOne({ username }).select('followers profileMutedUsers').lean();
      if (authorUser?.followers?.length > 0) {
        const allFollowers = await User.find({ username: { $in: authorUser.followers } })
          .select('username profileMutedUsers notifications')
          .lean();
        for (const follower of allFollowers) {
          // Skip if follower has profile-muted the author
          const muteEntry = (follower.profileMutedUsers || []).find(m => m.username === username);
          if (muteEntry) {
            if (muteEntry.duration !== 'forever' && muteEntry.expiresAt && new Date(muteEntry.expiresAt) > new Date()) {
              continue; // Still muted
            }
            if (muteEntry.duration === 'forever') continue;
          }
          await User.updateOne(
            { username: follower.username },
            {
              $push: {
                notifications: {
                  $each: [{
                    type: 'post',
                    fromUser: username,
                    postId: post._id,
                    username: follower.username,
                    createdAt: new Date(),
                    isRead: false
                  }],
                  $position: 0
                }
              }
            }
          );
        }
      }
    }

    res.json(populatedPost);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

const INTEREST_KEYWORDS = [
  { interest: 'gaming', keywords: ['valorant', 'minecraft', 'elden ring', 'gaming', 'game', 'games', 'gamer', 'nintendo', 'playstation', 'xbox', 'pc gaming', 'league of legends', 'fortnite', 'call of duty', 'gta', 'roblox', 'steam', 'esports', 'speedrun', 'retro', 'arcade', 'rpg', 'fps'] },
  { interest: 'anime', keywords: ['anime', 'manga', 'naruto', 'one piece', 'attack on titan', 'aot', 'jujutsu kaisen', 'demon slayer', 'dragon ball', 'pokemon', 'studio ghibli', 'spirited away', 'death note', 'fullmetal', 'hunter x hunter', 'cosplay', 'waifu', 'otaku', 'shonen', 'isekai'] },
  { interest: 'movies', keywords: ['movie', 'film', 'cinema', 'netflix', 'marvel', 'dc', 'hollywood', 'bollywood', 'oscar', 'thriller', 'horror', 'comedy', 'drama', 'documentary', 'sci-fi', 'imdb', 'blockbuster', 'director', 'screenplay', 'animation'] },
  { interest: 'music', keywords: ['music', 'song', 'album', 'spotify', 'concert', 'band', 'guitar', 'piano', 'hip hop', 'rock', 'pop', 'jazz', 'classical', 'lofi', 'playlist', 'singer', 'producer', 'festival', 'vinyl', 'beat'] },
  { interest: 'art', keywords: ['art', 'drawing', 'painting', 'sketch', 'digital art', 'illustration', 'watercolor', 'acrylic', 'canvas', 'artist', 'gallery', 'exhibition', 'sculpture', 'portrait', 'abstract', 'surreal', 'creative', 'sketchbook', 'ink', 'traditional'] },
  { interest: 'design', keywords: ['design', 'ui', 'ux', 'graphic design', 'typography', 'logo', 'branding', 'figma', 'photoshop', 'illustrator', 'canva', 'color palette', 'wireframe', 'prototype', 'motion', '3d', 'blender', 'minimal', 'layout', 'visual'] },
  { interest: 'photography', keywords: ['photography', 'photo', 'camera', 'portrait', 'landscape', 'street photography', 'sony', 'canon', 'nikon', 'fujifilm', 'film photography', 'edit', 'lightroom', 'capture', 'lens', 'aperture', 'composition', 'golden hour', 'night photography', 'vintage'] },
  { interest: 'technology', keywords: ['technology', 'programming', 'coding', 'ai', 'artificial intelligence', 'web dev', 'react', 'javascript', 'python', 'machine learning', 'blockchain', 'cybersecurity', 'app dev', 'startup', 'saas', 'cloud', 'devops', 'data science', 'ui/ux', 'figma'] },
  { interest: 'coding', keywords: ['coding', 'programming', 'javascript', 'python', 'java', 'rust', 'go lang', 'typescript', 'react', 'node.js', 'docker', 'api', 'algorithm', 'open source', 'github', 'terminal', 'debug', 'framework', 'backend', 'frontend'] },
  { interest: 'ai', keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'llm', 'neural network', 'gpt', 'openai', 'stable diffusion', 'midjourney', 'prompt', 'automation', 'computer vision', 'nlp', 'tensorflow', 'pytorch', 'data', 'model', 'inference'] },
  { interest: 'science', keywords: ['science', 'physics', 'biology', 'chemistry', 'space', 'nasa', 'astronomy', 'research', 'lab', 'experiment', 'quantum', 'dna', 'evolution', 'climate', 'particle', 'telescope', 'mars', 'genetics', 'neuroscience', 'discovery'] },
  { interest: 'books', keywords: ['book', 'reading', 'novel', 'author', 'library', 'fantasy', 'sci-fi', 'fiction', 'nonfiction', 'bestseller', 'thriller', 'mystery', 'biography', 'philosophy', 'self-help', 'page-turner', 'literature', 'poetry', 'ebook', 'paperback'] },
  { interest: 'fitness', keywords: ['fitness', 'gym', 'workout', 'bodybuilding', 'yoga', 'cardio', 'crossfit', 'running', 'marathon', 'pilates', 'protein', 'calisthenics', 'weightlifting', 'hiit', 'meditation', 'mindfulness', 'nutrition', 'diet', 'abs', 'strength'] },
  { interest: 'health', keywords: ['health', 'wellness', 'mental health', 'sleep', 'self-care', 'therapy', 'anxiety', 'stress', 'mindfulness', 'meditation', 'immune', 'vitamin', 'healthy', 'recovery', 'hydration', 'skin care', 'gut health', 'hormone', 'energy', 'balance'] },
  { interest: 'food', keywords: ['food', 'cooking', 'baking', 'recipe', 'restaurant', 'pizza', 'sushi', 'pasta', 'dessert', 'vegan', 'vegetarian', 'keto', 'meal prep', 'street food', 'brunch', 'coffee', 'wine', 'cocktail', 'chef', 'gourmet'] },
  { interest: 'travel', keywords: ['travel', 'photography', 'adventure', 'backpacking', 'hiking', 'beach', 'mountains', 'road trip', 'vacation', 'explore', 'culture', 'wanderlust', 'solo travel', 'budget travel', 'luxury travel', 'nature', 'sunset', 'camping', 'roadtrip', 'destination'] },
  { interest: 'sports', keywords: ['sports', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'formula 1', 'nfl', 'nba', 'uefa', 'olympics', 'athlete', 'training', 'championship', 'league', 'stadium', 'goal', 'match', 'score', 'highlight'] },
  { interest: 'finance', keywords: ['finance', 'investing', 'stock', 'crypto', 'bitcoin', 'trading', 'savings', 'budget', 'passive income', 'real estate', 'dividend', 'portfolio', 'market', 'wealth', 'retirement', 'debt', 'credit', 'tax', 'financial', 'money'] },
  { interest: 'productivity', keywords: ['productivity', 'focus', 'time management', 'habit', 'routine', 'efficiency', 'goals', 'tracking', 'todo', 'organization', 'planning', 'deep work', 'pomodoro', 'minimalism', 'discipline', 'motivation', 'notion', 'workflow', 'schedule', 'hack'] },
  { interest: 'startups', keywords: ['startup', 'entrepreneur', 'founder', 'venture capital', 'fundraising', 'mvp', 'growth', 'scale', 'product market', 'pivot', 'accelerator', 'y combinator', 'series a', 'bootstrap', 'angel', 'pitch', 'investor', 'exit', 'saas', 'disrupt'] }
];

// GET DISCUSSION POSTS with interest filtering + sorting
app.get('/api/posts/discussions', async (req, res) => {
  try {
    const { username, sort: sortParam, search } = req.query;
    const sortMode = ['trending', 'popular', 'recent'].includes(sortParam) ? sortParam : 'trending';

    // Run all three initial queries in parallel
    const [discussions, userDoc, currentUser, blockers] = await Promise.all([
      Post.find({ type: 'discussion' }).lean(),
      username ? User.findOne({ username }).select('interests').lean() : null,
      username ? User.findOne({ username }).select('blockedUsers profileMutedUsers blockedInterests').lean() : null,
      username ? User.find({ 'blockedUsers.username': username }).select('username').lean() : [],
    ]);

    const userInterests = userDoc?.interests || [];

    // Block + profile mute filter
    if (username) {
      const blockedUsernames = (currentUser?.blockedUsers || []).map(b => b.username);
      const blockerUsernames = blockers.map(b => b.username);
      const allBlocked = new Set([...blockedUsernames, ...blockerUsernames]);
      const mutedUsernames = new Set();
      for (const m of (currentUser?.profileMutedUsers || [])) {
        if (m.duration === 'forever' || (m.expiresAt && new Date(m.expiresAt) > new Date())) {
          mutedUsernames.add(m.username);
        }
      }
      const hidden = new Set([...allBlocked, ...mutedUsernames]);
      if (hidden.size > 0) {
        discussions = discussions.filter(d => !hidden.has(d.username));
      }
      if (currentUser?.blockedInterests?.length > 0) {
        discussions = filterBlockedInterests(discussions, currentUser.blockedInterests);
      }
    }

    // Interest filtering (skip if search is active)
    if (search && search.trim()) {
      const q = search.toLowerCase();
      discussions = discussions.filter(d => {
        const text = [d.title, d.content, ...(d.tags || [])].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    } else if (userInterests.length > 0) {
      discussions = discussions.filter(d => {
        // Always include the requesting user's own discussions
        if (username && d.username === username) return true;
        const text = [d.title, d.content, ...(d.tags || [])].filter(Boolean).join(' ').toLowerCase();
        for (const { interest, keywords } of INTEREST_KEYWORDS) {
          if (!userInterests.includes(interest)) continue;
          for (const kw of keywords) {
            if (text.includes(kw)) return true;
          }
        }
        return false;
      });
    }

    // Apply sort
    if (sortMode === 'recent') {
      discussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortMode === 'popular') {
      discussions.sort((a, b) => ((b.comments || 0) + (b.likes || 0)) - ((a.comments || 0) + (a.likes || 0)));
    } else {
      // trending: engagement / age^1.5
      const now = Date.now();
      discussions.sort((a, b) => {
        const engagementA = (a.comments || 0) + (a.likes || 0) + 1;
        const hoursAgeA = (now - new Date(a.createdAt).getTime()) / 3600000;
        const scoreA = engagementA / Math.pow((hoursAgeA + 2), 1.5);

        const engagementB = (b.comments || 0) + (b.likes || 0) + 1;
        const hoursAgeB = (now - new Date(b.createdAt).getTime()) / 3600000;
        const scoreB = engagementB / Math.pow((hoursAgeB + 2), 1.5);

        return scoreB - scoreA;
      });
    }

    // Attach profilePhoto (respecting photo visibility)
    const discUsernames = [...new Set(discussions.map(d => d.username))];
    const discUsers = await User.find({ username: { $in: discUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const discPhotoMap = {};
    for (const u of discUsers) {
      if (canViewPhoto(u, username)) {
        discPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        discPhotoMap[u.username] = '';
      }
    }
    discussions = discussions.map(d => ({ ...d, profilePhoto: discPhotoMap[d.username] || '' }));

    res.json(discussions);
  } catch (err) {
    console.error('Discussions fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE POST BY ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    let post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Attach profilePhoto (respecting photo visibility)
    const { username: viewerUsername } = req.query;
    const postUser = await User.findOne({ username: post.username }).select('profilePhoto photoVisibility followers').lean();
    if (postUser && canViewPhoto(postUser, viewerUsername)) {
      post.profilePhoto = postUser.profilePhoto || '';
    } else {
      post.profilePhoto = '';
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET POSTS BY COMMUNITY
app.get('/api/posts/community/:communityId', async (req, res) => {
  try {
    let posts = await Post.find({ communityId: req.params.communityId })
      .sort({ createdAt: -1 })
      .lean();
    // Blocked interests filter for the viewer
    const { currentUsername } = req.query;
    if (currentUsername) {
      const viewer = await User.findOne({ username: currentUsername }).select('blockedInterests').lean();
      if (viewer?.blockedInterests?.length > 0) {
        posts = filterBlockedInterests(posts, viewer.blockedInterests);
      }
    }
    // Attach profilePhoto (respecting photo visibility)
    const commUsernames = [...new Set(posts.map(p => p.username))];
    const commUsers = await User.find({ username: { $in: commUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const commPhotoMap = {};
    for (const u of commUsers) {
      if (canViewPhoto(u, req.query.currentUsername)) {
        commPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        commPhotoMap[u.username] = '';
      }
    }
    posts = posts.map(p => ({ ...p, profilePhoto: commPhotoMap[p.username] || '' }));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIKE/UNLIKE POST
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likedBy.includes(username);
    if (isLiked) {
      await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likedBy: username },
        $inc: { likes: -1 }
      });
    } else {
      await Post.findByIdAndUpdate(req.params.id, {
        $addToSet: { likedBy: username },
        $inc: { likes: 1 }
      });

      // Add notification ONLY when liking (not unliking) and NOT own post
      if (username !== post.username) {
        const notification = {
          type: 'like',
          fromUser: username,
          postId: post._id,
          createdAt: new Date(),
          isRead: false
        };
        await User.findOneAndUpdate(
          { username: post.username },
          { $push: { notifications: { $each: [notification], $position: 0 } } }
        );
      }
    }

    const updatedPost = await Post.findById(req.params.id).lean();
    res.json(updatedPost);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET COMMENTS FOR POST
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const isDiscussion = post && post.type === 'discussion';
    
    let comments = await Comment.find({ postId: req.params.id }).lean();
    
    if (isDiscussion) {
      comments.sort((a, b) => {
        const netA = (a.upvotes || 0) - (a.downvotes || 0);
        const netB = (b.upvotes || 0) - (b.downvotes || 0);
        if (netA !== netB) return netB - netA;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // older first for same score
      });
    } else {
      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Attach profilePhoto to each comment (respecting photo visibility)
    const commentUsernames = [...new Set(comments.map(c => c.username))];
    const { currentUsername } = req.query;
    const commentUsers = await User.find({ username: { $in: commentUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const commentPhotoMap = {};
    for (const u of commentUsers) {
      if (canViewPhoto(u, currentUsername)) {
        commentPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        commentPhotoMap[u.username] = '';
      }
    }
    comments = comments.map(c => ({ ...c, profilePhoto: commentPhotoMap[c.username] || '' }));
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET COMMENTS BY USER
app.get('/api/comments/user/:username', async (req, res) => {
  try {
    let comments = await Comment.find({ username: req.params.username }).sort({ createdAt: -1 }).lean();
    // Attach profilePhoto (respecting photo visibility)
    const { currentUsername } = req.query;
    const commentUsers = await User.find({ username: req.params.username }).select('profilePhoto photoVisibility followers').lean();
    const userDoc = commentUsers[0];
    const photo = (userDoc && canViewPhoto(userDoc, currentUsername)) ? (userDoc.profilePhoto || '') : '';
    comments = comments.map(c => ({ ...c, profilePhoto: photo }));
    res.json(comments);
  } catch (err) {
    console.error('Get comments by user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADD COMMENT
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { username, content, parentId } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment content required' });

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
    }

    const comment = new Comment({
      postId: req.params.id,
      username,
      content,
      parentId: parentId || null,
      upvotes: 0,
      upvotedBy: [],
      downvotes: 0,
      downvotedBy: []
    });
    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { comments: 1 } });

    const populatedComment = await Comment.findById(comment._id).lean();
    res.json(populatedComment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SAVE/UNSAVE POST
app.post('/api/posts/:id/save', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const postId = req.params.id;
    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { savedPosts: postId }
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { savedPosts: postId }
      });
    }

    const updatedUser = await User.findOne({ username }).lean();
    res.json(updatedUser);
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// VOTE ON POLL
app.post('/api/posts/:id/vote', async (req, res) => {
  try {
    const { username, optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.poll || !post.poll.options || optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ message: 'Invalid poll or option' });
    }

    const option = post.poll.options[optionIndex];
    if (option.voters.includes(username)) {
      return res.status(400).json({ message: 'Already voted' });
    }

    const alreadyVoted = post.poll.options.some(o => o.voters.includes(username));
    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    option.votes += 1;
    option.voters.push(username);
    post.poll.totalVotes += 1;
    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Poll vote error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPVOTE / DOWNVOTE DISCUSSION TOPIC
app.post('/api/posts/:id/vote-topic', async (req, res) => {
  try {
    const { username, voteType } = req.body; // 'upvote', 'downvote', 'unvote'
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.likedBy) post.likedBy = [];
    if (!post.downvotedBy) post.downvotedBy = [];

    const hasUpvoted = post.likedBy.includes(username);
    const hasDownvoted = post.downvotedBy.includes(username);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        post.likedBy = post.likedBy.filter(u => u !== username);
      } else {
        post.likedBy.push(username);
        post.downvotedBy = post.downvotedBy.filter(u => u !== username);
      }
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        post.downvotedBy = post.downvotedBy.filter(u => u !== username);
      } else {
        post.downvotedBy.push(username);
        post.likedBy = post.likedBy.filter(u => u !== username);
      }
    } else if (voteType === 'unvote') {
      post.likedBy = post.likedBy.filter(u => u !== username);
      post.downvotedBy = post.downvotedBy.filter(u => u !== username);
    }

    post.likes = post.likedBy.length;
    post.downvotes = post.downvotedBy.length;
    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Vote topic error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPVOTE / DOWNVOTE DISCUSSION COMMENT (legacy — also tracked in Vote collection)
app.post('/api/posts/:postId/comments/:commentId/vote', async (req, res) => {
  try {
    const { username, voteType } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.upvotedBy) comment.upvotedBy = [];
    if (!comment.downvotedBy) comment.downvotedBy = [];

    const hasUpvoted = comment.upvotedBy.includes(username);
    const hasDownvoted = comment.downvotedBy.includes(username);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        comment.upvotedBy = comment.upvotedBy.filter(u => u !== username);
      } else {
        comment.upvotedBy.push(username);
        comment.downvotedBy = comment.downvotedBy.filter(u => u !== username);
      }
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        comment.downvotedBy = comment.downvotedBy.filter(u => u !== username);
      } else {
        comment.downvotedBy.push(username);
        comment.upvotedBy = comment.upvotedBy.filter(u => u !== username);
      }
    } else if (voteType === 'unvote') {
      comment.upvotedBy = comment.upvotedBy.filter(u => u !== username);
      comment.downvotedBy = comment.downvotedBy.filter(u => u !== username);
    }

    comment.upvotes = comment.upvotedBy.length;
    comment.downvotes = comment.downvotedBy.length;
    await comment.save();

    // Also track in Vote collection
    const postId = req.params.postId;
    const existingVote = await Vote.findOne({ userId: username, postId, commentId: comment._id });
    if (existingVote) {
      const newType = voteType === 'unvote' ? null : (existingVote.voteType === voteType ? null : voteType);
      if (!newType) {
        await Vote.deleteOne({ _id: existingVote._id });
      } else {
        existingVote.voteType = newType;
        existingVote.updatedAt = new Date();
        await existingVote.save();
      }
    } else if (voteType !== 'unvote') {
      await new Vote({ userId: username, postId, commentId: comment._id, voteType }).save();
    }

    res.json(comment);
  } catch (err) {
    console.error('Vote comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// LIKE COMMENT (Home feed Instagram-style)
app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required' });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.likedBy) comment.likedBy = [];

    const hasLiked = comment.likedBy.includes(username);

    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(u => u !== username);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(username);
      comment.likes = (comment.likes || 0) + 1;
    }

    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error('Like comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// VOTE SUBMISSION — handles voting on both posts and comments
app.post('/api/votes/submit', async (req, res) => {
  try {
    const { username, postId, commentId, voteType } = req.body;
    if (!username) return res.status(401).json({ error: 'You must be logged in to vote' });
    if (!postId) return res.status(400).json({ error: 'postId is required' });
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: "vote_type must be 'upvote' or 'downvote'" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post does not exist' });

    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
    }

    // Find existing vote
    const existingVote = await Vote.findOne({
      userId: username,
      postId,
      commentId: commentId || null
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off: same vote clicked again
        await Vote.deleteOne({ _id: existingVote._id });
      } else {
        // Switch vote: opposite vote clicked
        existingVote.voteType = voteType;
        existingVote.updatedAt = new Date();
        await existingVote.save();
      }
    } else {
      // New vote
      const newVote = new Vote({ userId: username, postId, commentId: commentId || null, voteType });
      await newVote.save();
    }

    // Recalculate counts
    const upvoteCount = await Vote.countDocuments({ postId, commentId: commentId || null, voteType: 'upvote' });
    const downvoteCount = await Vote.countDocuments({ postId, commentId: commentId || null, voteType: 'downvote' });

    if (commentId) {
      await Comment.findByIdAndUpdate(commentId, {
        $set: { upvotes: upvoteCount, downvotes: downvoteCount }
      });
    } else {
      await Post.findByIdAndUpdate(postId, {
        $set: { upvoteCount, downvoteCount }
      });
    }

    const userVote = existingVote
      ? (existingVote.voteType === voteType ? null : voteType)
      : voteType;

    res.json({
      success: true,
      user_vote: userVote,
      updated_counts: { upvote_count: upvoteCount, downvote_count: downvoteCount, total_votes: upvoteCount - downvoteCount }
    });
  } catch (err) {
    console.error('Vote submit error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate vote' });
    }
    res.status(500).json({ error: err.message });
  }
});

// CHECK VOTE STATE
app.get('/api/votes/check', async (req, res) => {
  try {
    const { postId, commentId, username } = req.query;
    if (!postId) return res.status(400).json({ error: 'postId is required' });

    let userVote = null;
    if (username) {
      const vote = await Vote.findOne({ userId: username, postId, commentId: commentId || null });
      if (vote) userVote = vote.voteType;
    }

    let upvoteCount = 0;
    let downvoteCount = 0;

    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (comment) {
        upvoteCount = comment.upvotes || 0;
        downvoteCount = comment.downvotes || 0;
      }
    } else {
      const post = await Post.findById(postId);
      if (post) {
        upvoteCount = post.upvoteCount || 0;
        downvoteCount = post.downvoteCount || 0;
      }
    }

    res.json({ user_vote: userVote, upvote_count: upvoteCount, downvote_count: downvoteCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE POST
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { username } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.username !== username) return res.status(403).json({ message: 'Not authorized to delete this post' });

    const postId = post._id;
    await Comment.deleteMany({ postId });
    await Like.deleteMany({ postId });
    await Saved.deleteMany({ postId });
    await Notification.deleteMany({ postId });
    await User.findOneAndUpdate({ username }, { $pull: { posts: postId } });
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, postId });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE COMMENT
app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { username } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.postId.toString() !== req.params.postId) return res.status(400).json({ message: 'Comment does not belong to this post' });
    if (comment.username !== username) return res.status(403).json({ message: 'Not authorized' });

    const deleteResult = await Comment.deleteMany({
      $or: [
        { _id: req.params.commentId },
        { parentId: req.params.commentId }
      ]
    });
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { comments: -deleteResult.deletedCount } });

    res.json({ success: true, commentId: req.params.commentId });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET SAVED POSTS
app.get('/api/users/:username/saved', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let savedPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .sort({ createdAt: -1 })
      .lean();
    // Attach profilePhoto (respecting photo visibility)
    const savedUsernames = [...new Set(savedPosts.map(p => p.username))];
    const savedUsers = await User.find({ username: { $in: savedUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const savedPhotoMap = {};
    for (const u of savedUsers) {
      if (canViewPhoto(u, req.params.username)) {
        savedPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        savedPhotoMap[u.username] = '';
      }
    }
    savedPosts = savedPosts.map(p => ({ ...p, profilePhoto: savedPhotoMap[p.username] || '' }));
    res.json(savedPosts);
  } catch (err) {
    console.error('Get saved posts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET NOTIFICATIONS
app.get('/api/users/:username/notifications', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    let notifications = user.notifications || [];
    // Filter out notifications from blocked users
    const blockedSet = new Set((user.blockedUsers || []).map(b => b.username));
    const blockers = await User.find({ 'blockedUsers.username': req.params.username }).select('username').lean();
    blockers.forEach(b => blockedSet.add(b.username));
    if (blockedSet.size > 0) {
      notifications = notifications.filter(n => !blockedSet.has(n.fromUser));
    }
    // Attach profilePhoto to each notification (respecting photo visibility)
    const notifUsernames = [...new Set(notifications.map(n => n.fromUser).filter(Boolean))];
    const notifUsers = await User.find({ username: { $in: notifUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const notifPhotoMap = {};
    for (const u of notifUsers) {
      if (canViewPhoto(u, req.params.username)) {
        notifPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        notifPhotoMap[u.username] = '';
      }
    }
    notifications = notifications.map(n => ({ ...n, profilePhoto: notifPhotoMap[n.fromUser] || '' }));
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// MARK ALL NOTIFICATIONS AS READ
app.post('/api/users/:username/notifications/read', async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { 'notifications.$[].isRead': true } }
    );
    const user = await User.findOne({ username: req.params.username }).lean();
    res.json(user.notifications || []);
  } catch (err) {
    console.error('Mark notifications read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// MARK SINGLE NOTIFICATION AS READ
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await User.updateOne(
      { 'notifications._id': req.params.id },
      { $set: { 'notifications.$.isRead': true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/user/settings', async (req, res) => {
  try {
    const { username, interests, blockedInterests, feedPreference, discoverWidgets } = req.body;
    const update = {};
    if (interests !== undefined) update.interests = interests;
    if (blockedInterests !== undefined) update.blockedInterests = blockedInterests;
    if (feedPreference !== undefined) update.feedPreference = feedPreference;
    if (discoverWidgets !== undefined) update.discoverWidgets = discoverWidgets;
    const user = await User.findOneAndUpdate(
      { username },
      { $set: update },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL HUBS
app.get('/api/hubs', async (req, res) => {
  try {
    const hubs = await Hub.find().sort({ order: 1 });
    res.json(hubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMMUNITIES FOR A HUB
app.get('/api/hubs/:hubId/communities', async (req, res) => {
  try {
    const communities = await Community.find({ hubId: req.params.hubId }).sort({ memberCount: -1 });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD CHANNEL TO A COMMUNITY
app.post('/api/community/:communityId/channel', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    community.channels.push({ name, description: description || '', type: 'text' });
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMMUNITY BY ID
app.get('/api/community/:communityId', async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId).lean();
    if (!community) return res.status(404).json({ error: 'Community not found' });
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE COMMUNITY
app.post('/api/community', async (req, res) => {
  try {
    const { name, description, hubId, isPrivate, icon, tags, creator } = req.body;
    if (!name || !creator) return res.status(400).json({ error: 'Name and creator required' });
    if (!hubId) return res.status(400).json({ error: 'Hub selection required' });

    const existing = await Community.findOne({ name });
    if (existing) return res.status(409).json({ error: 'A community with this name already exists' });

    const community = new Community({
      name, description: description || '', hubId, isPrivate: isPrivate || false,
      icon: icon || '', tags: tags || [], creator,
      members: [{ username: creator, role: 'owner', joinedAt: new Date() }],
      channels: [{ name: 'general', description: 'General discussion', type: 'text' }]
    });
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE COMMUNITY
app.put('/api/community/:communityId', async (req, res) => {
  try {
    const { username } = req.body;
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const member = community.members.find(m => m.username === username);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ error: 'Only owners and admins can edit the community' });
    }
    const allowed = ['name', 'description', 'icon', 'isPrivate', 'tags'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) community[field] = req.body[field];
    }
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JOIN COMMUNITY (public)
app.post('/api/community/:communityId/join', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.isPrivate) return res.status(403).json({ error: 'Private community — use an invite link' });
    if (community.members.some(m => m.username === username)) {
      return res.status(409).json({ error: 'Already a member' });
    }
    community.members.push({ username, role: 'member', joinedAt: new Date() });
    community.memberCount = community.members.length;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LEAVE COMMUNITY
app.post('/api/community/:communityId/leave', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const idx = community.members.findIndex(m => m.username === username);
    if (idx === -1) return res.status(404).json({ error: 'Not a member' });
    if (community.members[idx].role === 'owner') {
      return res.status(403).json({ error: 'Owner cannot leave. Transfer ownership first or delete the community.' });
    }
    community.members.splice(idx, 1);
    community.memberCount = community.members.length;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE COMMUNITY MEMBER
app.delete('/api/community/:communityId/member/:targetUsername', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const requester = community.members.find(m => m.username === username);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only owners and admins can remove members' });
    }
    const targetIndex = community.members.findIndex(m => m.username === req.params.targetUsername);
    if (targetIndex === -1) return res.status(404).json({ error: 'User not a member' });
    const target = community.members[targetIndex];
    if (target.role === 'owner') return res.status(403).json({ error: 'Cannot remove the owner' });
    if (requester.role === 'admin' && ['admin', 'owner'].includes(target.role)) {
      return res.status(403).json({ error: 'Admins cannot remove other admins or the owner' });
    }
    community.members.splice(targetIndex, 1);
    community.memberCount = community.members.length;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET JOINED COMMUNITIES FOR A USER
app.get('/api/community/joined/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const communities = await Community.find({ 'members.username': username }).sort({ updatedAt: -1 }).lean();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GENERATE INVITE LINK
app.post('/api/community/:communityId/invite', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const member = community.members.find(m => m.username === username);
    if (!member || !['owner', 'admin', 'moderator'].includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to generate invites' });
    }
    const code = Array.from({ length: 12 }, () => Math.random().toString(36)[2] || 'x').join('');
    community.inviteLinks.push({ code, createdBy: username, createdAt: new Date(), uses: 0 });
    await community.save();
    res.json({ code, inviteUrl: `/community/join/${code}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JOIN VIA INVITE LINK
app.post('/api/community/join/:inviteCode', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findOne({ 'inviteLinks.code': req.params.inviteCode });
    if (!community) return res.status(404).json({ error: 'Invalid or expired invite link' });
    if (community.members.some(m => m.username === username)) {
      return res.status(409).json({ error: 'Already a member' });
    }
    community.members.push({ username, role: 'member', joinedAt: new Date() });
    community.memberCount = community.members.length;
    const link = community.inviteLinks.find(l => l.code === req.params.inviteCode);
    if (link) link.uses += 1;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SET MEMBER ROLE
app.post('/api/community/:communityId/member/:targetUsername/role', async (req, res) => {
  try {
    const { username, role } = req.body;
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, moderator, or member.' });
    }
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const requester = community.members.find(m => m.username === username);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only owners and admins can change roles' });
    }
    const target = community.members.find(m => m.username === req.params.targetUsername);
    if (!target) return res.status(404).json({ error: 'User not a member' });
    if (target.role === 'owner') return res.status(403).json({ error: 'Cannot change owner role' });
    if (requester.role === 'admin' && ['admin', 'owner'].includes(target.role)) {
      return res.status(403).json({ error: 'Admins cannot modify other admins or the owner' });
    }
    target.role = role;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH PUBLIC COMMUNITIES
app.get('/api/communities/search', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { isPrivate: false };
    if (q && q.trim()) {
      const terms = q.trim().split(/\s+/).filter(Boolean);
      const conditions = [];
      terms.forEach(term => {
        conditions.push({ name: { $regex: term, $options: 'i' } });
        conditions.push({ description: { $regex: term, $options: 'i' } });
        conditions.push({ tags: { $regex: term, $options: 'i' } });
      });
      const communities = await Community.find({ ...filter, $or: conditions })
        .sort({ memberCount: -1 }).limit(20).lean();
      return res.json(communities);
    }
    const communities = await Community.find(filter).sort({ memberCount: -1 }).limit(20).lean();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL PUBLIC COMMUNITIES (for Discover)
app.get('/api/communities', async (req, res) => {
  try {
    const communities = await Community.find({ isPrivate: false }).sort({ memberCount: -1 }).limit(20).lean();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE COMMUNITY (owner only)
app.delete('/api/community/:communityId', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const member = community.members.find(m => m.username === username);
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can delete the community' });
    }
    await Community.findByIdAndDelete(req.params.communityId);
    res.json({ message: 'Community deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEED HUBS
app.post('/api/hubs/seed', async (req, res) => {
  try {
    const count = await Hub.countDocuments();
    if (count > 0) return res.json({ message: 'Hubs already seeded' });

    const hubs = await Hub.insertMany([
      { name: 'Anime', description: 'Anime & Manga discussions', icon: '🎨', interests: ['anime', 'manga', 'japanese culture', 'cosplay'], order: 1 },
      { name: 'Gaming', description: 'All things gaming', icon: '🎮', interests: ['gaming', 'esports', 'game dev', 'retro games'], order: 2 },
      { name: 'Tech', description: 'Technology & programming', icon: '💻', interests: ['technology', 'programming', 'ai', 'web dev'], order: 3 },
      { name: 'Fitness', description: 'Health & fitness', icon: '💪', interests: ['fitness', 'workout', 'nutrition', 'yoga'], order: 4 },
      { name: 'Music', description: 'Music lovers unite', icon: '🎵', interests: ['music', 'concerts', 'instruments', 'production'], order: 5 },
      { name: 'Travel', description: 'Explore the world', icon: '🌍', interests: ['travel', 'photography', 'adventure', 'food'], order: 6 }
    ]);

    const communities = await Community.insertMany([
      { hubId: hubs[0]._id, name: 'Attack on Titan', description: 'Discussion about AoT', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'theories', description: 'Fan theories' }] },
      { hubId: hubs[0]._id, name: 'One Piece', description: 'Straw Hat Pirates crew', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'spoilers', description: 'Manga spoilers' }] },
      { hubId: hubs[0]._id, name: 'Studio Ghibli', description: 'Hayao Miyazaki works', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'art', description: 'Fan art' }] },
      { hubId: hubs[1]._id, name: 'Valorant', description: 'Valorant competitive', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'lfg', description: 'Looking for group' }] },
      { hubId: hubs[1]._id, name: 'Minecraft', description: 'Build & explore', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'builds', description: 'Show your builds' }] },
      { hubId: hubs[1]._id, name: 'Elden Ring', description: 'Tarnished together', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'bosses', description: 'Boss strategies' }] },
      { hubId: hubs[2]._id, name: 'React Devs', description: 'React & Next.js', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'help', description: 'Get help' }] },
      { hubId: hubs[2]._id, name: 'AI Enthusiasts', description: 'Artificial intelligence', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'prompts', description: 'Prompt engineering' }] },
      { hubId: hubs[2]._id, name: 'Cybersecurity', description: 'Security & privacy', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'news', description: 'Security news' }] },
      { hubId: hubs[3]._id, name: 'Bodybuilding', description: 'Gains & nutrition', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'routines', description: 'Workout routines' }] },
      { hubId: hubs[3]._id, name: 'Yoga & Meditation', description: 'Mind & body', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'poses', description: 'Yoga poses' }] },
      { hubId: hubs[4]._id, name: 'Indie Music', description: 'Underground artists', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'discover', description: 'Discover new music' }] },
      { hubId: hubs[5]._id, name: 'Backpackers', description: 'Budget travel tips', creator: '', isPrivate: false, channels: [{ name: 'general', description: 'General discussion' }, { name: 'destinations', description: 'Destination guides' }] },
    ]);

    res.json({ hubs, communities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANNEL MESSAGES — real-time chat inside community channels
app.post('/api/channel-messages/:communityId/:channelName', async (req, res) => {
  try {
    const { communityId, channelName } = req.params;
    const { senderUsername, message, image } = req.body;
    if (!senderUsername) return res.status(400).json({ error: 'senderUsername required' });
    if (!message && !image) return res.status(400).json({ error: 'Message or image required' });
    const cm = new ChannelMessage({ communityId, channelName, senderUsername, message: message || '', image: image || null });
    await cm.save();
    res.json(cm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/channel-messages/:communityId/:channelName', async (req, res) => {
  try {
    const { communityId, channelName } = req.params;
    let messages = await ChannelMessage.find({ communityId, channelName })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    // Attach profilePhoto (respecting photo visibility)
    const cmUsernames = [...new Set(messages.map(m => m.senderUsername))];
    const cmUsers = await User.find({ username: { $in: cmUsernames } }).select('username profilePhoto photoVisibility followers').lean();
    const cmPhotoMap = {};
    for (const u of cmUsers) {
      if (canViewPhoto(u, req.query.currentUsername)) {
        cmPhotoMap[u.username] = u.profilePhoto || '';
      } else {
        cmPhotoMap[u.username] = '';
      }
    }
    messages = messages.map(m => ({ ...m, profilePhoto: cmPhotoMap[m.senderUsername] || '' }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STORIES — independent from posts
app.post('/api/stories', async (req, res) => {
  try {
    const { author, media, mediaType, caption, audience } = req.body;
    if (!author || !media) return res.status(400).json({ error: 'Author and media required' });
    const detectedType = mediaType || (media.startsWith('data:video/') ? 'video' : 'image');
    const story = new Story({
      author, media,
      mediaType: detectedType,
      caption: caption || '',
      audience: audience || 'followers'
    });
    await story.save();
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stories', async (req, res) => {
  try {
    const now = new Date();
    const { currentUsername } = req.query;
    let stories = await Story.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .lean();
    // PRIVACY FILTER + AUDIENCE FILTER: remove stories from private accounts, filter by audience
    if (currentUsername) {
      const allUsers = await User.find().select('username isPrivate followers closeFriends').lean();
      const userMap = {};
      for (const u of allUsers) {
        userMap[u.username] = { isPrivate: u.isPrivate, followers: u.followers || [], closeFriends: u.closeFriends || [] };
      }
      stories = stories.filter(s => {
        const owner = userMap[s.author];
        if (!owner) return true;
        // Own stories always visible
        if (s.author === currentUsername) return true;
        // Account privacy: private accounts → only followers
        if (owner.isPrivate && !owner.followers.includes(currentUsername)) return false;
        // Audience: close_friends → only users in author's closeFriends list
        if (s.audience === 'close_friends' && !owner.closeFriends.includes(currentUsername)) return false;
        return true;
      });
    }
    // BLOCK FILTER
    if (currentUsername) {
      const currentUser = await User.findOne({ username: currentUsername }).select('blockedUsers').lean();
      const blockedSet = new Set((currentUser?.blockedUsers || []).map(b => b.username));
      const blockers = await User.find({ 'blockedUsers.username': currentUsername }).select('username').lean();
      blockers.forEach(b => blockedSet.add(b.username));
      if (blockedSet.size > 0) {
        stories = stories.filter(s => !blockedSet.has(s.author));
      }
    }
    // Enrich with author profile photos (respecting photo visibility)
    const authors = [...new Set(stories.map(s => s.author))];
    const authorUsers = await User.find({ username: { $in: authors } }).select('username profilePhoto photoVisibility followers').lean();
    const photoMap = {};
    for (const u of authorUsers) {
      if (canViewPhoto(u, currentUsername)) {
        photoMap[u.username] = u.profilePhoto || '';
      } else {
        photoMap[u.username] = '';
      }
    }
    stories = stories.map(s => ({ ...s, profilePhoto: photoMap[s.author] || '' }));

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stories for a specific user (profile page)
app.get('/api/stories/user/:username', async (req, res) => {
  try {
    const now = new Date();
    const { currentUsername } = req.query;
    const targetUsername = req.params.username;

    let stories = await Story.find({
      author: targetUsername,
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 }).lean();

    // Privacy checks
    if (currentUsername && targetUsername !== currentUsername) {
      const targetUser = await User.findOne({ username: targetUsername }).select('isPrivate followers closeFriends').lean();
      if (targetUser) {
        const isOwner = currentUsername === targetUsername;
        const isFollower = (targetUser.followers || []).includes(currentUsername);
        const isCloseFriend = (targetUser.closeFriends || []).includes(currentUsername);
        const isFollowing = isOwner || isFollower;

        if (targetUser.isPrivate && !isFollower && !isOwner) {
          return res.json([]);
        }

        stories = stories.filter(s => {
          // Owner sees all
          if (isOwner) return true;
          // Public audience: visible if profile access is granted (passed private check)
          if (s.audience === 'public') return true;
          // Followers audience: only followers
          if (s.audience === 'followers' && isFollower) return true;
          // Close friends audience: only close friends
          if (s.audience === 'close_friends' && isCloseFriend) return true;
          return false;
        });
      }
    }

    // Block filter
    if (currentUsername) {
      const currentUser = await User.findOne({ username: currentUsername }).select('blockedUsers').lean();
      const blockedSet = new Set((currentUser?.blockedUsers || []).map(b => b.username));
      const blockers = await User.find({ 'blockedUsers.username': currentUsername }).select('username').lean();
      blockers.forEach(b => blockedSet.add(b.username));
      if (blockedSet.size > 0) {
        stories = stories.filter(s => !blockedSet.has(s.author));
      }
    }

    // Enrich with author profile photo (respecting photo visibility)
    const authorUser = await User.findOne({ username: targetUsername }).select('profilePhoto photoVisibility followers').lean();
    const authorPhoto = (authorUser && canViewPhoto(authorUser, currentUsername)) ? (authorUser.profilePhoto || '') : '';
    stories = stories.map(s => ({ ...s, profilePhoto: authorPhoto }));

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stories/:id/view', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    // Don't count the owner viewing their own story
    if (story.author !== username && !story.viewers.includes(username)) {
      story.viewers.push(username);
      await story.save();
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stories/:id', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.author !== username) return res.status(403).json({ error: 'Not authorized' });
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEST at end

const PORT = 5001;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
