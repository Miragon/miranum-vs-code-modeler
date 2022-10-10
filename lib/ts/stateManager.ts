import { WebviewApi } from "vscode-webview";

export interface State {
  // https://github.com/bpmn-io/diagram-js/blob/master/lib/core/Canvas.js#L1052
  viewBox?: unknown;
  initialized?: boolean;
  content?: string;
  rootNodeId?: string;
}

const DEBUG = false;

export class StateManager {
  private vscode: WebviewApi<State>;

  public constructor() {
    this.vscode = acquireVsCodeApi();
  }

  public getState(): State {
    const state = this.vscode.getState() ?? {};
    DEBUG && console.debug("[BPMN_Editor.CodeApiManager] Getting state", state);
    return state;
  }

  private setState(state: State) {
    DEBUG && console.debug("[BPMN_Editor.CodeApiManager] Setting state", state);
    this.vscode.setState(state);
  }

  public updateState(state: Partial<State>) {
    this.setState({
      ...this.getState(),
      ...state,
      initialized: true,
    });
  }

  public sendUpdateXML(xml: string) {
    this.vscode.postMessage({
      type: "updateXML",
      text: xml,
    });
  }
}
