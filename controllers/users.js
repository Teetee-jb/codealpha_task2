const User = require('../models/User');
const Follow = require('../models/Follow');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }

    const [followerCount, followingCount, isFollowing] = await Promise.all([
      Follow.countDocuments({ following: req.params.id }),
      Follow.countDocuments({ follower: req.params.id }),
      req.user
        ? Follow.exists({ follower: req.user.id, following: req.params.id })
        : null
    ]);

    res.json({
      user,
      followerCount,
      followingCount,
      isFollowing: !!isFollowing
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      const err = new Error('Not authorized');
      err.status = 403;
      return next(err);
    }

    const { bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('username avatar bio')
      .limit(limit);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};
