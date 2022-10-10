// CSS
import "./style.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-color-picker/colors/color-picker.css";

// External Modules
import BpmnModeler from "bpmn-js/lib/Modeler";
import BpmnColorPickerModule from "bpmn-js-color-picker";

// Libs
import { Navigator } from "./navigator";
import { ContentManager } from "./contentManager";
import { StateManager } from "./stateManager";
import { LoaderManager } from "./loaderManager";

const DEBUG = false;

// Setup
const stateManager = new StateManager();
const loaderManager = new LoaderManager(stateManager);

const modeler = new BpmnModeler({
  container: "#canvas",
  keyboard: { bindTo: document },
  additionalModules: [BpmnColorPickerModule],
});

const navigation = new Navigator(modeler, stateManager);
const contentManager = new ContentManager(modeler);

// Helpers
async function openXML(content) {
  DEBUG && console.debug("[BPMN_Editor.Webview] Loading changes");

  if (!content) {
    DEBUG &&
      console.debug("[BPMN_Editor.Webview] Empty diagram, saving template");
    await contentManager.newDiagram();
    sendChanges();
  } else {
    await contentManager.loadDiagram(content);
    // Persist in cache
    stateManager.updateState({ content });
  }

  // Persist state information.
  // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
  stateManager.updateState({ content });
}

function sendChanges() {
  DEBUG && console.debug("[BPMN_Editor.Webview] Sending changes");

  contentManager.exportDiagram().then((text) => {
    stateManager.sendUpdateXML(text);
    stateManager.updateState({ content: text });
  });
}

// Listeners

function setupListeners() {
  DEBUG && console.debug("[BPMN_Editor.Webview] Setting up listeners");
  // VSCode API listeners
  window.addEventListener("message", async (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "updateXML":
        DEBUG &&
          console.debug(
            "[BPMN_Editor.Webview] Updating event from editor: ",
            message
          );
        openXML(message.text);
        return;
      case "loadXML":
        break;
      default:
        DEBUG &&
          console.debug(
            "[BPMN_Editor.Webview] Unknown message type: ",
            message
          );
    }
  });

  // Auto save on XML Change
  modeler.get("eventBus").on("commandStack.changed", sendChanges);

  // Navigation listeners
  navigation.startListeners();
}

// Init
async function init() {
  DEBUG && console.debug("[BPMN_Editor.Webview] Initializing");

  // Load last state
  const state = await loaderManager.initialState;
  DEBUG &&
    console.debug("[BPMN_Editor.Webview] Initializing with state: ", state);
  await openXML(state.content);
  if (state.rootNodeId) navigation.setRootNodeId(state.rootNodeId);
  if (state.viewBox) navigation.setViewBox(state.viewBox);
  setupListeners();
}

init();
