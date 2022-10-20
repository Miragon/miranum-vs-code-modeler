import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule} from "bpmn-js-properties-panel";

import EMPTY_DIAGRAM_XML from '../../resources/bpmn/empty.bpmn?raw';

// css
import './app.css';
import '../../node_modules/bpmn-js/dist/assets/bpmn-js.css';
import '../../node_modules/bpmn-js/dist/assets/diagram-js.css';
import '../../node_modules/bpmn-js-properties-panel/dist/assets/properties-panel.css';

// Only for developing
const ENVIROMENTS = {
    Browser: 'browser',
    VsCode: 'vscode'
};
const ENV = ENVIROMENTS.VsCode;

const container = $('#js-drop-zone');
let vscode;
let textarea;

if (ENV === 'vscode') {
    vscode = acquireVsCodeApi();
} else if (ENV === 'browser') {
    const simulator = document.createElement('div');  // simulates vscode respectively the document
    textarea = document.createElement('textarea');
    const style = document.createElement('style');

    simulator.className = 'simulator';
    textarea.className = 'editor';
    style.textContent = `
       .content {
           height: 70%;
       }
       .simulator {
           width: 100%;
           height: 30%;
       }
       .editor {
           width: 100%;
           height: 100%;
           resize: none;
       }
    `;

    simulator.appendChild(style);
    simulator.appendChild(textarea);
    document.body.appendChild(simulator);
}


const modeler = new BpmnModeler({
    container: '#js-canvas', keyboard: {
        bindTo: document
    },
    propertiesPanel: {
        parent: '#js-properties-panel'
    },
    additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule
    ]
});
container.removeClass('with-diagram');

async function importDiagram(xml) {

    if (!xml) {
        xml = EMPTY_DIAGRAM_XML;
    }

    if (ENV === 'vscode') {
        // Set state when diagram is opened
        vscode.setState({
            text: xml
        });
    }

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
    return (await modeler.saveXML({format: true}));
}

// main
$(function () {

    if (ENV === 'vscode') {
        const state = vscode.getState();
        if (state) {
            importDiagram(state.text);
        } else {
            importDiagram();
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.type) {
                case 'bpmn-modeler.updateFromExtension':
                    const xml = message.text;
                    importDiagram(xml);
                    return;
            }
        });

    } else if (ENV === 'browser') {
        importDiagram();
    }

    const updateExtension = debounce(async function () {

        try {

            exportDiagram()
                .then((content) => {
                    if (ENV === 'vscode') {
                        // Set state when changes occur
                        vscode.setState({
                            text: content.xml
                        });
                        // Send update to extension
                        vscode.postMessage({
                            type: 'bpmn-modeler.updateFromWebview', content: content.xml
                        });
                    } else if (ENV === 'browser') {
                        textarea.value = content.xml;
                    }
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

    return function () {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(fn, timeout);
    };
}