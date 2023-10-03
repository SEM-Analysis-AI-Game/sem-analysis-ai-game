"use client"

import { ActionHistoryProvider } from "./action-history";
import { BackgroundLoader } from "./background-loader";
import { PainterCanvas } from "./canvas";
import { Loader } from "./loader";
import { PainterToolProvider } from "./tools";

export function Painter(): JSX.Element {
  return (
    <div className="flex h-screen justify-center items-center">
      <PainterToolProvider>
        <ActionHistoryProvider>
          <BackgroundLoader fallback={<Loader />}>
            <PainterCanvas />
          </BackgroundLoader>
        </ActionHistoryProvider>
      </PainterToolProvider>
    </div>
  );
}
