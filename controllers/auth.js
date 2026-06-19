const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      const err = new Error('All fields are required');
      err.status = 400;
      return next(err);
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.status = 400;
      return next(err);
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const err = new Error('Username or email already taken');
      err.status = 409;
      return next(err);
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      return next(err);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      return next(err);
    }

    const match = await user.comparePassword(password);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      return next(err);
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (err) {
    next(err);
  }
};
