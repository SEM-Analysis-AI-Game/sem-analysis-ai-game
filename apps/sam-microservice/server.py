import atexit
from flask import Flask, request
from ultralytics import SAM

import requests
from PIL import Image
from io import BytesIO

# Step 1: Download the image from the URL
def download_image(url):
    response = requests.get(url)
    image = Image.open(BytesIO(response.content))
    return image

# Load the model
model = SAM("mobile_sam.pt")

app = Flask(__name__)

@app.route("/", methods=["POST"])
def segment():
    # get image from request
    # run image through predictor
    # return result
    # image = request.files["image"]
    body = request.json

    n_fields = ['points', 'imageURL']

    if len(list(filter(lambda f: f not in body, n_fields))) > 0:
        return 'Missing a required field', 400

    points, url = body['points'], body['imageURL']

    image = download_image(url)

    # download the image from the url

    result = model(image)

    print(result)

    print(url)
    print(points)

    # print(image)
    # result = model(image)
    # return result.Masks
    return {"mask": []}

def shutdown():
    print("Flask is shutting down...")

atexit.register(shutdown)

app.run()
