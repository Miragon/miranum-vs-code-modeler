import { StateManager } from "./stateManager";

const DEBUG = false;

export class Navigator {
  private canvas: any;
  private eventBus: any;
  private rootNodeId: undefined | string;

  constructor(modeler, private readonly stateManager: StateManager) {
    this.canvas = modeler.get("canvas");
    this.eventBus = modeler.get("eventBus");
  }

  public startListeners() {
    DEBUG &&
      console.debug("[BPMN_Editor.Navigator] Starting root element listener");
    this.eventBus.on("root.set", this.setRootFromEvent.bind(this));
    this.eventBus.on(
      "canvas.viewbox.changed",
      this.setViewboxFromEvent.bind(this)
    );
  }

  private setViewboxFromEvent(event) {
    DEBUG &&
      console.debug(
        "[BPMN_Editor.Navigator] Setting view box from event",
        event.viewbox
      );
    this.stateManager.updateState({
      viewBox: event.viewbox,
    });
  }

  private setRootFromEvent(event) {
    const rootElement = event.element;
    DEBUG &&
      console.debug(
        "[BPMN_Editor.Navigator] Setting root element",
        rootElement
      );
    if (rootElement.id === this.rootNodeId) return;

    console.debug("[BPMN_Editor.Navigator] Root element set: ", rootElement.id);
    this.rootNodeId = rootElement.id;

    this.stateManager.updateState({ rootNodeId: rootElement.id });
  }

  public setRootNodeId(rootNodeId) {
    DEBUG &&
      console.debug("[BPMN_Editor.Navigator] Setting root node id", rootNodeId);
    this.rootNodeId = rootNodeId;
    this.canvas.setRootElement(this.canvas.findRoot(this.rootNodeId));
  }

  public setViewBox(viewBox) {
    DEBUG && console.debug("[BPMN_Editor.Navigator] Setting view box", viewBox);
    if (viewBox) this.canvas.viewbox(viewBox);
  }
}
