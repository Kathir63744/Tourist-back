const mongoose = require('mongoose');
require('dotenv').config();

// Define Resort Schema
const resortSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  priceDisplay: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  image: { type: String },
  amenities: [String],
  tags: [String],
  distance: String,
  weather: String,
  season: String,
  special: String,
  rooms: [String]
});

// Create model
const Resort = mongoose.model('Resort', resortSchema);

// Sample resort data matching your frontend
const resorts = [
  {
    id: 1,
    name: "Deluxe Family Room",
    location: "Sholayar Dam City",
    description: "Our Deluxe Family Room offers spacious and comfortable accommodations perfect for families. It features a cozy seating area, a large bed, modern amenities, and a private bathroom.",
    price: 2603,
    priceDisplay: "₹2,603/night",
    rating: 4.4,
    reviews: 93,
    image: "/room1.jpg",
    amenities: ["Bathroom", "Bath or Shower", "Dining table", "WiFi", "Restaurant", "Flat-screen TV", "Mineral Water"],
    tags: ["Luxury", "Family Friendly", "Pet Friendly", "Spa", "Wellness"],
    distance: "2.5km from city center",
    weather: "18-24°C • Misty mornings",
    season: "Best: Oct-Mar",
    special: "Book 3 nights, get 1 free",
    rooms: ["Deluxe", "Premium", "Suite", "Villa"]
  },
  {
    id: 2,
    name: "Deluxe Family Room (With Balcony)",
    location: "Sholayar Dam City",
    description: "Sustainable treehouse resort in the heart of untouched forests",
    price: 2982,
    priceDisplay: "₹2,982/night",
    rating: 4.4,
    reviews: 94,
    image: "/room2.jpg",
    amenities: ["Forest View", "Bird Watching", "Eco-friendly", "Open Balcony"],
    tags: ["Eco-Friendly", "Adventure", "Romantic", "Wildlife", "Nature"],
    distance: "Deep forest location",
    weather: "16-22°C • Dense fog",
    season: "Year-round",
    special: "Free guided nature walk",
    rooms: ["Treehouse", "Cabin", "Tent", "Family Suite"]
  },
  {
    id: 3,
    name: "Valparai Emerald Resort & Spa",
    location: "Valparai",
    description: "5-star luxury resort amidst tea gardens with panoramic Anamalai hills view",
    price: 4800,
    priceDisplay: "₹4,800/night",
    rating: 4.9,
    reviews: 120,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
    amenities: ["Mountain View", "Spa", "Infinity Pool", "WiFi", "Restaurant", "Gym", "Parking"],
    tags: ["Luxury", "Family Friendly", "Spa", "Pool", "Fine Dining"],
    distance: "3km from Valparai town",
    weather: "15-22°C • Pleasant",
    season: "Oct-Apr",
    special: "Free spa treatment on 3-night stay",
    rooms: ["Deluxe", "Premium", "Suite", "Villa"]
  },
  {
    id: 4,
    name: "Solaiyur Forest Canopy Resort",
    location: "Solaiyur",
    description: "Sustainable treehouse resort in the heart of untouched forests",
    price: 4200,
    priceDisplay: "₹4,200/night",
    rating: 4.7,
    reviews: 85,
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800",
    amenities: ["Forest View", "Campfire", "Trekking", "Bird Watching", "Eco-friendly", "Bonfire"],
    tags: ["Eco-Friendly", "Adventure", "Wildlife", "Nature", "Romantic"],
    distance: "Deep forest location",
    weather: "16-22°C • Dense fog",
    season: "Year-round",
    special: "Free guided nature walk",
    rooms: ["Treehouse", "Cabin", "Tent", "Family Suite"]
  },
  {
    id: 5,
    name: "Kothagiri Sky Villas",
    location: "Kothagiri",
    description: "Modern luxury villas with breathtaking views of Nilgiri valley",
    price: 5500,
    priceDisplay: "₹5,500/night",
    rating: 4.8,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800",
    amenities: ["Valley View", "Private Pool", "Butler Service", "Fine Dining", "Spa", "Jacuzzi"],
    tags: ["Luxury", "Honeymoon", "Panoramic Views", "Private Pool", "Romantic"],
    distance: "5km from Kothagiri",
    weather: "12-20°C • Cool",
    season: "Nov-Feb",
    special: "Honeymoon package available",
    rooms: ["Villa", "Premium Villa", "Honeymoon Suite", "Executive Suite"]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('📡 Connecting to MongoDB...');
    
    // Get MongoDB URI from .env or use default
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resort';
    console.log(`🔗 Using URI: ${MONGODB_URI}`);
    
    // Connect to MongoDB - Remove deprecated options
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Clear existing resorts collection
    console.log('🧹 Clearing existing resorts...');
    await Resort.deleteMany({});
    console.log('✅ Database cleared');
    
    // Insert new resorts
    console.log('🏨 Seeding resorts...');
    const result = await Resort.insertMany(resorts);
    console.log(`✅ Inserted ${result.length} resorts`);
    
    // Display what was added
    console.log('\n📋 Resorts added to database:');
    console.log('='.repeat(50));
    result.forEach((resort, index) => {
      console.log(`${index + 1}. ${resort.name}`);
      console.log(`   Location: ${resort.location}`);
      console.log(`   Price: ₹${resort.price}/night`);
      console.log(`   Rating: ${resort.rating}/5 (${resort.reviews} reviews)`);
      console.log('');
    });
    console.log('='.repeat(50));
    
    // Count total resorts
    const count = await Resort.countDocuments();
    console.log(`📊 Total resorts in database: ${count}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
    // Show next steps
    console.log('\n💡 Next steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Test API: http://localhost:5000/api/resorts');
    console.log('   3. Test from frontend: http://localhost:3000');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed with error:');
    console.error(`   Message: ${error.message}`);
    
    if (error.name === 'MongoServerError') {
      console.log('\n💡 MongoDB Error - Possible solutions:');
      console.log('   1. Check your MONGODB_URI in .env file');
      console.log('   2. Make sure database name is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - MongoDB is not running!');
      console.log('   Start MongoDB with: mongod');
    } else {
      console.error('\n💡 Full error:', error);
    }
    
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();