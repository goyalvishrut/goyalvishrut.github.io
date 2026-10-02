from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route("/")
@app.route("/index.html")
def home():
    """Serve the same canonical page as GitHub Pages."""
    return send_from_directory(app.root_path, "index.html")


@app.route("/resume.html")
def resume():
    return send_from_directory(app.root_path, "resume.html")


if __name__ == "__main__":
    app.run()
