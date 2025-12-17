// Setup script to add sample data to MongoDB
import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/kumari_foods?retryWrites=true&w=majority';

async function setupMongoDB() {
  const client = new MongoClient(MONGO_URI);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('kumari_foods');

    // Drop existing collections (optional - remove if you want to keep existing data)
    try {
      await db.collection('companies').deleteMany({});
      console.log('🗑️  Cleared existing companies');
    } catch (e) {
      console.log('No existing companies to clear');
    }

    try {
      await db.collection('schedules').deleteMany({});
      console.log('🗑️  Cleared existing schedules');
    } catch (e) {
      console.log('No existing schedules to clear');
    }

    // Create sample companies
    const companiesData = [
      {
        id: 'company-1',
        name: 'Kumari Foods - Main Branch',
        createdAt: new Date().toISOString()
      },
      {
        id: 'company-2',
        name: 'Kumari Foods - Downtown',
        createdAt: new Date().toISOString()
      },
      {
        id: 'company-3',
        name: 'Kumari Foods - Airport',
        createdAt: new Date().toISOString()
      }
    ];

    const companiesResult = await db.collection('companies').insertMany(companiesData);
    console.log(`✅ Added ${companiesResult.insertedCount} companies`);

    // Create sample schedules
    const schedulesData = [
      {
        companyId: 'company-1',
        meals: [
          { day: 'monday', mealTime: 'morning', foodName: 'Idli with Sambar' },
          { day: 'monday', mealTime: 'Afternoon', foodName: 'Dosa with Chutney' },
          { day: 'monday', mealTime: 'night', foodName: 'Rice with Dal' },
          { day: 'tuesday', mealTime: 'morning', foodName: 'Upma' },
          { day: 'tuesday', mealTime: 'Afternoon', foodName: 'Uttapam' },
          { day: 'tuesday', mealTime: 'night', foodName: 'Biryani' },
          { day: 'wednesday', mealTime: 'morning', foodName: 'Pongal' },
          { day: 'wednesday', mealTime: 'Afternoon', foodName: 'Vada' },
          { day: 'wednesday', mealTime: 'night', foodName: 'Pulao' },
          { day: 'thursday', mealTime: 'morning', foodName: 'Poha' },
          { day: 'thursday', mealTime: 'Afternoon', foodName: 'Dosa' },
          { day: 'thursday', mealTime: 'night', foodName: 'Chapati with Curry' },
          { day: 'friday', mealTime: 'morning', foodName: 'Idli' },
          { day: 'friday', mealTime: 'Afternoon', foodName: 'Samosa' },
          { day: 'friday', mealTime: 'night', foodName: 'Curd Rice' },
          { day: 'saturday', mealTime: 'morning', foodName: 'Paratha' },
          { day: 'saturday', mealTime: 'Afternoon', foodName: 'Pakora' },
          { day: 'saturday', mealTime: 'night', foodName: 'Fried Rice' },
          { day: 'sunday', mealTime: 'morning', foodName: 'Puttu' },
          { day: 'sunday', mealTime: 'Afternoon', foodName: 'Bajji' },
          { day: 'sunday', mealTime: 'night', foodName: 'Korma' }
        ]
      },
      {
        companyId: 'company-2',
        meals: [
          { day: 'monday', mealTime: 'morning', foodName: 'Appam with Stew' },
          { day: 'monday', mealTime: 'Afternoon', foodName: 'Luchi with Curry' },
          { day: 'tuesday', mealTime: 'morning', foodName: 'Dosa' },
          { day: 'tuesday', mealTime: 'Afternoon', foodName: 'Chats' },
          { day: 'wednesday', mealTime: 'morning', foodName: 'Idli' },
          { day: 'wednesday', mealTime: 'Afternoon', foodName: 'Uttapam' },
          { day: 'thursday', mealTime: 'morning', foodName: 'Poha' },
          { day: 'thursday', mealTime: 'Afternoon', foodName: 'Vada' },
          { day: 'friday', mealTime: 'morning', foodName: 'Roti' },
          { day: 'friday', mealTime: 'Afternoon', foodName: 'Samosa' },
          { day: 'saturday', mealTime: 'morning', foodName: 'Paratha' },
          { day: 'saturday', mealTime: 'Afternoon', foodName: 'Pakora' },
          { day: 'sunday', mealTime: 'morning', foodName: 'Puttu' },
          { day: 'sunday', mealTime: 'Afternoon', foodName: 'Bajji' }
        ]
      },
      {
        companyId: 'company-3',
        meals: [
          { day: 'monday', mealTime: 'morning', foodName: 'Breakfast Combo' },
          { day: 'monday', mealTime: 'Afternoon', foodName: 'Lunch Combo' },
          { day: 'tuesday', mealTime: 'morning', foodName: 'South Indian' },
          { day: 'tuesday', mealTime: 'Afternoon', foodName: 'North Indian' },
          { day: 'wednesday', mealTime: 'morning', foodName: 'Mixed Breakfast' },
          { day: 'wednesday', mealTime: 'Afternoon', foodName: 'Special Lunch' },
          { day: 'thursday', mealTime: 'morning', foodName: 'Light Breakfast' },
          { day: 'thursday', mealTime: 'Afternoon', foodName: 'Heavy Lunch' },
          { day: 'friday', mealTime: 'morning', foodName: 'Quick Bites' },
          { day: 'friday', mealTime: 'Afternoon', foodName: 'Festive Lunch' }
        ]
      }
    ];

    const schedulesResult = await db.collection('schedules').insertMany(schedulesData);
    console.log(`✅ Added ${schedulesResult.insertedCount} schedules`);

    console.log('\n📊 Sample Data Summary:');
    console.log('✅ Companies: 3');
    console.log('✅ Total Meal Entries: 45+');
    console.log('\n🎉 MongoDB setup complete!');
    console.log('\nYou can now:');
    console.log('1. Open the app');
    console.log('2. Click "Cloud" button');
    console.log('3. Paste your MongoDB URI');
    console.log('4. Click "Test Connection"');
    console.log('5. Click "Sync Data" to load this sample data');

  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

// Run the setup
setupMongoDB();
