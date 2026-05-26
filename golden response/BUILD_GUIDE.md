# BookmarkSync — Step-by-Step Build Guide

Work through the sections in order. Each section ends with a checkpoint so you can verify things work before moving on.

---

## Table of Contents

1. [Folder Setup](#1-folder-setup)
2. [Backend — Project Init](#2-backend--project-init)
3. [MongoDB Connection](#3-mongodb-connection)
4. [User Model & Auth APIs](#4-user-model--auth-apis)
5. [Bookmark Model & APIs](#5-bookmark-model--apis)
6. [JWT Middleware](#6-jwt-middleware)
7. [Wire Up Express Server](#7-wire-up-express-server)
8. [Test the Backend](#8-test-the-backend)
9. [Dashboard — HTML Structure](#9-dashboard--html-structure)
10. [Dashboard — CSS](#10-dashboard--css)
11. [Dashboard — JavaScript](#11-dashboard--javascript)
12. [Dashboard Sub-pages](#12-dashboard-sub-pages)
13. [Chrome Extension — manifest.json](#13-chrome-extension--manifestjson)
14. [Extension — popup.html](#14-extension--popuphtml)
15. [Extension — popup.css](#15-extension--popupcss)
16. [Extension — api.js](#16-extension--apijs)
17. [Extension — auth.js](#17-extension--authjs)
18. [Extension — storage.js](#18-extension--storagejs)
19. [Extension — popup.js](#19-extension--popupjs)
20. [Extension — background.js](#20-extension--backgroundjs)
21. [Load Extension in Chrome](#21-load-extension-in-chrome)
22. [Connect Everything](#22-connect-everything)
23. [Common Errors & Fixes](#23-common-errors--fixes)
24. [Deployment Checklist](#24-deployment-checklist)

---

## 1. Folder Setup

Create the root project folder and three sub-folders:

```
bookmarksync/
├── backend/
├── extension/
└── dashboard/
```

```bash
mkdir bookmarksync
cd bookmarksync
mkdir backend extension dashboard
```

---

## 2. Backend — Project Init

```bash
cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv cors
npm install --save-dev nodemon
```

Edit `backend/package.json` — add scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bookmarksync
JWT_SECRET=replace_this_with_a_long_random_string
```

Create the folder structure inside `backend/`:

```bash
mkdir config controllers middleware models routes
```

---

## 3. MongoDB Connection

**File: `backend/config/db.js`**

```js
// Connects to MongoDB using the URI from .env
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 4. User Model & Auth APIs

**File: `backend/models/User.js`**

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
```

**File: `backend/controllers/authController.js`**

```js
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');

// Helper — generate a JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    // Check duplicate
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed });

    res.status(201).json({ token: generateToken(user._id), name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: generateToken(user._id), name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/profile  (protected)
exports.profile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};
```

**File: `backend/routes/auth.js`**

```js
const express = require('express');
const router  = express.Router();
const { signup, login, profile } = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/signup',  signup);
router.post('/login',   login);
router.get('/profile',  protect, profile);

module.exports = router;
```

---

## 5. Bookmark Model & APIs

**File: `backend/models/Bookmark.js`**

```js
const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  url:         { type: String, required: true },
  category:    { type: String, default: 'General', trim: true },
  description: { type: String, default: '' },
  favorite:    { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);
```

**File: `backend/controllers/bookmarkController.js`**

```js
const Bookmark = require('../models/Bookmark');

// GET /api/bookmarks
exports.getAll = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookmarks
exports.create = async (req, res) => {
  try {
    const { title, url, category, description } = req.body;
    if (!title || !url)
      return res.status(400).json({ message: 'Title and URL are required' });

    // Prevent duplicate URLs per user
    const exists = await Bookmark.findOne({ user: req.user.id, url });
    if (exists)
      return res.status(400).json({ message: 'Bookmark already exists' });

    const bookmark = await Bookmark.create({ user: req.user.id, title, url, category, description });
    res.status(201).json(bookmark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookmarks/:id
exports.update = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!bookmark) return res.status(404).json({ message: 'Not found' });
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/bookmarks/:id
exports.remove = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bookmark) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/bookmarks/:id/favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user.id });
    if (!bookmark) return res.status(404).json({ message: 'Not found' });
    bookmark.favorite = !bookmark.favorite;
    await bookmark.save();
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**File: `backend/routes/bookmarks.js`**

```js
const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const {
  getAll, create, update, remove, toggleFavorite
} = require('../controllers/bookmarkController');

router.use(protect);  // all bookmark routes require login

router.get('/',              getAll);
router.post('/',             create);
router.put('/:id',           update);
router.delete('/:id',        remove);
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
```

---

## 6. JWT Middleware

**File: `backend/middleware/auth.js`**

```js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Attach req.user if token is valid
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = protect;
```

---

## 7. Wire Up Express Server

**File: `backend/server.js`**

```js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');

connectDB();

const app = express();

// Middleware
app.use(cors());            // Restrict origins in production
app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/bookmarks',  require('./routes/bookmarks'));

// Health check
app.get('/', (req, res) => res.send('BookmarkSync API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 8. Test the Backend

Start the server:

```bash
cd backend
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
```

Test with curl or a tool like Postman / Insomnia:

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'

# Login (copy the token from the response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'

# Add a bookmark (replace TOKEN)
curl -X POST http://localhost:5000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"GitHub","url":"https://github.com","category":"Dev"}'
```

**Checkpoint:** all three commands return valid JSON without errors.

---

## 9. Dashboard — HTML Structure

**File: `dashboard/index.html`**

Create a single-page layout with:

- A `<aside>` sidebar containing navigation links (Home, Bookmarks, Categories, Settings, Help)
- A `<main>` content area that swaps sections using `data-page` attributes
- A top bar with a search input, theme toggle button, and user name display
- Stat cards: Total Bookmarks, Favorites, Categories
- A Recent Bookmarks list
- A Bookmarks full-list section (shown when clicking "Bookmarks" in the sidebar)
- A Settings section with a form to update name / password
- A Help section with usage instructions
- Login and Signup forms shown when no token is present (these replace the main layout until authenticated)

Put all sections inside `<div id="app">`. JavaScript will show/hide them.

---

## 10. Dashboard — CSS

**File: `dashboard/dashboard.css`**

Design guidelines (minimal and professional):

```
Colors (light theme):
  background:   #f5f5f5
  surface:      #ffffff
  border:       #e0e0e0
  text-primary: #1a1a1a
  text-muted:   #666666
  accent:       #2563eb   (blue)
  danger:       #dc2626

Colors (dark theme — toggled via class="dark" on <body>):
  background:   #111111
  surface:      #1e1e1e
  border:       #2e2e2e
  text-primary: #f0f0f0
  text-muted:   #888888

Typography:
  Font: system-ui, -apple-system, sans-serif
  Base size: 14px
  Headings: 18–24px, font-weight 600

Layout:
  Sidebar: 220px fixed left, full height
  Main content: padding 24px, max-width 900px
  Cards: border-radius 6px, border 1px solid var(--border)
  No box-shadow on cards (keep flat)

Buttons:
  Primary: background accent, white text, border-radius 4px, padding 8px 16px
  Danger:  background danger, white text
  Ghost:   transparent, border 1px solid border

Inputs:
  border: 1px solid var(--border)
  border-radius: 4px
  padding: 8px 12px
  width: 100%
  background: var(--surface)
```

Transitions: `transition: color 0.15s, background 0.15s` only — no animations.

---

## 11. Dashboard — JavaScript

**File: `dashboard/dashboard.js`**

Structure:

```js
// 1. Constants
const API_BASE = 'http://localhost:5000/api';  // Change after deployment

// 2. State
let token = localStorage.getItem('token');
let bookmarks = [];
let currentPage = 'home';

// 3. Auth helpers
//    getToken(), saveToken(t), clearToken()

// 4. API helpers (async fetch wrappers)
//    apiGet(path), apiPost(path, body), apiPut(path, body),
//    apiDelete(path), apiPatch(path, body)
//    All automatically attach Authorization header and handle errors.

// 5. Render functions
//    renderHome()       — stats + recent list
//    renderBookmarks()  — full list with search/filter/sort
//    renderCategories() — grouped by category
//    renderSettings()   — profile form
//    renderHelp()       — static content

// 6. Navigation
//    navigate(page) — hides all sections, shows the target section

// 7. Event listeners
//    Sidebar links → navigate()
//    Add bookmark form submit → apiPost then renderBookmarks()
//    Delete buttons (delegated) → apiDelete then refresh
//    Edit buttons → populate form, switch to edit mode
//    Favorite buttons → apiPatch then refresh
//    Search input → filter displayed list
//    Theme toggle → toggle body.dark, persist in localStorage
//    Logout → clearToken(), show login view

// 8. Init
//    On page load: if token exists load profile + bookmarks + renderHome(),
//    else show login form.
```

Key pattern — all API calls follow:

```js
async function loadBookmarks() {
  try {
    bookmarks = await apiGet('/bookmarks');
    renderBookmarks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
```

Toast helper (no library needed):

```js
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
```

Add `.toast` styles to `dashboard.css`:
```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 13px;
  color: #fff;
  z-index: 9999;
}
.toast-success { background: #16a34a; }
.toast-error   { background: #dc2626; }
```

---

## 12. Dashboard Sub-pages

Create three standalone pages that share `dashboard.css`:

**`dashboard/pages/profile.html`** — shows user name, email, member since date. Has "Edit" button that reveals a form to change name / password. On save, call `PUT /api/auth/profile` (add this optional endpoint to the backend if needed).

**`dashboard/pages/settings.html`** — theme preference (light/dark), default category list, export all bookmarks as JSON, import bookmarks from JSON. Export: `JSON.stringify(bookmarks, null, 2)` + `Blob` download. Import: `FileReader` + parse + loop `apiPost('/bookmarks', ...)`.

**`dashboard/pages/help.html`** — static FAQ: how to install extension, how to add a bookmark, how to sync, where data is stored.

Each page has a "Back to Dashboard" link.

---

## 13. Chrome Extension — manifest.json

**File: `extension/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "BookmarkSync",
  "version": "1.0.0",
  "description": "Save and sync bookmarks to the cloud",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": ["http://localhost:5000/*"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

For production, change `host_permissions` to your deployed API domain.

**Icons:** Create three plain PNG files (16×16, 48×48, 128×128) — a simple bookmark icon or any solid-color square is fine for development. Place them in `extension/icons/`.

---

## 14. Extension — popup.html

**File: `extension/popup.html`**

Structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <!-- Auth view (shown when logged out) -->
  <div id="auth-view">
    <!-- Login form -->
    <!-- Link to switch to signup form -->
    <!-- Signup form -->
  </div>

  <!-- Main view (shown when logged in) -->
  <div id="main-view" hidden>
    <!-- Header: app name + dashboard button + logout button -->
    <header>
      <span class="app-title">BookmarkSync</span>
      <button id="btn-dashboard" title="Open Dashboard">⊞</button>
      <button id="btn-logout">Logout</button>
    </header>

    <!-- Quick add current tab -->
    <div id="quick-add">
      <button id="btn-quick-add">+ Add Current Tab</button>
    </div>

    <!-- Add / Edit form (collapsible) -->
    <div id="form-section">
      <input id="input-title"    placeholder="Title">
      <input id="input-url"      placeholder="URL">
      <input id="input-category" placeholder="Category">
      <textarea id="input-desc"  placeholder="Notes (optional)"></textarea>
      <button id="btn-save">Save</button>
      <button id="btn-cancel" hidden>Cancel</button>
    </div>

    <!-- Search -->
    <input id="search-input" placeholder="Search bookmarks...">

    <!-- Bookmark list -->
    <div id="bookmark-list">
      <!-- Populated by popup.js -->
    </div>
  </div>

  <script src="api.js"></script>
  <script src="auth.js"></script>
  <script src="storage.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

---

## 15. Extension — popup.css

**File: `extension/popup.css`**

```css
/* Popup is 360px wide; browser caps height at ~600px */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 360px;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  background: #fff;
  color: #1a1a1a;
}

/* Use same minimal color system as dashboard */
/* Sections separated by 1px borders, 12px padding */
/* Inputs: full width, 1px border, 4px radius */
/* Bookmark items: flex row, title + url + action buttons */
/* Action buttons: text buttons (Edit, ★, ✕), no background */
/* Loading text: centered gray text */
/* Error/success messages: colored text below form */
```

Write the actual CSS following these rules — no shadows, no gradients, no transitions except `color 0.1s`.

---

## 16. Extension — api.js

**File: `extension/api.js`**

```js
// Thin wrapper around fetch for the backend API.
// Reads the token from chrome.storage.local.

const API_BASE = 'http://localhost:5000/api';

async function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('token', data => resolve(data.token || null));
  });
}

async function request(method, path, body) {
  const token = await getToken();
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body)  options.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const API = {
  signup:          (b) => request('POST', '/auth/signup',          b),
  login:           (b) => request('POST', '/auth/login',           b),
  getBookmarks:    ()  => request('GET',  '/bookmarks'),
  addBookmark:     (b) => request('POST', '/bookmarks',            b),
  updateBookmark:  (id, b) => request('PUT',  `/bookmarks/${id}`,  b),
  deleteBookmark:  (id)    => request('DELETE',`/bookmarks/${id}`),
  toggleFavorite:  (id)    => request('PATCH', `/bookmarks/${id}/favorite`)
};
```

---

## 17. Extension — auth.js

**File: `extension/auth.js`**

```js
// Handles saving/clearing the JWT in chrome.storage.local

function saveAuth(token, user) {
  chrome.storage.local.set({ token, user });
}

function clearAuth() {
  chrome.storage.local.remove(['token', 'user']);
}

async function getStoredUser() {
  return new Promise(resolve => {
    chrome.storage.local.get('user', data => resolve(data.user || null));
  });
}

async function isLoggedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get('token', data => resolve(!!data.token));
  });
}
```

---

## 18. Extension — storage.js

**File: `extension/storage.js`**

```js
// Local cache so bookmarks load instantly before the API responds

const CACHE_KEY = 'cached_bookmarks';

function cacheBookmarks(bookmarks) {
  chrome.storage.local.set({ [CACHE_KEY]: bookmarks });
}

function getCachedBookmarks() {
  return new Promise(resolve => {
    chrome.storage.local.get(CACHE_KEY, data => resolve(data[CACHE_KEY] || []));
  });
}

function clearCache() {
  chrome.storage.local.remove(CACHE_KEY);
}
```

---

## 19. Extension — popup.js

**File: `extension/popup.js`**

Main logic flow:

```js
// 1. On DOMContentLoaded:
//    - Check isLoggedIn()
//    - If yes: show main-view, load bookmarks
//    - If no:  show auth-view

// 2. Login form submit:
//    API.login(email, password)
//    → saveAuth(token, user)
//    → show main-view + loadBookmarks()

// 3. Signup form submit:
//    API.signup(name, email, password)
//    → saveAuth(token, user)
//    → show main-view + loadBookmarks()

// 4. Logout:
//    clearAuth() + clearCache() + show auth-view

// 5. loadBookmarks():
//    a. Show cached immediately (getCachedBookmarks)
//    b. Fetch API.getBookmarks()
//    c. cacheBookmarks(result)
//    d. renderList(result)

// 6. renderList(bookmarks, filter=''):
//    Filter by search term if provided.
//    For each bookmark create a row:
//      Title (link), URL (small), category badge
//      Buttons: ★ (toggle fav), Edit, Delete

// 7. Quick add current tab:
//    chrome.tabs.query({ active: true, currentWindow: true })
//    → fill form inputs with tab title + url

// 8. Save bookmark:
//    Validate title and URL.
//    If editing: API.updateBookmark(id, data)
//    If new:     API.addBookmark(data)
//    On success: reload + show toast

// 9. Delete bookmark:
//    API.deleteBookmark(id) + reload

// 10. Toggle favorite:
//     API.toggleFavorite(id) + reload

// 11. Search input (oninput):
//     renderList(bookmarks, searchInput.value)

// 12. Dashboard button:
//     chrome.tabs.create({ url: 'http://localhost:5501/dashboard/index.html' })
//     Change URL to deployed dashboard after deployment.
```

Implement each step with `async/await` and `try/catch`. Show a simple loading text while fetching and show error messages inline.

---

## 20. Extension — background.js

**File: `extension/background.js`**

```js
// Service worker — handles extension lifecycle events

// Open popup on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('BookmarkSync installed');
});

// Listen for messages from popup (optional — for future keyboard shortcuts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // keep channel open for async response
  }
});
```

---

## 21. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Turn on **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The extension appears — click the puzzle icon in the toolbar to pin it

To reload after code changes: click the refresh (↺) icon on the extension card.

---

## 22. Connect Everything

### Local development checklist

- [ ] Backend running: `cd backend && npm run dev`
- [ ] MongoDB running locally (or Atlas URI in `.env`)
- [ ] Dashboard served: open `dashboard/index.html` in browser (or `npx serve dashboard`)
- [ ] Extension loaded in Chrome
- [ ] `API_BASE` in `extension/api.js` = `http://localhost:5000/api`
- [ ] `API_BASE` in `dashboard/dashboard.js` = `http://localhost:5000/api`
- [ ] Dashboard URL in `extension/popup.js` button matches where you're serving the dashboard

### End-to-end test

1. Open the extension popup → sign up for a new account
2. Add a bookmark from the popup
3. Open the dashboard → verify the bookmark appears
4. Edit the bookmark from the dashboard → verify the popup shows the update
5. Delete a bookmark → verify it's gone in both places
6. Click the dashboard button in the popup → new tab opens the dashboard

---

## 23. Common Errors & Fixes

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `MongoDB connection error` | MongoDB not running | Start MongoDB: `brew services start mongodb-community` or `sudo systemctl start mongodb` |
| `CORS error` in browser console | Backend not allowing your origin | In `server.js` change `app.use(cors())` to `app.use(cors({ origin: 'http://localhost:5501' }))` |
| `401 No token` | Extension not sending token | Check `getToken()` in `api.js` — make sure `chrome.storage.local` key matches what `saveAuth()` stores |
| `Cannot read properties of null` in popup | DOM element not found | Check that all `getElementById` IDs match the HTML exactly |
| Extension shows old code | Cache not cleared | Click ↺ on `chrome://extensions/` then close and reopen the popup |
| `NetworkError` in popup | Backend not running or wrong port | Confirm `npm run dev` is running and `API_BASE` port is correct |
| Bookmark saves locally but not in MongoDB | Token expired or invalid | Log out and log in again |
| Dashboard shows blank | JS error blocking init | Open DevTools on the dashboard page and check the console |

---

## 24. Deployment Checklist

### Backend

- [ ] Deploy to Railway / Render / Fly.io
- [ ] Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`
- [ ] Note the deployed URL (e.g. `https://bookmarksync.railway.app`)
- [ ] Change `app.use(cors())` to `app.use(cors({ origin: 'https://your-dashboard.vercel.app' }))`

### Dashboard

- [ ] Update `API_BASE` to the deployed backend URL
- [ ] Deploy `dashboard/` to Vercel / Netlify
- [ ] Note the deployed URL

### Extension

- [ ] Update `API_BASE` in `api.js` to the deployed backend URL
- [ ] Update the dashboard URL in the dashboard button handler
- [ ] Update `host_permissions` in `manifest.json` to the deployed backend domain
- [ ] Reload the extension (or package it as a `.crx` / submit to Chrome Web Store)

### Chrome Web Store (optional)

1. Zip the `extension/` folder
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay one-time $5 developer fee
4. Upload the zip, fill in description and screenshots, submit for review

---

## File Creation Summary

Use this as a checklist — create each file as you work through the sections above:

```
backend/
  .env                          ← Section 2
  package.json                  ← Section 2
  server.js                     ← Section 7
  config/db.js                  ← Section 3
  models/User.js                ← Section 4
  models/Bookmark.js            ← Section 5
  controllers/authController.js ← Section 4
  controllers/bookmarkController.js ← Section 5
  middleware/auth.js            ← Section 6
  routes/auth.js                ← Section 4
  routes/bookmarks.js           ← Section 5

dashboard/
  index.html                    ← Section 9
  dashboard.css                 ← Section 10
  dashboard.js                  ← Section 11
  pages/profile.html            ← Section 12
  pages/settings.html           ← Section 12
  pages/help.html               ← Section 12

extension/
  manifest.json                 ← Section 13
  popup.html                    ← Section 14
  popup.css                     ← Section 15
  api.js                        ← Section 16
  auth.js                       ← Section 17
  storage.js                    ← Section 18
  popup.js                      ← Section 19
  background.js                 ← Section 20
  icons/icon16.png              ← Section 13
  icons/icon48.png              ← Section 13
  icons/icon128.png             ← Section 13
```
