"""
Tool executor — routes all 7 Voya tool calls to their implementations.
Every call is wrapped in try/except and always returns valid JSON.
"""
import json

from tools.weather import get_weather
from tools.flights import search_flights
from tools.hotels import search_hotels
from tools.budget import calculate_budget
from tools.places import calculate_route, search_places
from tools.vision import analyze_image


def execute_tool(tool_name: str, arguments) -> str:
    """
    Execute a Voya tool by name with the given arguments.
    Returns a JSON string of the result (or an error dict).
    All tool functions are real API integrations — no fake data.
    """
    try:
        if isinstance(arguments, str):
            arguments = json.loads(arguments)
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"Invalid tool arguments JSON: {e}"})

    try:
        if tool_name == "get_weather":
            try:
                result = get_weather(
                    destination=arguments.get("destination", ""),
                    month=arguments.get("month"),
                )
            except Exception as e:
                result = {"error": f"Weather tool error: {str(e)}"}

        elif tool_name == "search_flights":
            try:
                result = search_flights(
                    origin=arguments.get("origin", ""),
                    destination=arguments.get("destination", ""),
                    departure_date=arguments.get("departure_date", ""),
                    return_date=arguments.get("return_date"),
                    adults=arguments.get("adults", 1),
                    travel_class=arguments.get("travel_class", "ECONOMY"),
                    max_results=arguments.get("max_results", 5),
                )
            except Exception as e:
                result = {"error": f"Flights tool error: {str(e)}"}

        elif tool_name == "search_hotels":
            try:
                result = search_hotels(
                    destination=arguments.get("destination", ""),
                    check_in=arguments.get("check_in", ""),
                    check_out=arguments.get("check_out", ""),
                    adults=arguments.get("adults", 2),
                    rooms=arguments.get("rooms", 1),
                    budget_tier=arguments.get("budget_tier", "mid"),
                    max_results=arguments.get("max_results", 5),
                )
            except Exception as e:
                result = {"error": f"Hotels tool error: {str(e)}"}

        elif tool_name == "calculate_budget":
            try:
                result = calculate_budget(
                    destination=arguments.get("destination", ""),
                    days=arguments.get("days", 3),
                    people=arguments.get("people", 2),
                    budget_tier=arguments.get("budget_tier", "mid"),
                    total_budget=arguments.get("total_budget"),
                    month=arguments.get("month"),
                )
            except Exception as e:
                result = {"error": f"Budget tool error: {str(e)}"}

        elif tool_name == "calculate_route":
            try:
                result = calculate_route(
                    start=arguments.get("start", ""),
                    end=arguments.get("end", ""),
                    car_type=arguments.get("car_type", "sedan"),
                    people=arguments.get("people", 2),
                    waypoints=arguments.get("waypoints", []),
                )
            except Exception as e:
                result = {"error": f"Route tool error: {str(e)}"}

        elif tool_name == "search_places":
            try:
                result = search_places(
                    destination=arguments.get("destination", ""),
                    category=arguments.get("category", "tourist attractions"),
                )
            except Exception as e:
                result = {"error": f"Places tool error: {str(e)}"}

        elif tool_name == "analyze_image":
            try:
                result = analyze_image(
                    image_data=arguments.get("image_url", ""),
                    intent=arguments.get("intent", "identify_location"),
                )
            except Exception as e:
                result = {"error": f"Vision tool error: {str(e)}"}

        else:
            result = {"error": f"Unknown tool: '{tool_name}'. Valid: get_weather, search_flights, search_hotels, calculate_budget, calculate_route, search_places, analyze_image"}

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        return json.dumps({"error": f"Tool execution error in '{tool_name}': {str(e)}"})