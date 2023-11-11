import hela1 from "../../public/sem-images/0.png";
import hela2 from "../../public/sem-images/1.png";
import hela3 from "../../public/sem-images/2.png";
import pus1 from "../../public/sem-images/3.png";
import blood1 from "../../public/sem-images/4.png";
import strawberry1 from "../../public/sem-images/5.png";
import bac1 from "../../public/sem-images/6.png";
import fuso1 from "../../public/sem-images/7.png";

/**
 * The images that are available to be used as the background.
 */
export const kImages = [
  {
    ...hela1,
    description:
      "Surface of cervical cancer cell that has a high production of a specific protein involved in breast cancer.",
  },
  {
    ...hela2,
    description:
      "Surface of cervical cancer cell that has a high production of a specific protein involved in breast cancer.",
  },
  {
    ...hela3,
    description:
      "Surface of cervical cancer cell that has a high production of a specific protein involved in breast cancer.",
  },
  {
    ...pus1,
    description:
      "Fluid secreted during the response from the immune system to an infection.",
  },
  {
    ...blood1,
    description:
      "Blood cells that have clotted together. Normal when bleeding and dangerous when not.",
  },
  {
    ...strawberry1,
    description:
      "Surface of a strawberry. The small bumps are the seeds of the strawberry.",
  },
  {
    ...bac1,
    description:
      "A colony of bacillus cereus, a bacteria found in soil and marine sponges. Can contaminant in foodborne illness.",
  },
  {
    ...fuso1,
    description:
      "Bacteria found in the mouth and intestines. It is interacting with a pancreatic cancer cell.",
  },
];

/**
 * Gets a background image by index.
 */
export function getImage(index: number) {
  return kImages[index];
}
