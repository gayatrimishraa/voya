"""
Voya MongoDB layer — single place for all DB operations.
Collections: users, itineraries, chat_sessions, saved_trips
"""
import os
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is not None:
        return _db
    uri = os.getenv("MONGO_URI")
    if not uri:
        raise RuntimeError(
            "MONGO_URI environment variable not set. "
            "Add MONGO_URI=mongodb+srv://... to your .env file."
        )
    _client = MongoClient(
        uri,
        maxPoolSize=10,
        serverSelectionTimeoutMS=5000,
    )
    # Verify connection
    _client.admin.command("ping")
    _db = _client["voya"]
    _ensure_indexes(_db)
    return _db


def _ensure_indexes(db):
    """Create all indexes on startup — idempotent."""
    try:
        # itineraries
        db.itineraries.create_index([("session_id", ASCENDING)])
        db.itineraries.create_index([("created_at", DESCENDING)])
        db.itineraries.create_index([("destination", ASCENDING)])

        # chat_sessions
        db.chat_sessions.create_index([("session_id", ASCENDING)], unique=True)
        db.chat_sessions.create_index([("updated_at", DESCENDING)])

        # saved_trips
        db.saved_trips.create_index([("session_id", ASCENDING)])
        db.saved_trips.create_index([("destination", ASCENDING)])
    except Exception as e:
        print(f"[WARN]  Index creation warning: {e}")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc)


def _serialize(doc):
    """Convert ObjectId and datetime to JSON-safe types — handles nested structures."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [_serialize(item) for item in doc]
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, dict):
                result[k] = _serialize(v)
            elif isinstance(v, list):
                result[k] = _serialize(v)
            else:
                result[k] = v
        return result
    return doc


# ── Chat Sessions ──────────────────────────────────────────────────────────────

def upsert_session(session_id: str, history: list) -> dict:
    """Save or update a chat session with its full message history."""
    try:
        db = get_db()
        result = db.chat_sessions.find_one_and_update(
            {"session_id": session_id},
            {
                "$set": {
                    "history": history[-40:],  # keep last 40 messages
                    "updated_at": _now(),
                    "message_count": len(history),
                },
                "$setOnInsert": {"created_at": _now()},
            },
            upsert=True,
            return_document=True,
        )
        return _serialize(result)
    except Exception as e:
        print(f"[WARN]  upsert_session error: {e}")
        return None


def get_session(session_id: str) -> dict | None:
    """Load a chat session by ID."""
    try:
        db = get_db()
        doc = db.chat_sessions.find_one({"session_id": session_id})
        return _serialize(doc)
    except Exception as e:
        print(f"[WARN]  get_session error: {e}")
        return None


def delete_session(session_id: str) -> bool:
    try:
        db = get_db()
        result = db.chat_sessions.delete_one({"session_id": session_id})
        return result.deleted_count > 0
    except Exception as e:
        print(f"[WARN]  delete_session error: {e}")
        return False


# ── Itineraries ────────────────────────────────────────────────────────────────

def save_itinerary(session_id: str, itinerary: dict) -> str:
    """
    Save a generated itinerary. Returns the inserted _id as string.
    If an itinerary for this session already exists, updates it.
    """
    try:
        db = get_db()
        now = _now()
        payload = {
            "session_id": session_id,
            "destination": itinerary.get("destination", ""),
            "title": itinerary.get("title", ""),
            "duration": itinerary.get("duration", 0),
            "data": itinerary,
            "updated_at": now,
        }
        existing = db.itineraries.find_one({"session_id": session_id})
        if existing:
            db.itineraries.update_one(
                {"session_id": session_id},
                {"$set": payload},
            )
            return str(existing["_id"])
        else:
            payload["created_at"] = now
            result = db.itineraries.insert_one(payload)
            return str(result.inserted_id)
    except Exception as e:
        print(f"[WARN]  save_itinerary error: {e}")
        return None


def get_itinerary(itinerary_id: str) -> dict | None:
    """Load an itinerary by its _id."""
    try:
        db = get_db()
        doc = db.itineraries.find_one({"_id": ObjectId(itinerary_id)})
        return _serialize(doc)
    except Exception as e:
        print(f"[WARN]  get_itinerary error: {e}")
        return None


def get_itinerary_by_session(session_id: str) -> dict | None:
    """Get the latest itinerary for a session."""
    try:
        db = get_db()
        doc = db.itineraries.find_one(
            {"session_id": session_id},
            sort=[("updated_at", DESCENDING)],
        )
        return _serialize(doc)
    except Exception as e:
        print(f"[WARN]  get_itinerary_by_session error: {e}")
        return None


def list_recent_itineraries(limit: int = 20) -> list:
    """List recent itineraries for a dashboard view."""
    try:
        db = get_db()
        docs = db.itineraries.find(
            {},
            {"data": 0},  # exclude large data field for listing
            sort=[("updated_at", DESCENDING)],
            limit=limit,
        )
        return [_serialize(d) for d in docs]
    except Exception as e:
        print(f"[WARN]  list_recent_itineraries error: {e}")
        return []


# ── Saved Trips (user bookmarks) ───────────────────────────────────────────────

def save_trip(session_id: str, trip_data: dict) -> str:
    """Save a trip package the user wants to bookmark."""
    try:
        db = get_db()
        payload = {
            "session_id": session_id,
            "destination": trip_data.get("destination", ""),
            "data": trip_data,
            "created_at": _now(),
        }
        result = db.saved_trips.insert_one(payload)
        return str(result.inserted_id)
    except Exception as e:
        print(f"[WARN]  save_trip error: {e}")
        return None


def get_saved_trips(session_id: str) -> list:
    """Get all saved trips for a session."""
    try:
        db = get_db()
        docs = db.saved_trips.find(
            {"session_id": session_id},
            sort=[("created_at", DESCENDING)],
        )
        return [_serialize(d) for d in docs]
    except Exception as e:
        print(f"[WARN]  get_saved_trips error: {e}")
        return []


def delete_saved_trip(trip_id: str) -> bool:
    try:
        db = get_db()
        result = db.saved_trips.delete_one({"_id": ObjectId(trip_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"[WARN]  delete_saved_trip error: {e}")
        return False


# ── Analytics (lightweight) ────────────────────────────────────────────────────

def log_search(destination: str, tool_used: str):
    """Log what destinations and tools are being used — for a stats dashboard."""
    try:
        db = get_db()
        db.search_logs.insert_one({
            "destination": destination,
            "tool": tool_used,
            "ts": _now(),
        })
    except Exception:
        pass  # never let logging crash the main flow