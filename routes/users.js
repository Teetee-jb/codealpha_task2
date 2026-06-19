const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, getUsers } = require('../controllers/users');

router.get('/', auth, getUsers);
router.get('/:id', auth, getProfile);
router.put('/:id', auth, updateProfile);

module.exports = router;
