import { BackgroundLoader } from "./background-loader";
import { PainterCanvas } from "./canvas";
import { Loader } from "./loader";
import { PainterOverlay } from "./overlay";
import { PainterTools } from "./tools";

export function Painter(): JSX.Element {
  return (
    <div className="flex h-screen justify-center items-center">
      <PainterTools>
        <BackgroundLoader overlay={<PainterOverlay />} fallback={<Loader />}>
          <PainterCanvas />
        </BackgroundLoader>
      </PainterTools>
    </div>
  );
}
