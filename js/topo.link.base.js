/**topo连线类**/
(function(global, factory) {
  factory((global.LinkBase = global.LinkBase || {}), global);
}(window, function(exports, global) {
  'use strict';
  class LinkBase {
    constructor(canvas, config) {
      if (!canvas) {
        console.error('请定义画布');
        return;
      }
      if (!config) {
        console.error('请提供节点定义');
        return;
      }
      canvas.links.push(this);//将自己添加到画布连线列表里
      //两下划线开头的属性，代表需要在tojson中序列化，单下划线只是代表私有属性，但不需要序列化
      this.canvas = canvas;//画布对象
      this.config = config;//原始配置
      this.getSet = {};//存储属性旧值，方便比对
      this.getSetConfig = {};//存储旧config值
      this.status = {selected: false};//状态
      if (config.source) {
        this.source = this.canvas.getNodeByUuid(config.source);
        if (this.source) {
          this.source.links.push(this);//将自己添加到节点连线记录里，当节点坐标发生变化重绘线段
        } else {
          console.log('起点节点不存在');
        }
      }
      if (config.target) {
        this.target = this.canvas.getNodeByUuid(config.target);
        if (this.target) {
          this.target.links.push(this);//将自己添加到节点连线记录里，当节点坐标发生变化重绘线段
        } else {
          console.log('终点节点不存在');
        }
      }
      this._path = '';//线路径
      this._class = 'linkPath';//默认样式
      this._stroke = null;//线段颜色，默认跟随class
      this._opacity = 0.9;//透明度
      this._markerend = true;//是否有箭头
      this._markerstart = true;//是否有起点
      this._isCurve = true;//是否需要根据锚点拐弯
      this._isDeletable = true;//是否允许删除
      this._isAnimated = true;//是否有动画
      this._isDeleteable = (typeof canvas.config['link.deleteable'] == 'undefined') ? true : canvas.config['link.deleteable'];//是否允许删除
      this._isSelectable = (typeof canvas.config['link.selectable'] == 'undefined') ? true : canvas.config['link.selectable']; //是否允许选中
      this.__uuid = config.uuid || Topo.generateUuid();//唯一id
      if (!this.config.uuid) {
        this.config.uuid = this.__uuid;
      }
      this.__name = null;//连线名称
      this.__style = 'soild';//连线风格，solid或dotted
      this.__target = config.target;//目标节点
      this.__source = config.source; //开始节点
      this.__tAnchor = config.tAnchor;//目标连线点
      this.__sAnchor = config.sAnchor;//开始连线点

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
    draw() {
      if (this.el) {
        return;
      }
      const canvasEl = this.canvas.zoomG;//在zoomG里创建所有元素
      this.el = canvasEl.append('g');
      this.el.datum(this);
      this.el.attr('class', 'linkG');
      //将线置于最低层
      this.el.lower();
      //主线
      this.linkEl = this.el.append('path')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('fill', 'none')
        .attr('id', `link${this.getUuid()}`);
      //.attr('mask', `url(#link-mask${this.getUuid()})`)
        
      //用于捕获事件和按钮定位
      //添加顺序在阴影线后面，可以捕获mouseenter事件
      this.tractionLinkEl = this.el.append('path')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-opacity', '0')
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 20)//宽度需要更宽
        .attr('id', `link-traction${this.getUuid()}`);

      this.updatePath();

      //触发划线动画，需要在updatePath之后做，因为需要d属性
      if (this.getIsAnimated()) {
        this.animateEl = this.el.append('path')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('class', 'maskPath')
          .attr('fill', 'none')
          .attr('stroke-width', 2)
          .attr('d', this.getPath());
        this.animateEl.attr('stroke-dasharray', `${this.getTotalLength()}`)
          .attr('stroke-dashoffset', `0`)
          .transition('animation')
          .duration(`${Math.min(this.getTotalLength() / 0.5, 500)}`)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', `${-this.getTotalLength()}`)
          .on('end', d => {
            this.animateEl.remove();
          });
      }

      // 绑定事件
      this.initEvent();

      //重新设置一遍属性，触发PH set方法进行绘制
      for (var k in this.getSet) {
        this[k] = this.getSet[k];
      }
    }
    raise() {
      this.el.raise();
    }
    lower() {
      this.el.lower();
    }
    selectedFn() {
      if (typeof this.canvas.config['link.selectedFn'] == 'function') {
        this.canvas.config['link.selectedFn'](this);
      }
    } //选中后函数
    unselectFn() {
      if (typeof this.canvas.config['link.unselectFn'] == 'function') {
        this.canvas.config['link.unselectFn'](this);
      } 
    } //取消选中后函数
    removeFn() {
      if (typeof this.canvas.config['link.removeFn'] == 'function') {
        this.canvas.config['link.removeFn'](this);
      }
    } 
    select() {
      this.canvas.nodes.forEach(element => {
        element.unselect();
      });
      this.canvas.links.forEach(element => {
        if (element != this) {
          element.unselect();
        }
      });
      //在tractionLinkEl前插入，防止tractionLinkEl无法捕捉mouseenter事件
      if (!this.shadowLinkEl) {
        this.shadowLinkEl = this.el.insert('path', 'path:nth-child(1)')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-opacity', '0.3')
          .attr('fill', 'none')
          .attr('stroke-width', 8)
          .attr('class', this.getClass())
          .attr('d', this.getPath());
      }
      if (!this.status.selected) {
        if (this.selectedFn && typeof this.selectedFn == 'function') {
          this.selectedFn();
        }
        this.status.selected = true;
      }
    }
    unselect() {
      if (this.shadowLinkEl) {
        this.shadowLinkEl.remove();
        this.shadowLinkEl = null;
      }
      if (this.status.selected) {
        if (this.unselectFn && typeof this.unselectFn === 'function') {
          this.unselectFn();
        } 
        this.status.selected = false;
      }
    }
    /**
     * 获取连线总长度
     */
    getTotalLength() {
      return this.linkEl.node().getTotalLength();
    }
    initEvent() {
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
            ak = k.substr(2);//去掉前缀，PH里的名字是没前缀的
          } else if (k.startsWith('_')) {
            ak = k.substr(1);//去掉前缀，PH里的名字是没前缀的
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
              if (PH['link.' + ak] && typeof PH['link.' + ak] === 'function') {
                PH['link.' + ak](that, value);
              } 
            }
          };
        }
      }
      Object.defineProperties(this, bindSetting);
    }
    updatePath(sx, sy, tx, ty) {
      if (typeof sx == 'undefined' || typeof sy == 'undefined' || typeof tx == 'undefined' || typeof ty == 'undefined') {
        if (this.getSource() && this.getTarget()) {
          const sourceNode = this.canvas.getNodeByUuid(this.getSource());
          const targetNode = this.canvas.getNodeByUuid(this.getTarget());
          if (sourceNode && targetNode) {
            const sourceAnchor = sourceNode.getAnchor(this.getSAnchor().dir);
            const targetAnchor = targetNode.getAnchor(this.getTAnchor().dir);
            if (sourceAnchor && targetAnchor) {
              sx = sourceNode.getX() + sourceAnchor.getEdgeX();
              sy = sourceNode.getY() + sourceAnchor.getEdgeY();
              tx = targetNode.getX() + targetAnchor.getEdgeX();
              ty = targetNode.getY() + targetAnchor.getEdgeY();
            }
          }
        }
      }
      if (typeof sx != 'undefined' && typeof sy != 'undefined' && typeof tx != 'undefined' && typeof ty != 'undefined') {
        var linkFn = d3.line().x(function(d) {
          return d.x;
        }).y(function(d) {
          return d.y;
        });
        if (this.getSAnchor() && this.getTAnchor() && this.getIsCurve()) {
          const tsCurve = (context) => {
            return new TsCurve(context, this);
          };
          linkFn.curve(tsCurve);
        }
     
        let pos = [];
        pos.push({x: sx, y: sy}, {x: tx, y: ty});
        const d = linkFn(pos);
        this.setPath(d);//保存路径数据
      }
    }
    destory() {
      this.el.remove();
      //删除节点对象
      this.canvas.nodes.forEach((node) => {
        //删除对象
        const lindex = node.links.findIndex(item => Object.is(item, this));
        if (lindex >= 0) {
          node.links.splice(lindex, 1);
        }
      });
      //删除对象
      const li = this.canvas.links.findIndex(item => Object.is(item, this));
      if (li >= 0) {
        this.canvas.links.splice(li, 1);
      }
      //删除数据
      const ldi = this.canvas.canvasJson.links.findIndex(item => item['uuid'] === this.getUuid());
      if (ldi >= 0) {
        this.canvas.canvasJson.links.splice(ldi, 1);
      }
      if (this.constructor.name != 'Dragging' && this.removeFn && typeof this.removeFn == 'function') {
        this.removeFn();
      }
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
  global.LinkBase = LinkBase;
}));
