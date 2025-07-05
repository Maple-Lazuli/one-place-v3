from app import create_app
from flask_cors import CORS

app = create_app()
CORS(app, resources={r"/*": {"origins": "*"}})  # <-- allows all origins; for dev only

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3001)