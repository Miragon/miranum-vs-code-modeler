import {SelectEntry, isSelectEntryEdited} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";
import { without } from 'min-dash';
import {createElement} from "camunda-bpmn-js-behaviors/lib/util/ElementUtil";

export default function(element) {
  return [
    {
      id: 'inputParameter',
      element,
      component: Form,
      isEdited: isSelectEntryEdited
    }
  ];
}

function Form(props) {
  const { element, id } = props;
  const modeling = useService('modeling');
  const bpmnFactory = useService('bpmnFactory')
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.form || '';
  };

  const setValue = (value) => {
    const property = {
      value: value,
      binding: {
        type: 'camunda:inputParameter',
        name: 'app_task_schema_key'
      }
    }

    if (value) {
      addInputParameter(element, property, bpmnFactory, modeling);
    } else {
      removeInputParameter(element, property.binding, modeling);
    }
  };

  //fetch forms (from window variable) and fill Forms with it
  const [ forms, setForms ] = useState([]);
  useEffect(() => {
     setForms(window.forms);
  }, [ setForms ]);

  const getOptions = () => {
    return [
      { label: '<none>', value: undefined },
      ...forms.map(form => ({
        label: form,
        value: form
      }))
    ];
  };

  return SelectEntry({
    element,
    id: {id},
    label: translate('Choose your Form'),
    getOptions,
    getValue,
    setValue,
    debounce
  });
}


function addInputParameter(element, property, bpmnFactory, modeling) {
  const {
    binding,
    value
  } = property;

  const businessObject = getBusinessObject(element); //alternativ: element.businessObject
  const extensionElements = businessObject.get('extensionElements');
  const inputOutput = findExtension(businessObject, 'camunda:InputOutput');
  let updatedBusinessObject, update;

  if (!extensionElements) {
    updatedBusinessObject = businessObject;

    const extensionElements = createExtensionElements(businessObject, bpmnFactory),
        inputOutput = createInputOutput(binding, value, bpmnFactory, extensionElements);
    extensionElements.values.push(inputOutput);

    update = { extensionElements };
  } else if (!inputOutput) {
    updatedBusinessObject = extensionElements;

    const inputOutput = createInputOutput(binding, value, bpmnFactory, extensionElements);

    update = { values: extensionElements.get('values').concat(inputOutput) };
  } else {
    updatedBusinessObject = inputOutput;

    const inputParameter = createInputParameter(binding, value, bpmnFactory);
    inputParameter.$parent = inputOutput;

    update = { inputParameters: inputOutput.get('camunda:inputParameters').concat(inputParameter) };
  }
  modeling.updateModdleProperties(element, updatedBusinessObject, update);
}


function removeInputParameter(element, binding, modeling) {
  const businessObject = getBusinessObject(element);

  const inputOutput = findExtension(businessObject, 'camunda:InputOutput'),
      inputParameters = inputOutput.get('camunda:inputParameters');

  const inputParameter = findInputParameter(inputOutput, binding);

  modeling.updateModdleProperties(element, inputOutput, {
    inputParameters: without(inputParameters, inputParameter)
  });
}


//     -----------------------------HELPERS-----------------------------     \\

function createExtensionElements(businessObject, bpmnFactory) {
  return createElement(
      'bpmn:ExtensionElements',
      { values: [] },
      businessObject,
      bpmnFactory
  );
}

function createInputOutput(binding, value, bpmnFactory, extensionElements) {
  const inputParameter = createInputParameter(binding, value, bpmnFactory);
  const inputOutput = createElement('camunda:InputOutput', {
    inputParameters: [ inputParameter ],
    outputParameters: []
  }, extensionElements, bpmnFactory);

  inputParameter.$parent = inputOutput;
  return inputOutput;
}

/**
 * Create an input parameter representing the given
 * binding and value.
 *
 * @param {PropertyBinding} binding
 * @param {String} value
 * @param {BpmnFactory} bpmnFactory
 *
 * @return {ModdleElement}
 */
export function createInputParameter(binding, value, bpmnFactory) {
  const {
    name,
    scriptFormat
  } = binding;

  let parameterValue,
      parameterDefinition;

  if (scriptFormat) {
    parameterDefinition = bpmnFactory.create('camunda:Script', {
      scriptFormat,
      value
    });
  } else {
    parameterValue = value;
  }

  return bpmnFactory.create('camunda:InputParameter', {
    name,
    value: parameterValue,
    definition: parameterDefinition
  });
}

/**
 * Find extension with given type in
 * BPMN element, diagram element or ExtensionElement.
 *
 * @param {ModdleElement|djs.model.Base} element
 * @param {String} type
 *
 * @return {ModdleElement} the extension
 */
export function findExtension(element, type) {
  const businessObject = getBusinessObject(element);

  let extensionElements;

  if (is(businessObject, 'bpmn:ExtensionElements')) {
    extensionElements = businessObject;
  } else {
    extensionElements = businessObject.get('extensionElements');
  }

  if (!extensionElements) {
    return null;
  }

  return extensionElements.get('values').find((value) => {
    return is(value, type);
  });
}

export function findInputParameter(inputOutput, binding) {
  const parameters = inputOutput.get('inputParameters');

  return parameters.find((parameter) => {
    return parameter.name === binding.name;
  });
}