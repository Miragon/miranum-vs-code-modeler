import spellProps from './parts/SpellProps';
import {is} from 'bpmn-js/lib/util/ModelUtil';
//import { useTranslation } from "react-i18next";

const LOW_PRIORITY = 500;
//const { t } = useTranslation("default");

/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function FormSimpProvider(propertiesPanel, translate) {

  // API ////////

  /**
   * Return the groups provided for the given element.
   *
   * @param {DiagramElement} element
   *
   * @return {(Object[]) => (Object[])} groups middleware
   */
  this.getGroups = function(element) {

    /**
     * We return a middleware that modifies
     * the existing groups.
     *
     * @param {Object[]} groups
     *
     * @return {Object[]} modified groups
     */
    return function(groups) {

      // Add the "form" group
      if(is(element, 'bpmn:Process')) {
        groups.push(createFormGroup(element, translate));
      }
      return groups;
    };
  };


  // registration ////////

  // Register our custom form properties provider.
  // Use a lower priority to ensure it is loaded after
  // the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

FormSimpProvider.$inject = [ 'propertiesPanel', 'translate' ];

// Create the custom form group
function createFormGroup(element, translate) {
  return {
    id: 'formSimp',
    label: translate('Form simplifier'),
    entries: spellProps(element)
  };
}