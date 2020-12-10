import {
  assign,
  forEach
} from 'min-dash';

import inherits from 'inherits';
import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import BpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import {
  DEFAULT_LABEL_SIZE
} from 'bpmn-js/lib/util/LabelUtil';


/**
 * A custom factory that knows how to create BPMN _and_ custom elements.
 */
export default function CustomElementFactory(bpmnFactory, moddle) {
  BpmnElementFactory.call(this, bpmnFactory, moddle);

  var self = this;

  var originalCreateShape = this.createShape;
  this.createShape = function(attrs) {

    return originalCreateShape.call(this, attrs);
  }





  this.createBpmnElement = function(elementType, attrs) {
    var size,
        translate = this._translate;
  
    attrs = attrs || {};
  
    var businessObject = attrs.businessObject;
  
    if (!businessObject) {
      if (!attrs.type) {
        throw new Error(translate('no shape type specified'));
      }
  
      businessObject = this._bpmnFactory.create(attrs.type, attrs);
    }
  
    if (!businessObject.di) {
      if (elementType === 'root') {
        businessObject.di = this._bpmnFactory.createDiPlane(businessObject, [], {
          id: businessObject.id + '_di'
        });
      } else
      if (elementType === 'connection') {
        businessObject.di = this._bpmnFactory.createDiEdge(businessObject, [], {
          id: businessObject.id + '_di'
        });
      } else {
        businessObject.di = this._bpmnFactory.createDiShape(businessObject, {}, {
          id: businessObject.id + '_di'
        });
      }
    }
  
    if (attrs.colors) {
      assign(businessObject.di, attrs.colors);
  
      delete attrs.colors;
    }
  
    applyAttributes(businessObject, attrs, [
      'processRef',
      'isInterrupting',
      'associationDirection',
      'isForCompensation'
    ]);
  
    if (attrs.isExpanded) {
      applyAttribute(businessObject.di, attrs, 'isExpanded');
    }
  
    if (is(businessObject, 'bpmn:ExclusiveGateway')) {
      businessObject.di.isMarkerVisible = true;
    }
  
    var eventDefinitions,
        newEventDefinition;
  
    if (attrs.eventDefinitionType) {
      eventDefinitions = businessObject.get('eventDefinitions') || [];
      newEventDefinition = this._moddle.create(attrs.eventDefinitionType);
  
      if (attrs.eventDefinitionType === 'bpmn:ConditionalEventDefinition') {
        newEventDefinition.condition = this._moddle.create('bpmn:FormalExpression');
      }
  
      eventDefinitions.push(newEventDefinition);
  
      newEventDefinition.$parent = businessObject;
      businessObject.eventDefinitions = eventDefinitions;
  
      delete attrs.eventDefinitionType;
    }
  
    size = this._getDefaultSize(businessObject);
  
    attrs = assign({
      businessObject: businessObject,
      id: businessObject.id
    }, size, attrs);
  
    return this.baseCreate(elementType, attrs);
  };

  function applyAttributes(element, attrs, attributeNames) {

    forEach(attributeNames, function(property) {
      if (attrs[property] !== undefined) {
        applyAttribute(element, attrs, property);
      }
    });
  }







  /**
   * Create a diagram-js element with the given type (any of shape, connection, label).
   *
   * @param  {String} elementType
   * @param  {Object} attrs
   *
   * @return {djs.model.Base}
   */
  this.create = function(elementType, attrs) {
    var type = attrs.type;

    if (elementType === 'label') {
      return self.baseCreate(elementType, assign({ type: 'label' }, DEFAULT_LABEL_SIZE, attrs));
    }

    // add type to businessObject if custom
    if (/^custom:/.test(type)) {
      if (!attrs.businessObject) {
        attrs.businessObject = {
          type: type
        };

        if (attrs.id) {
          assign(attrs.businessObject, {
            id: attrs.id
          });
        }
      }

      // add width and height if shape
      if (!/:connection$/.test(type)) {
        assign(attrs, self._getCustomElementSize(type));
      }


      // we mimic the ModdleElement API to allow interoperability with
      // other components, i.e. the Modeler and Properties Panel

      if (!('$model' in attrs.businessObject)) {
        Object.defineProperty(attrs.businessObject, '$model', {
          value: moddle
        });
      }

      if (!('$instanceOf' in attrs.businessObject)) {
        // ensures we can use ModelUtil#is for type checks
        Object.defineProperty(attrs.businessObject, '$instanceOf', {
          value: function(type) {
            return this.type === type;
          }
        });
      }

      if (!('get' in attrs.businessObject)) {
        Object.defineProperty(attrs.businessObject, 'get', {
          value: function(key) {
            return this[key];
          }
        });
      }

      if (!('set' in attrs.businessObject)) {
        Object.defineProperty(attrs.businessObject, 'set', {
          value: function(key, value) {
            return this[key] = value;
          }
        });
      }

      // END minic ModdleElement API

      return self.baseCreate(elementType, attrs);
    }

    return self.createBpmnElement(elementType, attrs);
  };
}

inherits(CustomElementFactory, BpmnElementFactory);

CustomElementFactory.$inject = [
  'bpmnFactory',
  'moddle'
];


/**
 * Returns the default size of custom shapes.
 *
 * The following example shows an interface on how
 * to setup the custom shapes's dimensions.
 *
 * @example
 *
 * var shapes = {
 *   triangle: { width: 40, height: 40 },
 *   rectangle: { width: 100, height: 20 }
 * };
 *
 * return shapes[type];
 *
 *
 * @param {String} type
 *
 * @return {Dimensions} a {width, height} object representing the size of the element
 */
CustomElementFactory.prototype._getCustomElementSize = function(type) {
  var shapes = {
    __default: { width: 100, height: 80 },
    'custom:triangle': { width: 40, height: 40 },
    'custom:circle': { width: 140, height: 140 }
  };

  return shapes[type] || shapes.__default;
};
