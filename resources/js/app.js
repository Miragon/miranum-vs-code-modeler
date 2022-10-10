import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
// import {
//   BpmnPropertiesPanelModule,
//   BpmnPropertiesProviderModule,
// } from 'bpmn-js-properties-panel';
import EMPTY_DIAGRAM_XML from "../../lib/ts/empty.bpmn?raw";

const vscode = acquireVsCodeApi();

//var container = $('#js-drop-zone');

var modeler = new BpmnModeler({
  container: '#js-canvas',
  keyboard: {
    bindTo: window
  },
  // propertiesPanel: {
  //   parent: '#js-properties-panel'
  // },
  // additionalModules: [
  //   BpmnPropertiesPanelModule,
  //   BpmnPropertiesProviderModule
  // ]
});
const container = modeler.container;

async function openDiagram(xml) {
  if (!xml) {
    await loadDiagram(EMPTY_DIAGRAM_XML);
    sendChanges();
  } else {
    await loadDiagram(xml);
    vscode.setState({ xml });
  }
  vscode.setState({ xml });

  // try {
  //   await modeler.importXML(xml);
  //   container
  //     .removeClass('with-error')
  //     .addClass('with-diagram');
  // } catch (err) {
  //   container
  //     .removeClass('with-diagram')
  //     .addClass('with-error');
  //   container.find('.error pre').text(err.message);
  //   console.error(err);
  // }
}

async function loadDiagram(content) {
  try {
    const { warnings } = await modeler.importXML(content);
    if (warnings && warnings.length) console.warn(warnings);
  } catch (err) {
    throw err;
  }
}

function sendChanges() {
  (modeler.saveXML({ format: true })).xml.then((text) => {
    sendUpdateXML(text);
    vscode.setState({ content: text });
  });
}

function sendUpdateXML(xml) {
  vscode.postMessage({
    type: "updateXML",
    text: xml,
  });
}

$(function() {

  const vscode = acquireVsCodeApi();
  let xml = '';

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateFromExtension':
        xml = message.text;
        openDiagram(xml);
        return;
      case 'loadXML':
        break;
    }
  });

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    openDiagram(xml);
  });

  var downloadLink = $('#js-download-diagram');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(async function() {

    try {
      const { xml } = await modeler.saveXML({ format: true });
      setEncoded(downloadLink, 'diagram.bpmn', xml);

      vscode.postMessage({
        type: 'updateFromWebview',
        content: xml 
      });
    } catch (err) {

      console.error('Error happened saving XML: ', err);
      setEncoded(downloadLink, 'diagram.bpmn', null);
    }
  }, 500);

  // $(document).ready(function() {
  //   initialised = true;
  // });

  modeler.on('commandStack.changed', exportArtifacts);
});

async function init() {
  const state = new Promise((resolve) => {
    // Loading from cache
    const state = vscode.getState() ?? {};
    if (state.initialized) {
      return resolve(state);
    }

    // Loading from file
    const controller = new AbortController();
    window.addEventListener(
      "message",
      async (event) => {
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

  await openDiagram(state.content);
  if (state.rootNodeId) navigation.setRootNodeId(state.rootNodeId);
  if (state.viewBox) navigation.setViewBox(state.viewBox);
  setupListeners();
}

init();

// helpers //////////////////////
function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}
