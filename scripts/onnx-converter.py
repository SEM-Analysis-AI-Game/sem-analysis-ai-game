import os

from ultralytics import FastSAM
from dotenv import load_dotenv

load_dotenv()

model = FastSAM(os.environ.get("MODEL_DIR") + "/FastSAM-s.pt")
path = model.export(format="onnx")
print(path)
