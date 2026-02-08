import bcrypt

# Using bcrypt directly to avoid passlib encoding issues
# bcrypt requires input as bytes (utf-8 encoded)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if a plain password matches its hashed version.
    Handles potential errors if the stored password isn't a valid hash.
    """
    try:
        if not hashed_password:
            print("DEBUG: Empty stored password")
            return False

        # Ensure plain_password is bytes
        if isinstance(plain_password, str):
            plain_bytes = plain_password.encode('utf-8')
        else:
            plain_bytes = plain_password

        # Ensure hashed_password is bytes
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
            
        # Check if it looks like a bcrypt hash (starts with $2b$, $2a$, or $2y$)
        # We check the string representation for the prefix
        hashed_str = hashed_bytes.decode('utf-8', errors='ignore')
        if not hashed_str.startswith(("$2b$", "$2a$", "$2y$")):
            print(f"DEBUG: Not a bcrypt hash. Fallback to plain comparison. Stored: {hashed_str[:10]}...")
            # Fallback: Plain text comparison for old users
            return plain_password == hashed_password

        # bcrypt.checkpw requires bytes for both arguments
        print("DEBUG: Verifying with bcrypt...")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
        
    except Exception as e:
        print(f"Password Verification Error: {e}")
        # Final fallback
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """
    Creates a secure bcrypt hash for a plain password string.
    Returns the hash as a string.
    """
    # Ensure password is bytes
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')
    else:
        password_bytes = password

    # hashpw returns bytes, so we decode to utf-8 string for storage
    hashed_bytes = bcrypt.hashpw(
        password_bytes, 
        bcrypt.gensalt()
    )
    return hashed_bytes.decode('utf-8')
