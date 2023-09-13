#!/bin/zsh

source .env

WGET_OPTIONS=(-q --show-progress -nc)

# Set up python environment
echo "Setting up environment..."
python3 -m venv $ENV_DIR
source $ENV_DIR/bin/activate
pip3 install -r requirements.txt | grep -v "already satisfied"

if ! test -f $MODEL_DIR/FastSAM-s.onnx; then
    python3 $SCRIPTS_DIR/onnx-converter.py
fi

echo "Done! ✨"