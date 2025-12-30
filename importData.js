
// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');
// const dotenv = require('dotenv');
// const Food = require('./models/Food');

// dotenv.config();

// const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/food_ordering_db';

// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('MongoDB connected for data import'))
//   .catch(err => {
//     console.error('MongoDB connection error for import:', err);
//     process.exit(1);
//   });

// const importData = async () => {
//   try {
//     // --- Food Import ---
//     console.log('Deleting existing foods...');
//     await Food.deleteMany();

//     // Read food data from JSON file
//     const foodDataPath = path.resolve(__dirname, './data/foodData.json');
//     const rawFoodData = fs.readFileSync(foodDataPath, 'utf-8');
//     const foodsFromFile = JSON.parse(rawFoodData);

//     console.log(`Found ${foodsFromFile.length} food items to import...`);
    
//     // Calculate totalReviews from reviews array
//     const formattedFoods = foodsFromFile.map(food => {
//       const foodItem = {
//         ...food,
//         // Ensure all required fields have defaults
//         rating: food.rating || 0,
//         totalReviews: food.reviews ? food.reviews.length : 0,
//         available: food.available !== undefined ? food.available : true,
//         // Parse numeric fields to ensure they're numbers
//         price: typeof food.price === 'string' ? parseFloat(food.price) : food.price,
//         originalPrice: food.originalPrice ? 
//           (typeof food.originalPrice === 'string' ? parseFloat(food.originalPrice) : food.originalPrice) : 
//           undefined,
//         discountPercent: food.discountPercent ? 
//           (typeof food.discountPercent === 'string' ? parseFloat(food.discountPercent) : food.discountPercent) : 
//           undefined
//       };
      
//       // Add current date to reviews if not present
//       if (foodItem.reviews) {
//         foodItem.reviews = foodItem.reviews.map(review => ({
//           ...review,
//           date: new Date()
//         }));
//       }
      
//       return foodItem;
//     });

//     console.log('Importing foods...');
//     await Food.insertMany(formattedFoods);
//     console.log('Foods imported successfully!');

//     // Get import statistics
//     const totalFoods = await Food.countDocuments();
//     const categories = await Food.aggregate([
//       { $group: { _id: '$category', count: { $sum: 1 } } },
//       { $sort: { _id: 1 } }
//     ]);

//     const popularCount = await Food.countDocuments({ isPopular: true });
//     const specialCount = await Food.countDocuments({ isSpecialOffer: true });

//     console.log('\n=== IMPORT SUMMARY ===');
//     console.log(`Total foods imported: ${totalFoods}`);
//     console.log(`Popular items: ${popularCount}`);
//     console.log(`Special offers: ${specialCount}`);
//     console.log('\nBy category:');
//     categories.forEach(cat => {
//       console.log(`  ${cat._id}: ${cat.count} items`);
//     });

//     process.exit();
//   } catch (error) {
//     console.error('Error importing data:', error);
//     process.exit(1);
//   }
// };

// const destroyData = async () => {
//   try {
//     console.log('Destroying all foods...');
//     await Food.deleteMany();
//     console.log('All foods destroyed!');
//     process.exit();
//   } catch (error) {
//     console.error('Error destroying data:', error);
//     process.exit(1);
//   }
// };

// if (process.argv[2] === '--import') {
//   importData();
// } else if (process.argv[2] === '--delete') {
//   destroyData();
// } else {
//   console.log('Usage: node importData.js --import (to import data) or node importData.js --delete (to delete all data)');
//   console.log('Example:');
//   console.log('  npm run import  (if you have script in package.json)');
//   console.log('  OR');
//   console.log('  node importData.js --import');
//   process.exit(1);
// }
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Food = require('./models/Food');

dotenv.config();

// Use the same connection string as server.js
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is missing in .env file');
  process.exit(1);
}

// Utility to hide password in logs
const hidePassword = (uri) => {
  return uri.replace(/:[^:]*@/, ':****@');
};

console.log('🔗 Connecting to:', hidePassword(MONGODB_URI));

// Test connection first
const testConnection = async () => {
  try {
    console.log('Testing connection to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // List databases to verify connection
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    console.log('📊 Available databases:');
    result.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
};

const importData = async () => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Cannot import data without database connection');
      process.exit(1);
    }
    
    // --- Food Import ---
    console.log('\n🗑️ Deleting existing foods...');
    const deleteResult = await Food.deleteMany();
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing food items`);
    
    // Read food data from JSON file
    const foodDataPath = path.resolve(__dirname, './data/foodData.json');
    
    if (!fs.existsSync(foodDataPath)) {
      console.error(`❌ Food data file not found at: ${foodDataPath}`);
      console.log('Please ensure foodData.json exists in the data folder');
      process.exit(1);
    }
    
    console.log(`📖 Reading food data from: ${foodDataPath}`);
    const rawFoodData = fs.readFileSync(foodDataPath, 'utf-8');
    const foodsFromFile = JSON.parse(rawFoodData);
    
    console.log(`📦 Found ${foodsFromFile.length} food items to import...`);
    
    if (foodsFromFile.length === 0) {
      console.error('❌ No food items found in JSON file');
      process.exit(1);
    }
    
    // Format and validate food items
    const formattedFoods = foodsFromFile.map((food, index) => {
      // Basic validation
      if (!food.name || !food.category || !food.price) {
        console.warn(`⚠️ Food item at index ${index} missing required fields`);
      }
      
      const foodItem = {
        ...food,
        // Ensure all required fields have defaults
        name: food.name || `Food Item ${index + 1}`,
        category: food.category || 'Other',
        rating: food.rating || 0,
        totalReviews: food.reviews ? food.reviews.length : 0,
        available: food.available !== undefined ? food.available : true,
        isPopular: food.isPopular || false,
        isSpecialOffer: food.isSpecialOffer || false,
        // Parse numeric fields
        price: typeof food.price === 'string' ? parseFloat(food.price) : Number(food.price) || 0,
        originalPrice: food.originalPrice ? 
          (typeof food.originalPrice === 'string' ? parseFloat(food.originalPrice) : Number(food.originalPrice)) : 
          undefined,
        discountPercent: food.discountPercent ? 
          (typeof food.discountPercent === 'string' ? parseFloat(food.discountPercent) : Number(food.discountPercent)) : 
          undefined,
        // Add timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Validate price
      if (isNaN(foodItem.price) || foodItem.price <= 0) {
        console.warn(`⚠️ Invalid price for "${foodItem.name}": ${food.price}`);
        foodItem.price = 9.99; // Default price
      }
      
      // Add current date to reviews if present
      if (foodItem.reviews && Array.isArray(foodItem.reviews)) {
        foodItem.reviews = foodItem.reviews.map(review => ({
          ...review,
          date: review.date ? new Date(review.date) : new Date()
        }));
      }
      
      return foodItem;
    });

    console.log('📤 Importing foods to MongoDB Atlas...');
    const result = await Food.insertMany(formattedFoods);
    console.log(`✅ Successfully imported ${result.length} food items!`);
    
    // Get import statistics
    const totalFoods = await Food.countDocuments();
    const categories = await Food.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const popularCount = await Food.countDocuments({ isPopular: true });
    const specialCount = await Food.countDocuments({ isSpecialOffer: true });

    console.log('\n📊 === IMPORT SUMMARY ===');
    console.log(`✅ Total foods imported: ${totalFoods}`);
    console.log(`🌟 Popular items: ${popularCount}`);
    console.log(`🎉 Special offers: ${specialCount}`);
    console.log('\n📂 By category:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} items`);
    });
    
    // Sample of imported items
    console.log('\n📝 Sample imported items:');
    const sampleItems = await Food.find().limit(3).select('name category price rating');
    sampleItems.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name} (${item.category}) - $${item.price} ⭐${item.rating}`);
    });

    console.log('\n🎉 Data import completed successfully!');
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    console.error('Stack trace:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log('⚠️ WARNING: This will delete ALL food items from MongoDB Atlas!');
    console.log('Database:', hidePassword(MONGODB_URI));
    
    // Add confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Are you sure? Type "DELETE" to confirm: ', async (answer) => {
      if (answer === 'DELETE') {
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        
        console.log('🗑️ Destroying all foods...');
        const result = await Food.deleteMany();
        console.log(`✅ Deleted ${result.deletedCount} food items`);
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        readline.close();
        process.exit(0);
      } else {
        console.log('❌ Deletion cancelled');
        readline.close();
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('❌ Error destroying data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  destroyData();
} else if (process.argv[2] === '--test') {
  testConnection().then(isConnected => {
    process.exit(isConnected ? 0 : 1);
  });
} else {
  console.log('📋 Usage: node importData.js [option]');
  console.log('\nOptions:');
  console.log('  --import    Import food data from JSON to MongoDB Atlas');
  console.log('  --delete    Delete all food data (requires confirmation)');
  console.log('  --test      Test connection to MongoDB Atlas');
  console.log('\nExamples:');
  console.log('  node importData.js --test');
  console.log('  node importData.js --import');
  console.log('  node importData.js --delete');
  process.exit(1);
}