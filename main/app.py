from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from crud_operations import login_user, add_user
from datetime import datetime
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


@app.route("/update_inventory/<int:item_id>", methods=["POST"])
def update_inventory(item_id):
    """Update an inventory item."""
    try:
        product_name = request.form["product_name"]
        quantity = int(request.form["quantity"])
        price = float(request.form["price"])
        expiration_date = request.form.get("expiration_date")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE inventory
            SET product_name = ?, quantity = ?, price = ?, expiration_date = ?
            WHERE id = ?
            """,
            (product_name, quantity, price, expiration_date, item_id),
        )
        conn.commit()
        conn.close()

        return jsonify(
            {
                "id": item_id,
                "product_name": product_name,
                "quantity": quantity,
                "price": price,
                "expiration_date": expiration_date or None,
            }
        )
    except Exception as e:
        print("Error updating inventory:", str(e))
        return jsonify({"error": str(e)}), 500



@app.route("/user_management")
def user_management():
    """Manage users and their roles."""
    if "username" not in session:
        return redirect(url_for("login"))  # Ensure user is logged in

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT users.id, users.username, roles.role 
        FROM users 
        LEFT JOIN roles ON users.id = roles.user_id
        """
    )
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
        cursor.execute(
            """
            INSERT INTO inventory (product_name, quantity, price, expiration_date) 
            VALUES (?, ?, ?, ?)
            """,
            (product_name, quantity, price, expiration_date),
        )
        conn.commit()
        item_id = cursor.lastrowid
        conn.close()

        response_data = {
            "id": item_id,
            "product_name": product_name,
            "quantity": quantity,
            "price": price,
            "expiration_date": expiration_date or None,
        }
        return jsonify(response_data)
    except Exception as e:
        print("Error adding inventory:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/delete_item/<int:item_id>", methods=["POST"])
def delete_item(item_id):
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()

        return jsonify({"success": True})
    except Exception as e:
        print("Error deleting item:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/logout")
def logout():
    """Clear session and redirect to login page."""
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    print("Starting Flask app...")
    app.run(host="0.0.0.0", port=5002, debug=True, use_reloader=False)
