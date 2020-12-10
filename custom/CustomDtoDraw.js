'use strict';

var inherits = require('inherits');

var is = require('bpmn-js/lib/util/ModelUtil').is;

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var BpmnRenderer = require('bpmn-js/lib/draw/BpmnRenderer');

var svgAttr = require('tiny-svg/lib/attr');


function CustomDtoDraw(eventBus, styles, pathMap, canvas, priority) {

    BpmnRenderer.call(this, eventBus, styles, pathMap, canvas, priority || 1200);


    var originalDrawShape = this.drawShape;

    this.drawShape = function (visuals, element) {

        var bo, color;

        var result = originalDrawShape.call(this, visuals, element);


        var originalDrawShape = this.drawShape;



        var result = originalDrawShape.call(this, p, element);        

        if (is(element, 'bpmn:ServiceTask')) {
            bo = getBusinessObject(element);
            color = bo.get('tp:color');

            if (color) {
                svgAttr(result, 'fill', color);
            }
        }

        return result;
    };
}

inherits(CustomDtoDraw, BpmnRenderer);

CustomDtoDraw.$inject = [
    'eventBus',
    'styles',
    'pathMap',
    'canvas'
];

module.exports = CustomDtoDraw;