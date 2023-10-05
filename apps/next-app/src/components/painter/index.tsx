import { ActionHistoryProvider } from "./action-history";
import { BackgroundLoader } from "./background-loader";
import { PainterCanvas } from "./canvas";
import { Loader } from "./loader";
import { PainterOverlay } from "./overlay";
import { StatisticsProvider } from "./statistics";
import { PainterToolProvider } from "./tools";

export function Painter(): JSX.Element {
  return (
    <div className="flex h-screen justify-center items-center">
      <PainterToolProvider>
        <ActionHistoryProvider>
          <BackgroundLoader overlay={<PainterOverlay />} fallback={<Loader />}>
            <StatisticsProvider>
              <PainterCanvas />
            </StatisticsProvider>
          </BackgroundLoader>
        </ActionHistoryProvider>
      </PainterToolProvider>
    </div>
  );
}
