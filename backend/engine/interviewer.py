import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Using stable gemini-1.5-flash for reliability
MODEL_NAME = "gemini-1.5-flash"

async def generate_next_question(initial_data, chat_history):
    """
    Generates the next logical question to ask the user to deepen the profile.
    Decides whether to end the conversation based on the history.
    """
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.7 # Increased temperature for more creativity
        }
    )
    
    # Calculate current turn count
    current_turn = (len(chat_history) // 2) + 1
    
    # Strictly structure the prompt to inject data correctly
    prompt = f"""
    You are 'Connecty', a warm, supportive, and observant close friend for IntroConnect.
    
    [USER CONTEXT]
    Initial Data: {json.dumps(initial_data, indent=2, ensure_ascii=False)}
    Conversation History: {json.dumps(chat_history, indent=2, ensure_ascii=False)}
    Current Turn Number: {current_turn}
    
    [CRITICAL ROLES & RULES]
    1. CONCISENESS: Responses must be max 2 sentences.
    2. MINIMUM TURNS: You MUST ask at least 3 dynamic follow-up questions. NEVER set 'should_end' to true until at least Turn 6.
    3. MAXIMUM TURNS: Set 'should_end' to true on or before Turn 9.
    4. GRACEFUL CLOSING: If 'should_end' is true, the 'next_question' MUST be: "I think I've got a great feel for who you are! Is there anything else you'd like to share before we find your matches?" and 'options' MUST be ["No, I'm all set!", "Actually, one more thing!"].
    5. SINGLE TOPIC: Focus on ONLY ONE topic per question.
    6. DYNAMIC START (Turn 4): This is your first interaction. Always provide 2-3 specific topics in the 'options' array.
    7. STAY ON TOPIC: Keep the conversation on the chosen topic.
    8. LANGUAGE: ALWAYS respond in English, regardless of the user's input language.
    9. OPTIONS LOGIC: 
       - Topic Selection: Include strings when asking to CHOOSE a new topic.
       - Closing: When 'should_end' is true, provide the two English closing options mentioned in Rule 4.
       - Otherwise: [].
    
    [OUTPUT FORMAT (Strict JSON)]
    {{
      "comment": "Brief empathic reaction",
      "next_question": "One concise question",
      "options": [], 
      "should_end": false
    }}
    """
    
    response = model.generate_content(prompt)
    return response.text
