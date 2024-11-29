from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from crud_operations import login_user, add_user
import sqlite3
import os

app = Flask(__name__, static_folder="../static", template_folder="../templates")
app.secret_key = "your_secret_key"  # Required for session management

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "../inventory_system.db")


def get_db_connection():
    """Establish a connection to the SQLite database."""
    return sqlite3.connect(DB_PATH)


@app.route("/")
def home():
    """Redirect to login page."""
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle login and registration."""
    if request.method == "POST":
        form_type = request.form.get("form_type")
        if form_type == "login":
            username = request.form["username"]
            password = request.form["password"]
            if login_user(username, password):
                session["username"] = username  # Store username in session
                return redirect(url_for("dashboard"))
            return render_template("login.html", error="Invalid username or password.", show_form="login")
        elif form_type == "register":
            username = request.form["username"]
            password = request.form["password"]
            confirm_password = request.form["confirm_password"]
            if password != confirm_password:
                return render_template("login.html", error="Passwords do not match.", show_form="register")
            if add_user(username, password):
                return redirect(url_for("login"))
            return render_template("login.html", error="Username already exists.", show_form="register")
    return render_template("login.html", show_form="login")





@app.route("/dashboard")
def dashboard():
    if "username" not in session:
        return redirect(url_for("login"))

    username = session["username"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, product_name, quantity, price, expiration_date FROM inventory")
    inventory_items = cursor.fetchall()
    conn.close()

    return render_template("dashboard.html", username=username, inventory_items=inventory_items)



@app.route("/add_employee", methods=["POST"])
def add_employee():
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    username = request.form["username"]
    password = request.form["password"]
    role = request.form["role"]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert the user into the users table
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        user_id = cursor.lastrowid

        # Assign the role to the user
        cursor.execute("INSERT INTO roles (user_id, role) VALUES (?, ?)", (user_id, role))
        conn.commit()
        conn.close()

        # Return the new user details
        return jsonify({"id": user_id, "username": username, "role": role}), 200
    except sqlite3.IntegrityError as e:
        return jsonify({"error": f"Username '{username}' already exists."}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_users", methods=["GET"])
def get_users():
    """Fetch all users and their roles."""
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT users.id, users.username, roles.role 
            FROM users 
            LEFT JOIN roles ON users.id = roles.user_id
        """)
        users = [{"id": row[0], "username": row[1], "role": row[2]} for row in cursor.fetchall()]
        conn.close()
        return jsonify(users)
    except Exception as e:
        print("Error fetching users:", str(e))
        return jsonify({"error": str(e)}), 500



@app.route("/add_user", methods=["GET", "POST"])
def add_user_page():
    """Add a new user and assign a role."""
    if "username" not in session:
        return redirect(url_for("login"))  # Ensure user is logged in

    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        role = request.form["role"]

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            user_id = cursor.lastrowid
            cursor.execute("INSERT INTO roles (user_id, role) VALUES (?, ?)", (user_id, role))
            conn.commit()
        except sqlite3.IntegrityError:
            return render_template("add_user.html", error="Username already exists.")
        finally:
            conn.close()
        return redirect(url_for("user_management"))
    return render_template("add_user.html")


@app.route("/user_management")
def user_management():
    """Manage users and their roles."""
    if "username" not in session:
        return redirect(url_for("login"))  # Ensure user is logged in

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT users.id, users.username, roles.role 
        FROM users 
        LEFT JOIN roles ON users.id = roles.user_id
    """)
    users = cursor.fetchall()
    conn.close()
    return render_template("user_management.html", users=users)

@app.route("/add_inventory", methods=["POST"])
def add_inventory():
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    product_name = request.form["product_name"]
    quantity = int(request.form["quantity"])
    price = float(request.form["price"])
    expiration_date = request.form.get("expiration_date")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO inventory (product_name, quantity, price, expiration_date) 
            VALUES (?, ?, ?, ?)
        """, (product_name, quantity, price, expiration_date))
        conn.commit()
        item_id = cursor.lastrowid
        conn.close()

        # Log response for debugging
        response_data = {
            "id": item_id,
            "product_name": product_name,
            "quantity": quantity,
            "price": price,
            "expiration_date": expiration_date or None
        }
        print("Response data:", response_data)
        return jsonify(response_data)
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500










@app.route("/transactions")
def transactions():
    """View transaction history."""
    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT transactions.id, users.username, inventory.product_name, transactions.transaction_date 
        FROM transactions 
        JOIN users ON transactions.user_id = users.id 
        JOIN inventory ON transactions.product_id = inventory.id
    """)
    transactions = cursor.fetchall()
    conn.close()
    return render_template("transactions.html", transactions=transactions)

@app.route('/delete_item/<int:item_id>', methods=['POST'])
def delete_item(item_id):
    if "username" not in session:
        return {"error": "Unauthorized"}, 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()

        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500



@app.route("/logout")
def logout():
    """Clear session and redirect to login page."""
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    print("Starting Flask app...")
    app.run(host="0.0.0.0", port=5002, debug=True, use_reloader=False)
