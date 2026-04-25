"""
Vision tool — image analysis using GPT-4o Vision.
Handles missing API key gracefully.
"""
from openai import OpenAI
import os
import json


def analyze_image(image_data, intent='identify_location'):
    """Analyze an image using GPT-4o Vision."""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return {
            'error': 'OpenAI API key not configured',
            'message': 'Set OPENAI_API_KEY in your .env file to enable image analysis.',
        }

    client = OpenAI(api_key=api_key)

    intent_prompts = {
        'identify_location': """
            Analyze this travel photo. Identify:
            1. The location/landmark (be specific — city, state, country)
            2. What makes it special for travelers
            3. Best time to visit
            4. Estimated entry cost in INR
            5. Nearby attractions worth visiting
            Return as a JSON with keys: location, description, best_time, cost, nearby
        """,
        'identify_food': """
            Analyze this food photo. Identify:
            1. Dish name and cuisine type
            2. Whether it's vegetarian/vegan/non-veg
            3. Approximate cost in INR at a restaurant
            4. Which Indian cities/regions are famous for this dish
            Return as JSON with keys: dish, cuisine, dietary, cost, famous_in
        """,
        'read_receipt': """
            Read this receipt/bill image. Extract:
            1. Total amount in INR
            2. Category (food/accommodation/transport/activity)
            3. Date if visible
            4. Establishment name if visible
            Return as JSON with keys: amount, category, date, establishment
        """,
        'match_vibe': """
            Look at this image for travel inspiration. Describe:
            1. The overall mood and aesthetic
            2. Three Indian destinations that match this vibe
            3. What type of traveller would love this
            4. Best season to experience this vibe in India
            Return as JSON with keys: mood, destinations, traveller_type, best_season
        """,
    }

    prompt = intent_prompts.get(intent, intent_prompts['identify_location'])

    try:
        # Handle base64 image
        if image_data and image_data.startswith('data:image'):
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_data}
            }
        elif image_data:
            image_content = {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
            }
        else:
            return {'error': 'No image data provided'}

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    image_content,
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=500,
        )

        text = response.choices[0].message.content
        # Clean JSON
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()

        return json.loads(text)

    except json.JSONDecodeError:
        # If we got text but couldn't parse JSON, return as-is
        return {'analysis': text, 'intent': intent}
    except Exception as e:
        return {'error': str(e), 'message': 'Could not analyze image'}