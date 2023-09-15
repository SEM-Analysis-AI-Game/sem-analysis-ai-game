import { TexturePainterToolbar } from './toolbar';

export function TexturePainterOverlay(): JSX.Element {
  return (
    <TexturePainterToolbar
      currentToolName={'brush'}
      updateTool={function (): void {
        throw new Error('Function not implemented.');
      }}
    />
  );
}
