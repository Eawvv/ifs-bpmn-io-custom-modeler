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

  // Id
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: options.id || 'id',
    label: translate('Id'),
    description: description && translate(description),
    modelProperty: 'id',
    getProperty: function(element) {
      return getBusinessObject(element).id;
    },
    setProperty: function(element, properties) {

      element = element.labelTarget || element;

      return cmdHelper.updateProperties(element, properties);
    },
    validate: function(element, values) {
      var idValue = values.id;

      var bo = getBusinessObject(element);

      var idError = utils.isIdValid(bo, idValue, translate);

      return idError ? { id: idError } : {};
    }
  }));

};