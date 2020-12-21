/**节点连接点类，一个类实例可以表示多个连接点**/
(function(global, factory) {
  factory((global.Anchor = global.Anchor || {}), global);
}(window, function(exports, global) {
  'use strict';
  class Anchor {
    constructor(canvas, node, config) {
      if (!canvas) {
        console.error('请定义画布');
        return;
      }
      if (!node) {
        console.error('请提供节点定义');
        return;
      }
      if (!config) {
        console.error('请提供连接点配置');
        return;
      }
      //两下划线开头的属性，代表需要在tojson中序列化，单下划线只是代表私有属性，但不需要序列化
      this.canvas = canvas;//画布对象
      this.node = node;//节点对象
      this.config = config;
      this.linkFactory = new LinkFactory();

      this._shape = 'circle';
      this._size = canvas.config['anchor.size'] || 8; // 锚点大小
      this._direction = 'io';//支持连入连出
      if (config.position) {
        this._position = config.position;
      } else {
        console.error('请提供节点位置');
        return;
      }
      this._nodeX = config.nodeX;//节点x坐标
      this._nodeY = config.nodeY;//节点y坐标
      this._direction = config.direction || 'io';
      this._stroke = '#336EFF';
      this._ishover = false;

      let x = 0; let y = 0;
      if (this._position == 'L') {
        this._x = -node.getWidth() / 2;
        this._edgeX = this._x - this._size;
        this._y = 0;
        this._edgeY = 0;
      } else if (this._position == 'R') {
        this._x = node.getWidth() / 2;
        this._edgeX = this._x + this._size;
        this._y = 0;
        this._edgeY = 0;
      } else if (this._position == 'T') {
        this._x = 0;
        this._edgeX = 0;
        this._y = -node.getHeight() / 2;
        this._edgeY = this._y - this._size;
      } else {
        this._x = 0;
        this._edgeX = 0;
        this._y = node.getHeight() / 2;
        this._edgeY = this._y + this._size;
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
          };
        } else if (k.startsWith('_')) {
          let pname = k.substr(1);
          pname = pname.replace(pname[0], pname[0].toUpperCase());
          this['get' + pname] = function() {
            return this[k];
          };
          this['set' + pname] = function(value) {
            this[k] = value;
          };
        }
      }
    }
    draw() {
      if (this.node.anchorG) {
        this.el = this.node.anchorG.append('g');
        this.el.datum(this);
        this.el.attr('class', 'anG').attr('transform', `translate(${this.getX()},${this.getY()})`);
        this.anchorEl = this.el.append('svg:circle')
          .attr('r', this.getSize())
          .attr('stroke', this.getStroke())
          .attr('fill', '#FFFFFF')
          .attr('transform', 'scale(0)');

        //初始化事件
        this.initEvent();
      }
    }
    initEvent() {
      this.el.on('active', d => {
        if (d.resetActiveHandler) {
          clearTimeout(d.resetActiveHandler);
          d.resetActiveHandler = null;
        }
        d.anchorEl.interrupt();
        d.anchorEl
          .transition()
          .duration(300)
          .attr('transform', `scale(1)`).attr('stroke-width', '1.5').attr('stroke-opacity', '1').on('end', () => { });
        //将anchor至于最前面
        //d.node.el.raise();
        d.el.raise();
      }).on('unactive', d => {
        //延迟300毫秒退出active
        if (d.resetActiveHandler) {
          clearTimeout(d.resetActiveHandler);
          d.resetActiveHandler = null;
        }
        d.resetActiveHandler = setTimeout(() => {
          d.isActived = false;
          d.anchorEl.interrupt();
          d.anchorEl
            .transition()
            .duration(300)
            .attr('transform', `scale(0)`).attr('stroke-width', '1.5').attr('stroke-opacity', '1').on('end', () => { }); 
        }, 300); 
      }).on('mouseenter', d => {
        d.anchorEl.interrupt();
        d.anchorEl
          .transition()
          .duration(300)
          .attr('transform', `scale(1)`)
          .attr('stroke-width', d.getSize())
          .attr('stroke-opacity', '0.3');
        //检测是否需要连线
        const linkList = d.canvas.getLinkByType('dragging');
        if (linkList && linkList.length > 0) { //如果正在拖拽中
          const draglink = linkList[0];
          draglink.setTarget(d.node.getUuid());//设置终点到拖拽线中
          draglink.setTAnchor({dir: d.getPosition()});
        }
      }).on('mouseleave', d => {
        d.anchorEl.interrupt();
        d.anchorEl
          .transition()
          .duration(300)
          .attr('stroke-width', '1.5').attr('stroke-opacity', '1');
        //检测是否需要连线
        const linkList = d.canvas.getLinkByType('dragging');
        if (linkList && linkList.length) { //如果正在拖拽中
          const draglink = linkList[0];
          draglink.setTarget(null);
          draglink.setTAnchor(null);
        }
      });
      //绑定拖拽
      this.el.call(d3.drag()
        .on('start', (d) => {
          if (!this.dragLine) {
            this.dragLine = this.linkFactory.create('dragging', this.canvas, {
              source: this.node.getUuid(),
              sAnchor: {
                'dir': this.getPosition()
              }
            });//设置拖出节点为起点
            if (this.dragLine) {
              this.dragLine.draw();
              this.dragLine.raise();
            }
          }
        })
        .on('drag', (d) => {
          if (this.dragLine) {
            const sx = this.node.getX() + this.getEdgeX();
            const sy = this.node.getY() + this.getEdgeY();
            let tx = this.node.getX() + d3.event.x;
            let ty = this.node.getY() + d3.event.y;
            /*拖拽线段缩短offset个像素，这样就不会因为线段盖在连接点上导致触发连接点的mouseleave事件 */
            const offset = 20;
            const longEdge = Math.sqrt(Math.pow((ty - sy), 2) + Math.pow((tx - sx), 2));
            const offsetY = Math.abs(ty - sy) / longEdge * offset;
            const offsetX = Math.abs(tx - sx) / longEdge * offset;
            tx += (sx >= tx ? Math.min(sx - tx, offsetX) : -Math.min(tx - sx, offsetX));
            ty += (sy >= ty ? Math.min(sy - ty, offsetY) : -Math.min(ty - sy, offsetY));
            if (!isNaN(tx) && !isNaN(ty)) {
              this.dragLine.updatePath(sx, sy, tx, ty);
            }
          }
        })
        .on('end', (d) => {
          if (this.dragLine) {
            if (this.dragLine.getSource() && this.dragLine.getTarget()) { //如果拖拽线有起点和终点，则代表可以连线
              const sourceNode = this.canvas.getNodeByUuid(this.dragLine.getSource());
              const targetNode = this.canvas.getNodeByUuid(this.dragLine.getTarget());
              if (sourceNode && targetNode) {
                //创建连接
                sourceNode.connect(this.dragLine.getSAnchor(), targetNode, this.dragLine.getTAnchor());
              }
            }
            this.dragLine.destory();
            this.dragLine = null;
          }
        }));
    }
  }
  global.Anchor = Anchor;
}));
