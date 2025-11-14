/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');

// MongoDB connection string
const MONGO_URI =
    'mongodb+srv://azibaliansari311_db_user:My10dollers$@cluster0.nktmmeq.mongodb.net/Aluminum?retryWrites=true&w=majority';

// Color schema
const colorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
    },
    { timestamps: true }
);

const Color = mongoose.model('Color', colorSchema);

// Initial colors to seed
const initialColors = [
    { name: 'DULL', description: 'Dull finish aluminum' },
    { name: 'H23/PC-RAL', description: 'H23/PC-RAL color finish' },
    { name: 'SAHRA/BRN', description: 'Sahara brown finish' },
    { name: 'BLACK/MULTI', description: 'Black multi-tone finish' },
    { name: 'WOODCOAT', description: 'Wood coat finish' },
];

async function seedColors() {
    try {
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

seedColors();
