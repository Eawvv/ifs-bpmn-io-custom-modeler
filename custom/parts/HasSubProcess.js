'use strict';

var entryFactory = require('../EntryFactory'),
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    utils = require('../Utils'),
    cmdHelper = require('../CmdHelper');

module.exports = function(group, element, translate, options) {
  if (!options) {
    options = {};
  }

  var description = options && options.description;

  //DTO: Render props dynamically based on $attrs collection of business object
  const bo = getBusinessObject(element);
  if(bo != null && bo.$attrs != null)
  {
    for(var propertyName in bo.$attrs) {
        const propName = propertyName;
        if(propName != 'type'){
            group.entries.push(entryFactory.validationAwareTextField(translate, {
                id: propName, //options.id || 'false',
                label: translate(propName),
                description: 'bla bla description ' +propName ,
                modelProperty: propName,
                getProperty: function(element) {
                  return getBusinessObject(element).$attrs[propName];
                },
                setProperty: function(element, properties) {
            
                  element = element.labelTarget || element;                  
                  return cmdHelper.updateProperties(element, properties);
                },
                validate: function(element, values) {
                  return true;
                }
              }));
        }
     }
  }  

};
