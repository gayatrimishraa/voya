const { MongoClient } = require('mongodb');

const uri = 'mongodb://gayatri:Gayatri2026@ac-h1ias7d-shard-00-00.uljxbkf.mongodb.net:27017,ac-h1ias7d-shard-00-01.uljxbkf.mongodb.net:27017,ac-h1ias7d-shard-00-02.uljxbkf.mongodb.net:27017/travel-app?ssl=true&replicaSet=atlas-nwtab6-shard-0&authSource=admin&appName=Cluster0';

const templates = [
  {
    type: 'template',
    title: 'Goa Beach Escape — 5 Days',
    destination: 'Goa',
    duration: 5,
    budgetRange: '₹8,000 – ₹12,000',
    budgetTier: 'budget',
    vibe: ['Beach', 'Nightlife', 'Relaxation'],
    highlights: ['Baga Beach', 'Dudhsagar Falls', 'Old Goa Churches'],
    source: 'Inspired by popular MMT packages',
    days: [
      { day: 1, title: 'Arrival & North Goa', morning: { activity: 'Check-in & Baga Beach', description: 'Settle in and head straight to Baga Beach', cost: '₹0', tips: 'Go early to get a good spot' }, afternoon: { activity: 'Water Sports', description: 'Parasailing, banana boat, jet ski at Baga', cost: '₹1,500', tips: 'Negotiate package deals' }, evening: { activity: 'Anjuna Flea Market', description: 'Shop for souvenirs and try local food', cost: '₹500', tips: 'Open on Wednesdays only' }, accommodation: { name: 'Zostel Goa', type: 'budget', cost: '₹600/night', bookingLink: 'https://www.makemytrip.com/hotels/goa/' }, dailyCost: '₹2,600', transport: 'Rent a scooter for ₹300/day' },
      { day: 2, title: 'South Goa Serenity', morning: { activity: 'Colva Beach', description: 'Quieter and cleaner than North Goa beaches', cost: '₹0', tips: 'Best beach for swimming' }, afternoon: { activity: 'Dudhsagar Falls', description: 'Stunning four-tiered waterfall — hire a jeep from Mollem', cost: '₹800', tips: 'Only accessible Oct–May' }, evening: { activity: 'Palolem Beach', description: 'Stunning crescent beach perfect for sunset', cost: '₹200', tips: 'Try the fresh seafood stalls' }, accommodation: { name: 'Zostel Goa', type: 'budget', cost: '₹600/night', bookingLink: 'https://www.makemytrip.com/hotels/goa/' }, dailyCost: '₹1,600', transport: 'Hire a jeep for Dudhsagar' },
      { day: 3, title: 'Heritage & Culture', morning: { activity: 'Basilica of Bom Jesus', description: 'UNESCO heritage site in Old Goa', cost: '₹0', tips: 'Go before 10am to avoid crowds' }, afternoon: { activity: 'Spice Plantation Tour', description: 'Guided tour with traditional Goan lunch', cost: '₹700', tips: 'Includes elephant ride' }, evening: { activity: 'Panaji Riverfront', description: 'Walk along Mandovi River, try Goan fish curry', cost: '₹400', tips: 'Try Ritz Classic restaurant' }, accommodation: { name: 'Zostel Goa', type: 'budget', cost: '₹600/night', bookingLink: 'https://www.makemytrip.com/hotels/goa/' }, dailyCost: '₹1,700', transport: 'Local bus ₹50' },
      { day: 4, title: 'Adventure Day', morning: { activity: 'Kayaking at Chorao Island', description: 'Mangrove kayaking — unique experience', cost: '₹900', tips: 'Book in advance' }, afternoon: { activity: 'Arambol Beach', description: 'Bohemian vibe, paragliding available', cost: '₹1,200', tips: 'Great for solo travellers' }, evening: { activity: 'Saturday Night Market', description: 'Food, music, shopping at Arpora', cost: '₹500', tips: 'Only on Saturdays' }, accommodation: { name: 'Zostel Goa', type: 'budget', cost: '₹600/night', bookingLink: 'https://www.makemytrip.com/hotels/goa/' }, dailyCost: '₹3,200', transport: 'Scooter' },
      { day: 5, title: 'Departure Day', morning: { activity: 'Calangute Beach last swim', description: 'Final morning at the beach', cost: '₹0', tips: 'Pack the night before' }, afternoon: { activity: 'Souvenir shopping', description: 'Mapusa Market for cashews, spices, feni', cost: '₹600', tips: 'Cashews are cheapest here' }, evening: { activity: 'Departure', description: 'Head to airport/station', cost: '₹300', tips: 'Book cab in advance' }, accommodation: { name: '', type: '', cost: '', bookingLink: '' }, dailyCost: '₹900', transport: 'Cab to airport ₹300' },
    ],
    bookingLinks: { flights: 'https://www.makemytrip.com/flights/', hotels: 'https://www.goibibo.com/hotels/goa-hotels/', activities: 'https://www.makemytrip.com/activities/goa/' },
    coordinates: { lat: 15.2993, lng: 74.1240 },
  },
  {
    type: 'template',
    title: 'Varanasi Spiritual Journey — 3 Days',
    destination: 'Varanasi',
    duration: 3,
    budgetRange: '₹5,000 – ₹8,000',
    budgetTier: 'budget',
    vibe: ['Spiritual', 'Cultural', 'Heritage'],
    highlights: ['Ganga Aarti', 'Sarnath', 'Boat Ride at Dawn'],
    source: 'Inspired by popular MMT packages',
    days: [
      { day: 1, title: 'Arrival & The Sacred Ghats', morning: { activity: 'Check-in & Dashashwamedh Ghat', description: 'Witness the energy of the main ghat', cost: '₹0', tips: 'Stay in a guesthouse near the ghats' }, afternoon: { activity: 'Ghat Walk', description: 'Walk from Assi Ghat to Manikarnika Ghat', cost: '₹0', tips: 'Hire a local guide for ₹300' }, evening: { activity: 'Ganga Aarti', description: 'The spectacular evening prayer ceremony', cost: '₹0', tips: 'Arrive 30 min early for a good spot' }, accommodation: { name: 'Zostel Varanasi', type: 'budget', cost: '₹500/night', bookingLink: 'https://www.makemytrip.com/hotels/varanasi/' }, dailyCost: '₹1,200', transport: 'Walk or cycle rickshaw' },
      { day: 2, title: 'Dawn on the Ganges & Sarnath', morning: { activity: 'Sunrise Boat Ride', description: 'Row boat on the Ganges at dawn — unmissable', cost: '₹300', tips: 'Negotiate price before boarding' }, afternoon: { activity: 'Sarnath', description: 'Where Buddha gave his first sermon — Dhamek Stupa', cost: '₹40 entry', tips: 'Museum worth visiting' }, evening: { activity: 'Kashi Vishwanath Temple', description: 'One of the 12 Jyotirlingas', cost: '₹0', tips: 'Leave phone outside, no photography' }, accommodation: { name: 'Zostel Varanasi', type: 'budget', cost: '₹500/night', bookingLink: 'https://www.makemytrip.com/hotels/varanasi/' }, dailyCost: '₹1,500', transport: 'Auto rickshaw' },
      { day: 3, title: 'Food, Silk & Departure', morning: { activity: 'Varanasi Street Food Tour', description: 'Kachori sabzi, lassi, malaiyo — legendary breakfasts', cost: '₹300', tips: 'Try Deena Chaat Bhandar' }, afternoon: { activity: 'Silk Weaving Quarter', description: 'See Banarasi silk being made, buy direct from weavers', cost: '₹0 – ₹2,000', tips: 'Prices are fixed at co-operatives' }, evening: { activity: 'Departure', description: 'Head to station or airport', cost: '₹200', tips: 'Varanasi Junction is the main station' }, accommodation: { name: '', type: '', cost: '', bookingLink: '' }, dailyCost: '₹2,000', transport: 'Auto to station' },
    ],
    bookingLinks: { flights: 'https://www.makemytrip.com/flights/', hotels: 'https://www.goibibo.com/hotels/varanasi-hotels/', activities: 'https://www.makemytrip.com/activities/varanasi/' },
    coordinates: { lat: 25.3176, lng: 82.9739 },
  },
  {
    type: 'template',
    title: 'Rajasthan Royal Circuit — 7 Days',
    destination: 'Rajasthan',
    duration: 7,
    budgetRange: '₹18,000 – ₹25,000',
    budgetTier: 'mid',
    vibe: ['Heritage', 'Culture', 'Architecture'],
    highlights: ['Amber Fort', 'Lake Pichola', 'Sam Sand Dunes'],
    source: 'Inspired by popular Goibibo packages',
    days: [
      { day: 1, title: 'Jaipur — The Pink City', morning: { activity: 'Amber Fort', description: 'Magnificent hilltop fort with stunning views', cost: '₹200', tips: 'Take the elephant ride up' }, afternoon: { activity: 'City Palace & Jantar Mantar', description: 'Royal palace and astronomical observatory', cost: '₹400', tips: 'Combo ticket saves money' }, evening: { activity: 'Hawa Mahal at sunset', description: 'The Palace of Winds glowing golden', cost: '₹50', tips: 'Best photographed from the cafe opposite' }, accommodation: { name: 'Hotel Pearl Palace', type: 'mid', cost: '₹1,800/night', bookingLink: 'https://www.makemytrip.com/hotels/jaipur/' }, dailyCost: '₹3,500', transport: 'Auto rickshaw day pass ₹500' },
      { day: 2, title: 'Jaipur — Markets & Forts', morning: { activity: 'Nahargarh Fort', description: 'Panoramic views of the whole city', cost: '₹50', tips: 'Go at sunrise' }, afternoon: { activity: 'Johari Bazaar', description: 'Gems, jewellery, blue pottery shopping', cost: '₹1,000', tips: 'Bargain hard' }, evening: { activity: 'Chokhi Dhani', description: 'Village-style cultural evening with Rajasthani dinner', cost: '₹900', tips: 'Book ahead for weekends' }, accommodation: { name: 'Hotel Pearl Palace', type: 'mid', cost: '₹1,800/night', bookingLink: 'https://www.makemytrip.com/hotels/jaipur/' }, dailyCost: '₹3,800', transport: 'Auto' },
      { day: 3, title: 'Pushkar — Holy Lake Town', morning: { activity: 'Drive to Pushkar', description: '3 hour drive through scenic Aravalli hills', cost: '₹600 cab', tips: 'Leave by 8am' }, afternoon: { activity: 'Brahma Temple & Pushkar Lake', description: 'Only Brahma temple in the world', cost: '₹0', tips: 'Dress modestly' }, evening: { activity: 'Pushkar Bazaar', description: 'Hippie markets, silver jewellery, street food', cost: '₹500', tips: 'Try the banana lassi' }, accommodation: { name: 'Inn Seventh Heaven', type: 'mid', cost: '₹2,000/night', bookingLink: 'https://www.goibibo.com/hotels/pushkar-hotels/' }, dailyCost: '₹3,500', transport: 'Cab from Jaipur' },
      { day: 4, title: 'Jodhpur — The Blue City', morning: { activity: 'Drive to Jodhpur', description: '4 hour drive', cost: '₹800', tips: 'Book AC cab' }, afternoon: { activity: 'Mehrangarh Fort', description: 'One of India\'s largest forts, stunning museum', cost: '₹400', tips: 'Audio guide worth it' }, evening: { activity: 'Clock Tower Market', description: 'Famous for spices and mirchi bada', cost: '₹300', tips: 'Try makhaniya lassi' }, accommodation: { name: 'Raas Jodhpur', type: 'mid', cost: '₹2,500/night', bookingLink: 'https://www.makemytrip.com/hotels/jodhpur/' }, dailyCost: '₹4,200', transport: 'Cab + walking' },
      { day: 5, title: 'Jaisalmer — Golden City', morning: { activity: 'Drive to Jaisalmer', description: '5 hour drive across the Thar Desert', cost: '₹1,000', tips: 'Stunning drive — sit by the window' }, afternoon: { activity: 'Jaisalmer Fort', description: 'Living fort — people still live inside', cost: '₹100', tips: 'Get lost in the narrow lanes' }, evening: { activity: 'Sunset at Gadisar Lake', description: 'Peaceful sunset at an ancient reservoir', cost: '₹0', tips: 'Rent a paddle boat' }, accommodation: { name: 'Hotel Fifu', type: 'mid', cost: '₹1,500/night', bookingLink: 'https://www.goibibo.com/hotels/jaisalmer-hotels/' }, dailyCost: '₹3,000', transport: 'Long cab day' },
      { day: 6, title: 'Sam Sand Dunes — Desert Night', morning: { activity: 'Patwon Ki Haveli', description: 'Ornate mansion — finest in Jaisalmer', cost: '₹100', tips: 'Rooftop has city views' }, afternoon: { activity: 'Drive to Sam Sand Dunes', description: '45 min from Jaisalmer city', cost: '₹400', tips: 'Go by 4pm' }, evening: { activity: 'Camel Safari & Desert Camp', description: 'Sunset camel ride, cultural show, stargazing, dinner', cost: '₹2,000', tips: 'Book camp that includes dinner' }, accommodation: { name: 'Desert Camp Sam', type: 'mid', cost: '₹2,000 (included in package)', bookingLink: 'https://www.makemytrip.com/hotels/jaisalmer/' }, dailyCost: '₹4,500', transport: 'Jeep to dunes' },
      { day: 7, title: 'Udaipur — City of Lakes', morning: { activity: 'Drive/Fly to Udaipur', description: 'Drive 6hrs or fly 45min', cost: '₹1,500', tips: 'Fly if budget allows' }, afternoon: { activity: 'City Palace', description: 'Sprawling palace on Lake Pichola', cost: '₹300', tips: 'Best views in Rajasthan' }, evening: { activity: 'Lake Pichola Boat Ride', description: 'Views of Jag Mandir and Lake Palace Hotel', cost: '₹700', tips: 'Sunset timing is magical' }, accommodation: { name: 'Zostel Udaipur', type: 'budget', cost: '₹700/night', bookingLink: 'https://www.goibibo.com/hotels/udaipur-hotels/' }, dailyCost: '₹4,000', transport: 'Auto + boat' },
    ],
    bookingLinks: { flights: 'https://www.makemytrip.com/flights/', hotels: 'https://www.goibibo.com/hotels/rajasthan-hotels/', activities: 'https://www.makemytrip.com/activities/' },
    coordinates: { lat: 26.9124, lng: 75.7873 },
  },
  {
    type: 'template',
    title: 'Kerala Backwaters & Hills — 5 Days',
    destination: 'Kerala',
    duration: 5,
    budgetRange: '₹15,000 – ₹22,000',
    budgetTier: 'mid',
    vibe: ['Nature', 'Relaxation', 'Scenic'],
    highlights: ['Alleppey Houseboat', 'Munnar Tea Gardens', 'Kovalam Beach'],
    source: 'Inspired by popular MMT packages',
    days: [
      { day: 1, title: 'Kochi — Fort & Spices', morning: { activity: 'Fort Kochi Walk', description: 'Colonial architecture, Chinese fishing nets', cost: '₹0', tips: 'Go early morning' }, afternoon: { activity: 'Spice Market Tour', description: 'Mattancherry spice warehouses', cost: '₹0', tips: 'Buy cardamom and pepper here' }, evening: { activity: 'Kathakali Performance', description: 'Traditional Kerala dance-drama', cost: '₹350', tips: 'Arrive early to see makeup' }, accommodation: { name: 'Old Harbour Hotel', type: 'mid', cost: '₹2,500/night', bookingLink: 'https://www.makemytrip.com/hotels/kochi/' }, dailyCost: '₹3,500', transport: 'Walk + ferry' },
      { day: 2, title: 'Alleppey Houseboat', morning: { activity: 'Drive to Alleppey', description: '1.5 hour drive from Kochi', cost: '₹500', tips: 'Leave by 9am' }, afternoon: { activity: 'Board Houseboat', description: 'Cruise the famous Kerala backwaters', cost: '₹6,000 (includes meals)', tips: 'Book non-AC for budget' }, evening: { activity: 'Backwater Village Walk', description: 'Dock and explore a village at sunset', cost: '₹0', tips: 'Watch the toddy tappers' }, accommodation: { name: 'Houseboat stay', type: 'mid', cost: 'Included', bookingLink: 'https://www.goibibo.com/hotels/alleppey-hotels/' }, dailyCost: '₹7,000', transport: 'Houseboat' },
      { day: 3, title: 'Munnar — Tea Country', morning: { activity: 'Drive to Munnar', description: 'Scenic 4-hour mountain drive', cost: '₹800', tips: 'Stop at Cheeyappara Waterfalls' }, afternoon: { activity: 'Tea Museum & Plantations', description: 'Learn how Munnar tea is made', cost: '₹150', tips: 'Buy fresh tea here — much cheaper' }, evening: { activity: 'Top Station Viewpoint', description: 'Panoramic views of Tamil Nadu border', cost: '₹0', tips: 'Misty and magical at dusk' }, accommodation: { name: 'Windermere Estate', type: 'mid', cost: '₹2,000/night', bookingLink: 'https://www.makemytrip.com/hotels/munnar/' }, dailyCost: '₹3,500', transport: 'Taxi' },
      { day: 4, title: 'Munnar Adventures', morning: { activity: 'Eravikulam National Park', description: 'See endangered Nilgiri Tahr', cost: '₹125', tips: 'Book online — limited slots' }, afternoon: { activity: 'Mattupetty Dam & Echo Point', description: 'Boating on a mountain lake', cost: '₹300', tips: 'Echo Point is touristy but fun' }, evening: { activity: 'Spice Garden Walk', description: 'Cardamom, pepper, cinnamon growing wild', cost: '₹200', tips: 'Guides available at hotels' }, accommodation: { name: 'Windermere Estate', type: 'mid', cost: '₹2,000/night', bookingLink: 'https://www.makemytrip.com/hotels/munnar/' }, dailyCost: '₹2,800', transport: 'Local jeep' },
      { day: 5, title: 'Kovalam Beach & Departure', morning: { activity: 'Drive to Kovalam', description: '5 hour drive to the coast', cost: '₹1,200', tips: 'Break journey in Thiruvananthapuram' }, afternoon: { activity: 'Kovalam Beach', description: 'Crescent beach with lighthouse views', cost: '₹0', tips: 'Swim only in flagged areas' }, evening: { activity: 'Departure', description: 'Head to Trivandrum airport', cost: '₹400', tips: 'Airport is 15km from Kovalam' }, accommodation: { name: '', type: '', cost: '', bookingLink: '' }, dailyCost: '₹2,500', transport: 'Cab' },
    ],
    bookingLinks: { flights: 'https://www.makemytrip.com/flights/', hotels: 'https://www.goibibo.com/hotels/kerala-hotels/', activities: 'https://www.makemytrip.com/activities/kerala/' },
    coordinates: { lat: 10.8505, lng: 76.2711 },
  },
  {
    type: 'template',
    title: 'Manali Adventure — 4 Days',
    destination: 'Manali',
    duration: 4,
    budgetRange: '₹10,000 – ₹14,000',
    budgetTier: 'budget',
    vibe: ['Adventure', 'Mountains', 'Nature'],
    highlights: ['Rohtang Pass', 'Solang Valley', 'Old Manali'],
    source: 'Inspired by popular MMT packages',
    days: [
      { day: 1, title: 'Arrival & Old Manali', morning: { activity: 'Arrive & Acclimatize', description: 'Rest and walk around Old Manali village', cost: '₹0', tips: 'Drink lots of water — altitude is 2,050m' }, afternoon: { activity: 'Hadimba Temple', description: 'Ancient wooden temple in cedar forest', cost: '₹0', tips: 'Remove shoes outside' }, evening: { activity: 'Old Manali Cafes', description: 'Lazy evening at rooftop cafes, Tibetan food', cost: '₹400', tips: 'Try Lazy Dog or Cafe 1947' }, accommodation: { name: 'Snow Valley Resort', type: 'budget', cost: '₹800/night', bookingLink: 'https://www.makemytrip.com/hotels/manali/' }, dailyCost: '₹1,500', transport: 'Walk' },
      { day: 2, title: 'Solang Valley Adventures', morning: { activity: 'Solang Valley', description: 'Paragliding, zorbing, skiing (winter)', cost: '₹1,500', tips: 'Book activities on arrival' }, afternoon: { activity: 'Atal Tunnel', description: 'World\'s longest highway tunnel — into Spiti', cost: '₹0', tips: 'Drive through and come back — stunning' }, evening: { activity: 'Beas River Walk', description: 'Sunset by the rushing Beas River', cost: '₹0', tips: 'White water rafting available here' }, accommodation: { name: 'Snow Valley Resort', type: 'budget', cost: '₹800/night', bookingLink: 'https://www.makemytrip.com/hotels/manali/' }, dailyCost: '₹2,500', transport: 'Taxi ₹600' },
      { day: 3, title: 'Rohtang Pass', morning: { activity: 'Rohtang Pass (3,978m)', description: 'Snow-capped pass on the edge of the world', cost: '₹600 permit', tips: 'Book permit online — limited daily quota' }, afternoon: { activity: 'Snow activities', description: 'Sledging, snow scooter, snowball fights', cost: '₹800', tips: 'Rent heavy gear there — worth it' }, evening: { activity: 'Manu Temple & Market', description: 'Ancient temple + Manali market for woolens', cost: '₹400', tips: 'Shawls and pashminas are best here' }, accommodation: { name: 'Snow Valley Resort', type: 'budget', cost: '₹800/night', bookingLink: 'https://www.makemytrip.com/hotels/manali/' }, dailyCost: '₹3,000', transport: 'Shared taxi to Rohtang' },
      { day: 4, title: 'Kullu & Departure', morning: { activity: 'White Water Rafting', description: 'Grade 3–4 rapids on the Beas River', cost: '₹600', tips: 'Best flow June–September' }, afternoon: { activity: 'Kullu Valley Drive', description: 'Scenic drive through apple orchards', cost: '₹0', tips: 'Buy fresh apples by the roadside' }, evening: { activity: 'Departure to Delhi', description: 'Overnight Volvo bus from Manali', cost: '₹700', tips: 'Book Volvo AC bus — 14 hour journey' }, accommodation: { name: '', type: '', cost: '', bookingLink: '' }, dailyCost: '₹1,500', transport: 'Overnight bus to Delhi' },
    ],
    bookingLinks: { flights: 'https://www.makemytrip.com/flights/', hotels: 'https://www.goibibo.com/hotels/manali-hotels/', activities: 'https://www.makemytrip.com/activities/manali/' },
    coordinates: { lat: 32.2396, lng: 77.1887 },
  },
];

async function seedItineraries() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected');
    const col = client.db('travel-app').collection('itineraries');
    await col.deleteMany({ type: 'template' });
    const result = await col.insertMany(templates);
    console.log(`✅ Seeded ${result.insertedCount} template itineraries`);
  } catch (err) {
    console.error('❌', err.message);
  } finally {
    await client.close();
  }
}

seedItineraries();