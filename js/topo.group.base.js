/**topo节点的分组类**/
(function(global, factory) {
  factory((global.GroupBase = global.GroupBase || {}), global);
}(window, function(exports, global) {
  'use strict';
  class GroupBase {
    constructor(canvas, config) {
      if (!canvas) {
        console.error('请定义画布');
        return;
      }
      if (!config) {
        console.error('请提供分组定义');
        return;
      }
      if (!config.type) {
        console.error('请定义分组类型');
        return; 
      }
      canvas.groups.push(this); //将自己添加到画布分组列表里
      //两下划线开头的属性，代表需要在tojson中序列化，单下划线只是代表私有属性，执行过程中不会被修改，不需要序列化
      this.config = config; //保存原始设置
      this.nodes = [];//子节点列表
      this.getSet = {}; //存储属性旧值，方便比对
      this.getSetConfig = {}; //存储旧config值
      this.canvas = canvas; //画布对象
      this.draggingNode = null;//被拖动的子节点，这个节点会带动当前分组的所有子节点一起移动，所以要被排除掉
      this._headerHeight = 30;
      this._fill = '#B8C5D0';
      this._stroke = '#B8C5D0';
      this._strokewidth = 1;
      this._dx = 0;//拖动时偏移x坐标
      this._dy = 0;//拖动时偏移y坐标
      this._isDragable = (typeof canvas.config['group.dragable'] == 'undefined') ? true : canvas.config['group.dragable']; //是否允许拖拽
      this.__uuid = config.uuid || Topo.generateUuid();//唯一id
      if (!this.config.uuid) {
        this.config.uuid = this.__uuid;
      }
      this.__x = config.x || 0;//x坐标
      this.__y = config.y || 0;//y坐标
      this.__name = config.name;
      this.__contain = config.contain || [];//包含节点的uuid数组
      this.__config = config.config;//自定义数据
      this.__class = canvas.config['node.class'] || ''; //节点样式

      //设置子节点列表
      if (this.__contain && this.__contain.length > 0) {
        this.__contain.forEach(nodeuuid => {
          const node = this.canvas.getNodeByUuid(nodeuuid);
          if (node) {
            this.nodes.push(node);
            node.group = this;
          }
        });
      }

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
              const oldValue = that.getSet[k];
              if (oldValue !== value) {
                that.getSet[k] = value;
              }
              if (PH['group.' + ak] && typeof PH['group.' + ak] === 'function') {
                PH['group.' + ak](that, value);
                //执行完公共方法后，根据节点情况执行自动方法
                if (that.customFn && that.customFn()['group.' + ak] && typeof that.customFn()['group.' + ak] === 'function') {
                  that.customFn()['group.' + ak](that, value, oldValue);
                }
              }
            }
          };
        }
      }
      Object.defineProperties(this, bindSetting);
    }
    addNode(node) {
      if (node) {
        const nodeSet = new Set(this.nodes);
        if (!nodeSet.has(node)) {
          this.nodes.push(node);
          let contain = this.getContain();
          contain.push(node.getUuid());
          this.setContain(contain);
          node.group = this;
        }
      }
    }
    removeNode(node) {
      if (node) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
          const n = this.nodes[i];
          if (node === n) {
            this.nodes.splice(i, 1);
            break;
          }
        }
        const contain = this.getContain();
        for (let i = contain.length - 1; i >= 0; i--) {
          const uuid = contain[i];
          if (uuid == node.getUuid()) {
            contain.splice(i, 1);
            break;
          }
        }
        this.setContain(contain);
      }
    }
    draw() {
      if (this.el) {
        return;
      }
      const canvasEl = this.canvas.zoomG; //在zoomG里创建所有元素
      this.el = canvasEl.append('g');
      this.el.datum(this);
      this.el
        .classed('groupG', true)
        .classed(this.getClass(), true)
        .attr('cursor', 'pointer');
      //将分组置于最低层
      this.el.lower();
      //外框
      this.borderEl = this.el.append('rect')
        .attr('fill', 'none')
        .attr('width', this.getWidth())
        .attr('height', this.getHeight())
        .attr('x', -this.getWidth() / 2)
        .attr('y', -this.getHeight() / 2)
        .attr('stroke', this.getStroke())
        .attr('stroke-width', this.getStrokewidth());
      //重新设置一遍属性，触发PH set方法进行绘制
      for (var k in this.getSet) {
        this[k] = this.getSet[k];
      }
    }
    /**
     * 计算分组宽度，由于不同分组具体的形态不一定相同，所以不能是属性，直接由子类实现
     */
    getWidth() { return 0; }
    /**
     * 计算分组高度，由于不同分组具体的形态不一定相同，所以不能是属性，直接由子类实现
     */
    getHeight() { return 0; }
    destory() {
      this.el.remove();
      if (this.nodes && this.nodes.length > 0) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
          const node = this.nodes[i];
          node.destory();
        }
      }
      //删除对象
      const gi = this.canvas.groups.findIndex(item => Object.is(item, this));
      if (gi >= 0) {
        this.canvas.groups.splice(gi, 1);
      }
      //删除数据
      const gdi = this.canvas.canvasJson.groups.findIndex(item => item['uuid'] === this.getUuid());
      if (gdi >= 0) {
        this.canvas.canvasJson.groups.splice(gdi, 1);
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
  global.GroupBase = GroupBase;
}));
