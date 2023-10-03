import ultralytics
import atexit
from flask import Flask, send_from_directory
# from dotenv import load_dotenv
# import os

# load_dotenv()

app = Flask(__name__)

@app.route('/')
def segment():
    # for now mock out result and return JSON something blah blah blah
    return {
        "result": "Hello"
    }

def shutdown():
    print("Flask is shutting down...")

atexit.register(shutdown)

app.run()
