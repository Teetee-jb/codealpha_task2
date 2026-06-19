require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Message = require('./models/Message');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const user1 = await User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      bio: 'Software engineer and tech enthusiast.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
    });

    const user2 = await User.create({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
      bio: 'Just here for the memes.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
    });

    const user3 = await User.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'password123',
      bio: 'Frontend developer making cool UIs.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
    });

    const user4 = await User.create({
      username: 'dave',
      email: 'dave@example.com',
      password: 'password123',
      bio: 'Coffee addict and code wizard 🧙‍♂️',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave'
    });

    const user5 = await User.create({
      username: 'eve',
      email: 'eve@example.com',
      password: 'password123',
      bio: 'Design systems engineer. I love CSS.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve'
    });

    const user6 = await User.create({
      username: 'frank',
      email: 'frank@example.com',
      password: 'password123',
      bio: 'Serverless architecture enthusiast.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank'
    });

    console.log('Created users');

    // Create posts
    const post1 = await Post.create({
      author: user1._id,
      content: 'Just deployed the new version of our social platform! Really excited for everyone to try out the new minimalist UI. Let me know what you think in the comments!',
      likes: [user2._id, user3._id],
      likeCount: 2
    });

    const post2 = await Post.create({
      author: user2._id,
      content: 'Does anyone else feel like there are way too many JavaScript frameworks nowadays? I cannot keep up anymore.',
      likes: [user1._id],
      likeCount: 1
    });

    const post3 = await Post.create({
      author: user3._id,
      content: 'Taking a break from coding today to go hiking. Need to touch grass sometimes.',
      likes: [user1._id, user2._id],
      likeCount: 2
    });

    const post4 = await Post.create({
      author: user4._id,
      content: 'Just discovered a new trick in CSS Grid. It is mind blowing how much code you can save by just using grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)).',
      likes: [user1._id, user5._id, user6._id],
      likeCount: 3
    });

    const post5 = await Post.create({
      author: user5._id,
      content: 'Anyone have good recommendations for a mechanical keyboard? My current one is starting to miss keystrokes.',
      likes: [user4._id, user2._id],
      likeCount: 2
    });

    const post6 = await Post.create({
      author: user6._id,
      content: 'I finally passed the AWS Certified Solutions Architect exam today! So relieved. 🎉',
      likes: [user1._id, user2._id, user3._id, user4._id, user5._id],
      likeCount: 5
    });

    const post7 = await Post.create({
      author: user1._id,
      content: 'Writing documentation is just as important as writing code. Change my mind.',
      likes: [user4._id, user6._id],
      likeCount: 2
    });

    console.log('Created posts');

    // Create comments
    await Comment.create({
      post: post1._id,
      author: user2._id,
      text: 'Looks awesome Alice! Way better without the purple.'
    });

    await Comment.create({
      post: post1._id,
      author: user3._id,
      text: 'The new blue accent is super clean.'
    });

    post1.commentCount = 2;
    await post1.save();

    await Comment.create({
      post: post2._id,
      author: user3._id,
      text: 'You should just stick to vanilla JS.'
    });

    post2.commentCount = 1;
    await post2.save();

    await Comment.create({
      post: post4._id,
      author: user5._id,
      text: 'Yes! Auto-fit is a lifesaver for responsive layouts without media queries.'
    });

    post4.commentCount = 1;
    await post4.save();

    await Comment.create({
      post: post5._id,
      author: user4._id,
      text: 'Keychron Q1 is amazing. Highly recommend.'
    });

    await Comment.create({
      post: post5._id,
      author: user3._id,
      text: 'Build your own! It is a fun rabbit hole.'
    });

    post5.commentCount = 2;
    await post5.save();

    await Comment.create({
      post: post6._id,
      author: user1._id,
      text: 'Congratulations Frank! That is a tough exam.'
    });

    post6.commentCount = 1;
    await post6.save();

    await Comment.create({
      post: post7._id,
      author: user2._id,
      text: 'I refuse to write docs and you cannot make me.'
    });

    post7.commentCount = 1;
    await post7.save();

    console.log('Created comments');

    // Create Messages
    await Message.create({
      sender: user2._id,
      receiver: user1._id,
      text: 'Hey Alice! I just saw the new UI, it looks fantastic.',
      read: true
    });
    
    await Message.create({
      sender: user1._id,
      receiver: user2._id,
      text: 'Thanks Bob! Still tweaking a few things but glad you like it.',
      read: true
    });
    
    await Message.create({
      sender: user2._id,
      receiver: user1._id,
      text: 'Let me know if you need any help testing!',
      read: false
    });

    await Message.create({
      sender: user3._id,
      receiver: user1._id,
      text: 'Are we still on for the code review tomorrow?',
      read: false
    });

    console.log('Created messages');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
