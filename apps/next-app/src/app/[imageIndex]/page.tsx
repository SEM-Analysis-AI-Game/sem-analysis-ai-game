import { DrawEvent, kImages, smoothPaint } from "@/util";
import { Painter } from "@/components";

export function generateStaticParams() {
  return kImages.map((_, index) => ({
    imageIndex: index.toString(),
  }));
}

let previousState: DrawEvent[][] = [];
const imageDrawingStates: {
  segmentBuffer: Int32Array;
  segmentData: { color: THREE.Color }[];
  textureData: Uint8Array;
}[] = kImages.map((image) => ({
  segmentBuffer: new Int32Array(image.width * image.height).fill(-1),
  segmentData: [],
  textureData: new Uint8Array(image.width * image.height * 4),
}));

export default async function Paint(props: {
  params: { imageIndex: string };
}): Promise<JSX.Element> {
  // fetch the current state from the server (this component is being rendered on a worker
  // so it does not have direct access to the server's state)
  const response = await fetch(
    `http://localhost${
      process.env.PORT ? `:${process.env.PORT}` : ""
    }/api/state?imageIndex=${props.params.imageIndex}`,
    { cache: "no-cache" }
  )
    .then((res) => res.json())
    .catch(() => ({
      state: [],
    }));

  const index = parseInt(props.params.imageIndex);
  const image = kImages[index];

  for (let i = previousState.length; i < response.state.length; i++) {
    const event = response.state[i];
    smoothPaint(
      event,
      imageDrawingStates[index].segmentBuffer,
      imageDrawingStates[index].segmentData,
      imageDrawingStates[index].textureData,
      [image.width, image.height]
    );
  }

  previousState = response.state;

  return (
    <Painter
      imageIndex={index}
      segmentBuffer={imageDrawingStates[index].segmentBuffer}
      segmentData={imageDrawingStates[index].segmentData.map((data) => ({
        color: data.color.getHexString(),
      }))}
      initialDrawingData={imageDrawingStates[index].textureData}
    />
  );
}
