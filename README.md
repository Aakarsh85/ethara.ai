# BookmarkSync

A full-stack Chrome Extension bookmark manager with cloud sync, JWT authentication, and a dashboard website.

---

## Project Structure

```
bookmarksync/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── bookmarkController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Bookmark.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── bookmarks.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── extension/                # Chrome Extension (Manifest V3)
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── api.js
│   ├── auth.js
│   ├── background.js
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.html
│   ├── popup.js
│   └── storage.js
│
└── dashboard/                # Web dashboard
    ├── pages/
    │   ├── profile.html
    │   ├── settings.html
    │   └── help.html
    ├── dashboard.css
    ├── dashboard.js
    └── index.html
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas or local) |
| Auth | JWT + bcrypt |
| Dashboard | HTML, CSS, Vanilla JS |

---

## Features

- **Authentication** — Signup, login, logout with JWT tokens
- **Bookmark Management** — Add, edit, delete, search, categorize, favorite
- **Cloud Sync** — Bookmarks stored in MongoDB per user
- **Local Cache** — `chrome.storage.local` for offline access
- **Dashboard** — Stats, categories, recent activity, settings
- **Quick Add** — Save the current tab with one click
- **Import / Export** — JSON export and import of bookmarks

---

## Prerequisites

- Node.js v18+
- MongoDB (local install or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- Google Chrome browser

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bookmarksync
JWT_SECRET=your_strong_secret_here
```

Start the server:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

API is available at `http://localhost:5000`.

### 2. Dashboard

Open `dashboard/index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve dashboard
```

### 3. Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The extension icon appears in the toolbar

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/profile` | Get current user (protected) |

### Bookmarks

All bookmark routes require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | Get all user bookmarks |
| POST | `/api/bookmarks` | Add bookmark |
| PUT | `/api/bookmarks/:id` | Update bookmark |
| DELETE | `/api/bookmarks/:id` | Delete bookmark |
| PATCH | `/api/bookmarks/:id/favorite` | Toggle favorite |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/bookmarksync` |
| `JWT_SECRET` | Secret for signing tokens | `supersecretkey123` |

---

## MongoDB Setup

**Local:**
```bash
# macOS
brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt install mongodb && sudo systemctl start mongodb
```

**Atlas (free cloud):**
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Whitelist your IP and create a database user
4. Copy the connection string into `MONGO_URI`

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Push the `backend/` folder to a GitHub repo
2. Connect the repo to Railway or Render
3. Add environment variables (`MONGO_URI`, `JWT_SECRET`) in the dashboard
4. Deploy — you get a public URL (e.g. `https://bookmarksync-api.railway.app`)

### Dashboard (Vercel / Netlify)

1. Push `dashboard/` to GitHub
2. Import into Vercel or Netlify
3. Update `API_BASE` in `dashboard.js` to your deployed backend URL

### Extension (after deployment)

Update `API_BASE` in `extension/api.js` to point to your deployed backend, then reload the extension.

---

## Scripts

```bash
# Backend
npm start          # Start server
npm run dev        # Start with nodemon (auto-reload)

# Dashboard (optional local server)
npx serve dashboard
```

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds)
- JWTs expire after **7 days**
- All bookmark routes are protected by JWT middleware
- CORS is restricted to allowed origins in production — update `server.js` before deploying
- Never commit `.env` to version control

---

## License

MIT
