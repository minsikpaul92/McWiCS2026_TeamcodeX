import asyncio
import json
from engine.interviewer import generate_next_question

async def main():
    # Simulated initial data (Q1-Q3)
    initial_data = {
        "likes": ["reading", "indie games", "rainy days"],
        "dislikes": ["loud music", "crowded places"],
        "intro": "I'm a writer who loves spending time in quiet libraries."
    }
    
    # Starting a session with empty history
    chat_history = []
    
    print("--- AI Onboarding Test Starting ---")
    
    # Turn 1: AI asks the first follow-up question
    response1_json = await generate_next_question(initial_data, chat_history)
    res1 = json.loads(response1_json)
    print(f"\nAI (Turn 1): {res1['next_question']}")
    
    # Turn 2: User answers
    user_answer = "I mostly write mystery novels. Libraries are my sanctuary because of the smell of old books."
    chat_history.append({"role": "user", "content": user_answer})
    chat_history.append({"role": "ai", "content": res1['next_question']}) # Simplified tracking
    
    # Turn 3: AI asks the second follow-up question
    response2_json = await generate_next_question(initial_data, chat_history)
    res2 = json.loads(response2_json)
    print(f"\nAI (Turn 2): {res2['next_question']}")
    print(f"Should End: {res2['should_end']}")

    print("\n--- Test Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
