def calculate_match_score(user_a, user_b):
    score = 0
    reasons = []

    attr_a = user_a.get("matching_attributes", {})
    attr_b = user_b.get("matching_attributes", {})
    tags_a = user_a.get("user_profile", {}).get("tags", {})
    tags_b = user_b.get("user_profile", {}).get("tags", {})

    # 1. HARD FILTER: Must Avoids (The Dealbreakers)
    # Check if A's likes are in B's avoids, or vice versa
    for dislike in attr_a.get("must_avoid", []):
        if any(like in dislike.lower() for like in tags_b.get("likes", [])):
            score -= 50
            reasons.append(f"Conflict: Item in {user_b.get('alias', 'Match')}'s lifestyle is a dealbreaker for {user_a.get('alias', 'User')}.")

    # 2. SOFT MATCH: Social Style (Weight: 30%)
    if attr_a.get("social_style") == attr_b.get("social_style"):
        score += 30
        reasons.append(f"Both share a {attr_a.get('social_style')} social style.")

    # 3. SOFT MATCH: Energy Level (Weight: 30%)
    # Max difference of 10. We want a small delta.
    energy_delta = abs(attr_a.get("energy_level", 0) - attr_b.get("energy_level", 0))
    if energy_delta <= 2:
        score += 30
        reasons.append("Highly compatible energy levels.")
    elif energy_delta <= 4:
        score += 15
        reasons.append("Moderately compatible energy levels.")

    # 4. SOFT MATCH: Shared Interests (Weight: 40%)
    common_likes = set(tags_a.get("likes", [])) & set(tags_b.get("likes", []))
    if common_likes:
        interest_score = min(len(common_likes) * 15, 40)
        score += interest_score
        reasons.append(f"Shared interests: {', '.join(list(common_likes)[:3])}")

    # Final Score Normalization (0-100)
    final_score = max(0, min(score, 100))
    return final_score, reasons