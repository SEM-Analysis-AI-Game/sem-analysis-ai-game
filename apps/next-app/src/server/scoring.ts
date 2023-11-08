/**
 * @param resolution The width and height of the input image
 * @param reference Segment index array of correct/reference image
 * @param input Segement index array of a given image to assign a score to
 */
export const scoringFunction = (resolution: readonly [number, number], reference: readonly number[], input: readonly number[]) => {
    /*
    Approach:
        Perform an optimal mapping of correct segments to given segments. This mapping should be injective
        but not necessarily surjective. That is, every correct segment should match to at most 1 given segment.
        With that mapping count the total number of pixels which have been correctly drawn
        Report the answer as that value divided by the total number of pixels on the image.
    */
   
   const [width, height] = resolution;
   const size = width * height;
   if (reference.length != size || input.length != size) {
       throw Error("Dimension of correct and image must match the total size of the image");
   }

    // 1. Count for each correct segment the total number of pixels for each 

    // input segment index to a map that associates a reference segment index to the count
    const counts = new Map<number, Map<number, number>>();
    const found = new Array<boolean>(size);
    let numReferencePoints = 0;
    for (let i = 0; i < size; i++) {
        if (reference[i] && reference[i] !== 0) {
            numReferencePoints++;
        }
        else if (!input[i] || input[i] === 0) {
            numReferencePoints++; // penalty for filling in when they shouldn't have
            continue;
        }
        
        if (found[i]) continue;

        let [x, y] = [i % width, Math.floor(i / width)];
        // perform DFS
        const stack: number[] = [i];
        found[i] = true;
        while (stack.length > 0) {
            const n = stack.pop() as number;
            const segmentIndex = input[n];
            const referenceIndex = reference[n];
            if (referenceIndex) {
                if (!counts.has(segmentIndex)) {
                    counts.set(segmentIndex, new Map<number, number>());
                }

                const countMap = counts.get(segmentIndex);
                if (countMap?.has(referenceIndex)) {
                    countMap.set(referenceIndex, countMap.get(referenceIndex) as number + 1);
                }
                else {
                    countMap?.set(referenceIndex, 1);
                }
                
            }
            for (const dir of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const [nx, ny] = [x + dir[0], y + dir[1]];
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const index = nx + ny * width;
                    if (!found[index] && input[index] === segmentIndex) {
                        stack.push(index);
                        found[index] = true;
                    }
                }
            }
        }
    }

    // FOR OPTIMAL SOLUTION:
    // To perfrom an optimal matching that associates reference segment indexes to input
    // we can use a maximum flow algorithm on a bipartite graph

    // FOR NAIVE SOLUTION:
    // For each matching associate the input segment with the one it is overlapping the greatest with and mark that segment as used
    const used = new Set<number>();
    const inputToReference = new Map<number, number>();
    counts.forEach((val: Map<number, number>, key: number) => {
        let [max, maxInd]: [number, number | null] = [0, null];
        val.forEach((count: number, ind: number) => {
            if (used.has(ind)) return;
            if (count > max) {
                max = count;
                maxInd = ind;
            }
        })

        if (maxInd !== null) {
            inputToReference.set(key, maxInd);
            used.add(maxInd);
        }
    });

    let correctCount = 0;

    counts.forEach((value: Map<number ,number>, inputIndex: number) => {
        const referenceIndex = inputToReference.get(inputIndex);
        if (referenceIndex) {
            correctCount += value.get(referenceIndex) as number;
        }
    });

    const totalCorrect = correctCount;

    const score = totalCorrect / numReferencePoints;

    return score;
}