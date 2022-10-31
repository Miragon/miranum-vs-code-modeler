// Import your custom property entries.
// The entry is a text input field with logic attached to create,
// update and delete the "spell" property.
import spellProps from './parts/SpellProps';

import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


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

  // create a group called "Formsimplifier".
  const formGroup = {
    id: 'formSimp',
    label: translate('Formsimplifier'),
    entries: spellProps(element)
  };

  return formGroup;
}