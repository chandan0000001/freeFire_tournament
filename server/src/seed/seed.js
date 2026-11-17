import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Tournament } from '../models/Tournament.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { ROLES } from '../constants/roles.js';
import { TOURNAMENT_STATUS, TOURNAMENT_FORMAT } from '../constants/statuses.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Seed Superadmin
    const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@ritesports.in').toLowerCase();
    const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@RIT2026!';
    
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'RIT Chief Administrator',
        email: adminEmail,
        password: adminPassword,
        role: ROLES.SUPERADMIN,
        isActive: true,
      });
      console.log(`[Seed] Superadmin created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`[Seed] Superadmin already exists: ${adminEmail}`);
    }

    // 2. Seed Site Settings
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create({
        collegeName: 'RIT Esports Arena',
        whatsappCommunityUrl: process.env.WHATSAPP_COMMUNITY_URL || 'https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2',
        adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '918114603994',
        upiId: process.env.ADMIN_UPI_ID || '8114603994@paytm',
        announcementBanner: 'Welcome to RIT Esports Arena! Registrations for Week 01 Squad & Solo Battles are now OPEN!',
        contactEmail: 'ritesports.arena@gmail.com',
      });
      console.log('[Seed] Site settings created with WhatsApp and UPI configurations.');
    } else {
      settings.whatsappCommunityUrl = process.env.WHATSAPP_COMMUNITY_URL || settings.whatsappCommunityUrl;
      settings.adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER || settings.adminWhatsAppNumber;
      settings.upiId = process.env.ADMIN_UPI_ID || settings.upiId;
      await settings.save();
      console.log('[Seed] Site settings updated.');
    }

    // 4. Seed Tournaments
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(18, 0, 0, 0); // 6:00 PM IST

    const tournamentsData = [
      {
        title: 'RIT Squad Battle — Week 01',
        slug: 'rit-squad-battle-week-01',
        description: 'The premier weekly 4v4 Free Fire Squad showdown for RIT students. Battle for the Booyah and prize pool!',
        format: TOURNAMENT_FORMAT.SQUAD,
        entryFee: 29,
        maxSlots: 12, // 12 Squads = 48 players in one custom room
        registeredSlots: 0,
        registrationStart: new Date(),
        registrationEnd: new Date(nextSunday.getTime() - 2 * 3600000), // 2 hours before match
        matchDate: nextSunday,
        status: TOURNAMENT_STATUS.REGISTRATION_OPEN,
        map: 'Bermuda',
        scoringConfig: {
          killPointValue: 1,
          booyahBonus: 12,
          tieBreakerOrder: ['booyahs', 'kills', 'bestPlacement'],
        },
        prizeConfig: {
          firstPlace: 600,
          secondPlace: 300,
          thirdPlace: 100,
          mvpPrize: 100,
          totalPool: 1100,
          terms: 'Cash prizes transferred via UPI directly by admin within 24 hours of verified results.',
        },
        rules: '1. Only verified RIT students.\n2. No PC/Emulators allowed; mobile only.\n3. Custom Room ID & Password sent via email 20 mins prior.\n4. Toxic behaviour or hacking results in permanent ban.',
        bannerUrl: '/images/ff-banner.webp',
        isPublic: true,
      },
      {
        title: 'RIT Solo Battle — Week 01',
        slug: 'rit-solo-battle-week-01',
        description: 'Prove your individual gun skill and survival instincts in the RIT Free Fire Solo arena!',
        format: TOURNAMENT_FORMAT.SOLO,
        entryFee: 14,
        maxSlots: 48, // 48 Solo players
        registeredSlots: 0,
        registrationStart: new Date(),
        registrationEnd: new Date(nextSunday.getTime() - 2 * 3600000),
        matchDate: new Date(nextSunday.getTime() + 7200000), // 8:00 PM IST
        status: TOURNAMENT_STATUS.REGISTRATION_OPEN,
        map: 'Purgatory',
        scoringConfig: {
          killPointValue: 1,
          booyahBonus: 12,
          tieBreakerOrder: ['booyahs', 'kills', 'bestPlacement'],
        },
        prizeConfig: {
          firstPlace: 300,
          secondPlace: 150,
          thirdPlace: 50,
          mvpPrize: 0,
          totalPool: 500,
          terms: 'Cash prize paid manually via UPI to verified winner.',
        },
        rules: '1. Solo mode only. Teaming up with other players will result in immediate disqualification.\n2. Mobile devices only.\n3. Screenshots must be submitted in case of dispute.',
        bannerUrl: '/images/ff-banner-hayato.webp',
        isPublic: true,
      },
      {
        title: 'RIT Squad Battle — Week 02',
        slug: 'rit-squad-battle-week-02',
        description: 'Prepare for Week 02 clash! Registrations open soon after Week 01 concludes.',
        format: TOURNAMENT_FORMAT.SQUAD,
        entryFee: 29,
        maxSlots: 12,
        registeredSlots: 0,
        registrationStart: new Date(nextSunday.getTime() + 86400000),
        registrationEnd: new Date(nextSunday.getTime() + 7 * 86400000),
        matchDate: new Date(nextSunday.getTime() + 7 * 86400000),
        status: TOURNAMENT_STATUS.UPCOMING,
        map: 'Kalahari',
        scoringConfig: {
          killPointValue: 1,
          booyahBonus: 12,
          tieBreakerOrder: ['booyahs', 'kills', 'bestPlacement'],
        },
        prizeConfig: {
          firstPlace: 600,
          secondPlace: 300,
          thirdPlace: 100,
          mvpPrize: 100,
          totalPool: 1100,
          terms: 'Standard cash prize terms apply.',
        },
        rules: 'Standard Free Fire esports rules.',
        bannerUrl: '/images/ff-banner-2.webp',
        isPublic: true,
      },
    ];

    for (const tData of tournamentsData) {
      await Tournament.findOneAndUpdate({ slug: tData.slug }, tData, { upsert: true, new: true });
      console.log(`[Seed] Seeded tournament: ${tData.title} (${tData.slug})`);
    }

    console.log('[Seed] Database successfully seeded! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
