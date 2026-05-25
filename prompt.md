# Full-Stack Chrome Bookmark Manager Extension

## Project Overview

Build a full-stack Chrome Bookmark Manager Extension similar to a modern productivity tool.

The project should include:

- Clean modern UI
- Authentication system
- Dashboard integration
- Bookmark management
- Cloud data storage

---

# Tech Stack

- Chrome Extension Manifest V3
- HTML
- CSS
- Vanilla JavaScript
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- REST APIs

---

# Project Structure

Create 3 separate folders:

```bash
project-root/
│
├── extension/   → Chrome Extension
├── backend/     → Node.js + Express + MongoDB backend
└── dashboard/   → Dashboard website frontend
```

---

# FEATURES REQUIRED

# 1. USER AUTHENTICATION

- Signup page
- Login page
- Logout functionality
- JWT token authentication
- Store token securely
- Protected routes
- Session persistence
- Show logged-in user info

---

# 2. CHROME EXTENSION

The extension popup should contain:

- Search bookmarks
- Add bookmark button
- Bookmark title input
- Bookmark URL input
- Category/tag input
- Save bookmark button
- Bookmark list
- Delete bookmark button
- Edit bookmark button
- Favorite/star option
- Recently added section
- Empty state UI
- Loading states

---

# 3. DASHBOARD LOGO BUTTON

Add a dashboard logo/icon in the extension popup.

Clicking the logo should:

- Open dashboard website in a NEW TAB
- Use `chrome.tabs.create()`

Dashboard URL should be configurable.

---

# 4. DASHBOARD WEBSITE

Create a separate modern dashboard website with:

- Sidebar navigation
- Dashboard home
- User profile section
- Total bookmarks stats
- Recent bookmarks
- Categories section
- Search functionality
- Settings page
- Help/About page
- Responsive design
- Dark/light theme toggle
- Smooth animations

---

# 5. BOOKMARK MANAGEMENT

Users should be able to:

- Add bookmarks
- Edit bookmarks
- Delete bookmarks
- Search bookmarks
- Categorize bookmarks
- Favorite bookmarks
- Store notes/descriptions
- Open bookmarks in new tabs
- Sort bookmarks
- Filter by category

---

# 6. CLOUD STORAGE

- Store user data in MongoDB
- Each user should have their own bookmarks
- Use proper MongoDB schemas
- Protect routes using JWT middleware

---

# 7. BACKEND API

Create REST APIs for:

- Signup
- Login
- Get bookmarks
- Add bookmark
- Update bookmark
- Delete bookmark
- Favorite bookmark
- User profile

---

# 8. CHROME STORAGE

Use:

- `chrome.storage.local`
- Sync local data with backend
- Cache bookmarks locally

---

# 9. MODERN UI REQUIREMENTS

UI should look modern and premium:

- Rounded corners
- Smooth hover effects
- Soft shadows
- Clean typography
- Glassmorphism or minimal modern design
- Responsive popup
- Beautiful dashboard cards
- Elegant animations

---

# 10. EXTENSION REQUIREMENTS

`manifest.json` should include:

- storage permission
- tabs permission
- activeTab permission
- host_permissions
- background service worker

---

# 11. IMPORTANT FUNCTIONALITY

When bookmark is saved:

- Save locally
- Save to MongoDB backend

Additional functionality:

- Auto-refresh bookmark list
- Proper error handling
- Toast notifications
- Loading spinners
- Validation for URLs
- Prevent duplicate bookmarks

---

# 12. FILES TO CREATE

## EXTENSION

```bash
extension/
│
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── background.js
├── auth.js
├── api.js
├── storage.js
└── icons/
```

## BACKEND

```bash
backend/
│
├── server.js
├── config/
├── models/
├── routes/
├── middleware/
├── controllers/
├── .env
└── package.json
```

## DASHBOARD

```bash
dashboard/
│
├── index.html
├── dashboard.js
├── dashboard.css
├── profile.html
├── settings.html
└── help.html
```

---

# 13. SECURITY

- Hash passwords using bcrypt
- Use JWT tokens
- Environment variables
- Input validation
- Protected APIs
- CORS setup

---

# 14. EXTRA FEATURES

- Bookmark import/export
- Keyboard shortcuts
- Recent activity
- Bookmark analytics
- Quick add current tab button
- Copy bookmark link
- Mobile responsive dashboard

---

# 15. UI DIFFERENCE

Keep functionality similar to the previous bookmark extension project, but:

- Use a slightly different modern UI
- Different color palette
- Better spacing and typography
- More polished dashboard
- Improved popup design

---

# 16. CODE REQUIREMENTS

- Write clean modular code
- Add comments
- Use async/await
- Separate API utilities
- Proper folder structure
- Beginner-friendly explanation in comments

---

# 17. FINAL OUTPUT REQUIRED

Provide:

- Complete project code
- Folder structure
- Setup instructions
- MongoDB setup guide
- How to load extension in Chrome
- How to run backend server
- How to connect dashboard with backend
- How to deploy later

---

# DEVELOPMENT FLOW

Build the project step-by-step starting from:

1. Backend setup
2. MongoDB connection
3. Authentication APIs
4. Bookmark APIs
5. Dashboard frontend
6. Chrome extension frontend
7. Chrome extension backend integration
8. Dashboard redirect logo functionality
9. Final polishing and testing

---

# FINAL GOAL

The final project should work as a complete production-ready bookmark manager Chrome extension with:

- Authentication
- Dashboard website
- Cloud sync
- Modern responsive UI
- Bookmark management system
- MongoDB backend
- JWT security
- Chrome storage sync
