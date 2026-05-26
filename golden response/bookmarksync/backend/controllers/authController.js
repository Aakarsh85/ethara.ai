const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed });
    res.status(201).json({ token: generateToken(user._id), name: user.name, email: user.email });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: generateToken(user._id), name: user.name, email: user.email });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.profile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};
