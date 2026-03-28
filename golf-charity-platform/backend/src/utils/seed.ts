import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Charity } from '../models/Charity';
import { UserScores } from '../models/Score';
import { User } from '../models/User';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Charity.deleteMany({}),
    UserScores.deleteMany({}),
  ]);

  // Seed charities
  const charities = await Charity.insertMany([
    {
      name: 'Golf for Good',
      description: 'Bringing the joy of golf to underprivileged youth across the UK. We provide free coaching, equipment, and access to courses for children aged 8-18 from low-income families.',
      logo: 'https://placehold.co/200x200/22c55e/white?text=G4G',
      images: ['https://placehold.co/800x400/22c55e/white?text=Golf+for+Good'],
      website: 'https://example.com',
      category: 'Youth Sports',
      featured: true,
      events: [
        {
          title: 'Annual Junior Golf Day',
          date: new Date('2025-07-15'),
          description: 'A fun-filled day of golf for junior players. All equipment provided.',
          location: 'Royal Birkdale Golf Club, Southport',
        },
      ],
      totalReceived: 125000,
    },
    {
      name: 'Fairway Hearts',
      description: 'Supporting cardiac research and heart disease prevention through the power of golf communities. Every round played raises funds for vital medical research.',
      logo: 'https://placehold.co/200x200/ef4444/white?text=FH',
      images: ['https://placehold.co/800x400/ef4444/white?text=Fairway+Hearts'],
      website: 'https://example.com',
      category: 'Medical Research',
      featured: true,
      events: [
        {
          title: 'Charity Golf Tournament 2025',
          date: new Date('2025-08-20'),
          description: 'Annual charity tournament raising funds for heart disease research.',
          location: 'Wentworth Club, Surrey',
        },
      ],
      totalReceived: 89000,
    },
    {
      name: 'Green Earth Golf',
      description: 'Environmental charity focused on making golf courses more sustainable and restoring natural habitats. We work with over 200 golf clubs to reduce their environmental footprint.',
      logo: 'https://placehold.co/200x200/16a34a/white?text=GEG',
      images: ['https://placehold.co/800x400/16a34a/white?text=Green+Earth+Golf'],
      website: 'https://example.com',
      category: 'Environment',
      featured: false,
      events: [],
      totalReceived: 45000,
    },
    {
      name: 'Veterans on the Fairway',
      description: 'Using golf as therapy and community building for military veterans. Our programs help veterans transition to civilian life through structured golf programs, mentorship, and peer support.',
      logo: 'https://placehold.co/200x200/1d4ed8/white?text=VOF',
      images: ['https://placehold.co/800x400/1d4ed8/white?text=Veterans+on+the+Fairway'],
      website: 'https://example.com',
      category: 'Veterans',
      featured: false,
      events: [
        {
          title: 'Veterans Golf Day',
          date: new Date('2025-06-28'),
          description: 'Monthly golf day for veterans — all abilities welcome.',
          location: 'Various venues across the UK',
        },
      ],
      totalReceived: 67000,
    },
  ]);

  console.log(`✅ Created ${charities.length} charities`);

  // Seed admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@golfcharity.com',
    password: 'Admin@1234',
    role: 'admin',
    subscription: {
      status: 'active',
      plan: 'yearly',
    },
    selectedCharity: charities[0]._id,
    charityPercentage: 15,
  });

  // Seed test user
  const testUser = await User.create({
    name: 'Test Player',
    email: 'player@golfcharity.com',
    password: 'Player@1234',
    role: 'user',
    subscription: {
      status: 'active',
      plan: 'monthly',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    selectedCharity: charities[0]._id,
    charityPercentage: 10,
  });

  // Seed test user scores
  await UserScores.create({
    user: testUser._id,
    scores: [
      { value: 36, date: new Date('2025-04-10') },
      { value: 28, date: new Date('2025-04-03') },
      { value: 33, date: new Date('2025-03-27') },
      { value: 41, date: new Date('2025-03-20') },
      { value: 25, date: new Date('2025-03-13') },
    ],
  });

  console.log(`✅ Created admin: admin@golfcharity.com / Admin@1234`);
  console.log(`✅ Created player: player@golfcharity.com / Player@1234`);

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch(console.error);
