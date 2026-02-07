import asyncio
import json
from engine.analyzer import analyze_user_data

async def main():
    # Sample user message for testing (in English)
    test_message = """
    Hi! I'm Paul, a computer programmer living in Toronto. 
    Lately, I've been playing 'Clair Obscur' on Steam quite a lot. 
    I really enjoy staying home and watching dramas in a quiet environment. 
    However, I absolutely hate loud parties and I can't eat spicy food at all. 
    I usually go out once a week just for grocery shopping.
    """
    
    print("--- AI Analysis Starting ---")
    
    # Start analysis with no existing profile (None)
    result_json = await analyze_user_data(existing_profile=None, new_content=test_message)
    
    # Output the result
    result = json.loads(result_json)
    print(json.dumps(result, indent=2))
    
    print("\n--- Analysis Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
