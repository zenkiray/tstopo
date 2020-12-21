(function(global, factory) {
  factory((global.Link = global.Link || {}), global);
}(window, function(exports, global) {
  'use strict';
  class TsCurve {
    constructor(context, link) {
      this.context = context;
      this.link = link;
      this.sx = 0;
      this.sy = 0;
      this.tx = 0;
      this.ty = 0;
      this.sdir = link.getSAnchor().dir;
      this.tdir = link.getTAnchor().dir;
    }

    areaStart() {
      this._line = 0;
    }
    areaEnd() {
      this._line = NaN;
    }
    lineStart() {
      this._x = this._y = NaN;
      this._point = 0;
    }
    lineEnd() {
      let sy = this.sy;
      let sx = this.sx;
      let ty = this.ty;
      let tx = this.tx;
      let radius = 10;//圆角弧度
      const padding = 15;//偏离锚点的距离
     
      //移动到起点
      this.context.moveTo(this.sx, this.sy);
      //根据锚点位置重置起点和终点坐标
      if (this.sdir == 'L') {
        sx -= padding;
      } else if (this.sdir == 'R') {
        sx += padding;
      } else if (this.sdir == 'T') {
        sy -= padding;
      } else {
        sy += padding;
      }

      if (this.tdir == 'L') {
        tx -= padding;
      } else if (this.tdir == 'R') {
        tx += padding;
      } else if (this.tdir == 'T') {
        ty -= padding;
      } else {
        ty += padding;
      }
      //this.context.lineTo(sx, sy);
      const minYR = parseInt(Math.abs(ty - sy) / 3);
      const minXR = parseInt(Math.abs(tx - sx) / 3);
      radius = Math.min(radius, Math.min(Math.abs(minYR), Math.abs(minXR)));
      const points = this.generatePoints();
      for (let i = 1; i < points.length; i++) {
        this.context.arcTo(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, radius);
      }
      this.context.lineTo(this.tx, this.ty);
    }
    point(x, y) {
      //记录开始节点和结束节点坐标，在lineEnd里统一画线
      if (this._point == 0) {
        this.sx = x;
        this.sy = y;
        this._point++;
      } else if (this._point == 1) {
        this.tx = x;
        this.ty = y;
      }
    }
    generatePoints() {
      let points = [];
      let sy = this.sy;
      let sx = this.sx;
      let ty = this.ty;
      let tx = this.tx;
      const padding = 15;//偏离锚点的距离
      
      //根据锚点位置重置起点和终点坐标
      if (this.sdir == 'L') {
        sx -= padding;
      } else if (this.sdir == 'R') {
        sx += padding;
      } else if (this.sdir == 'T') {
        sy -= padding;
      } else {
        sy += padding;
      }
      points.push({x: sx, y: sy});
      if (this.tdir == 'L') {
        tx -= padding;
      } else if (this.tdir == 'R') {
        tx += padding;
      } else if (this.tdir == 'T') {
        ty -= padding;
      } else {
        ty += padding;
      }
      let midX = (sx + tx) * 0.5;
      let midY = (sy + ty) * 0.5;

      if (this.sdir == 'T') { //上连接点
        if (sy <= ty) {
          if (sx <= tx) { //终点在起点右下角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: tx, y: sy});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            }
          } else { //终点在起点左下角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: tx, y: sy});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            }
          }
        } else {
          if (sx <= tx) { //终点在起点右上角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: sx, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            }
          } else { //终点在起点左上角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: sx, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            }
          }
        }
      } else if (this.sdir == 'B') { //下连接点
        if (sy <= ty) {
          if (sx <= tx) { //终点在起点右下角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: sx, y: ty});
            }
          } else { //终点在起点左下角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: sx, y: ty});
            }
          }
        } else {
          if (sx <= tx) { //终点在起点右上角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: tx, y: sy});
            }
          } else { //终点在起点左上角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: tx, y: sy});
            }
          }
        }
      } else if (this.sdir == 'R') {
        if (sy <= ty) {
          if (sx <= tx) { //终点在起点右下角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: tx, y: sy});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            }
          } else { //终点在起点左下角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: sx, y: ty});
            }
          }
        } else {
          if (sx <= tx) { //终点在起点右上角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: tx, y: sy});
            }
          } else { //终点在起点左上角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: sx, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            }
          }
        }
      } else if (this.sdir == 'L') {
        if (sy <= ty) {
          if (sx <= tx) { //终点在起点右下角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: sx, y: ty});
            }
          } else { //终点在起点左下角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: tx, y: sy});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            }
          }
        } else {
          if (sx <= tx) { //终点在起点右上角
            if (this.tdir == 'T' || this.tdir == 'L') {
              points.push({x: sx, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'R') {
              points.push({x: sx, y: midY});
              points.push({x: tx, y: midY});
            }
          } else { //终点在起点左上角
            if (this.tdir == 'T' || this.tdir == 'R') {
              points.push({x: midX, y: sy});
              points.push({x: midX, y: ty});
            } else if (this.tdir == 'B' || this.tdir == 'L') {
              points.push({x: tx, y: sy});
            }
          }
        }
      }
      points.push({x: tx, y: ty});
      points.push({x: this.tx, y: this.ty});
      return points;
    }
  }
  global.TsCurve = TsCurve;
}));
