const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res, next) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text) {
      const err = new Error('postId and text are required');
      err.status = 400;
      return next(err);
    }

    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      return next(err);
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      text
    });

    post.commentCount += 1;
    await post.save();

    await comment.populate('author', 'username avatar');

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.query;

    if (!postId) {
      const err = new Error('postId query param is required');
      err.status = 400;
      return next(err);
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      return next(err);
    }

    if (comment.author.toString() !== req.user.id) {
      const err = new Error('Not authorized');
      err.status = 403;
      return next(err);
    }

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    await comment.deleteOne();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
