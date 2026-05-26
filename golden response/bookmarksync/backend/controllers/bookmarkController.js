const Bookmark = require('../models/Bookmark');

exports.getAll = async (req, res) => {
  try { res.json(await Bookmark.find({ user: req.user.id }).sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, url, category, description } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'Title and URL are required' });
    if (await Bookmark.findOne({ user: req.user.id, url }))
      return res.status(400).json({ message: 'Bookmark already exists' });
    const bookmark = await Bookmark.create({ user: req.user.id, title, url, category, description });
    res.status(201).json(bookmark);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, req.body, { new: true }
    );
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    res.json(bookmark);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user.id });
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    bookmark.favorite = !bookmark.favorite;
    await bookmark.save();
    res.json(bookmark);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
