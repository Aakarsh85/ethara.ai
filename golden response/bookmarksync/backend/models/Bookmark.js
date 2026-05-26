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
