"""
Weather tool — OpenWeatherMap real API.
Primary: OPENWEATHER_API_KEY
"""
import os
import requests

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"
GEO_URL = "https://api.openweathermap.org/geo/1.0"


def get_weather(destination: str, month: str = None) -> dict:
    """
    Fetch real current weather + 5-day forecast for a destination.
    Falls back to a graceful error dict if the API call fails.
    """
    if not OPENWEATHER_API_KEY:
        return {
            "error": "Weather API key not configured",
            "message": "Set OPENWEATHER_API_KEY in your .env file to enable real-time weather.",
            "destination": destination,
            "travel_advice": _best_time(destination),
        }

    try:
        # Step 1: geocode the city name → lat/lon
        geo_resp = requests.get(
            f"{GEO_URL}/direct",
            params={"q": f"{destination},IN", "limit": 1, "appid": OPENWEATHER_API_KEY},
            timeout=8,
        )
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()

        if not geo_data:
            return {
                "error": f"Could not find location: '{destination}'",
                "message": f"Try a major Indian city name like 'Mumbai', 'Delhi', 'Goa', etc.",
                "destination": destination,
                "best_time_to_visit": _best_time(destination),
            }

        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]

        # Step 2: current weather
        current_resp = requests.get(
            f"{BASE_URL}/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
            },
            timeout=8,
        )
        current_resp.raise_for_status()
        current = current_resp.json()

        # Step 3: 5-day / 3-hour forecast
        forecast_resp = requests.get(
            f"{BASE_URL}/forecast",
            params={
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
                "cnt": 8,  # next 24 hours (8 × 3h)
            },
            timeout=8,
        )
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()

        # Parse forecast into daily summary
        forecast_items = forecast_data.get("list", [])
        forecast_summary = []
        for item in forecast_items[:5]:
            forecast_summary.append({
                "time": item["dt_txt"],
                "temp_c": round(item["main"]["temp"]),
                "feels_like_c": round(item["main"]["feels_like"]),
                "condition": item["weather"][0]["description"].capitalize(),
                "humidity_pct": item["main"]["humidity"],
                "wind_kmh": round(item["wind"]["speed"] * 3.6),
            })

        # Build travel advice based on condition codes
        weather_id = current["weather"][0]["id"]
        travel_advice = _get_travel_advice(weather_id, current["main"]["temp"])

        return {
            "destination": destination,
            "current": {
                "temp_c": round(current["main"]["temp"]),
                "feels_like_c": round(current["main"]["feels_like"]),
                "condition": current["weather"][0]["description"].capitalize(),
                "humidity_pct": current["main"]["humidity"],
                "wind_kmh": round(current["wind"]["speed"] * 3.6),
                "visibility_km": round(current.get("visibility", 10000) / 1000),
            },
            "forecast_next_24h": forecast_summary,
            "travel_advice": travel_advice,
            "best_time_to_visit": _best_time(destination),
            "queried_month": month,
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Weather API error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


def _get_travel_advice(weather_id: int, temp: float) -> str:
    if weather_id < 300:
        return "Thunderstorm expected — avoid outdoor activities and keep an umbrella handy."
    elif weather_id < 400:
        return "Drizzle expected — light rain gear recommended."
    elif weather_id < 600:
        return "Rain expected — carry a waterproof jacket and be cautious on roads."
    elif weather_id < 700:
        return "Snow expected — dress in layers and check road conditions."
    elif weather_id < 800:
        return "Low visibility due to fog/haze — drive carefully and plan indoor activities."
    elif weather_id == 800:
        if temp > 35:
            return "Clear but very hot — stay hydrated, wear sunscreen, avoid midday sun."
        elif temp < 10:
            return "Clear but cold — layer up, especially for evenings."
        else:
            return "Clear skies — excellent conditions for sightseeing and outdoor activities."
    else:
        return "Partly cloudy — generally good conditions with possible light cloud cover."


def _best_time(destination: str) -> str:
    best_times = {
        "goa": "November to February",
        "manali": "October to June (avoid monsoon July–September)",
        "kerala": "September to March",
        "rajasthan": "October to March",
        "jaipur": "October to March",
        "udaipur": "September to March",
        "ladakh": "June to September",
        "kashmir": "April to October",
        "shimla": "March to June and September to November",
        "ooty": "October to June",
        "coorg": "October to March",
        "varanasi": "November to March",
        "agra": "October to March",
        "delhi": "October to March",
        "mumbai": "November to February",
        "kolkata": "October to March",
        "bengaluru": "August to February",
        "hyderabad": "October to February",
        "mysuru": "October to March",
        "pondicherry": "November to February",
    }
    dest_lower = destination.lower()
    for key, period in best_times.items():
        if key in dest_lower:
            return period
    return "October to March (generally the best season for most Indian destinations)"