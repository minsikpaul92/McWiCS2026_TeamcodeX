import json
from engine.matcher import calculate_match_score

def test_matching():
    # paul's analyzed profile (from previous result)
    paul = {
        "user_profile": {
            "summary": "Paul is a computer programmer in Toronto...",
            "tags": {
                "likes": ["computer programming", "gaming", "quiet environments", "staying home"],
                "dislikes": ["loud parties", "spicy food"]
            }
        },
        "matching_attributes": {
            "energy_level": 2,
            "social_style": "Quiet",
            "must_avoid": ["loud parties", "spicy food"]
        }
    }

    # a potential match: "Sarah" (Simulated profile)
    sarah = {
        "user_profile": {
            "summary": "Sarah loves books and painting in cafes.",
            "tags": {
                "likes": ["reading", "painting", "quiet environments", "coding"],
                "dislikes": ["noisy places"]
            }
        },
        "matching_attributes": {
            "energy_level": 3,
            "social_style": "Quiet",
            "must_avoid": ["noisy environments"]
        }
    }

    # a bad match: "Party Lover" (Simulated profile)
    party_person = {
        "user_profile": {
            "summary": "I love clubbing and spicy food!",
            "tags": {
                "likes": ["loud parties", "spicy food", "dancing"],
                "dislikes": ["silence"]
            }
        },
        "matching_attributes": {
            "energy_level": 9,
            "social_style": "Direct",
            "must_avoid": ["boring people"]
        }
    }

    print("--- Matching Test Starting ---")
    
    # Test 1: Paul & Sarah (Good Match)
    score1, reasons1 = calculate_match_score(paul, sarah)
    print(f"\nMatch 1 (Paul & Sarah): Score = {score1}%")
    for r in reasons1: print(f" - {r}")

    # Test 2: Paul & Party Lover (Bad Match - Hard Filtered)
    score2, reasons2 = calculate_match_score(paul, party_person)
    print(f"\nMatch 2 (Paul & Party Lover): Score = {score2}%")
    for r in reasons2: print(f" - {r}")

if __name__ == "__main__":
    test_matching()
