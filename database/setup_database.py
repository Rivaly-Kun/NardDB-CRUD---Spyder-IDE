import sqlite3
import os
import pandas as pd
def setup_database():
    # Define the path to the SQLite database file
    db_path = os.path.join(os.path.dirname(__file__), "../inventory_system.db")

    # Ensure the database file path exists
    if not os.path.exists(db_path):
        print(f"Creating database at {db_path}")
    else:
        print(f"Database found at {db_path}, proceeding with setup.")

    # Connect to SQLite (creates the file if it doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create 'users' table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # Create 'roles' table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Create 'inventory' table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        expiration_date TEXT
    )
    """)

    # Create 'transactions' table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        transaction_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES inventory (id)
    )
    """)

    # Commit changes and close connection
    conn.commit()
    conn.close()
    print("Database setup completed!")

# Run the function if the script is executed
if __name__ == "__main__":
    setup_database()
