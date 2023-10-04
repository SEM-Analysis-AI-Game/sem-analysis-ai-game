import { ActionHistoryProvider } from "./action-history";
import { BackgroundLoader } from "./background-loader";
import { PainterCanvas } from "./canvas";
import { Loader } from "./loader";
import { PainterOverlay } from "./overlay";
import { PainterStatistics, StatisticsProvider } from "./statistics";
import { PainterToolProvider } from "./tools";

export function Painter(): JSX.Element {
  return (
    <div className="flex h-screen justify-center items-center">
      <PainterToolProvider>
        <ActionHistoryProvider>
          <StatisticsProvider>
            <BackgroundLoader
              overlay={<PainterOverlay />}
              fallback={<Loader />}
            >
              <PainterCanvas />
            </BackgroundLoader>
          </StatisticsProvider>
        </ActionHistoryProvider>
      </PainterToolProvider>
    </div>
  );
}
