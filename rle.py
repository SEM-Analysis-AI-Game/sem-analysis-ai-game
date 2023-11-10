print('[', end='')
with open("1.txt", "r") as f:
    lines = map(lambda x: x.strip()[:-1], f.readlines())
    last = None
    length = 0
    for l in lines:
        if l != last:
            if last is not None:
                print(f'[{last},{length}]',end=',')
            length = 1
            last = l
        else:
            length += 1
    print(f'[{last},{length}]',end='')
print(']')