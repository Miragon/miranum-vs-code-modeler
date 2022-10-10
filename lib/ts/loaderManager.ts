import { State, StateManager } from "./stateManager";

const DEBUG = false;

export class LoaderManager {
  private _loadResolver: Promise<State>;

  constructor(private readonly stateManager: StateManager) {
    this._loadResolver = new Promise((resolve) => {
      DEBUG && console.debug("[BPMN_Editor.Webview] Waiting for initial state");
      // Loading from cache
      const state = this.stateManager.getState();
      if (state.initialized) {
        DEBUG &&
          console.debug("[BPMN_Editor.LoaderManager] Initial state from cache");
        return resolve(state);
      }

      // Loading from file
      const controller = new AbortController();
      window.addEventListener(
        "message",
        async (event : any) => {
          DEBUG &&
            console.debug(
              "[BPMN_Editor.LoaderManager] Initial state from vscode",
              event.data
            );
          const message = event.data;
          if (message.type === "loadXML") {
            resolve({
              content: message.text == "" ? null : message.text,
            });
            // Remove listener
            controller.abort();
          }
        },
        { signal: controller.signal }
      );
    });
  }

  get initialState() {
    return this._loadResolver;
  }
}
