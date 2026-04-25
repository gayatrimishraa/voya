from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
import json
import uuid

from tools.voya_tools import VOYA_TOOLS
from tools.tool_executor import execute_tool
from db.mongo import (
    upsert_session, get_session,
    save_itinerary, get_itinerary_by_session,
    save_trip, get_saved_trips, delete_saved_trip,
    list_recent_itineraries, log_search,
)

chat_bp = Blueprint("chat", __name__)
client_ai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are Voya — a world-class AI travel concierge specialising in Indian travel.
Personality: warm, knowledgeable, unhurried. Like a brilliant well-travelled friend who knows India intimately and genuinely cares about making your trip perfect.

AVAILABLE TOOLS (always use real data — never make up prices or details):
- get_weather: Real-time weather + 24h forecast from OpenWeatherMap
- search_flights: Live flight search with prices and booking links
- search_hotels: Real hotel options with booking links to Booking.com, MakeMyTrip, Agoda
- calculate_budget: Detailed budget breakdown with seasonal adjustments
- calculate_route: Route calculation — distance, fuel cost, tolls, fatigue score
- search_places: Real attractions, restaurants, activities from Foursquare
- analyze_image: Identify destinations, food, landmarks from uploaded photos

CORE RULES:
1. ALWAYS call tools before generating itinerary content — never fabricate data
2. When user mentions a destination + month: call get_weather AND search_places simultaneously
3. When user mentions budget: call calculate_budget to validate feasibility
4. When user mentions flying: call search_flights and present real options
5. When user mentions hotels / accommodation: call search_hotels
6. When user mentions road trip / driving: call calculate_route
7. When user uploads an image: call analyze_image first
8. Generate itinerary JSON only when you have enough info (destination, dates or duration, budget or tier)
9. Ask ONE clarifying question at a time — never overwhelm
10. After tool calls, weave ALL data naturally into warm, conversational responses

ITINERARY FORMAT — embed in <itinerary>...</itinerary> tags:
<itinerary>
{
  "title": "Descriptive trip title",
  "destination": "City, State",
  "duration": 4,
  "travelMonth": "December",
  "budgetBreakdown": {
    "total": "₹45,000",
    "accommodation": "₹18,000",
    "food": "₹9,000",
    "transport": "₹8,000",
    "activities": "₹6,000",
    "misc": "₹4,000"
  },
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "weatherNote": "Real weather data from tool",
  "festivalNote": "Any festivals or events",
  "flightOptions": [{"airline": "IndiGo", "price": "₹4,200", "link": "https://..."}],
  "hotelOptions": [{"name": "Hotel XYZ", "stars": 4, "price": "₹3,500/night", "link": "https://..."}],
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "morning": {
        "activity": "Activity name",
        "description": "Rich description",
        "duration": "2 hours",
        "cost": "₹200",
        "tips": "Practical insider tip"
      },
      "afternoon": {"activity": "", "description": "", "duration": "", "cost": "", "tips": ""},
      "evening": {"activity": "", "description": "", "duration": "", "cost": "", "tips": ""},
      "accommodation": {"name": "", "type": "", "cost": "₹3,500/night", "bookingLink": "https://..."},
      "dailyCost": "₹4,500",
      "transport": "Local transport advice"
    }
  ],
  "packingList": ["Sunscreen SPF 50+", "Light cotton clothes"],
  "bestTimeToVisit": "October to March",
  "bookingLinks": {
    "flights": "https://www.makemytrip.com/flights/",
    "hotels": "https://www.booking.com/searchresults.html?ss=...",
    "activities": "https://www.makemytrip.com/activities/"
  },
  "insiderTips": ["tip1", "tip2"]
}
</itinerary>
"""


@chat_bp.route("/chat", methods=["POST"])
def chat():
    # Content-Type check
    if not request.is_json:
        return jsonify({"success": False, "error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body"}), 400

    # Handle session_id — None, empty string, or missing → generate UUID
    session_id = data.get("session_id")
    if not session_id or not isinstance(session_id, str) or not session_id.strip():
        session_id = str(uuid.uuid4())

    message = data.get("message", "")
    current_itinerary = data.get("currentItinerary", None)
    image_data = data.get("imageData", None)

    # Load history from MongoDB — default to [] if None
    try:
        session = get_session(session_id)
        history = (session.get("history") if session else None) or []
    except Exception:
        history = []

    system_context = SYSTEM_PROMPT
    if current_itinerary:
        system_context += f"\n\nUser has a loaded itinerary:\n{json.dumps(current_itinerary, indent=2)}\nModify it if the user requests changes."

    messages = [{"role": "system", "content": system_context}]
    for msg in history[-14:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Append current user message
    if image_data:
        messages.append({
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_data}},
                {"type": "text", "text": message or "What is this place? Help me plan a trip there."},
            ],
        })
        history.append({"role": "user", "content": message or "[image uploaded]"})
    else:
        messages.append({"role": "user", "content": message})
        history.append({"role": "user", "content": message})

    try:
        max_iterations = 6
        iteration = 0
        tool_results = []
        reply = ""

        while iteration < max_iterations:
            iteration += 1

            response = client_ai.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=VOYA_TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=3000,
            )

            msg = response.choices[0].message

            if not msg.tool_calls:
                reply = msg.content or ""
                break

            # Append assistant tool-call message
            messages.append({
                "role": "assistant",
                "content": msg.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in msg.tool_calls
                ],
            })

            # Execute tools — wrapped in try/except per tool
            for tc in msg.tool_calls:
                try:
                    result = execute_tool(tc.function.name, tc.function.arguments)
                    result_dict = json.loads(result)
                    tool_results.append({"tool": tc.function.name, "result": result_dict})
                except Exception as tool_err:
                    result = json.dumps({"error": f"Tool execution failed: {str(tool_err)}"})
                    tool_results.append({"tool": tc.function.name, "result": {"error": str(tool_err)}})

                # Log to MongoDB analytics
                try:
                    args = json.loads(tc.function.arguments)
                    dest = args.get("destination", args.get("origin", ""))
                    if dest:
                        log_search(dest, tc.function.name)
                except Exception:
                    pass

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })

        # Parse itinerary from reply
        itinerary = None
        if "<itinerary>" in reply and "</itinerary>" in reply:
            try:
                raw = reply.split("<itinerary>")[1].split("</itinerary>")[0].strip()
                itinerary = json.loads(raw)
                reply = reply.split("<itinerary>")[0].strip()
            except (json.JSONDecodeError, IndexError) as e:
                print(f"Itinerary parse error (non-fatal): {e}")
                # Keep the reply text as-is, just skip the itinerary parse

        # Persist to MongoDB
        history.append({"role": "assistant", "content": reply})
        try:
            upsert_session(session_id, history)
        except Exception as e:
            print(f"[WARN]  Session save error (non-fatal): {e}")

        itinerary_id = None
        if itinerary:
            try:
                itinerary_id = save_itinerary(session_id, itinerary)
            except Exception as e:
                print(f"[WARN]  Itinerary save error (non-fatal): {e}")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "reply": reply,
            "itinerary": itinerary,
            "itinerary_id": itinerary_id,
            "tool_results": tool_results,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/session/<session_id>", methods=["GET"])
def load_session(session_id):
    """Load a previous chat session + its itinerary."""
    try:
        session = get_session(session_id)
        if not session:
            return jsonify({"success": False, "error": "Session not found"}), 404
        itinerary = get_itinerary_by_session(session_id)
        return jsonify({
            "success": True,
            "session": session,
            "itinerary": itinerary,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/session/<session_id>", methods=["DELETE"])
def clear_session(session_id):
    """Clear a chat session (start fresh)."""
    try:
        from db.mongo import delete_session
        delete_session(session_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/itineraries", methods=["GET"])
def list_itineraries():
    """List recent saved itineraries."""
    try:
        items = list_recent_itineraries(limit=20)
        return jsonify({"success": True, "itineraries": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/itinerary/<itinerary_id>", methods=["GET"])
def get_itinerary_route(itinerary_id):
    try:
        from db.mongo import get_itinerary
        doc = get_itinerary(itinerary_id)
        if not doc:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True, "itinerary": doc})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/saved-trips", methods=["POST"])
def save_trip_route():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "Invalid JSON"}), 400
        session_id = data.get("session_id", "anonymous")
        trip_data = data.get("trip")
        if not trip_data:
            return jsonify({"success": False, "error": "No trip data"}), 400
        trip_id = save_trip(session_id, trip_data)
        return jsonify({"success": True, "trip_id": trip_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/saved-trips/<session_id>", methods=["GET"])
def get_saved_trips_route(session_id):
    try:
        trips = get_saved_trips(session_id)
        return jsonify({"success": True, "trips": trips})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@chat_bp.route("/saved-trips/<trip_id>", methods=["DELETE"])
def delete_trip_route(trip_id):
    try:
        ok = delete_saved_trip(trip_id)
        return jsonify({"success": ok})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500