import formSimpStartProps from './parts/FormSimpStartProps';
import formSimpUserProps from './parts/FormSimpUserProps';
import {is} from 'bpmn-js/lib/util/ModelUtil';
import {findIndex} from "min-dash";

const LOW_PRIORITY = 500;

/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function MiragonProvider(propertiesPanel, translate) {

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

      // Add the "form" group for StartEvent
      if(is(element, 'bpmn:StartEvent')) {
        groups.push(createStartFormGroup(element, translate));
      }
      // Add the "form" group for UserTasks
      if(is(element, 'bpmn:UserTask')) {
        groups.push(createUserFormGroup(element, translate));
      }
      return groups;
    };
  };

  /**
   * Remove the original Form property
   *
   * @param element
   * @returns {function(*): *}
   */
  // this.getTabs = function (element) {
  //   return function (entries) {
  //     // Remove a tab
  //     const idx = findEntry(entries, "Form")
  //     entries.splice(idx, 1);
  //     return entries;
  //   };
  //   element.getEntriesByName("Form");
  // };

  // registration ////////
  // Use a lower priority to ensure it is loaded after the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

MiragonProvider.$inject = [ 'propertiesPanel', 'translate' ];

// Create the custom groups
// due to prefix 'ElementTemplates__' it will stay displayed even with templates active
function createStartFormGroup(element, translate) {
  return {
    id: 'ElementTemplates__formSimplifier',
    label: translate('Form simplifier'),
    entries: formSimpStartProps(element)
  };
}

function createUserFormGroup(element, translate) {
  return {
    id: 'ElementTemplates__formSimplifier',
    label: translate('Form simplifier'),
    entries: formSimpUserProps(element)
  };
}


//  ---------------------HELPERS---------------------  \\
function findEntry(entries, entryId) {
  return findIndex(entries, (e) => e.id === entryId);
}