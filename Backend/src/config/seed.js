import User from '../models/user.model.js';
import Content from '../models/content.model.js';
import Payment from '../models/payment.model.js';
import Notification from '../models/notification.model.js';
import Report from '../models/report.model.js';
import { resolveDemoVideoUrl } from '../utils/demoVideo.js';

const seedUsers = {
  admin: {
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@blackreel.com').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
    status: 'active',
    avatarUrl: '/images/avatar.png',
  },
  demo: {
    name: process.env.SEED_USER_NAME || 'Nicole Johnson',
    email: (process.env.SEED_USER_EMAIL || 'user@blackreel.com').toLowerCase(),
    password: process.env.SEED_USER_PASSWORD || 'User123!',
    role: 'user',
    status: 'active',
    avatarUrl: '/images/avatar.png',
  },
};

const demoContent = [
  {
    title: 'Brothas in Arms',
    description: 'Brothas in Arms is an action-packed feature about loyalty, survival, and the cost of making it out.',
    type: 'Movie',
    genre: 'Action',
    tags: ['new_release', 'popular', 'fandom'],
    thumbnailUrl: '/images/fandom/Poster 1 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/hero_pool_boy_banner.png',
    videoUrl: resolveDemoVideoUrl({ title: 'Brothas in Arms' }),
    featured: true,
    views: 15400,
    rating: 4.8,
  },
  {
    title: 'Kinky',
    description: 'A thriller series where desire, ambition, and dangerous secrets collide on campus.',
    type: 'Series',
    genre: 'Thriller',
    tags: ['new_release'],
    thumbnailUrl: '/images/fandom/Poster 2 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 2 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'Kinky' }),
    views: 11200,
    rating: 4.5,
  },
  {
    title: 'Burden',
    description: 'An award-winning mystery about guilt, justice, and the stories we bury to survive.',
    type: 'Movie',
    genre: 'Mystery',
    tags: ['new_release', 'trending', 'fandom'],
    thumbnailUrl: '/images/fandom/Poster 3 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 3 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'Burden' }),
    views: 18900,
    rating: 4.7,
  },
  {
    title: 'He Lifted',
    description: 'A grounded drama about faith, protest, and a family carrying history on their shoulders.',
    type: 'Movie',
    genre: 'Drama',
    tags: ['new_release'],
    thumbnailUrl: '/images/fandom/Poster 4 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 4 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'He Lifted' }),
    views: 9400,
    rating: 4.2,
  },
  {
    title: 'Blood Sisters',
    description: 'A comedy series about sisterhood, chaos, and choosing family again and again.',
    type: 'Series',
    genre: 'Comedy',
    tags: ['new_release', 'trending'],
    thumbnailUrl: '/images/fandom/Poster 5 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 5 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'Blood Sisters' }),
    views: 20350,
    rating: 4.6,
  },
  {
    title: 'Glory Road',
    description: 'A historical story of courage and collective action in the fight for civil rights.',
    type: 'Movie',
    genre: 'History',
    tags: ['new_release'],
    thumbnailUrl: '/images/fandom/Poster 6 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 6 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'Glory Road' }),
    views: 8300,
    rating: 4.1,
  },
  {
    title: 'Love Match',
    description: 'A romance about ambition, healing, and the connection that changes everything.',
    type: 'Movie',
    genre: 'Romance',
    tags: ['trending', 'fandom'],
    thumbnailUrl: '/images/fandom/Poster 7 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/Poster 7 - 150x200.jpg.jpeg',
    videoUrl: resolveDemoVideoUrl({ title: 'Love Match' }),
    views: 17300,
    rating: 4.4,
  },
  {
    title: 'Velvet Room',
    description: 'An exclusive look inside the most secretive club in Miami, where every night comes with a price.',
    type: 'Series',
    genre: 'Originals',
    tags: ['trending', 'popular'],
    thumbnailUrl: '/images/fandom/Poster 3 - 150x200.jpg.jpeg',
    heroImageUrl: '/images/fandom/hero_pool_boy_banner.png',
    videoUrl: resolveDemoVideoUrl({ title: 'Velvet Room' }),
    featured: true,
    views: 31120,
    rating: 4.9,
  },
];

const syncSeedUser = async ({ email, password, ...payload }) => {
  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    user = await User.create({ email, password, ...payload });
    return user;
  }

  user.name = payload.name;
  user.role = payload.role;
  user.status = payload.status;
  user.avatarUrl = payload.avatarUrl;

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    user.password = password;
  }

  await user.save();

  return user;
};

const seedDatabase = async () => {
  const adminUser = await syncSeedUser(seedUsers.admin);
  const demoUser = await syncSeedUser(seedUsers.demo);

  const existingContentCount = await Content.countDocuments();

  if (existingContentCount === 0) {
    await Content.insertMany(
      demoContent.map((item) => ({
        ...item,
        createdBy: adminUser._id,
      }))
    );
  }

  const allContent = await Content.find().sort({ createdAt: 1 });

  if (demoUser.watchlist.length === 0 && allContent.length >= 3) {
    demoUser.watchlist = [allContent[0]._id, allContent[2]._id, allContent[allContent.length - 1]._id];
    demoUser.devices = [
      {
        name: "Nicole's iPhone",
        location: 'Oakland, CA',
        os: 'iOS 17.4',
        type: 'phone',
        current: true,
      },
      {
        name: "Nicole's MacBook Pro",
        location: 'Los Angeles, CA',
        os: 'macOS Sonoma',
        type: 'laptop',
      },
      {
        name: 'Living Room TV',
        location: 'Atlanta, GA',
        os: 'Smart TV',
        type: 'tv',
      },
    ];
    await demoUser.save();
  }

  const existingPaymentsCount = await Payment.countDocuments();

  if (existingPaymentsCount === 0) {
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await Payment.create({
      user: demoUser._id,
      planType: 'premium',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      billingEmail: demoUser.email,
      paymentMethod: 'Visa ending 4242',
      nextBillingDate,
      transactionId: `txn_seed_${Date.now()}`,
    });

    await User.findByIdAndUpdate(demoUser._id, {
      subscription: {
        planType: 'premium',
        status: 'active',
        startedAt: new Date(),
        renewalDate: nextBillingDate,
      },
    });
  }

  const existingNotificationsCount = await Notification.countDocuments();

  if (existingNotificationsCount === 0) {
    await Notification.insertMany([
      {
        title: 'Your subscription is active',
        message: 'Premium access is now enabled on your account.',
        type: 'system',
        targetRole: 'user',
        user: demoUser._id,
        createdBy: adminUser._id,
      },
      {
        title: 'New episode available',
        message: 'Velvet Room has a new episode ready to watch.',
        type: 'new_episode',
        targetRole: 'user',
        createdBy: adminUser._id,
      },
      {
        title: 'Platform maintenance',
        message: 'A brief maintenance window is scheduled for tonight at 11:30 PM.',
        type: 'broadcast',
        targetRole: 'all',
        createdBy: adminUser._id,
      },
    ]);
  }

  const existingReportsCount = await Report.countDocuments();

  if (existingReportsCount === 0 && allContent.length >= 3) {
    await Report.insertMany([
      {
        content: allContent[0]._id,
        contentTitle: allContent[0].title,
        reportedByEmail: 'viewer1@example.com',
        reason: 'Audio sync issue',
        status: 'pending',
      },
      {
        content: allContent[1]._id,
        contentTitle: allContent[1].title,
        reportedByEmail: 'viewer2@example.com',
        reason: 'Incorrect maturity label',
        status: 'resolved',
      },
      {
        content: allContent[2]._id,
        contentTitle: allContent[2].title,
        reportedByEmail: 'viewer3@example.com',
        reason: 'Broken subtitles',
        status: 'pending',
      },
    ]);
  }
};

export default seedDatabase;
