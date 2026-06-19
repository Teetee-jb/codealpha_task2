const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/follow');

router.post('/:id', auth, followUser);
router.delete('/:id', auth, unfollowUser);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);

module.exports = router;
