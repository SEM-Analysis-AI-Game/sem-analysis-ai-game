import { ActionHistoryProvider } from "./action-history";
import { BackgroundLoader } from "./background-loader";
import { PainterCanvas } from "./canvas";
import { DrawingLayerProvider } from "./drawing-layer";
import { HistoryButton } from "./history-button";
import { Loader } from "./loader";
import { RendererStateProvider } from "./renderer-state";
import { StatisticsProvider } from "./statistics";
import { Toolbar } from "./toolbar";
import { PainterToolProvider } from "./tools";

export function Painter(): JSX.Element {
  return (
    <div className="flex h-screen justify-center items-center">
      <PainterToolProvider>
        <BackgroundLoader overlay={<Toolbar />} fallback={<Loader />}>
          <StatisticsProvider>
            <RendererStateProvider>
              <DrawingLayerProvider>
                <ActionHistoryProvider>
                  <div className="flex justify-between">
                    {(["undo", "redo"] as const).map((type) => (
                      <HistoryButton key={type} type={type}>
                        {type}
                      </HistoryButton>
                    ))}
                  </div>
                  <PainterCanvas />
                </ActionHistoryProvider>
              </DrawingLayerProvider>
            </RendererStateProvider>
          </StatisticsProvider>
        </BackgroundLoader>
      </PainterToolProvider>
    </div>
  );
}
