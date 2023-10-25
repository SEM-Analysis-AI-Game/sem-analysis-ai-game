import { StaticImageData } from "next/image";

import hela1 from '../../public/sem-images/hela-1.png';
import hela2 from '../../public/sem-images/hela-2.png';
import hela3 from '../../public/sem-images/hela-3.png';
import lotus1 from '../../public/sem-images/lotus-leaf-1.png';
import lotus2 from '../../public/sem-images/lotus-leaf-2.png';
import muc1 from '../../public/sem-images/muc-1.png';
import muc2 from '../../public/sem-images/muc-2.png';
import muc3 from '../../public/sem-images/muc-3.png';

export type SEMImageData = {
    image: StaticImageData,
    description: string
};

/**
 * the images to display in the gallery.
 */
export const kImages: SEMImageData[] = [
    {
        image: hela1,
        description: "The cells of something (i don't know)"
    },
    {
        image: hela2,
        description: "The cells of something (i don't know)"
    },
    {
        image: hela3,
        description: "The cells of something (i don't know)"
    },
    {
        image: lotus1,
        description: "The cells of something (i don't know)"
    },
    {
        image: lotus2,
        description: "The cells of something (i don't know)"
    },
    {
        image: muc1,
        description: "The cells of something (i don't know)"
    },
    {
        image: muc2,
        description: "The cells of something (i don't know)"
    },
    {
        image: muc3,
        description: "The cells of something (i don't know)"
    },
];

