import mongoose from 'mongoose';
import { categorySchema } from '../entities/Category.entity';

const MONGO =
  process.env.MONGO_URI || 'mongodb://localhost:27017/posand-inventory';

const Category = mongoose.model('Category', categorySchema);

const defaults = [
  { name: 'Sections', prefix: 'SECT' },
  { name: 'Channels', prefix: 'CHAN' },
  { name: 'Accessories', prefix: 'ACC' },
  { name: 'Glass', prefix: 'GLAS' },
];

async function seed() {
  try {
    console.log('Connecting to', MONGO);
    await mongoose.connect(MONGO);

    for (const c of defaults) {
      const existing = await Category.findOne({ name: c.name }).exec();
      if (existing) {
        console.log(
          `Category ${c.name} already exists (id=${String(existing._id)})`,
        );
        continue;
      }

      const doc = await Category.create({
        name: c.name,
        prefix: c.prefix,
        seq: 0,
      });
      console.log(`Created category ${c.name} id=${String(doc._id)}`);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

void seed();
