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
