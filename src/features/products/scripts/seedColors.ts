/* eslint-disable prettier/prettier */
import 'dotenv/config';
import mongoose, { Model, Schema } from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

// Color schema
type SeedColor = {
  name: string;
  description: string;
};

const colorSchema = new Schema<SeedColor>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true },
);

const Color: Model<SeedColor> = mongoose.model('Color', colorSchema);

// Initial colors to seed
const initialColors: SeedColor[] = [
  { name: 'DULL', description: 'Dull finish aluminum' },
  { name: 'H23/PC-RAL', description: 'H23/PC-RAL color finish' },
  { name: 'SAHRA/BRN', description: 'Sahara brown finish' },
  { name: 'BLACK/MULTI', description: 'Black multi-tone finish' },
  { name: 'WOODCOAT', description: 'Wood coat finish' },
];

async function seedColors() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is required to run seedColors');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if colors already exist
    const existingCount = await Color.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing colors. Skipping seed.`);
      await mongoose.connection.close();
      return;
    }

    console.log('Seeding colors...');
    await Color.insertMany(initialColors);
    console.log(`✓ Successfully seeded ${initialColors.length} colors`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding colors:', error);
    process.exit(1);
  }
}

void seedColors();
