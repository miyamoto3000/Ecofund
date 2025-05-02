// scripts/seedGrants.js
import dotenv from 'dotenv';
import dbConnect from '../lib/db.js';
import Grant from '../models/Grants.js';
import fs from 'fs';

dotenv.config({ path: 'C:/Users/shahi/ecothon/.env.local' }); 

async function seedGrants() {
  try {
    await dbConnect();
    const rawData = fs.readFileSync('scripts/initialGrants.json', 'utf-8');
    const grants = JSON.parse(rawData);

    for (const grant of grants) {
      await Grant.findOneAndUpdate(
        { title: grant.title, source: grant.source },
        { ...grant, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    console.log('Successfully seeded', grants.length, 'grants into the database.');
  } catch (error) {
    console.error('Error seeding grants:', error);
    process.exit(1);
  }
}

seedGrants();