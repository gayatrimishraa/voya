"""
Voya Itinerary routes — clean CRUD against MongoDB.
No legacy code, no seeded data, no direct OpenAI calls.
"""
from flask import Blueprint, request, jsonify
from db.mongo import (
    list_recent_itineraries,
    get_itinerary,
    save_itinerary,
)

itinerary_bp = Blueprint("itinerary", __name__)


@itinerary_bp.route("/itineraries", methods=["GET"])
def list_itineraries():
    """List recent itineraries from MongoDB."""
    try:
        limit = request.args.get("limit", 20, type=int)
        items = list_recent_itineraries(limit=limit)
        return jsonify({"success": True, "itineraries": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@itinerary_bp.route("/itinerary/<itinerary_id>", methods=["GET"])
def get_one_itinerary(itinerary_id):
    """Load one itinerary by _id."""
    try:
        doc = get_itinerary(itinerary_id)
        if not doc:
            return jsonify({"success": False, "error": "Itinerary not found"}), 404
        return jsonify({"success": True, "itinerary": doc})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@itinerary_bp.route("/itinerary", methods=["POST"])
def save_new_itinerary():
    """Manually save an itinerary."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "Invalid JSON body"}), 400

        session_id = data.get("session_id", "manual")
        itinerary = data.get("itinerary")
        if not itinerary:
            return jsonify({"success": False, "error": "Missing itinerary data"}), 400

        doc_id = save_itinerary(session_id, itinerary)
        if not doc_id:
            return jsonify({"success": False, "error": "Failed to save"}), 500

        return jsonify({"success": True, "itinerary_id": doc_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500