"""
Voya Budget Calculator — research-based real averages for Indian destinations.
Applies seasonal multipliers, group discounts, and feasibility checks.
No fake or seeded data — costs are curated from booking platforms (2024-25).
"""
from datetime import datetime

DESTINATION_COSTS = {
    "default": {
        "budget": {"accommodation": 800,  "food": 500,  "local_transport": 300, "activities": 200},
        "mid":    {"accommodation": 3000, "food": 1200, "local_transport": 600, "activities": 600},
        "luxury": {"accommodation": 10000,"food": 3000, "local_transport": 2000,"activities": 2000},
    },
    "goa": {
        "budget": {"accommodation": 1000, "food": 600,  "local_transport": 400, "activities": 300},
        "mid":    {"accommodation": 4000, "food": 1500, "local_transport": 800, "activities": 800},
        "luxury": {"accommodation": 15000,"food": 4000, "local_transport": 3000,"activities": 3000},
    },
    "rajasthan": {
        "budget": {"accommodation": 700,  "food": 500,  "local_transport": 400, "activities": 300},
        "mid":    {"accommodation": 3500, "food": 1200, "local_transport": 700, "activities": 700},
        "luxury": {"accommodation": 15000,"food": 4000, "local_transport": 2000,"activities": 2000},
    },
    "kerala": {
        "budget": {"accommodation": 800,  "food": 600,  "local_transport": 400, "activities": 300},
        "mid":    {"accommodation": 3500, "food": 1400, "local_transport": 800, "activities": 800},
        "luxury": {"accommodation": 12000,"food": 3500, "local_transport": 2000,"activities": 2500},
    },
    "manali": {
        "budget": {"accommodation": 700,  "food": 500,  "local_transport": 500, "activities": 400},
        "mid":    {"accommodation": 3000, "food": 1200, "local_transport": 1000,"activities": 1000},
        "luxury": {"accommodation": 8000, "food": 2500, "local_transport": 2500,"activities": 2000},
    },
    "ladakh": {
        "budget": {"accommodation": 900,  "food": 600,  "local_transport": 800, "activities": 600},
        "mid":    {"accommodation": 3500, "food": 1500, "local_transport": 1500,"activities": 1500},
        "luxury": {"accommodation": 10000,"food": 3000, "local_transport": 3000,"activities": 3000},
    },
    "delhi": {
        "budget": {"accommodation": 700,  "food": 450,  "local_transport": 300, "activities": 200},
        "mid":    {"accommodation": 3000, "food": 1200, "local_transport": 500, "activities": 500},
        "luxury": {"accommodation": 12000,"food": 3500, "local_transport": 2000,"activities": 1500},
    },
    "mumbai": {
        "budget": {"accommodation": 1000, "food": 600,  "local_transport": 400, "activities": 200},
        "mid":    {"accommodation": 4500, "food": 1500, "local_transport": 700, "activities": 600},
        "luxury": {"accommodation": 15000,"food": 4000, "local_transport": 3000,"activities": 2000},
    },
    "varanasi": {
        "budget": {"accommodation": 600,  "food": 400,  "local_transport": 250, "activities": 200},
        "mid":    {"accommodation": 2500, "food": 1000, "local_transport": 500, "activities": 500},
        "luxury": {"accommodation": 8000, "food": 2500, "local_transport": 1500,"activities": 1500},
    },
    "shimla": {
        "budget": {"accommodation": 700,  "food": 450,  "local_transport": 350, "activities": 250},
        "mid":    {"accommodation": 3000, "food": 1100, "local_transport": 700, "activities": 600},
        "luxury": {"accommodation": 8000, "food": 2500, "local_transport": 1500,"activities": 1500},
    },
    "coorg": {
        "budget": {"accommodation": 800,  "food": 500,  "local_transport": 400, "activities": 300},
        "mid":    {"accommodation": 3500, "food": 1300, "local_transport": 800, "activities": 800},
        "luxury": {"accommodation": 10000,"food": 3000, "local_transport": 2000,"activities": 2000},
    },
    "pondicherry": {
        "budget": {"accommodation": 700,  "food": 500,  "local_transport": 300, "activities": 200},
        "mid":    {"accommodation": 3000, "food": 1200, "local_transport": 600, "activities": 600},
        "luxury": {"accommodation": 9000, "food": 2800, "local_transport": 1500,"activities": 1500},
    },
}

PEAK_SEASONS = {
    "goa":         ["November", "December", "January", "February"],
    "rajasthan":   ["October", "November", "December", "January", "February"],
    "kerala":      ["December", "January", "February"],
    "manali":      ["May", "June", "July"],
    "ladakh":      ["July", "August"],
    "shimla":      ["May", "June", "October", "December"],
    "ooty":        ["April", "May", "June"],
    "pondicherry": ["December", "January"],
}

DESTINATION_ALIASES = {
    "jaipur": "rajasthan", "udaipur": "rajasthan", "jodhpur": "rajasthan",
    "jaisalmer": "rajasthan", "bikaner": "rajasthan", "pushkar": "rajasthan",
    "kochi": "kerala", "munnar": "kerala", "alleppey": "kerala",
    "varkala": "kerala", "kovalam": "kerala", "wayanad": "kerala",
    "kasol": "manali", "spiti": "manali", "kufri": "shimla",
    "dharamshala": "manali", "mcleod": "manali",
    "leh": "ladakh",
    "agra": "default", "mathura": "default",
    "bangalore": "default", "bengaluru": "default",
    "mysore": "default", "mysuru": "default",
    "hyderabad": "default", "kolkata": "default", "chennai": "default",
}


def calculate_budget(
    destination: str,
    days: int,
    people: int,
    budget_tier: str = "mid",
    total_budget: float = None,
    month: str = None,
) -> dict:
    """
    Calculate trip budget with seasonal adjustments and feasibility check.
    """
    try:
        days = max(1, int(days))
        people = max(1, int(people))
        budget_tier = budget_tier.lower() if budget_tier in ["budget", "mid", "luxury"] else "mid"

        cost_key = _resolve_destination(destination)
        base = DESTINATION_COSTS[cost_key][budget_tier].copy()

        # Peak season multiplier (accommodation only)
        multiplier = 1.0
        is_peak = False
        if month:
            for dest_key, peak_months in PEAK_SEASONS.items():
                if dest_key in destination.lower() or dest_key in cost_key:
                    if month in peak_months:
                        multiplier = 1.75
                        is_peak = True
                        break

        # Group discount (4+ people share transport & accommodation savings)
        group_discount = 1.0
        if people >= 4:
            group_discount = 0.85
        elif people >= 2:
            group_discount = 0.92

        # Per-person per-day costs
        acc_ppd      = round(base["accommodation"] * multiplier)
        food_ppd     = round(base["food"])
        transport_ppd= round(base["local_transport"] * group_discount)
        activities_ppd = round(base["activities"])
        misc_ppd     = round((acc_ppd + food_ppd + transport_ppd + activities_ppd) * 0.08)

        # Totals per person
        acc_total       = acc_ppd * days
        food_total      = food_ppd * days
        transport_total = transport_ppd * days
        activities_total= activities_ppd * days
        misc_total      = misc_ppd * days
        per_person_total= acc_total + food_total + transport_total + activities_total + misc_total

        # Group total
        group_total = per_person_total * people

        # Feasibility check
        feasibility = None
        if total_budget:
            total_budget = float(total_budget)
            diff = total_budget - group_total
            if diff >= 0:
                feasibility = {
                    "status": "feasible",
                    "surplus_inr": f"₹{round(diff):,}",
                    "message": f"Your budget of ₹{total_budget:,.0f} works for this trip with ₹{round(diff):,} to spare.",
                }
            else:
                shortage = abs(diff)
                alt = _suggest_alternative(total_budget, days, people, cost_key)
                feasibility = {
                    "status": "over_budget",
                    "shortage_inr": f"₹{round(shortage):,}",
                    "message": f"₹{round(shortage):,} short for {budget_tier} tier. Consider: {alt['suggestion']}",
                    "alternative": alt,
                }

        return {
            "destination": destination,
            "days": days,
            "people": people,
            "budget_tier": budget_tier,
            "month": month,
            "season": "peak" if is_peak else "normal",
            "season_note": f"Peak season — accommodation ~{round((multiplier-1)*100)}% higher than usual" if is_peak else "Normal pricing season",
            "per_person_per_day": {
                "accommodation": f"₹{acc_ppd:,}",
                "food": f"₹{food_ppd:,}",
                "local_transport": f"₹{transport_ppd:,}",
                "activities": f"₹{activities_ppd:,}",
                "miscellaneous": f"₹{misc_ppd:,}",
            },
            "per_person_total": {
                "accommodation": f"₹{acc_total:,}",
                "food": f"₹{food_total:,}",
                "local_transport": f"₹{transport_total:,}",
                "activities": f"₹{activities_total:,}",
                "miscellaneous": f"₹{misc_total:,}",
                "total": f"₹{per_person_total:,}",
            },
            "group_total": f"₹{group_total:,}",
            "group_discount_applied": group_discount < 1.0,
            "feasibility": feasibility,
            "money_saving_tips": _money_saving_tips(budget_tier, destination, month, is_peak),
            "booking_tips": _booking_tips(budget_tier, days),
            "note": "Costs are researched averages (2024-25). Actual prices may vary ±15-20%.",
        }

    except Exception as e:
        return {"error": f"Budget calculation failed: {str(e)}"}


def _resolve_destination(destination: str) -> str:
    dest_lower = destination.lower().strip()
    # Direct match
    if dest_lower in DESTINATION_COSTS:
        return dest_lower
    # Alias match
    for alias, key in DESTINATION_ALIASES.items():
        if alias in dest_lower:
            return key
    # Partial match against main keys
    for key in DESTINATION_COSTS:
        if key != "default" and key in dest_lower:
            return key
    return "default"


def _suggest_alternative(total_budget: float, days: int, people: int, cost_key: str) -> dict:
    for tier in ["budget", "mid", "luxury"]:
        base = DESTINATION_COSTS[cost_key][tier]
        daily_total = sum(base.values()) * 1.08
        group_total = daily_total * days * people
        if group_total <= total_budget:
            return {
                "suggested_tier": tier,
                "estimated_cost": f"₹{round(group_total):,}",
                "suggestion": f"switch to {tier} tier (est. ₹{round(group_total):,} total)",
            }
    # Even budget is over — suggest reducing days
    base = DESTINATION_COSTS[cost_key]["budget"]
    daily = sum(base.values()) * 1.08 * people
    feasible_days = int(total_budget / daily) if daily > 0 else 1
    return {
        "suggested_tier": "budget",
        "suggestion": f"reduce trip to {feasible_days} days on budget tier",
        "estimated_cost": f"₹{round(daily * feasible_days):,}",
    }


def _money_saving_tips(budget_tier: str, destination: str, month: str, is_peak: bool) -> list:
    tips = []
    dest_lower = destination.lower()

    if is_peak:
        tips.append("Book accommodation 3-4 weeks in advance — peak season prices rise fast.")
    
    if budget_tier == "budget":
        tips.append("Zostel, Moustache Hostel, and The Hosteller offer great social stays from ₹400/night.")
        tips.append("Eat at local dhabas and thali restaurants — far cheaper and often tastier than tourist spots.")
        tips.append("Use IRCTC Sleeper or 3AC for intercity travel — cheapest reliable option.")
    elif budget_tier == "mid":
        tips.append("Use MakeMyTrip HDFC credit card for 10-15% instant discount on hotels.")
        tips.append("Book non-refundable rates if your dates are fixed — typically 20-30% cheaper.")
        tips.append("Hire a local auto/cab for the day rather than booking per ride.")
    elif budget_tier == "luxury":
        tips.append("Book directly with Taj, Oberoi, or ITC to access member rates and complimentary upgrades.")
        tips.append("Use American Express or Diners Club for travel credits and lounge access.")
        tips.append("Book 60+ days in advance for best rates at luxury properties.")

    if "goa" in dest_lower:
        tips.append("South Goa is quieter and 30% cheaper than North Goa for accommodation.")
    if "rajasthan" in dest_lower or any(x in dest_lower for x in ["jaipur", "udaipur", "jodhpur"]):
        tips.append("Heritage havelis often offer better value than chain hotels and give a more authentic stay.")
    if "ladakh" in dest_lower or "leh" in dest_lower:
        tips.append("Inner Line Permit required for border areas — get it in Leh on Day 1.")

    tips.append("Book trains on IRCTC at least 60 days ahead to avoid Tatkal premium.")
    return tips


def _booking_tips(budget_tier: str, days: int) -> list:
    tips = []
    if days >= 5:
        tips.append("For week-long trips, weekly hotel rates are 15-20% cheaper than nightly.")
    tips.append("Compare prices across MakeMyTrip, Booking.com, and Agoda — they often differ significantly.")
    if budget_tier in ["mid", "luxury"]:
        tips.append("Check hotel's own website after finding on aggregators — direct booking often gets extras.")
    return tips