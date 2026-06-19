const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', messagesController.sendMessage);
router.get('/conversations', messagesController.getConversations);
router.get('/:userId', messagesController.getMessages);

module.exports = router;
