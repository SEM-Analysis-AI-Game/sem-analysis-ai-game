import hela1 from "../../public/sem-images/hela-1.png";
import hela2 from "../../public/sem-images/hela-2.png";
import hela3 from "../../public/sem-images/hela-3.png";
import lotus1 from "../../public/sem-images/lotus-leaf-1.png";
import lotus2 from "../../public/sem-images/lotus-leaf-2.png";
import muc1 from "../../public/sem-images/muc-1.png";
import muc2 from "../../public/sem-images/muc-2.png";
import muc3 from "../../public/sem-images/muc-3.png";

/**
 * The images that are available to be used as the background.
 */
export const kImages = [
  {
    ...hela1,
    description: "The cells of something (i don't know)",
  },
  {
    ...hela2,
    description: "The cells of something (i don't know)",
  },
  {
    ...hela3,
    description: "The cells of something (i don't know)",
  },
  {
    ...lotus1,
    description: "The cells of something (i don't know)",
  },
  {
    ...lotus2,
    description: "The cells of something (i don't know)",
  },
  {
    ...muc1,
    description: "The cells of something (i don't know)",
  },
  {
    ...muc2,
    description: "The cells of something (i don't know)",
  },
  {
    ...muc3,
    description: "The cells of something (i don't know)",
  },
];

/**
 * Gets a background image by index.
 */
export function getImage(index: number) {
  return kImages[index];
}
