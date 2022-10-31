import {SelectEntry, isSelectEntryEdited} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

// import hooks from the vendored preact package
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import {getBusinessObject, is} from "bpmn-js/lib/util/ModelUtil";


export default function(element) {

  return [
    {
      id: 'spell',
      element,
      component: Spell,
      isEdited: isSelectEntryEdited
    }
  ];
}

function Spell(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');


  const getValue = () => {
    return element.businessObject.spell || '';
  };

  const setValue = value => {
    return modeling.updateProperties(element, {
      spell: value
    });
  };

  const [ spells, setSpells ] = useState([]);

  useEffect(() => {
    function fetchSpells() {
      fetch('http://localhost:1234/spell')
        .then(res => res.json())
        .then(spellbook => setSpells(spellbook))
        .catch(error => console.error(error));
    }

    fetchSpells();
  }, [ setSpells ]);

  const getOptions = () => {
    return [
      { label: '<none>', value: undefined },
      ...spells.map(spell => ({
        label: spell,
        value: spell
      }))
    ];
  };

  return SelectEntry({
    element,
    id: 'formType',
    label: translate('Choose your Form'),
    getValue,
    setValue,
    getOptions
  });

  //Original example:
  // return `<TextFieldEntry
  //   id={ id }
  //   element={ element }
  //   description={ translate('Choose your form') }
  //   label={ translate('Spell') }
  //   getValue={ getValue }
  //   setValue={ setValue }
  //   getOptions={ getOptions }
  //   debounce={ debounce }
  //   />`;
}
