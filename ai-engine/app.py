from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

@app.route('/ai/plan', methods=['GET'])
def plan_trip():
    return jsonify({
        "message": "AI Agent is ready!",
        "suggestion": "How about a 3-day trip to Varanasi?"
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)