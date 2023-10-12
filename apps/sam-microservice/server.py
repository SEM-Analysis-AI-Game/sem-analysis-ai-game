import atexit
from flask import Flask, send_from_directory
from ultralytics import SAM

# Load the model
model = SAM('mobile_sam.pt')

# Predict a segment based on a point prompt
result = model.predict('sem.png', points=[900, 370], labels=[1])

print(result)

# app = Flask(__name__)

# @app.route('/')
# def segment():


#     # for now mock out result and return JSON something blah blah blah
#     return {
#         "result": "Hello"
#     }

# def shutdown():
#     print("Flask is shutting down...")

# atexit.register(shutdown)

# app.run()
