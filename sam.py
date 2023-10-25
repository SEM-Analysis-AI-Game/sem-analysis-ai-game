from ultralytics import SAM
from PIL import Image
import os

import dotenv
dotenv.load_dotenv()

base_dir = os.path.dirname(os.path.realpath(__file__))
model = SAM(os.path.join(base_dir, os.getenv("MODEL_DIR"), "mobile_sam.pt"))
input_dir = "sem-images"

for file in os.listdir(os.path.join(base_dir, input_dir)):
    filename = os.path.join(base_dir, input_dir, os.fsdecode(file))
    image = Image.open(filename)
    result = model(image, save=True)