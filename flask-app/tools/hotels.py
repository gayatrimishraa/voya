"""
Hotels tool — uses Hotels API (RapidAPI) as primary.
Falls back to curated booking deep-links if API key missing or call fails.
"""
import os
import requests
from datetime import datetime

HOTELS_API_KEY = os.getenv("HOTELS_API_KEY", "")

CITY_COORDS = {
    "goa": ("15.2993", "74.1240"),
    "mumbai": ("19.0760", "72.8777"),
    "delhi": ("28.7041", "77.1025"),
    "jaipur": ("26.9124", "75.7873"),
    "udaipur": ("24.5854", "73.7125"),
    "bangalore": ("12.9716", "77.5946"),
    "bengaluru": ("12.9716", "77.5946"),
    "hyderabad": ("17.3850", "78.4867"),
    "chennai": ("13.0827", "80.2707"),
    "kolkata": ("22.5726", "88.3639"),
    "kochi": ("9.9312", "76.2673"),
    "varanasi": ("25.3176", "82.9739"),
    "agra": ("27.1767", "78.0081"),
    "manali": ("32.2396", "77.1887"),
    "shimla": ("31.1048", "77.1734"),
    "leh": ("34.1526", "77.5771"),
    "ladakh": ("34.1526", "77.5771"),
    "ooty": ("11.4102", "76.6950"),
    "coorg": ("12.3375", "75.8069"),
    "pondicherry": ("11.9416", "79.8083"),
    "amritsar": ("31.6340", "74.8723"),
    "jodhpur": ("26.2389", "73.0243"),
}

BUDGET_STARS = {"budget": 1, "mid": 3, "luxury": 5}


def search_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    rooms: int = 1,
    budget_tier: str = "mid",
    max_results: int = 5,
) -> dict:
    """
    Search hotels. Uses Hotels API if key present, otherwise returns
    direct booking deep-links to Booking.com, MakeMyTrip, Agoda.
    """
    try:
        nights = _nights(check_in, check_out)

        if HOTELS_API_KEY:
            result = _search_rapidapi(destination, check_in, check_out, adults, rooms, budget_tier, max_results)
            if "error" not in result:
                return result

        return _booking_links_fallback(destination, check_in, check_out, adults, rooms, budget_tier, nights)
    except Exception as e:
        # Ultimate fallback — never crash
        nights = _nights(check_in, check_out)
        return _booking_links_fallback(destination, check_in, check_out, adults, rooms, budget_tier, nights)


def _search_rapidapi(destination, check_in, check_out, adults, rooms, budget_tier, max_results):
    """Hotels.com via RapidAPI — 500 free calls/month."""
    try:
        # Step 1: get location ID
        loc_resp = requests.get(
            "https://hotels-com-provider.p.rapidapi.com/v2/regions",
            headers={
                "X-RapidAPI-Key": HOTELS_API_KEY,
                "X-RapidAPI-Host": "hotels-com-provider.p.rapidapi.com",
            },
            params={"query": f"{destination} India", "locale": "en_IN", "domain": "IN"},
            timeout=10,
        )
        loc_resp.raise_for_status()
        regions = loc_resp.json().get("data", {}).get("body", {}).get("suggestions", [])

        dest_id = None
        for group in regions:
            for entity in group.get("entities", []):
                if entity.get("type") in ("CITY", "NEIGHBORHOOD"):
                    dest_id = entity.get("gaiaId")
                    break
            if dest_id:
                break

        if not dest_id:
            return {"error": "destination not found"}

        # Step 2: search hotels
        hotel_resp = requests.get(
            "https://hotels-com-provider.p.rapidapi.com/v2/hotels/search",
            headers={
                "X-RapidAPI-Key": HOTELS_API_KEY,
                "X-RapidAPI-Host": "hotels-com-provider.p.rapidapi.com",
            },
            params={
                "region_id": dest_id,
                "locale": "en_IN",
                "checkin_date": check_in,
                "checkout_date": check_out,
                "adults_number": adults,
                "rooms_number": rooms,
                "sort_order": "PRICE_LOW_TO_HIGH",
                "domain": "IN",
                "star_rating_ids": _star_filter(budget_tier),
            },
            timeout=15,
        )
        hotel_resp.raise_for_status()
        results = hotel_resp.json().get("data", {}).get("body", {}).get("searchResults", {}).get("results", [])

        if not results:
            return {"error": "no hotels found"}

        nights = _nights(check_in, check_out)
        parsed = []
        for h in results[:max_results]:
            price_per_night = h.get("ratePlan", {}).get("price", {}).get("current", "N/A")
            name = h.get("name", "Unknown Hotel")
            star = h.get("starRating", 0)
            hotel_id = h.get("id", "")
            rating = h.get("guestReviews", {}).get("rating", "N/A")

            parsed.append({
                "name": name,
                "stars": int(star) if star else "?",
                "guest_rating": rating,
                "price_per_night": price_per_night,
                "nights": nights,
                "booking_link": f"https://in.hotels.com/ho{hotel_id}/",
                "also_check": _also_check(destination, check_in, check_out, adults, rooms),
            })

        return {
            "source": "Hotels.com",
            "destination": destination,
            "check_in": check_in,
            "check_out": check_out,
            "nights": nights,
            "adults": adults,
            "rooms": rooms,
            "budget_tier": budget_tier,
            "hotels_found": len(parsed),
            "options": parsed,
        }

    except Exception as e:
        return {"error": str(e)}


def _booking_links_fallback(destination, check_in, check_out, adults, rooms, budget_tier, nights):
    """
    Generate direct deep-links to major booking platforms with search pre-filled.
    """
    dest_enc = destination.replace(" ", "+")
    dest_slug = destination.lower().replace(" ", "-")

    # Booking.com deep link
    booking = (
        f"https://www.booking.com/searchresults.html?"
        f"ss={dest_enc}+India&checkin={check_in}&checkout={check_out}"
        f"&group_adults={adults}&no_rooms={rooms}&nflt=class%3D{BUDGET_STARS.get(budget_tier, 3)}"
    )

    # MakeMyTrip
    mmt = f"https://www.makemytrip.com/hotels/{dest_slug}-hotels.html"

    # Agoda
    agoda = (
        f"https://www.agoda.com/search?"
        f"city={dest_enc}&checkIn={check_in}&checkOut={check_out}"
        f"&rooms={rooms}&adults={adults}"
    )

    # Goibibo
    goibibo = (
        f"https://www.goibibo.com/hotels/hotels-in-{dest_slug}/"
        f"?ci={check_in.replace('-', '')}&co={check_out.replace('-', '')}"
        f"&guests={adults}e0e0&nc={rooms}"
    )

    # OYO (budget-friendly)
    oyo = f"https://www.oyorooms.com/search/?location={dest_enc}&checkIn={check_in}&checkOut={check_out}&rooms={rooms}&guests={adults}"

    links = {"Booking.com": booking, "MakeMyTrip": mmt, "Agoda": agoda, "Goibibo": goibibo}
    if budget_tier == "budget":
        links["OYO"] = oyo

    # Estimated price ranges for context
    ranges = {
        "budget": "₹500 – ₹1,500/night",
        "mid": "₹2,000 – ₹5,000/night",
        "luxury": "₹8,000 – ₹25,000/night",
    }

    return {
        "source": "booking_links",
        "destination": destination,
        "check_in": check_in,
        "check_out": check_out,
        "nights": nights,
        "adults": adults,
        "rooms": rooms,
        "budget_tier": budget_tier,
        "estimated_price_range": ranges.get(budget_tier, ranges["mid"]),
        "message": (
            f"Here are direct hotel search links for {destination} "
            f"({check_in} to {check_out}, {nights} nights). "
            f"Click any to see real-time availability and prices."
        ),
        "booking_links": links,
    }


def _nights(check_in: str, check_out: str) -> int:
    try:
        d1 = datetime.strptime(check_in, "%Y-%m-%d")
        d2 = datetime.strptime(check_out, "%Y-%m-%d")
        return max(1, (d2 - d1).days)
    except Exception:
        return 1


def _star_filter(budget_tier: str) -> str:
    filters = {"budget": "1%2C2", "mid": "3%2C4", "luxury": "4%2C5"}
    return filters.get(budget_tier, "3%2C4")


def _also_check(destination, check_in, check_out, adults, rooms):
    slug = destination.lower().replace(" ", "-")
    enc = destination.replace(" ", "+")
    return [
        f"https://www.booking.com/searchresults.html?ss={enc}+India&checkin={check_in}&checkout={check_out}&group_adults={adults}&no_rooms={rooms}",
        f"https://www.agoda.com/search?city={enc}&checkIn={check_in}&checkOut={check_out}&rooms={rooms}&adults={adults}",
        f"https://www.makemytrip.com/hotels/{slug}-hotels.html",
    ]