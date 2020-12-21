import * as d3 from 'd3';
import '@/resources/assets/font/tsfont/font/tsfont.js';
import '@/resources/assets/font/tsfonts/iconfont.js';
import '@/resources/plugins/TsTopoNew/js/dagre-d3.js';
import '@/resources/plugins/TsTopoNew/js/topo.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.base.js';
import '@/resources/plugins/TsTopoNew/js/topo.ph.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.process.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.converge.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.start.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.end.js';
import '@/resources/plugins/TsTopoNew/js/topo.group.base.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.base.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.curve.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.forward.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.backward.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.dragging.js';

import '@/resources/plugins/TsTopoNew/js/topo.anchor.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.shape.js';
import '@/resources/plugins/TsTopoNew/js/topo.node.factory.js';
import '@/resources/plugins/TsTopoNew/js/topo.link.factory.js';
import '@/resources/plugins/TsTopoNew/js/topo.css';
import AreaShapeFactory from '@antv/g2/lib/geometry/shape/area';
window.d3 = d3;

var topo = {};
topo.install = function(Vue, options) {
  Vue.$Topo = topo;
};
//注册节点类进节点工厂
const nodeFactory = new NodeFactory();
nodeFactory.addClass(Process);
nodeFactory.addClass(Start);
nodeFactory.addClass(End);
nodeFactory.addClass(Converge);
//注册线类型进连线工厂
const linkFactory = new LinkFactory();
linkFactory.addClass(Forward);
linkFactory.addClass(Backward);
linkFactory.addClass(Dragging);

