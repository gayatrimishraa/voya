const { MongoClient } = require('mongodb');

const uri = 'mongodb://gayatri:Gayatri2026@ac-h1ias7d-shard-00-00.uljxbkf.mongodb.net:27017,ac-h1ias7d-shard-00-01.uljxbkf.mongodb.net:27017,ac-h1ias7d-shard-00-02.uljxbkf.mongodb.net:27017/travel-app?ssl=true&replicaSet=atlas-nwtab6-shard-0&authSource=admin&appName=Cluster0';

const trips = [
  // ── Beach ──────────────────────────────────────────
  {
    destination: 'Goa',
    days: 5, vibe: 'Beach',
    activities: ['Baga Beach', 'Water Sports', 'Dudhsagar Falls', 'Nightlife', 'Fort Aguada'],
    price: 12000,
    budgetTier: 'mid',
    region: 'West India',
    coordinates: { lat: 15.2993, lng: 74.1240 },
  },
  {
    destination: 'Andaman Islands',
    days: 6, vibe: 'Beach',
    activities: ['Radhanagar Beach', 'Scuba Diving', 'Glass Bottom Boat', 'Cellular Jail', 'Snorkelling'],
    price: 35000,
    budgetTier: 'luxury',
    region: 'Island',
    coordinates: { lat: 11.7401, lng: 92.6586 },
  },
  {
    destination: 'Pondicherry',
    days: 3, vibe: 'Beach',
    activities: ['Promenade Beach', 'Auroville', 'French Quarter Walk', 'Scuba Diving', 'Sri Aurobindo Ashram'],
    price: 10000,
    budgetTier: 'budget',
    region: 'South India',
    coordinates: { lat: 11.9416, lng: 79.8083 },
  },

  // ── Spiritual / Temple ──────────────────────────────
  {
    destination: 'Varanasi',
    days: 4, vibe: 'Temple',
    activities: ['Ganga Aarti', 'Boat Ride', 'Sarnath Visit', 'Street Food Tour', 'Kashi Vishwanath'],
    price: 8500,
    budgetTier: 'budget',
    region: 'North India',
    coordinates: { lat: 25.3176, lng: 82.9739 },
  },
  {
    destination: 'Rishikesh',
    days: 3, vibe: 'Temple',
    activities: ['White Water Rafting', 'Yoga Classes', 'Laxman Jhula', 'Bungee Jumping', 'Ganga Aarti'],
    price: 6000,
    budgetTier: 'budget',
    region: 'North India',
    coordinates: { lat: 30.0869, lng: 78.2676 },
  },
  {
    destination: 'Mysore',
    days: 3, vibe: 'Temple',
    activities: ['Mysore Palace', 'Chamundeshwari Temple', 'Brindavan Gardens', 'Devaraja Market', 'Silk Shopping'],
    price: 9000,
    budgetTier: 'budget',
    region: 'South India',
    coordinates: { lat: 12.2958, lng: 76.6394 },
  },

  // ── Adventure ───────────────────────────────────────
  {
    destination: 'Manali',
    days: 5, vibe: 'Adventure',
    activities: ['Rohtang Pass', 'Solang Valley', 'Paragliding', 'River Rafting', 'Old Manali Cafes'],
    price: 10000,
    budgetTier: 'budget',
    region: 'North India',
    coordinates: { lat: 32.2396, lng: 77.1887 },
  },
  {
    destination: 'Ladakh',
    days: 7, vibe: 'Adventure',
    activities: ['Pangong Lake', 'Nubra Valley', 'Khardung La Pass', 'Leh Palace', 'Magnetic Hill'],
    price: 25000,
    budgetTier: 'mid',
    region: 'North India',
    coordinates: { lat: 34.1526, lng: 77.5771 },
  },
  {
    destination: 'Spiti Valley',
    days: 6, vibe: 'Adventure',
    activities: ['Key Monastery', 'Chandratal Lake', 'Kaza Village', 'Pin Valley', 'Stargazing'],
    price: 18000,
    budgetTier: 'mid',
    region: 'North India',
    coordinates: { lat: 32.2461, lng: 78.0151 },
  },
  {
    destination: 'Meghalaya',
    days: 5, vibe: 'Adventure',
    activities: ['Living Root Bridges', 'Cherrapunji', 'Dawki River', 'Mawlynnong Village', 'Nohkalikai Falls'],
    price: 16000,
    budgetTier: 'mid',
    region: 'Northeast India',
    coordinates: { lat: 25.4670, lng: 91.3662 },
  },

  // ── Heritage ────────────────────────────────────────
  {
    destination: 'Rajasthan',
    days: 7, vibe: 'Heritage',
    activities: ['Amber Fort', 'Mehrangarh Fort', 'Sam Sand Dunes', 'Lake Pichola', 'City Palace'],
    price: 20000,
    budgetTier: 'mid',
    region: 'North India',
    coordinates: { lat: 26.9124, lng: 75.7873 },
  },
  {
    destination: 'Hampi',
    days: 3, vibe: 'Heritage',
    activities: ['Virupaksha Temple', 'Vittala Temple', 'Coracle Ride', 'Matanga Hill Sunrise', 'Lotus Mahal'],
    price: 8000,
    budgetTier: 'budget',
    region: 'South India',
    coordinates: { lat: 15.3350, lng: 76.4600 },
  },
  {
    destination: 'Udaipur',
    days: 4, vibe: 'Heritage',
    activities: ['City Palace', 'Lake Pichola Boat Ride', 'Vintage Car Museum', 'Saheliyon Ki Bari', 'Sajjangarh Fort'],
    price: 15000,
    budgetTier: 'mid',
    region: 'North India',
    coordinates: { lat: 24.5854, lng: 73.7125 },
  },

  // ── Nature ──────────────────────────────────────────
  {
    destination: 'Kerala',
    days: 5, vibe: 'Nature',
    activities: ['Alleppey Houseboat', 'Munnar Tea Gardens', 'Periyar Wildlife', 'Kovalam Beach', 'Kathakali Show'],
    price: 18000,
    budgetTier: 'mid',
    region: 'South India',
    coordinates: { lat: 10.8505, lng: 76.2711 },
  },
  {
    destination: 'Coorg',
    days: 3, vibe: 'Nature',
    activities: ['Coffee Plantation Tour', 'Abbey Falls', 'Raja\'s Seat', 'Dubare Elephant Camp', 'Namdroling Monastery'],
    price: 12000,
    budgetTier: 'mid',
    region: 'South India',
    coordinates: { lat: 12.3375, lng: 75.8069 },
  },
  {
    destination: 'Darjeeling',
    days: 4, vibe: 'Nature',
    activities: ['Tiger Hill Sunrise', 'Toy Train Ride', 'Tea Garden Tour', 'Batasia Loop', 'Peace Pagoda'],
    price: 12000,
    budgetTier: 'mid',
    region: 'East India',
    coordinates: { lat: 27.0360, lng: 88.2627 },
  },

  // ── City ────────────────────────────────────────────
  {
    destination: 'Mumbai',
    days: 3, vibe: 'City',
    activities: ['Gateway of India', 'Dharavi Tour', 'Marine Drive', 'Street Food Trail', 'Bollywood Studio'],
    price: 14000,
    budgetTier: 'mid',
    region: 'West India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
  },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to Atlas');
    const col = client.db('travel-app').collection('trips');
    await col.deleteMany({});
    const result = await col.insertMany(trips);
    console.log(`✅ Seeded ${result.insertedCount} trips`);
  } catch (err) {
    console.error('❌', err.message);
  } finally {
    await client.close();
  }
}

seed();