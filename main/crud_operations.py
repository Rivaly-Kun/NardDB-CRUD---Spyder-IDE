import sqlite3
import os

# Define the database path
DB_PATH = os.path.join(os.path.dirname(__file__), "../inventory_system.db")

# Function to verify login credentials
def login_user(username, password):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = cursor.fetchone()
        conn.close()
        return user is not None
    except sqlite3.DatabaseError as e:
        print(f"Database error: {e}")
        return False

# Function to add a new user
def add_user(username, password):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        print("Error: Username already exists.")
        return False
    except sqlite3.DatabaseError as e:
        print(f"Database error: {e}")
        return False
