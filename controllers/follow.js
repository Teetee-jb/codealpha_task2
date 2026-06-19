const Follow = require('../models/Follow');
const User = require('../models/User');

exports.followUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      const err = new Error('Cannot follow yourself');
      err.status = 400;
      return next(err);
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }

    const exists = await Follow.findOne({
      follower: req.user.id,
      following: req.params.id
    });

    if (exists) {
      const err = new Error('Already following this user');
      err.status = 409;
      return next(err);
    }

    await Follow.create({ follower: req.user.id, following: req.params.id });

    res.status(201).json({ message: 'Followed' });
  } catch (err) {
    next(err);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const doc = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: req.params.id
    });

    if (!doc) {
      const err = new Error('Not following this user');
      err.status = 404;
      return next(err);
    }

    res.json({ message: 'Unfollowed' });
  } catch (err) {
    next(err);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const docs = await Follow.find({ following: req.params.id })
      .populate('follower', 'username avatar bio');

    const followers = docs.map((d) => d.follower);
    res.json({ followers });
  } catch (err) {
    next(err);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const docs = await Follow.find({ follower: req.params.id })
      .populate('following', 'username avatar bio');

    const following = docs.map((d) => d.following);
    res.json({ following });
  } catch (err) {
    next(err);
  }
};
