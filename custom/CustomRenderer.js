import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';

import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg';

var COLOR_GREEN = '#52B415',
  COLOR_RED = '#cc0000',
  COLOR_YELLOW = '#ffc800';

/**
 * A renderer that knows how to render custom elements.
 */
export default function CustomRenderer(eventBus, styles, bpmnRenderer) {

  this.bpmnRenderer = bpmnRenderer;
  BaseRenderer.call(this, eventBus, 2000);

  var computeStyle = styles.computeStyle;

  this.drawTriangle = function (p, side) {
    var halfSide = side / 2,
      points,
      attrs;

    points = [halfSide, 0, side, side, 0, side];

    attrs = computeStyle(attrs, {
      stroke: COLOR_GREEN,
      strokeWidth: 2,
      fill: COLOR_GREEN
    });

    var polygon = svgCreate('polygon');

    svgAttr(polygon, {
      points: points
    });

    svgAttr(polygon, attrs);

    svgAppend(p, polygon);

    return polygon;
  };

  this.getTrianglePath = function (element) {
    var x = element.x,
      y = element.y,
      width = element.width,
      height = element.height;

    var trianglePath = [
      ['M', x + width / 2, y],
      ['l', width / 2, height],
      ['l', -width, 0],
      ['z']
    ];

    return componentsToPath(trianglePath);
  };

  this.drawCircle = function (p, width, height) {
    var cx = width / 2,
      cy = height / 2;

    var attrs = computeStyle(attrs, {
      stroke: COLOR_YELLOW,
      strokeWidth: 4,
      fill: COLOR_YELLOW
    });

    var circle = svgCreate('circle');

    svgAttr(circle, {
      cx: cx,
      cy: cy,
      r: Math.round((width + height) / 4)
    });

    svgAttr(circle, attrs);

    svgAppend(p, circle);

    return circle;
  };

  this.drawSubprocess = function (p, width, height, element) {
    var attrs = computeStyle(attrs, {
      stroke: COLOR_YELLOW,
      strokeWidth: 4,
      fill: COLOR_YELLOW
    });

    const bo = element.businessObject;
    if(!bo.$attrs.hasSubProcess || (bo.$attrs.hasSubProcess !== true && bo.$attrs.hasSubProcess !== "true")){
      return;
    }

    var circle = svgCreate('circle');


    circle.addEventListener("click", function () {
      alert('blabla');
    }, false);

    var left = width / 8 * 7;
    svgAttr(circle, {
      cx: left,
      cy: height / 8,
      r: Math.round((width + height) / 16)
    });

    svgAttr(circle, attrs);

    svgAppend(p, circle);

    //experimentation code, not working.
    //idea was to make a svg item clickable so we can navigate for example to a sub process by clicking on it, alternative is to use the context menu, see CustomContextPadProvider
    var svg = circle;
    svg.addEventListener('click', function (e) {
      var c = e.target;
      // while (c !== svg) {
      //   if (c.hasAttribute('id')) {
      //     var id = c.getAttribute('id');

      //     if (handlers.hasOwnProperty(id)) {
      //       handlers[id](c);
      //       break;
      //     }
      //   }
      //   c = c.parentNode;
      // }
      //alert('hoi');
    });

    return circle;
  }

  this.getCirclePath = function (shape) {
    var cx = shape.x + shape.width / 2,
      cy = shape.y + shape.height / 2,
      radius = shape.width / 2;

    var circlePath = [
      ['M', cx, cy],
      ['m', 0, -radius],
      ['a', radius, radius, 0, 1, 1, 0, 2 * radius],
      ['a', radius, radius, 0, 1, 1, 0, -2 * radius],
      ['z']
    ];

    return componentsToPath(circlePath);
  };

  this.drawCustomConnection = function (p, element) {
    var attrs = computeStyle(attrs, {
      stroke: COLOR_RED,
      strokeWidth: 2
    });

    return svgAppend(p, createLine(element.waypoints, attrs));
  };

  this.getCustomConnectionPath = function (connection) {
    var waypoints = connection.waypoints.map(function (p) {
      return p.original || p;
    });

    var connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach(function (waypoint, index) {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };

  var originalDrawShape = this.drawShape;

  this.drawShape = function (parentNode, element) {
    var type = element.type;

    if (type === 'custom:triangle') {
      return this.drawTriangle(parentNode, element.width);
    }

    if (type === 'custom:circle') {
      return this.drawCircle(parentNode, element.width, element.height);
    }

    if (type === 'bpmn:ServiceTask') {

      const shape = this.bpmnRenderer.drawShape(parentNode, element);            
      this.drawSubprocess(parentNode, element.width, element.height, element)
      return shape;
    }

  };


}

inherits(CustomRenderer, BaseRenderer);
//inherits(BpmnRenderer, BaseRenderer);

CustomRenderer.$inject = ['eventBus', 'styles', 'bpmnRenderer'];
//BpmnRenderer.$inject = ['config','eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];


CustomRenderer.prototype.canRender = function (element) {
  return /^custom:/.test(element.type) || element.type === 'bpmn:ServiceTask';
};

CustomRenderer.prototype.getShapePath = function (shape) {
  var type = shape.type;

  if (type === 'custom:triangle') {
    return this.getTrianglePath(shape);
  }

  if (type === 'custom:circle') {
    return this.getCirclePath(shape);
  }
};

CustomRenderer.prototype.drawConnection = function (p, element) {

  var type = element.type;

  if (type === 'custom:connection') {
    return this.drawCustomConnection(p, element);
  }
};


CustomRenderer.prototype.getConnectionPath = function (connection) {

  var type = connection.type;

  if (type === 'custom:connection') {
    return this.getCustomConnectionPath(connection);
  }
};



