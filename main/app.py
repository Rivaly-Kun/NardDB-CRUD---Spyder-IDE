from flask import Flask, render_template, request, redirect, url_for
from crud_operations import login_user, add_user

app = Flask(__name__, static_folder="../static", template_folder="../templates")


@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        if login_user(username, password):  # Check login credentials
            return redirect(url_for("dashboard", username=username))
        else:
            return render_template("login.html", error="Invalid username or password.")

    return render_template("login.html")

@app.route("/dashboard/<username>")
def dashboard(username):
    return render_template("dashboard.html", username=username)

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":  # Removed the `z`
        username = request.form["username"]
        password = request.form["password"]

        if add_user(username, password):
            return redirect(url_for("login"))
        else:
            return render_template("register.html", error="Username already exists.")

    return render_template("register.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)

