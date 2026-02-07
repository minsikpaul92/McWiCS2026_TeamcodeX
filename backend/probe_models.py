import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

models_to_test = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview"
]

async def test_models():
    for m_name in models_to_test:
        print(f"Testing {m_name}...")
        try:
            model = genai.GenerativeModel(m_name)
            response = model.generate_content("Hi, are you working?")
            print(f"SUCCESS: {m_name} is working!")
            return m_name
        except Exception as e:
            print(f"FAILED: {m_name} - {e}")
    return None

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_models())
