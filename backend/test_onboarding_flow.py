import asyncio
import json
from engine.interviewer import generate_next_question

async def run_full_onboarding_test():
    # 1. Simulated User Initial Data (Q1-Q3 + Personal Info)
    initial_data = {
        "personal_info": {
            "name": "Minsik",
            "gender": "Male",
            "age": 25
        },
        "likes": ["Programming", "Jazz Music", "Rainy Weather", "Reading Sci-Fi", "Quiet Cafes"],
        "dislikes": ["Loud Parties", "Spicy Food", "Crowded Subways", "Small Talk", "Hot Weather"],
        "intro": "I'm a developer who finds peace in coding with jazz music in a quiet cafe."
    }
    
    chat_history = []
    
    print(f"--- Onboarding Flow Test for {initial_data['personal_info']['name']} ---")
    print(f"Initial Likes: {', '.join(initial_data['likes'])}")
    print(f"Initial Dislikes: {', '.join(initial_data['dislikes'])}")
    print(f"Intro: {initial_data['intro']}")
    
    # Simulate 3 turns of AI questioning
    for turn in range(1, 4):
        print(f"\n[Turn {turn}] Generating AI Question...")
        
        response_json = await generate_next_question(initial_data, chat_history)
        res = json.loads(response_json)
        
        print(f"AI: {res['comment']}")
        print(f"AI Question: {res['next_question']}")
        
        # In a real test, you'd provide an answer. Let's simulate one.
        if turn == 1:
            user_answer = "I love Jazz because it feels like a conversation without words. It helps me focus on complex code."
        elif turn == 2:
            user_answer = "Quiet cafes are great because the white noise is just enough to block out the world without being distracting."
        else:
            user_answer = "I prefer Sci-Fi that explores philosophical questions about the future."
            
        print(f"User Answer: {user_answer}")
        
        # Keep track of history
        chat_history.append({"role": "ai", "content": res['next_question']})
        chat_history.append({"role": "user", "content": user_answer})
        
        if res.get('should_end'):
            print("\nAI decided to end the conversation early.")
            break

    print("\n--- Onboarding Flow Test Complete ---")

if __name__ == "__main__":
    asyncio.run(run_full_onboarding_test())
