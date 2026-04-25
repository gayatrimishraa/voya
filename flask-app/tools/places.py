"""
Places tool — PRIMARY APIs:
  Routes:  OpenRouteService (OPENROUTESERVICE_API_KEY)
  Places:  Foursquare Places API v3 (FOURSQUARE_API_KEY)
  Geocode: Nominatim / OSM (no key needed)

No Google Maps dependency.
"""
import os
import requests

FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")
OPENROUTESERVICE_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")


# ── Route Calculation (OpenRouteService) ──────────────────────────────────────

def calculate_route(
    start: str,
    end: str,
    car_type: str = "sedan",
    people: int = 2,
    waypoints: list = None,
) -> dict:
    """
    Calculate a road trip route using OpenRouteService Directions API.
    Geocodes city names via Nominatim (OSM, no key needed).

    Returns: distance_km, duration, fuel cost, toll estimate, fatigue score.
    """
    try:
        if not OPENROUTESERVICE_API_KEY:
            return _route_estimate_fallback(start, end, car_type, people)

        # Geocode start and end via Nominatim
        start_coords = _geocode(start)
        end_coords = _geocode(end)

        if not start_coords or not end_coords:
            return _route_estimate_fallback(start, end, car_type, people)

        # Build coordinates list: [start, *waypoints, end]
        coordinates = [start_coords]
        if waypoints:
            for wp in waypoints:
                wp_coords = _geocode(wp)
                if wp_coords:
                    coordinates.append(wp_coords)
        coordinates.append(end_coords)

        # Call ORS Directions API
        resp = requests.post(
            "https://api.openrouteservice.org/v2/directions/driving-car/json",
            headers={
                "Authorization": OPENROUTESERVICE_API_KEY,
                "Content-Type": "application/json",
            },
            json={"coordinates": coordinates},
            timeout=12,
        )
        resp.raise_for_status()
        data = resp.json()

        routes = data.get("routes", [])
        if not routes:
            return _route_estimate_fallback(start, end, car_type, people)

        route = routes[0]
        summary = route.get("summary", {})
        total_distance_m = summary.get("distance", 0)
        total_duration_s = summary.get("duration", 0)
        total_distance_km = round(total_distance_m / 1000)

        # Duration formatting
        hours, rem = divmod(int(total_duration_s), 3600)
        mins = rem // 60
        duration_str = f"{hours}h {mins}m"

        # Fuel cost estimates
        fuel_efficiency = _get_fuel_efficiency(car_type)
        fuel_price_per_litre = 103  # approximate Indian average (petrol)
        fuel_litres = total_distance_km / fuel_efficiency
        fuel_cost = round(fuel_litres * fuel_price_per_litre)

        # Toll estimate (rough national highway average)
        toll_estimate = _estimate_tolls(total_distance_km)

        # Total road trip cost
        total_cost = fuel_cost + toll_estimate
        per_person_cost = round(total_cost / max(people, 1))

        # Fatigue score
        fatigue = _fatigue_score(hours + mins / 60)

        # Leg breakdown from segments
        segments = route.get("segments", [])
        leg_breakdown = []
        for i, seg in enumerate(segments):
            seg_dist = round(seg.get("distance", 0) / 1000)
            seg_dur_s = seg.get("duration", 0)
            sh, sr = divmod(int(seg_dur_s), 3600)
            sm = sr // 60
            from_name = start if i == 0 else (waypoints[i - 1] if waypoints and i - 1 < len(waypoints) else f"Waypoint {i}")
            to_name = end if i == len(segments) - 1 else (waypoints[i] if waypoints and i < len(waypoints) else f"Waypoint {i + 1}")
            leg_breakdown.append({
                "from": from_name,
                "to": to_name,
                "distance_km": seg_dist,
                "duration": f"{sh}h {sm}m",
            })

        return {
            "start": start,
            "end": end,
            "waypoints": waypoints or [],
            "car_type": car_type,
            "people": people,
            "total_distance_km": total_distance_km,
            "total_duration": duration_str,
            "leg_breakdown": leg_breakdown,
            "costs": {
                "fuel_litres": round(fuel_litres, 1),
                "fuel_cost_inr": f"₹{fuel_cost:,}",
                "toll_estimate_inr": f"₹{toll_estimate:,}",
                "total_cost_inr": f"₹{total_cost:,}",
                "per_person_inr": f"₹{per_person_cost:,}",
            },
            "fatigue": fatigue,
            "driving_tips": _driving_tips(total_distance_km, hours),
            "maps_link": f"https://duckduckgo.com/?q={start.replace(' ', '+')}+to+{end.replace(' ', '+')}&ia=web&iaxm=directions",
        }

    except requests.exceptions.RequestException as e:
        return _route_estimate_fallback(start, end, car_type, people)
    except Exception as e:
        return {"error": f"Route calculation error: {str(e)}"}


def _geocode(place: str) -> list | None:
    """Geocode a place name to [lon, lat] using Nominatim (OSM, free, no key)."""
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": f"{place}, India",
                "format": "json",
                "limit": 1,
            },
            headers={"User-Agent": "Voya-Travel-App/2.0"},
            timeout=8,
        )
        resp.raise_for_status()
        results = resp.json()
        if results:
            return [float(results[0]["lon"]), float(results[0]["lat"])]
        return None
    except Exception:
        return None


def _route_estimate_fallback(start: str, end: str, car_type: str, people: int) -> dict:
    """Estimated route when ORS API is unavailable — uses rough distance estimates."""
    # Rough straight-line estimates for common Indian routes
    COMMON_ROUTES = {
        ("mumbai", "goa"): 590, ("delhi", "jaipur"): 280, ("delhi", "agra"): 230,
        ("mumbai", "pune"): 150, ("bangalore", "mysore"): 150, ("delhi", "manali"): 540,
        ("bangalore", "goa"): 560, ("mumbai", "delhi"): 1400, ("hyderabad", "goa"): 630,
        ("kolkata", "delhi"): 1500, ("chennai", "bangalore"): 350,
    }
    s, e = start.lower().strip(), end.lower().strip()
    est_km = COMMON_ROUTES.get((s, e), COMMON_ROUTES.get((e, s), 400))

    fuel_eff = _get_fuel_efficiency(car_type)
    fuel_litres = est_km / fuel_eff
    fuel_cost = round(fuel_litres * 103)
    toll_est = _estimate_tolls(est_km)
    total = fuel_cost + toll_est
    hours = est_km / 60  # rough 60 km/h average

    return {
        "start": start,
        "end": end,
        "car_type": car_type,
        "people": people,
        "total_distance_km": est_km,
        "total_duration": f"{int(hours)}h {int((hours % 1) * 60)}m (estimated)",
        "costs": {
            "fuel_litres": round(fuel_litres, 1),
            "fuel_cost_inr": f"₹{fuel_cost:,}",
            "toll_estimate_inr": f"₹{toll_est:,}",
            "total_cost_inr": f"₹{total:,}",
            "per_person_inr": f"₹{round(total / max(people, 1)):,}",
        },
        "fatigue": _fatigue_score(hours),
        "driving_tips": _driving_tips(est_km, int(hours)),
        "maps_link": f"https://duckduckgo.com/?q={start.replace(' ', '+')}+to+{end.replace(' ', '+')}&ia=web&iaxm=directions",
        "note": "Distance is estimated. Use the Maps link for approximate route.",
    }


# ── Places Search (Foursquare) ───────────────────────────────────────────────

def search_places(destination: str, category: str = "tourist attractions") -> dict:
    """
    Search real places of interest using Foursquare Places API v3.
    """
    try:
        if not FOURSQUARE_API_KEY:
            return _places_fallback(destination, category)

        # Foursquare category mapping
        category_ids = _foursquare_category_id(category)

        params = {
            "query": f"{category} in {destination}",
            "near": f"{destination}, India",
            "limit": 8,
            "sort": "RELEVANCE",
        }
        if category_ids:
            params["categories"] = category_ids

        resp = requests.get(
            "https://api.foursquare.com/v3/places/search",
            headers={
                "Authorization": FOURSQUARE_API_KEY,
                "Accept": "application/json",
            },
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        if not results:
            return _places_fallback(destination, category)

        places = []
        for r in results[:8]:
            location = r.get("location", {})
            address = location.get("formatted_address", location.get("address", ""))
            name = r.get("name", "Unknown")

            places.append({
                "name": name,
                "address": address,
                "rating": r.get("rating", "No rating") if "rating" in r else "Popular",
                "categories": [c.get("name", "") for c in r.get("categories", [])[:3]],
                "maps_link": f"https://duckduckgo.com/?q={name.replace(' ', '+')}+{destination.replace(' ', '+')}&ia=web&iaxm=maps",
            })

        return {
            "destination": destination,
            "category": category,
            "places_found": len(places),
            "places": places,
            "source": "Foursquare",
        }

    except requests.exceptions.RequestException as e:
        return _places_fallback(destination, category)
    except Exception as e:
        return {"error": f"Places search error: {str(e)}"}


def _foursquare_category_id(category: str) -> str:
    """Map human-readable categories to Foursquare category IDs."""
    mapping = {
        "tourist attractions": "16000",
        "restaurants": "13000",
        "beaches": "16015",
        "temples": "12105",
        "street food": "13065",
        "markets": "17114",
        "nightlife": "10000",
        "adventure activities": "18000",
        "spas": "11136",
        "hotels": "19014",
        "cafes": "13032",
        "museums": "10027",
    }
    cat_lower = category.lower()
    for key, val in mapping.items():
        if key in cat_lower:
            return val
    return ""


def _places_fallback(destination: str, category: str) -> dict:
    """Fallback when Foursquare key is missing — return web search links."""
    search_query = f"{category} in {destination} India"
    return {
        "destination": destination,
        "category": category,
        "places_found": 0,
        "places": [],
        "message": f"Search for {category} in {destination}:",
        "search_links": {
            "DuckDuckGo": f"https://duckduckgo.com/?q={search_query.replace(' ', '+')}&ia=web&iaxm=maps",
            "TripAdvisor": f"https://www.tripadvisor.in/Search?q={destination.replace(' ', '+')}",
        },
        "source": "fallback",
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_fuel_efficiency(car_type: str) -> float:
    """Returns km per litre"""
    efficiencies = {
        "hatchback": 18.0,
        "sedan": 15.0,
        "suv": 12.0,
        "bike": 40.0,
    }
    return efficiencies.get(car_type.lower(), 15.0)


def _estimate_tolls(distance_km: int) -> int:
    """Rough toll estimate based on distance on Indian national highways"""
    return round(distance_km * 1.7)


def _fatigue_score(hours: float) -> dict:
    if hours <= 3:
        return {"level": "Low", "color": "green", "advice": "Comfortable drive — no special breaks needed."}
    elif hours <= 5:
        return {"level": "Moderate", "color": "yellow", "advice": "Take a 20-min break every 2 hours. Stay hydrated."}
    elif hours <= 8:
        return {"level": "High", "color": "orange", "advice": "Long drive — plan 2-3 breaks. Consider splitting into 2 days."}
    else:
        return {"level": "Very High", "color": "red", "advice": "Strongly recommend splitting this into 2+ day journey. Book an overnight stop."}


def _driving_tips(distance_km: int, hours: int) -> list:
    tips = ["Check tyre pressure and fuel before starting."]
    if distance_km > 200:
        tips.append("Download offline maps for the route in case of poor connectivity.")
    if hours > 4:
        tips.append("Start early (before 7 AM) to avoid traffic and heat.")
    if distance_km > 400:
        tips.append("Book accommodation in advance for the midpoint stop.")
    tips.append("Keep emergency contacts saved: 112 (emergency), 1033 (highway helpline).")
    return tips