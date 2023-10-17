import atexit
from flask import Flask, request, app
from ultralytics import SAM

# Load the model
model = SAM("mobile_sam.pt")

# Predict a segment based on a point prompt
# result = model.predict("sem.png", save=True, save_crop=True)

# print(result)


@app.route("/", methods=["POST"])
def segment():
    # for now mock out result and return JSON something blah blah blah
    # get image from request
    # run image through predictor
    # return result
    image = request.files["image"]
    result = model(image)
    return result.Masks


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
