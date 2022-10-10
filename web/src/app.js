import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule} from "bpmn-js-properties-panel";

import EMPTY_DIAGRAM_XML from '../../resources/bpmn/empty.bpmn?raw';

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

function createNewDiagram(xml) {

  if (!xml) {
    xml = EMPTY_DIAGRAM_XML;
  }

  openDiagram(xml);
}

async function openDiagram(xml) {
  vscode.setState({
    text: xml
  });

  console.log('openDiagram', xml);

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

$(function() {

  const state = vscode.getState();
  let xml = '';

  if (state) {
    xml = state.text;
    openDiagram(xml);
  } else {
    xml = EMPTY_DIAGRAM_XML;
    openDiagram(xml);
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateFromExtension':
        xml = message.text;
        createNewDiagram(xml);
        return;
    }
  });

  const exportArtifacts = debounce(async function () {

    try {

      const {xml} = await modeler.saveXML({format: true});

      vscode.setState({
        text: xml
      });

      vscode.postMessage({
        type: 'updateFromWebview',
        content: xml
      });

    } catch (err) {
      console.error('Error happened saving XML: ', err);
    }
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);
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
