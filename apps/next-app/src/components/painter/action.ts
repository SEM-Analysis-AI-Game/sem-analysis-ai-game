export abstract class CanvasAction {
  public abstract undo(): void;
  public abstract redo(): void;

  constructor() {}
}
