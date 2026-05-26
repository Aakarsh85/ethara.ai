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
