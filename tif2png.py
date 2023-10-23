import os, cv2

# convert tif to png
for file in os.listdir("sem-images"):
    filename = "sem-images/" + os.fsdecode(file)
    image = cv2.imread(filename)
    cv2.imwrite(filename[:-4] + ".png", image)
