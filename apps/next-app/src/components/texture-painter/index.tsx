import { TexturePainterCanvas } from "./canvas";
import { Loader } from "./loader";
import { TexturePainterOverlay } from "./overlay";
import { TexturePainterProvider } from "./state";

export function TexturePainter(): JSX.Element {
  return (
    <TexturePainterProvider>
      <Loader>
        <TexturePainterCanvas />
      </Loader>
      <TexturePainterOverlay />
    </TexturePainterProvider>
  );
}
