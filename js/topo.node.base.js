const { Select } = require('view-design');

/**topo节点的基础类，所有节点class都要extends此类**/
(function(global, factory) {
  factory((global.NodeBase = global.NodeBase || {}), global);
})(window, function(exports, global) {
  'use strict';
  class NodeBase {
    constructor(canvas, config) {
      if (!canvas) {
        console.error('请定义画布');
        return;
      }
      if (!config) {
        console.error('请提供节点定义');
        return;
      }
     
      if (!config.type) {
        console.error('请定义节点类型');
        return; 
      }
      canvas.nodes.push(this); //将自己添加到画布节点列表里
      this.config = config; //保存原始设置
      //两下划线开头的属性，代表需要在tojson中序列化，单下划线只是代表私有属性，执行过程中不会被修改，不需要序列化
      this.status = { selected: false }; //状态
      this.anchors = []; //连接点对象
      this.links = []; //连线对象
      this.group = null;//所属分组
      this.getSet = {}; //存储属性旧值，方便比对
      this.getSetConfig = {}; //存储旧config值
      this.canvas = canvas; //画布对象
      this._anchorList = [{ position: 'L' }, { position: 'R' }, { position: 'T' }, { position: 'B' }]; //连线点列表，默认上下左右四个锚点
      this._size = 26; //尺寸
      this._cx = 0;
      this._cy = 0;
      this._rx = 0;//圆角
      this._ry = 0;
      this._dx = 0;//拖动时偏移x坐标
      this._dy = 0;//拖动时偏移y坐标
      this._shape = null;//形状
      this._padding = 10;
      this._borderradius = 3; //边框圆角幅度
      this._strokewidth = 1; //边框宽度
      this._needShadow = true;//是否需要阴影
      this._isSelectable = (typeof canvas.config['node.selectable'] == 'undefined') ? true : canvas.config['node.selectable']; //是否允许选中
      this._isDragable = (typeof canvas.config['node.dragable'] == 'undefined') ? true : canvas.config['node.dragable']; //是否允许拖拽
      this._isDeleteable = (typeof canvas.config['node.deleteable'] == 'undefined') ? true : canvas.config['node.deleteable'];//是否允许删除
      this._isConnectable = (typeof canvas.config['node.connectable'] == 'undefined') ? true : canvas.config['node.connectable'];//是否允许连线
      this._fontfamily = 'ts'; //图标字体
      this._iconsize = config.iconsize || canvas.config['node.iconsize'] || 18; //节点图标大小
      this._width = 0;//节点宽度
      this._height = 0; //节点高度
      this.__uuid = config.uuid || Topo.generateUuid(); //唯一id
      if (!this.config.uuid) {
        this.config.uuid = this.__uuid;
      }
      this.__x = config.x || 0; //x坐标
      this.__y = config.y || 0; //y坐标
      this.__group = config.group; //分组uuid
      this.__icon = config.icon || canvas.config['node.icon']; //节点图标
      this.__iconcolor = config.iconcolor || canvas.config['node.iconcolor']; //节点图标颜色
      this.__fill = config.fill || canvas.config['node.fill']; //节点填充颜色
      this.__stroke = config.stroke || canvas.config['node.stroke']; //节点边框颜色
      this.__loadingcolor = config.loadingcolor;//loading效果颜色，为空时不显示loading
      this.__class = canvas.config['node.class'] || ''; //节点样式
      this.__name = config.name; //节点名称
      this.__config = config.config; //节点个性化数据

      //动态创建所有get set函数
      for (const k in this) {
        if (k.startsWith('__')) {
          let pname = k.substr(2);
          pname = pname.replace(pname[0], pname[0].toUpperCase());
          this['get' + pname] = function() {
            return this[k];
          };
          this['set' + pname] = function(value) {
            this[k] = value;
            return this;
          };
        } else if (k.startsWith('_')) {
          let pname = k.substr(1);
          pname = pname.replace(pname[0], pname[0].toUpperCase());
          this['get' + pname] = function() {
            return this[k];
          };
          this['set' + pname] = function(value) {
            this[k] = value;
            return this;
          };
        }
      }
      //设置属性双向绑定
      this.initBinding();
    }
    //生成节点
    draw() {
      if (this.el) {
        return;
      }
      //设置连线点，由于子类会覆盖anchorList，所以不能放构造函数里
      if (this.getAnchorList() && this.getAnchorList().length > 0) {
        this.getAnchorList().forEach(element => {
          this.anchors.push(new Anchor(this.canvas, this, element));
        });
      }

      const canvasEl = this.canvas.zoomG; //在zoomG里创建所有元素
      this.el = canvasEl.append('g');
      this.el.datum(this);
      this.el
        .classed('nodeG', true)
        .classed(this.getClass(), true)
        .attr('cursor', 'pointer');
      this.initEvent();

      //重新设置一遍属性，触发PH set方法进行绘制
      for (var k in this.getSet) {
        this[k] = this.getSet[k];
      }

      //绘制连接点
      if (this.anchors && this.anchors.length) {
        //一定要先创建anchorG，anchor的draw方法需要在里面绘制连接点
        this.anchorG = this.el.append('g');
        this.anchorG.attr('class', 'anchorG');
        this.anchors.forEach(element => {
          element.draw();
        });
      }
    }
    selectedFn() {
      if (typeof this.canvas.config['node.selectedFn'] == 'function') {
        this.canvas.config['node.selectedFn'](this);
      }
    } //选中后函数
    unselectFn() {
      if (typeof this.canvas.config['node.unselectFn'] == 'function') {
        this.canvas.config['node.unselectFn'](this);
      } 
    } //取消选中后函数
    clickFn() {
      if (typeof this.canvas.config['node.clickFn'] == 'function') {
        this.canvas.config['node.clickFn'](this);
      }
    } //鼠标进入函数
    mouseenterFn() {
      if (typeof this.canvas.config['node.mouseenterFn'] == 'function') {
        this.canvas.config['node.mouseenterFn'](this);
      }
    } //鼠标离开函数
    mouseleaveFn() {
      if (typeof this.canvas.config['node.mouseleaveFn'] == 'function') {
        this.canvas.config['node.mouseleaveFn'](this);
      }
    } 
    removeFn() {
      if (typeof this.canvas.config['node.removeFn'] == 'function') {
        this.canvas.config['node.removeFn'](this);
      }
    } 
    select() {
      this.canvas.links.forEach(element => {
        element.unselect();
      });
      this.canvas.nodes.forEach(element => {
        if (element != this) {
          element.unselect();
        }
      });
      if (!this.shapeElSelected) {
        const box = this.el.node().getBBox();
        this.shapeElSelected = this.el
          .append('rect')
          .attr('class', 'select')
          .attr('transform', 'scale(1.3)')
          .attr('fill', 'transparent')
          .attr('width', box.width)
          .attr('height', box.height)
          .attr('x', box.x)
          .attr('y', box.y);
      }
      if (!this.status.selected) {
        if (this.selectedFn && typeof this.selectedFn == 'function') {
          this.selectedFn();
        }
        this.status.selected = true;
      }
    }
    unselect() {
      if (this.shapeElSelected) {
        this.shapeElSelected.remove();
        this.shapeElSelected = null;
      }
      if (this.status.selected) {
        if (this.unselectFn && typeof this.unselectFn == 'function') {
          this.unselectFn();
        }
        this.status.selected = false;
      }
    }
    onClick(d) {
      d3.event.stopPropagation();
      if (this.clickFn && typeof this.clickFn === 'function') {
        this.clickFn(d);
      }
    }
    onMouseenter(d) {
      if (d.mouseenterFn && typeof d.mouseenterFn === 'function') {
        d.mouseenterFn(d);
      }
      if (this.getIsConnectable()) {
        if (d.anchors && d.anchors.length > 0) {
          d.anchors.forEach(element => {
            element.el.dispatch('active');
          });
        }
      }
    }
    onMouseover(d) {
      if (this.getIsConnectable()) {
        if (d.anchors && d.anchors.length > 0) {
          d.anchors.forEach(element => {
            element.el.dispatch('active');
          });
        }
      }
    }
    onMouseleave(d) {
      if (this.mouseleaveFn && typeof this.mouseleaveFn === 'function') {
        this.mouseleaveFn(d);
      }
      if (this.anchors && this.anchors.length > 0) {
        this.anchors.forEach(element => {
          element.el.dispatch('unactive');
        });
      }
    }
    onDragstart() {
      this.currentX = this.getX();
      this.currentY = this.getY();
      if (this.group) {
        this.group.draggingNode = this;//设置拖动节点，分组移动时忽略当前分组
      }
    }
    onDrag() {
      this.setDx(d3.event.dx);
      this.setDy(d3.event.dy);
      //如果属于分组，则拖动整个分组
      if (this.group) {
        this.group.setDx(d3.event.dx);
        this.group.setDy(d3.event.dy);
      }
      
      if (this.canvas.getIsAutoAdjust()) {
        //寻找最接近的节点，如果符合接近距离，则显示对齐辅助线
        const offset = 10;
        let targetX = null;
        let targetY = null;
        let minX = offset;
        let minY = offset;
        this.canvas.nodes.forEach(node => {
          if (node !== this) {
            const tx = Math.abs(this.getX() - node.getX());
            const ty = Math.abs(this.getY() - node.getY());
            if (tx <= minX) {
              minX = tx;
              targetX = node;
            }
            if (ty <= minY) {
              minY = ty;
              targetY = node;
            }
          }
        });
        if (targetX) {
        // 添加对齐辅助线
          if (!this.alignPathX) {
            this.alignPathX = this.canvas.zoomG
              .append('path')
              .attr('stroke-width', 1)
              .attr('class', 'alignPath')
              .attr('stroke-dasharray', '3,4')
              .attr('stroke', 'black')
              .attr('stroke-opacity', 0.5)
              .attr('fill', 'none')
              .attr('d', 'M0,-99999V99999');
          }
          this.alignPathX.attr('transform', `translate(${targetX.getX()}, 0)`);
          this.alignPathX.datum({ x: targetX.getX() });
        } else {
          if (this.alignPathX) {
            this.alignPathX.remove();
            this.alignPathX = null;
          }
        }
        if (targetY) {
          if (!this.alignPathY) {
            this.alignPathY = this.canvas.zoomG
              .append('path')
              .attr('stroke-width', 1)
              .attr('class', 'alignPath')
              .attr('stroke-dasharray', '3,4')
              .attr('stroke', 'black')
              .attr('stroke-opacity', 0.5)
              .attr('fill', 'none')
              .attr('d', 'M-99999,0H99999');
          }
          this.alignPathY.attr('transform', `translate(0, ${targetY.getY()})`);
          this.alignPathY.datum({ y: targetY.getY() });
        } else {
          if (this.alignPathY) {
            this.alignPathY.remove();
            this.alignPathY = null;
          }
        }
      }
    }
    onDragend() {
      if (this.alignPathX) {
        const data = this.alignPathX.datum();
        this.alignPathX.remove();
        this.alignPathX = null;
        this.setX(data.x);
        //重绘所有连线
        this.links.forEach(link => {
          link.updatePath();
        });
      }
      if (this.alignPathY) {
        const data = this.alignPathY.datum();
        this.alignPathY.remove();
        this.alignPathY = null;
        this.setY(data.y);
        //重绘所有连线
        this.links.forEach(link => {
          link.updatePath();
        });
      }
      //如果属于分组，则拖动整个分组
      if (this.group) {
        this.group.draggingNode = null;//删除拖动节点
      }
    }
    initEvent() {
      //初始化事件
      this.el
        .on('click', d => {
          this.onClick(d);
        })
        .on('mouseenter', d => {
          this.onMouseenter(d);
        })
        .on('mouseleave', d => {
          this.onMouseleave(d);
        });
      //绑定拖拽
      this.el.call(
        d3
          .drag()
          .on('start', d => {
            if (this.getIsDragable()) {
              this.onDragstart();
            }
          })
          .on('drag', d => {
            if (this.getIsDragable()) {
              this.onDrag(d);
            }
          })
          .on('end', d => {
            if (this.getIsDragable()) {
              this.onDragend(d);
            }
          })
      );
    }
    initBinding() {
      //创建外来数据双向绑定，外面属性变化自动修改节点属性
      let bindConfigSetting = {};
      for (const p in this) {
        if (p.startsWith('__')) {
          const k = p.substr(2); 
          this.getSetConfig[k] = this.config[k];
          const that = this;
          bindConfigSetting[k] = {
            get: function() {
              return that.getSetConfig[k];
            },
            set: function(value) {
              if (that.getSetConfig[k] !== value) {
                that['__' + k] = value;
                that.getSetConfig[k] = value;
              }
            }
          };
        }
      }
      Object.defineProperties(this.config, bindConfigSetting);
      //创建节点属性双向绑定，节点属性变化自动触发ph中的函数修改SVG
      let bindSetting = {};
      for (const k in this) {
        if (k.startsWith('__') || k.startsWith('_')) {
          let ak = '';
          if (k.startsWith('__')) {
            ak = k.substr(2); //去掉前缀，PH里的名字是没前缀的
          } else if (k.startsWith('_')) {
            ak = k.substr(1); //去掉前缀，PH里的名字是没前缀的
          }
          this.getSet[k] = this[k];
          const that = this;
          bindSetting[k] = {
            get: function() {
              return that.getSet[k];
            },
            set: function(value) {
              if (that.getSet[k] !== value) {
                that.getSet[k] = value;
              }
              if (PH['node.' + ak] && typeof PH['node.' + ak] === 'function') {
                PH['node.' + ak](that, value);
                //执行完公共方法后，根据节点情况执行自动方法
                if (that.customFn && that.customFn()['node.' + ak] && typeof that.customFn()['node.' + ak] === 'function') {
                  that.customFn()['node.' + ak](that, value);
                }
              }
            }
          };
        }
      }
      Object.defineProperties(this, bindSetting);
    }
    destory() {
      //如果属于分组，则删除分组节点列表信息
      if (this.group) {
        this.group.removeNode(this);
      }
      this.el.remove();
      //删除对象
      const ni = this.canvas.nodes.findIndex(item => Object.is(item, this));
      if (ni >= 0) {
        this.canvas.nodes.splice(ni, 1);
      }

      //删除数据
      const ndi = this.canvas.canvasJson.nodes.findIndex(item => item['uuid'] === this.getUuid());
      if (ndi >= 0) {
        this.canvas.canvasJson.nodes.splice(ndi, 1);
      }

      //删除连线
      if (this.links && this.links.length > 0) {
        this.links.forEach(link => {
          link.destory();
        });
      }

      if (this.removeFn && typeof this.removeFn == 'function') {
        this.removeFn();
      }
    }
    /**
     * 根据位置获取连接点对象
     * @param {String:L|R|T|B} dir
     */
    getAnchor(dir) {
      if (this.anchors && this.anchors.length > 0) {
        return this.anchors.find(element => element.getPosition() == dir);
      }
    }
    /**
     * 是否允许被起点关联
     * @param {NodeBase} 起点节点对象
     */
    isAllowConnected(sourceNode) {
      //是否被别的节点关联
      return false;
    }
    /**
     * 关联其他节点，如果不允许关联，则什么都不做
     * @param {Object} sourceAnchor 当前节点连接点位置:{dir:'L|R|T|B'}
     * @param {NodeBase} targetNode 目标节点对象
     * @param {Object} targetAnchor 目标节点连接点位置:{dir:'L|R|T|B'}
     */
    connect(sourceAnchor, targetNode, targetAnchor) {}
    /**
     * 获取当前节点的直接前置节点(不包含自身)
     * @param {String} type 连线类型
     */
    getPrevNodes(type) {
      let nodeList = [];
      this.canvas.links.forEach(element => {
        if ((!type || type == element.getType()) && element.getTarget() == this.getUuid() && element.getSource() != this.getUuid()) {
          const n = this.canvas.getNodeByUuid(element.getSource());
          if (n) {
            nodeList.push();
          }
        }
      });
      return nodeList;
    }
    /**
     * 获取当前节点的直接后置节点(不包含自身)
     * @param {String} type 连线类型
     */
    getNextNodes(type) {
      let nodeList = [];
      this.canvas.links.forEach(element => {
        if ((!type || type == element.getType()) && element.getSource() == this.getUuid() && element.getTarget() != this.getUuid()) {
          const n = this.canvas.getNodeByUuid(element.getTarget());
          if (n) {
            nodeList.push(n);
          }
        }
      });
      return nodeList;
    }
    /**
     *  获取当前节点的所有前置节点(不包含自身)
     * @param {String} type 连线类型
     */
    getAllPrevNodes(type) {
      let nodeList = this.getPrevNodes(type);
      const nodeSet = new Set(nodeList);
      if (nodeList && nodeList.length > 0) {
        let size = nodeList.length;
        for (let i = 0; i < size; i++) {
          const n = nodeList[i];
          const tmpList = n.getPrevNodes(type);
          tmpList.forEach(tmp => {
            //判断新的关系是否存在，不存在则加入nodeList继续循环
            if (!nodeSet.has(tmp) && !Object.is(tmp, this)) {
              nodeSet.add(tmp);
              nodeList.push(tmp);
            }
          });
          size = nodeList.length; //重新修正新的size
        }
      }
      return nodeList;
    }
    /**
     * 获取当前节点的所有后置节点(不包含自身)
     * @param {String} type 连线类型
     */
    getAllNextNodes(type) {
      let nodeList = this.getNextNodes(type);
      const nodeSet = new Set(nodeList);
      if (nodeList && nodeList.length > 0) {
        let size = nodeList.length;
        for (let i = 0; i < size; i++) {
          const n = nodeList[i];
          const tmpList = n.getNextNodes(type);
          tmpList.forEach(tmp => {
            //判断新的关系是否存在，不存在则加入nodeList继续循环
            if (!nodeSet.has(tmp) && !Object.is(tmp, this)) {
              nodeSet.add(tmp);
              nodeList.push(tmp);
            }
          });
          size = nodeList.length; //重新修正新的size
        }
      }
      return nodeList;
    }
    toJson() {
      let json = {};
      for (const k in this) {
        if (k.startsWith('__')) {
          json[k.substr(2)] = this[k];
        }
      }
      json.type = this.constructor.name;
      return json;
    }
    getType() {
      return this.constructor.name.toLowerCase();
    }
  }
  global.NodeBase = NodeBase;
});
