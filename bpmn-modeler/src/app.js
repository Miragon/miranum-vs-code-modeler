import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule} from "bpmn-js-properties-panel";

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
  openDiagram(xml);
}

async function openDiagram(xml) {

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

  //const vscode = acquireVsCodeApi();
  let xml = '';

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateFromExtension':
        xml = message.text;
        return;
    }
  });

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram(xml);
  });

  const downloadLink = $('#js-download-diagram');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    const encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  const exportArtifacts = debounce(async function () {

    try {

      const {xml} = await modeler.saveXML({format: true});
      setEncoded(downloadLink, 'diagram.bpmn', xml);
    } catch (err) {

      console.error('Error happened saving XML: ', err);
      setEncoded(downloadLink, 'diagram.bpmn', null);
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
