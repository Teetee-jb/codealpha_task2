const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      const err = new Error('Receiver ID and text are required');
      err.status = 400;
      return next(err);
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      text
    });

    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    // Find all messages where the user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const msg of messages) {
      const partnerId = msg.sender._id.toString() === req.user.id ? msg.receiver._id.toString() : msg.sender._id.toString();
      const partner = msg.sender._id.toString() === req.user.id ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner,
          lastMessage: msg,
          unread: msg.receiver._id.toString() === req.user.id && !msg.read ? 1 : 0
        });
      } else {
        const conv = conversationsMap.get(partnerId);
        if (msg.receiver._id.toString() === req.user.id && !msg.read) {
          conv.unread += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const partnerId = req.params.userId;
    
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: partnerId },
        { sender: partnerId, receiver: req.user.id }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 }); // Oldest first for chat view

    // Mark messages as read
    await Message.updateMany(
      { sender: partnerId, receiver: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err) {
    next(err);
  }
};
