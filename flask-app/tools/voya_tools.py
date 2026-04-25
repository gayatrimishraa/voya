"""
VOYA_TOOLS — OpenAI function-calling tool definitions.
All tools here correspond to real API implementations in the tools/ directory.
"""

VOYA_TOOLS = [
    # ── Weather ──────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": (
                "Get real-time current weather AND 24-hour forecast for any Indian destination "
                "using OpenWeatherMap. Call this before generating any itinerary when the user "
                "mentions a destination and travel dates."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "City name in India e.g. 'Goa', 'Manali', 'Varanasi'",
                    },
                    "month": {
                        "type": "string",
                        "description": "Month of travel e.g. 'December', 'March' (for context)",
                    },
                },
                "required": ["destination"],
            },
        },
    },

    # ── Flights ───────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": (
                "Search REAL available flights with live prices using the Amadeus API. "
                "Use this when the user asks about flights, how to get somewhere, "
                "or when building a travel plan that involves flying. "
                "Returns actual flight offers with prices, timings, and booking links."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {
                        "type": "string",
                        "description": "Departure city name (e.g. 'Mumbai') or IATA code (e.g. 'BOM')",
                    },
                    "destination": {
                        "type": "string",
                        "description": "Arrival city name (e.g. 'Goa') or IATA code (e.g. 'GOI')",
                    },
                    "departure_date": {
                        "type": "string",
                        "description": "Departure date in YYYY-MM-DD format e.g. '2025-12-20'",
                    },
                    "return_date": {
                        "type": "string",
                        "description": "Return date in YYYY-MM-DD format for round trips (optional)",
                    },
                    "adults": {
                        "type": "integer",
                        "description": "Number of adult passengers (default 1)",
                        "default": 1,
                    },
                    "travel_class": {
                        "type": "string",
                        "enum": ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
                        "description": "Cabin class (default ECONOMY)",
                        "default": "ECONOMY",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Max number of flight options to return (default 5)",
                        "default": 5,
                    },
                },
                "required": ["origin", "destination", "departure_date"],
            },
        },
    },

    # ── Hotels ────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": (
                "Search REAL hotels with live prices and availability using the Amadeus Hotel API. "
                "Use this when the user asks about accommodation, where to stay, or hotel options. "
                "Returns actual hotel offers with nightly rates, room types, and booking links."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "City name e.g. 'Jaipur', 'Goa', 'Udaipur'",
                    },
                    "check_in": {
                        "type": "string",
                        "description": "Check-in date in YYYY-MM-DD format",
                    },
                    "check_out": {
                        "type": "string",
                        "description": "Check-out date in YYYY-MM-DD format",
                    },
                    "adults": {
                        "type": "integer",
                        "description": "Number of adult guests per room",
                        "default": 2,
                    },
                    "rooms": {
                        "type": "integer",
                        "description": "Number of rooms required",
                        "default": 1,
                    },
                    "budget_tier": {
                        "type": "string",
                        "enum": ["budget", "mid", "luxury"],
                        "description": "Budget tier to filter hotel star ratings",
                        "default": "mid",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Max number of hotels to return (default 5)",
                        "default": 5,
                    },
                },
                "required": ["destination", "check_in", "check_out"],
            },
        },
    },

    # ── Budget ────────────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "calculate_budget",
            "description": (
                "Calculate a detailed trip budget breakdown with per-person and group totals. "
                "Applies seasonal adjustments for peak travel periods. "
                "Call this when the user mentions a budget amount, trip duration, or asks 'how much will this cost'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Destination city or region",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of trip days",
                    },
                    "people": {
                        "type": "integer",
                        "description": "Number of travellers",
                    },
                    "budget_tier": {
                        "type": "string",
                        "enum": ["budget", "mid", "luxury"],
                        "description": "Lifestyle tier for the trip",
                    },
                    "total_budget": {
                        "type": "number",
                        "description": "User's total budget in INR (optional — used to check feasibility)",
                    },
                    "month": {
                        "type": "string",
                        "description": "Month of travel for seasonal pricing adjustment",
                    },
                },
                "required": ["destination", "days", "people", "budget_tier"],
            },
        },
    },

    # ── Route / Road Trip ─────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "calculate_route",
            "description": (
                "Calculate a real road trip route using Google Maps — includes actual driving distance, "
                "estimated duration, fuel cost, toll estimate, fatigue score, and per-person cost. "
                "Call this when the user mentions a road trip, self-drive, or asks how to drive between cities."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "start": {
                        "type": "string",
                        "description": "Starting city or location",
                    },
                    "end": {
                        "type": "string",
                        "description": "Ending city or location",
                    },
                    "waypoints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of intermediate stops (optional)",
                    },
                    "car_type": {
                        "type": "string",
                        "enum": ["hatchback", "sedan", "suv", "bike"],
                        "description": "Vehicle type (affects fuel efficiency calculation)",
                        "default": "sedan",
                    },
                    "people": {
                        "type": "integer",
                        "description": "Number of people travelling (for per-person cost split)",
                        "default": 2,
                    },
                },
                "required": ["start", "end"],
            },
        },
    },

    # ── Places Search ─────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "search_places",
            "description": (
                "Search for real places of interest, restaurants, attractions, or landmarks "
                "using Google Places API. Call this when building itineraries to find actual "
                "things to do, eat, or see at a destination."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "City or region name",
                    },
                    "category": {
                        "type": "string",
                        "description": (
                            "Type of place to search for e.g. 'tourist attractions', "
                            "'restaurants', 'beaches', 'temples', 'street food', 'markets', "
                            "'nightlife', 'adventure activities', 'spas'"
                        ),
                        "default": "tourist attractions",
                    },
                },
                "required": ["destination"],
            },
        },
    },

    # ── Vision / Image Analysis ───────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "analyze_image",
            "description": (
                "Analyze a user-uploaded image to identify travel destinations, landmarks, food dishes, "
                "or receipts. Call this whenever the user uploads an image and wants to know what it is "
                "or asks to plan a trip based on an image."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "Base64 encoded image data URL or image URL",
                    },
                    "intent": {
                        "type": "string",
                        "enum": ["identify_location", "identify_food", "read_receipt", "match_vibe"],
                        "description": (
                            "identify_location: find out where the photo was taken; "
                            "identify_food: name the dish and suggest where to eat it; "
                            "read_receipt: parse a travel expense receipt; "
                            "match_vibe: match the mood/aesthetic of a photo to Indian destinations"
                        ),
                    },
                },
                "required": ["image_url", "intent"],
            },
        },
    },
]