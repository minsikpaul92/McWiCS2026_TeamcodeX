import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Note: Using 'gemini-2.0-flash-lite' for a more stable free quota (2.5-flash had 20/day limit)
MODEL_NAME = "gemini-3-flash-preview"

async def generate_next_question(initial_data, chat_history):
    """
    Generates the next logical question to ask the user to deepen the profile.
    Decides whether to end the conversation based on the history.
    """
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.2 # Lower temperature for better consistency
        }
    )
    
    # Calculate current turn count
    current_turn = (len(chat_history) // 2) + 1
    
    # Strictly structure the prompt to inject data correctly
    prompt = f"""
    You are 'Connecty', a warm, concise, and observant psychologist for IntroConnect.
    
    [USER CONTEXT]
    Initial Data: {json.dumps(initial_data, indent=2, ensure_ascii=False)}
    Conversation History: {json.dumps(chat_history, indent=2, ensure_ascii=False)}
    Current Turn Number: {current_turn}
    
    [CRITICAL ROLES & RULES]
    1. CONCISENESS: Responses must be max 2 sentences.
    2. MINIMUM TURNS: You MUST ask at least 2 questions. NEVER set 'should_end' to true if Current Turn Number is 1 or 2.
    3. MAXIMUM TURNS: Set 'should_end' to true on or before Turn 7.
    4. GRACEFUL CLOSING: If 'should_end' is true, the 'next_question' MUST be a warm closing remark asking if there is anything else they'd like to share (e.g., "I think I've learned a lot about you! Is there anything else you'd like to add before we finish?").
    5. SINGLE TOPIC: Focus on ONLY ONE topic per question.
    6. TOPIC SELECTION: On Turn 1, always ask the user to choose one topic from 2-3 specific options based on their profile.
    7. STAY ON TOPIC: Once a topic is chosen, stay on it for 1-2 follow-up questions before offering new options or ending.
    8. LANGUAGE: Respond in the SAME LANGUAGE the user used. 
    
    [OUTPUT FORMAT (Strict JSON)]
    {{
      "comment": "Brief empathic reaction in user's language",
      "next_question": "One concise question or closing remark",
      "options": ["Option A", "Option B"],
      "should_end": false, // Set to true ONLY when you are ready to wrap up (after at least 2 questions)
      "debug_turn_count": {current_turn}
    }}
    """
    
    response = model.generate_content(prompt)
    return response.text
