import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule} from "bpmn-js-properties-panel";

import EMPTY_DIAGRAM_XML from '../../resources/bpmn/empty.bpmn?raw';

// css
import './app.css';
import '../../node_modules/bpmn-js/dist/assets/bpmn-js.css';
import '../../node_modules/bpmn-js/dist/assets/diagram-js.css';
import '../../node_modules/bpmn-js-properties-panel/dist/assets/properties-panel.css';

const vscode = acquireVsCodeApi();
const container = $('#js-drop-zone');

const modeler = new BpmnModeler({
  container: '#js-canvas',
  keyboard: {
    bindTo: window
  },
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
  ],
});
container.removeClass('with-diagram');

function openDiagram(xml) {

  if (!xml) {
    xml = EMPTY_DIAGRAM_XML;
  }

  importDiagram(xml);
}

async function importDiagram(xml) {
  // Set state when diagram is opened
  vscode.setState({
    text: xml
  });

  try {

    await modeler.importXML(xml);

    container
      .removeClass('with-error')
      .addClass('with-diagram');
  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

async function exportDiagram() {
  return (await modeler.saveXML({ format: true }).xml);
}

// main
$(function() {

  const state = vscode.getState();
  if (state) {
    importDiagram(state.text);
  } else {
    importDiagram(EMPTY_DIAGRAM_XML);
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateFromExtension':
        const xml = message.text;
        openDiagram(xml);
        return;
    }
  });

  const updateExtension = debounce(async function () {

    try {

      exportDiagram()
          .then((text) => {
            // Set state when changes occur
            vscode.setState({
              text: text
            });
            // Send update to extension
            vscode.postMessage({
              type: 'updateFromWebview',
              content: text
            });
          });

    } catch (err) {
      console.error('Error happened saving XML: ', err);
    }
  }, 500);

  modeler.on('commandStack.changed', updateExtension);
});


// helpers //////////////////////
function debounce(fn, timeout) {

  let timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}
