import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
# Get the API key stored in the .env file.
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def analyze_user_data(existing_profile, new_content):
    """
    Analyzes user conversation content and incrementally updates the profile.
    """
    # Use the gemini-2.5-flash-lite model, which is active and has verified quota on the current account.
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite", 
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    )
    
    prompt = f"""
    You are an expert Psychologist and Data Analyst for an introvert matching app called "IntroConnect".
    Your goal is to understand the user's deep personality and preferences through their conversation or social posts.
    
    Current User Profile (JSON): {json.dumps(existing_profile) if existing_profile else "null"}
    New Input (Message/Post): {new_content}
    
    TASK:
    1. Update the 'user_profile' and 'matching_attributes' based on the new input.
    2. Be empathetic in your internal analysis but precise in the JSON data.
    3. If there's a conflict between old data and new deep conversation, prioritize the deeper insight from the new input.
    4. MUST extract 'must_avoid' constraints if the user expresses strong dislike or discomfort.
    5. Social Energy (1-10): 1 is total homebody (out 0 times/week), 2 is out 1 time/week.
    
    Format the output as ONLY the following JSON structure:
    {{
      "user_profile": {{
        "summary": "one sentence summary",
        "location": "city or null",
        "mbti": "MBTI or null",
        "tags": {{
          "likes": ["list of interests"],
          "dislikes": ["list of dislikes"]
        }}
      }},
      "matching_attributes": {{
        "energy_level": 1-10,
        "social_style": "Quiet" or "Thoughtful" or "Direct",
        "must_avoid": ["crucial things to avoid in matching"]
      }}
    }}
    """
    
    response = model.generate_content(prompt)
    return response.text