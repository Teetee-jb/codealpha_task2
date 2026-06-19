const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');

exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      const err = new Error('Content is required');
      err.status = 400;
      return next(err);
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }

    const post = await Post.create({ 
      author: req.user.id, 
      content,
      image: imageUrl
    });
    await post.populate('author', 'username avatar');

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.query.author) {
      filter.author = req.query.author;
    } else if (req.query.feed === 'true') {
      const follows = await Follow.find({ follower: req.user.id }).select('following');
      const ids = follows.map((f) => f.following);
      filter.author = { $in: ids };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)
    ]);

    res.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatar');
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      return next(err);
    }

    res.json({ post });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      return next(err);
    }

    if (post.author.toString() !== req.user.id) {
      const err = new Error('Not authorized');
      err.status = 403;
      return next(err);
    }

    post.content = req.body.content || post.content;
    await post.save();
    await post.populate('author', 'username avatar');

    res.json({ post });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      return next(err);
    }

    if (post.author.toString() !== req.user.id) {
      const err = new Error('Not authorized');
      err.status = 403;
      return next(err);
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      return next(err);
    }

    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(idx, 1);
    }

    post.likeCount = post.likes.length;
    await post.save();

    res.json({ post });
  } catch (err) {
    next(err);
  }
};
