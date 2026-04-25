"""
Flights tool — uses Aviationstack API as primary (free tier: 500 calls/month).
Constructs deep booking links to MakeMyTrip, Goibibo, Cleartrip for actual booking.
If API key missing or call fails, always falls back to booking links — never crashes.
"""
import os
import requests
from datetime import datetime

AVIATIONSTACK_KEY = os.getenv("AVIATIONSTACK_API_KEY")

CITY_TO_IATA = {
    "delhi": "DEL", "new delhi": "DEL",
    "mumbai": "BOM", "bombay": "BOM",
    "bengaluru": "BLR", "bangalore": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA", "madras": "MAA",
    "kolkata": "CCU", "calcutta": "CCU",
    "goa": "GOI", "panaji": "GOI",
    "ahmedabad": "AMD",
    "pune": "PNQ",
    "jaipur": "JAI",
    "kochi": "COK", "cochin": "COK",
    "lucknow": "LKO",
    "chandigarh": "IXC",
    "amritsar": "ATQ",
    "bhopal": "BHO",
    "nagpur": "NAG",
    "varanasi": "VNS",
    "indore": "IDR",
    "srinagar": "SXR",
    "jammu": "IXJ",
    "leh": "IXL",
    "dehradun": "DED",
    "agra": "AGR",
    "udaipur": "UDR",
    "jodhpur": "JDH",
    "coimbatore": "CJB",
    "visakhapatnam": "VTZ", "vizag": "VTZ",
    "bhubaneswar": "BBI",
    "patna": "PAT",
    "ranchi": "IXR",
    "port blair": "IXZ",
    "bagdogra": "IXB",
    "mangalore": "IXE",
    "trichy": "TRZ",
    "imphal": "IMF",
}


def _iata(city: str) -> str:
    if len(city) == 3 and city.isalpha():
        return city.upper()
    code = CITY_TO_IATA.get(city.lower().strip())
    if not code:
        raise ValueError(f"Unknown city '{city}'. Please use a major Indian city name.")
    return code


def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str = None,
    adults: int = 1,
    travel_class: str = "ECONOMY",
    max_results: int = 5,
) -> dict:
    """
    Search flights using Aviationstack API for live flight data.
    Falls back to booking link generation if API key not set or call fails.
    """
    try:
        origin_iata = _iata(origin)
        dest_iata = _iata(destination)
    except ValueError as e:
        return {"error": str(e)}

    # Try Aviationstack API
    if AVIATIONSTACK_KEY:
        result = _search_aviationstack(
            origin_iata, dest_iata, departure_date,
            return_date, adults, travel_class, max_results
        )
        if "error" not in result:
            return result

    # Fallback — always return booking links, never crash
    return _booking_links_fallback(
        origin, destination, origin_iata, dest_iata,
        departure_date, return_date, adults, travel_class
    )


def _search_aviationstack(
    origin_iata, dest_iata, departure_date,
    return_date, adults, travel_class, max_results
) -> dict:
    """Aviationstack API — real-time flight schedules."""
    try:
        params = {
            "access_key": AVIATIONSTACK_KEY,
            "dep_iata": origin_iata,
            "arr_iata": dest_iata,
            "limit": max_results,
        }

        resp = requests.get(
            "http://api.aviationstack.com/v1/flights",
            params=params,
            timeout=12,
        )
        resp.raise_for_status()
        data = resp.json()

        if "error" in data:
            return {"error": data["error"].get("message", "Aviationstack API error")}

        flights_data = data.get("data", [])
        if not flights_data:
            return {"error": "no results"}

        parsed = []
        for flight in flights_data[:max_results]:
            dep = flight.get("departure", {})
            arr = flight.get("arrival", {})
            airline_info = flight.get("airline", {})
            flight_info = flight.get("flight", {})

            airline_name = airline_info.get("name", "Unknown")
            flight_number = flight_info.get("iata", "")

            parsed.append({
                "airline": airline_name,
                "flight_number": flight_number,
                "outbound": {
                    "from": dep.get("iata", origin_iata),
                    "to": arr.get("iata", dest_iata),
                    "departs": dep.get("scheduled", ""),
                    "arrives": arr.get("scheduled", ""),
                    "terminal": dep.get("terminal", "—"),
                    "gate": dep.get("gate", "—"),
                },
                "status": flight.get("flight_status", "scheduled"),
                "booking_link": _mmtrip_link(origin_iata, dest_iata, departure_date, adults, travel_class),
            })

        return {
            "source": "Aviationstack",
            "origin": origin_iata,
            "destination": dest_iata,
            "departure_date": departure_date,
            "return_date": return_date,
            "passengers": adults,
            "class": travel_class,
            "flights_found": len(parsed),
            "offers": parsed,
            "also_check": _also_check_links(origin_iata, dest_iata, departure_date, adults, travel_class),
            "message": f"Found {len(parsed)} flights from {origin_iata} to {dest_iata}. Click booking links for live prices.",
        }

    except Exception as e:
        return {"error": str(e)}


def _booking_links_fallback(
    origin, destination, origin_iata, dest_iata,
    departure_date, return_date, adults, travel_class
) -> dict:
    """
    When flight API is unavailable, return direct deep-links to booking sites
    with search params pre-filled. The user clicks and books directly.
    """
    trip_type = "R" if return_date else "O"
    cab = travel_class.lower()

    mmtrip = (
        f"https://www.makemytrip.com/flights/search?"
        f"itinerary={origin_iata}-{dest_iata}-{departure_date}"
        f"&tripType={trip_type}&paxType=A-{adults}_C-0_I-0"
        f"&intl=false&cabinClass={cab}&lang=eng"
    )
    goibibo = (
        f"https://www.goibibo.com/flights/search/#?ri={origin_iata}"
        f"&rd={dest_iata}&rdd={departure_date.replace('-', '')}"
        f"&rc={adults}e0e0&rs=1&rtt={'2' if return_date else '1'}"
    )
    cleartrip = (
        f"https://www.cleartrip.com/flights/results?"
        f"from={origin_iata}&to={dest_iata}&depart_date={departure_date}"
        f"&adults={adults}&class={cab}&intl=n"
    )
    ixigo = (
        f"https://www.ixigo.com/search/result/flight?"
        f"from={origin_iata}&to={dest_iata}&date={departure_date}"
        f"&adults={adults}&class={cab}&type={'R' if return_date else 'O'}"
    )

    return {
        "source": "booking_links",
        "origin": origin_iata,
        "destination": dest_iata,
        "departure_date": departure_date,
        "return_date": return_date,
        "passengers": adults,
        "class": travel_class,
        "message": (
            f"Here are direct search links for {origin} → {destination} on {departure_date}. "
            f"Click any to see live prices and book instantly."
        ),
        "booking_links": {
            "MakeMyTrip": mmtrip,
            "Goibibo": goibibo,
            "Cleartrip": cleartrip,
            "ixigo": ixigo,
        },
    }


def _mmtrip_link(origin_iata, dest_iata, departure_date, adults, travel_class):
    return (
        f"https://www.makemytrip.com/flights/search?"
        f"itinerary={origin_iata}-{dest_iata}-{departure_date}"
        f"&tripType=O&paxType=A-{adults}_C-0_I-0&intl=false"
        f"&cabinClass={travel_class.lower()}&lang=eng"
    )


def _also_check_links(origin_iata, dest_iata, date, adults, travel_class):
    return [
        f"https://www.makemytrip.com/flights/search?itinerary={origin_iata}-{dest_iata}-{date}&tripType=O&paxType=A-{adults}_C-0_I-0&intl=false&cabinClass={travel_class.lower()}&lang=eng",
        f"https://www.goibibo.com/flights/",
        f"https://www.cleartrip.com/flights/results?from={origin_iata}&to={dest_iata}&depart_date={date}&adults={adults}&class={travel_class.lower()}&intl=n",
        f"https://www.ixigo.com/search/result/flight?from={origin_iata}&to={dest_iata}&date={date}&adults={adults}&type=O",
    ]