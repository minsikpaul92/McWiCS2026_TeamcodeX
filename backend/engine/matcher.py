def calculate_match_score(user1_profile, user2_profile):
    """
    Compares two users' profiles and calculates a matching score.
    """
    score = 0
    reasons = []

    # 1. Hard Filter: Must Avoid (Conditions to absolutely avoid)
    # Check if anything on my dislike list is included in the other person's likes
    u1_dislikes = set(user1_profile["matching_attributes"]["must_avoid"])
    u2_likes = set(user2_profile["user_profile"]["tags"]["likes"])
    
    intersection1 = u1_dislikes.intersection(u2_likes)
    if intersection1:
        return 0, ["Critical compatibility issue: Conflict with 'Must Avoid' constraints."]

    # 2. Energy Level Score (Social Energy Level)
    # Give bonus points if the difference is within 2, deduct points if it's 5 or more
    energy_diff = abs(user1_profile["matching_attributes"]["energy_level"] - 
                      user2_profile["matching_attributes"]["energy_level"])
    
    if energy_diff <= 2:
        score += 40
        reasons.append("Similar social energy levels.")
    elif energy_diff >= 5:
        score -= 20
        reasons.append("Significant difference in social energy.")

    # 3. Interest Matching
    u1_likes = set(user1_profile["user_profile"]["tags"]["likes"])
    u2_likes = set(user2_profile["user_profile"]["tags"]["likes"])
    common_interests = u1_likes.intersection(u2_likes)
    
    if common_interests:
        score += len(common_interests) * 10
        reasons.append(f"Shared interests: {', '.join(list(common_interests)[:3])}")

    # 4. Social Style (Communication Style)
    if user1_profile["matching_attributes"]["social_style"] == user2_profile["matching_attributes"]["social_style"]:
        score += 20
        reasons.append(f"Matching communication style: {user1_profile['matching_attributes']['social_style']}")

    # Normalize score (Max 100, Min 0)
    final_score = max(0, min(100, score))
    
    return final_score, reasons
