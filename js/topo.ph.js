/* eslint-disable no-eval */
/**双向绑定处理器，定义每个属性的具体处理方式**/
(function(global, factory) {
  factory((global.PH = global.PH || {}), global);
}(window, function(exports, global) {
  class PH {
  }
  //下面的属性必须要和节点、连线、分组对象中的属性名一致，否则不会触发修改
  PH['canvas.width'] = function(d, value) {
    if (d.el && value) {
      d.el.attr('width', value);
    }
  };
  PH['canvas.height'] = function(d, value) {
    if (d.el && value) {
      d.el.attr('height', value);
    }
  };
  PH['group.contain'] = function(d, value) {
    //重新设置子节点坐标
    let yOffset = 0;
    if (d.nodes.length > 0) {
      d.nodes.forEach(node => {
        if (!d.draggingNode || d.draggingNode != node) {
          node.setX(d.getX() - d.getWidth() / 2 + node.getWidth() / 2);
          node.setY(d.getY() - d.getHeight() / 2 + node.getHeight() / 2 + yOffset);
        }
        yOffset += node.getHeight();
      });
      if (d.borderEl) {
        d.borderEl
          .attr('width', d.getWidth())
          .attr('height', d.getHeight())
          .attr('x', -d.getWidth() / 2)
          .attr('y', -d.getHeight() / 2);
      }
    }
  };
  PH['group.x'] = function(d, value) { //x坐标
    if (d.el) {
      d.el.attr('transform', `translate(${value || 0},${d.getY() || 0})`);
      //重新设置子节点坐标
      if (d.nodes.length > 0) {
        d.nodes.forEach(node => {
          if (!d.draggingNode || d.draggingNode != node) {
            node.setX(value - d.getWidth() / 2 + node.getWidth() / 2);
          }
        });
      }
    }
  };
  PH['group.y'] = function(d, value) { //y坐标
    if (d.el) {
      d.el.attr('transform', `translate(${d.getX() || 0},${value || 0})`);
      //重新设置子节点坐标
      let yOffset = 0;
      if (d.nodes.length > 0) {
        d.nodes.forEach(node => {
          if (!d.draggingNode || d.draggingNode != node) {
            node.setY(value - d.getHeight() / 2 + node.getHeight() / 2 + yOffset);
          }
          yOffset += node.getHeight();
        });
      }
    }
  };
  PH['group.dx'] = function(d, value) {
    if (value) {
      const newX = d.getX() + value;
      d.setX(newX);
    }
  };
  PH['group.dy'] = function(d, value) {
    if (value) {
      const newY = d.getY() + value;
      d.setY(newY);
    }
  };
  PH['group.stroke'] = function(d, value) {
    if (d.borderEl) {
      d.borderEl.attr('stroke', value);
    }
  };
  PH['group.strokewidth'] = function(d, value) {
    if (d.borderEl) {
      d.borderEl.attr('stroke-width', value);
    }
  };
  PH['node.name'] = function(d, value) { //绘制节点名称
    const node = d.el;
    if (d.textEl) {
      d.textEl.remove();
    }
    if (value) {
      d.textEl = node.append('text')
        .attr('data-sort', 1)
        .attr('class', 'name')
        .attr('font-size', 14)
        .attr('y', d.getHeight() / 2)
        .attr('text-anchor', 'middle').attr('x', 0);
      if (value) {
        d.textEl.append('title').text(value);
        const width = d.getWidth() * 1.2;//比宽度大10%
        const words = value.split('').reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        let lineHeight = 1.1; // ems
        let y = d.textEl.attr('y');
        let dy = 1;//初始位置1em
        let tspanEl = d.textEl.append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
        while (true) {
          word = words.pop();
          if (!word) {
            break;
          }
          line.push(word);
          tspanEl.text(line.join(' '));
          if (tspanEl.node().getComputedTextLength() > width) {
            lineNumber++;
            line.pop();
            tspanEl.text(line.join(' '));
            line = [word];
            tspanEl = d.textEl.append('tspan').attr('x', 0).attr('y', y).attr('dy', lineNumber * lineHeight + dy + 'em').text(word);
          }
        }
      }
    }
  };
  PH['node.x'] = function(d, value) { //修改坐标
    if (d.el) {
      d.el.attr('transform', `translate(${value || 0},${d.getY() || 0})`);
      //重绘所有连线
      d.links.forEach(link => {
        link.updatePath();
      });
    }
  };
  PH['node.y'] = function(d, value) { //修改坐标
    if (d.el) {
      d.el.attr('transform', `translate(${d.getX() || 0},${value || 0})`);
      //重绘所有连线
      d.links.forEach(link => {
        link.updatePath();
      });
    }
  };
  PH['node.dx'] = function(d, value) { //修改坐标
    if (value) {
      const newX = d.getX() + value;
      d.setX(newX);
    }
  };
  PH['node.dy'] = function(d, value) { //修改坐标
    if (value) {
      const newY = d.getY() + value;
      d.setY(newY);
    }
  };
  PH['node.shape'] = function(d, value) { //绘制节点形状
    const node = d.el;
    if (node) {
      if (d.shapeEl) {
        d.shapeEl.remove();
      }
      d.shapeEl = node.append(function() {
        return NodeShape.getShape(d, -1).node();
      });
      d.shapeEl.attr('class', 'shape');
      //补充阴影
      if (d.getNeedShadow()) {
        d.shapeEl.attr('filter', `url(#node-shadow-${d.canvas.getUuid()})`);
      }
      //补充颜色
      if (d.getFill()) {
        d.setFill(d.getFill());
      }
      if (d.getStroke()) {
        d.setStroke(d.getStroke());
      }
      if (d.getStrokewidth()) {
        d.setStrokewidth(d.getStrokewidth());
      }
    }
  };
  PH['node.loadingcolor'] = function(d, value) { //加载环境
    if (value) {
      if (!d.loadingEl && !d.loadingMinEl) {
        const r = Math.min(d.getWidth(), d.getHeight()) / 2 - 10;//半径是高度或宽度的一半，并留3个像素padding
        d.loadingEl = d.el.append('circle')
          .attr('fill', 'none')
          .attr('stroke', value)
          .attr('stroke-width', 2)
        
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', r);
        d.loadingMinEl = d.el.append('circle')
          .attr('fill', value)
          .attr('stroke', value)
          .attr('stroke-width', 1)
          .attr('opacity', '0.8')
          .attr('cx', 0)
          .attr('cy', r)
          .attr('r', 2);
        d.loadingMinEl.append('animateTransform')
          .attr('attributeName', 'transform')
          .attr('type', 'rotate')
          .attr('dur', '2s')
          .attr('from', '0 0 0')
          .attr('to', '360 0 0')
          .attr('repeatCount', 'indefinite');
        //隐藏图标
        if (d.iconEl) {
          d.iconEl.attr('opacity', 0);
        }
      }
    } else {
      if (d.loadingEl && d.loadingMinEl) {
        d.loadingEl.remove();
        d.loadingMinEl.remove();
        d.loadingEl = null;
        d.loadingMinEl = null;
        //恢复显示图标
        if (d.iconEl) {
          d.iconEl.attr('opacity', 1);
        }
      }
    }
  };
  PH['node.fill'] = function(d, value) { //背景颜色
    if (d.shapeEl) {
      if (value) {
        d.shapeEl.style('fill', value);
      } else {
        d.shapeEl.style('fill', null);
      }
    }
  };
  PH['node.isDeleteable'] = function(d, value) { //是否显示删除按钮
    if (value) {
      if (!d.removeEl && d.el) {
        const iconSize = 14;
        d.removeEl = d.el.append('g').attr('class', 'removeBtn')
          .attr('data-mouseenter', 'removebtn')
          .attr('transform', `translate(${d.getWidth() / 2},${-d.getHeight() / 2})`)
          .attr('opacity', 0);
        d.removeEl.append('circle')
          .attr('fill', 'transparent')
          .attr('r', 10);

        d.removeEl.append('use')
          .attr('x', -iconSize / 2)
          .attr('y', -iconSize / 2)
          .attr('width', iconSize)
          .attr('height', iconSize)
          .attr('xlink:href', '#ts-remove-s')
          .style('cursor', 'pointer');

        d.el.on('mouseenter.removebtn', function() {
          d.removeEl.transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('opacity', 1)
            .attr('transform', `translate(${d.getWidth() / 2},${-d.getHeight() / 2}) scale(1)`);
          d.removeEl.raise();
        }).on('mouseleave.removebtn', function() {
          d.removeEl.transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('opacity', 0)
            .attr('transform', `translate(${d.getWidth() / 2},${-d.getHeight() / 2}) scale(0)`);
        });
        d.removeEl.on('click.removebtn', function() {
          d3.event.stopPropagation();
          d.destory();
        });
      }
    } else {
      if (d.removeEl) {
        d.removeEl.remove();
        d.removeEl = null;
      }
    }
  };
  PH['node.isSelectable'] = function(d, value) { //绘制节点选择框
    if (value) {
      //绑定选中事件
      if (d.el) {
        d.el.on('click.selectable', d => {
          d3.event.stopPropagation();
          if (!d.status.selected) {
            d.select();
          } else {
            d.unselect();
          }
        });
      }
    } else {
      if (d.el) {
        d.el.on('click.selectable', null);
      }
    }
  };
  PH['node.icon'] = function(d, value) { //绘制节点图标
    const node = d.el;
    if (d.iconEl) {
      d.iconEl.remove();
    }
    if (value) {
      const isIcon = value.startsWith('#');
      if (isIcon) {
        // eslint-disable-next-line no-eval
        value = eval("'" + value + "'");
        d.iconEl = node.append('use')
          .attr('xlink:href', value)
          .attr('data-sort', 11)
          .attr('class', 'icon')
          .attr('x', -d.getIconsize() / 2)
          .attr('y', -d.getIconsize() / 2)
          .attr('width', d.getIconsize())
          .attr('height', d.getIconsize());
      } else {
        d.iconEl = node.append('text')
          .attr('class', 'icon')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle').text(value);
      }
    } 
  };
  PH['node.iconcolor'] = function(d, value) { //背景颜色
    if (d.iconEl) {
      if (value) {
        d.iconEl.style('fill', value);
      } else {
        d.iconEl.style('fill', null);
      }
    }
  };
  PH['node.stroke'] = function(d, value) {
    if (d.shapeEl) {
      d.shapeEl.style('stroke', value);
    }
  };
  PH['node.strokewidth'] = function(d, value) {
    if (d.shapeEl) {
      d.shapeEl.style('stroke-width', value);
    }
  };
  PH['link.name'] = function(d, value) {
    if (d.el) {
      if (d.nameEl) {
        d.nameEl.remove();
      }
      if (value) {
        d.nameEl = d.el.append('text')
          .attr('class', 'name')
          .attr('font-family', 'ts')
          .attr('dy', '0.32em')
          .attr('text-anchor', 'middle')
          .attr('opacity', '1')
          .attr('font-size', '12px').attr('filter', `url(#linktextbg${d.canvas.getUuid()})`);
        d.nameEl.append('textPath')
          .attr('startOffset', '50%')
          .attr('href', '#link-traction' + d.getUuid()).append('tspan').text(value);
      }
    }
  };
  PH['link.path'] = function(d, value) { //更新所有线段路径
    if (d.el) {
      d.el.selectAll('path').attr('d', value);
    }
  };
  PH['link.isDeleteable'] = function(d, value) {
    if (value) {
      if (!d.removeEl && d.el) {
        d.removeEl = d.el.append('text')
          .attr('class', 'removeIcon')
          .attr('font-family', 'ts')
          .attr('dy', '-6px')
          .attr('text-anchor', 'middle')
          .attr('opacity', '0');

        d.removeEl.append('textPath')
          .attr('startOffset', '50%')
          .attr('class', 'icon')
          .attr('xlink:href', `#link${d.getUuid()}`)
          .append('tspan').text(eval("'" + '\ue8d0' + "'"));
        d.removeEl.on('click', d => {
          d3.event.stopPropagation();
          d.destory();
        });
        if (d.tractionLinkEl) {
          d.tractionLinkEl.on('mouseenter.removeline', d => {
            if (d.resetActiveHandler) {
              clearTimeout(d.resetActiveHandler);
              d.resetActiveHandler = null;
            }
            if (d.removeEl) {
              d.removeEl.raise().attr('opacity', '1');
            }
          }).on('mouseleave.removeline', d => {
            if (d.resetActiveHandler) {
              clearTimeout(d.resetActiveHandler);
              d.resetActiveHandler = null;
            }
            d.resetActiveHandler = setTimeout(() => {
              if (d.removeEl) {
                d.removeEl.attr('opacity', '0');
              } 
            }, 350);//延时350毫秒消失，方便点中删除按钮
          }); 
        }
      }
    } else {
      if (d.removeEl) {
        d.removeEl.remove();
      }
      if (d.tractionLinkEl) {
        d.tractionLinkEl.on('mouseenter.removeline', null).on('mouseleave.removeline', null);
      }
    }
  };
  PH['link.isSelectable'] = function(d, value) { //绘制节点选择框
    if (value) {
      d.tractionLinkEl.on('click.selectable', d => {
        d3.event.stopPropagation();
        if (!d.status.selected) {
          d.select();
        } else {
          d.unselect();
        }
      });
    } else {
      if (d.tractionLinkEl) {
        d.tractionLinkEl.on('click.selectable', null);
      }
    }
  };
  PH['link.stroke'] = function(d, value) {
    if (d.linkEl) {
      d.linkEl.attr('stroke', value);
    }
  };
  PH['link.style'] = function(d, value) {
    if (d.linkEl) {
      if (value == 'solid') {
        d.linkEl.attr('stroke-dasharray', null);
      } else if (value == 'dotted') {
        d.linkEl.attr('stroke-dasharray', '3,5');
      }
    }
  };
  PH['link.class'] = function(d, value) {
    if (d.linkEl) {
      d.linkEl.attr('class', value);
    }
  };
  PH['link.opacity'] = function(d, value) {
    if (d.linkEl) {
      d.linkEl.attr('stroke-opacity', value);
    }
  };
  PH['link.markerend'] = function(d, value) {
    if (d.linkEl) {
      if (value) {
        d.linkEl.attr('marker-end', `url(#arrow${d.canvas.getUuid()})`);
      } else {
        d.linkEl.attr('marker-end', null);
      }
    }
  };
  PH['link.markerstart'] = function(d, value) {
    if (d.linkEl) {
      if (value) {
        d.linkEl.attr('marker-start', `url(#arrowend${d.canvas.getUuid()})`);
      } else {
        d.linkEl.attr('marker-start', null);
      }
    }
  };
  global.PH = PH;
}));
