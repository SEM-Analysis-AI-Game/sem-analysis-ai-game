import sys
import json

if len(sys.argv) != 2:
    print("Incorrect usage - input the file name to run-length encode")
    exit()

file = sys.argv[1]

print('[', end='')
with open(file, "r") as f:
    # lines = map(lambda x: x.strip()[:-1], f.readlines())
    js = json.loads(f.read())
    last = None
    length = 0
    for l in js["segments"]:
        if l != last:
            if last is not None:
                print(f'[{last},{length}]',end=',')
            length = 1
            last = l
        else:
            length += 1
    print(f'[{last},{length}]',end='')
print(']')