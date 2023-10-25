import * as THREE from 'three';

export const getRandomColor = () => {
    const minimumRange = 0.6;

    // Repeatedly attempt to generate a color that satisfies the above condition

    while (true) {
        const candidate = [ Math.random(), Math.random(), Math.random()];
        
        const range = Math.max(...candidate) - Math.min(...candidate);

        if (range < minimumRange) {
            continue;
        }

        return new THREE.Color(...candidate);
    }
}