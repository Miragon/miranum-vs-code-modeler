import {SelectEntry, isSelectEntryEdited} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

// import hooks from the vendored preact package
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';

export default function(element) {

  return [
    {
      id: 'formKey',
      element,
      component: Form,
      isEdited: isSelectEntryEdited
    }
  ];
}

function Form(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');


  const getValue = () => {
    return element.businessObject.form || '';
  };

  const setValue = value => {
    return modeling.updateProperties(element, {
      formKey: value
    });
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
    getValue,
    setValue,
    getOptions,
    debounce
  });

  //Original example:
  // return `<TextFieldEntry
  //   id={ id }
  //   element={ element }
  //   description={ translate('Choose your form') }
  //   label={ translate('Form') }
  //   getValue={ getValue }
  //   setValue={ setValue }
  //   getOptions={ getOptions }
  //   debounce={ debounce }
  //   />`;
}
