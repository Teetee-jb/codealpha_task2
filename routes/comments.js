const router = require('express').Router();
const auth = require('../middleware/auth');
const { addComment, getComments, deleteComment } = require('../controllers/comments');

router.post('/', auth, addComment);
router.get('/', auth, getComments);
router.delete('/:id', auth, deleteComment);

module.exports = router;
