import asyncio
import json
import sys
from engine.interviewer import generate_next_question
from engine.analyzer import analyze_user_data

async def interactive_onboarding():
    print("=== Welcome to IntroConnect AI Onboarding Test ===")
    print("Please provide some initial info to start the journey.\n")
    
    # 1. Collect Initial Data manually or use defaults for speed
    name = input("Enter your Name: ") or "Guest"
    age = input("Enter your Age (optional): ") or "Unknown"
    gender = input("Enter your Gender (optional): ") or "Unknown"
    
    print("\nSelect 5 things you LIKE (comma separated):")
    likes = [item.strip() for item in input("> ").split(",") if item.strip()]
    
    print("\nSelect 5 things you DISLIKE (comma separated):")
    dislikes = [item.strip() for item in input("> ").split(",") if item.strip()]
    
    print("\nTell us a little about yourself (Intro):")
    intro = input("> ")

    initial_data = {
        "personal_info": {
            "name": name,
            "gender": gender,
            "age": age
        },
        "likes": likes,
        "dislikes": dislikes,
        "intro": intro
    }
    
    chat_history = []
    turn_count = 0
    
    print("\n--- AI Interview Starting ---")
    
    while True:
        turn_count += 1
        print(f"\n[Turn {turn_count}] AI is thinking...")
        
        try:
            response_json = await generate_next_question(initial_data, chat_history)
            res = json.loads(response_json)
            
            print(f"\nConnecty: {res['comment']}")
            print(f"Connecty: {res['next_question']}")
            
            if res.get('options') and not res.get('should_end'):
                print(f"Options: {', '.join(res['options'])}")
            
            user_answer = input("\nYour Answer (type 'exit' to stop): ")
            
            # Update history
            chat_history.append({"role": "ai", "content": res['next_question']})
            chat_history.append({"role": "user", "content": user_answer})

            if user_answer.lower() == 'exit' or (res.get('should_end') and turn_count >= 2):
                break
            
        except Exception as e:
            print(f"\nError: {e}")
            return # Exit function on error

    # --- Final Analysis Phase (runs whenever loop breaks) ---
    print("\n=== AI Analysis Phase Starting... ===")
    final_content = f"Initial Info: {json.dumps(initial_data)}\nConversation: {json.dumps(chat_history)}"
    
    try:
        analysis_result_json = await analyze_user_data(None, final_content)
        final_profile = json.loads(analysis_result_json)
        
        print("\n✨ [FINAL STRUCTURED PROFILE] ✨")
        print(json.dumps(final_profile, indent=2, ensure_ascii=False))
        print("\n=== Onboarding Complete! Thank you! ===")
    except Exception as e:
        print(f"Final analysis failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(interactive_onboarding())
    except KeyboardInterrupt:
        print("\nTest terminated by user.")
        sys.exit(0)
