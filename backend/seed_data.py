import random
from pymongo import MongoClient

# Connection
MONGO_URI = "mongodb+srv://zacdanny2007_db_user:uswF8H7rZFi0pbin@mcwics2026db.llmniuq.mongodb.net/?appName=mcwics2026db"
client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
db = client["IntroConnect"]
users_collection = db["users"]

# Data pools for variety
adjectives = ["Quiet", "Midnight", "Lunar", "Static", "Muted", "Echoing", "Hidden", "Soft", "Digital", "Velvet"]
nouns = ["Penguin", "Signal", "Librarian", "Nomad", "Artist", "Matcha", "Coder", "Architect", "Dreamer", "Cloud"]
colors = [
    "bg-blue-500/10 text-blue-600", "bg-purple-500/10 text-purple-600", 
    "bg-emerald-500/10 text-emerald-600", "bg-rose-500/10 text-rose-600",
    "bg-amber-500/10 text-amber-600", "bg-cyan-500/10 text-cyan-600"
]
interests_pool = [
    "Rust", "Hiking", "Jazz", "Anime", "Libraries", "Tea", "Lo-fi", "Vinyl", 
    "Photography", "Plants", "Baking", "Chess", "Film Noir", "Museums", 
    "Astrology", "Journaling", "Synthesizers", "Coffee Roasting", "Brutalism"
]
bios = [
    "I prefer deep talks over small talk. Usually found with a book.",
    "Early morning bird. I love the city when it's still asleep.",
    "Tech enthusiast and vintage collector. Dark mode is a lifestyle.",
    "Student at McGill. Looking for a quiet study partner.",
    "I enjoy rainy days and high-fidelity audio.",
    "Introverted but curious. Let's talk about the universe."
]

def generate_fake_profiles(count=100):
    profiles = []
    for i in range(count):
        alias = f"{random.choice(adjectives)} {random.choice(nouns)} #{random.randint(100, 999)}"
        profile = {
            "alias": alias,
            "email": f"fake_user_{i}@quietly.com",
            "password": "password123", # Default for testing
            "bio": random.choice(bios),
            "interests": random.sample(interests_pool, 3),
            "color": random.choice(colors),
            "time_left": f"{random.randint(1, 48)}h left",
            "inner_circle": [],
            "vibe_tokens": random.randint(10, 50), # Tokens for your AI logic
            "is_fake": True 
        }
        profiles.append(profile)
    return profiles

def seed():
    print("Clearing old fake data...")
    users_collection.delete_many({"is_fake": True})
    
    print(f"Generating 100 profiles...")
    data = generate_fake_profiles(100)
    
    users_collection.insert_many(data)
    print("✅ 100 fake profiles successfully added to the Montreal Cloud!")

if __name__ == "__main__":
    seed()