基于d3.js的topo图组件，支持vue双向绑定。

效果：

![效果图](https://github.com/zenkiray/tstopo/blob/master/images/1608617736475.jpg)

用法：
```javascript
this.topo = new Topo(this.$refs.topo, {
      'canvas.width': width, 
      'canvas.height': this.leftHeight,
      'canvas.autoadjust': true, //显示辅助线
      'anchor.size': 4, //连接点大小
      'node.selectedFn': (d) => {
        alert(d.getName() + '选中事件');
      },
      'node.unselectFn': (d) => {
        alert(d.getName() + '反选事件');
      },
      'node.removeFn': (d) => {
        alert(d.getName() + '删除事件');
      },
      'link.removeFn': (d) => {
        alert(d.getUuid() + '删除事件');
      }
    });
```
数据格式：
```json
  {
    "canvas": {
        "uuid": "5a9bd29525b04a11a2c26199cea6eaa1"
    },
    "nodes": [
        {
            "uuid": "8bC9Kgj4cdY9hEUQcC5NH2ddSCznWiEq",
            "x": 200,
            "y": 360,
            "icon": "#ts-circle-fill",
            "fill": "RGBA(129, 213, 83, .1)",
            "stroke": "RGBA(129, 213, 83, .1)",
            "class": "",
            "type": "Start"
        },
        {
            "uuid": "2R9QcQYjn4kXbYURTfRIC3TpiBOc9CJG",
            "x": 1062.0000610351562,
            "y": 360,
            "icon": "#ts-circle-fill",
            "fill": "RGBA(255, 98, 90, .1)",
            "stroke": "RGBA(255, 98, 90, .1)",
            "class": "",
            "type": "End"
        },
        {
            "uuid": "b34ef60f9cf04307bce1d8bb9f694ac1",
            "x": 337,
            "y": 360,
            "icon": "#tsfont-circle-o",
            "class": "",
            "name": "通用1",
            "config": {},
            "type": "Process"
        }
    ],
    "links": [
        {
            "uuid": "7ydbjWzgnKu7zpbI30LioKWblbyOkCA4",
            "type": "forward",
            "style": "soild",
            "name": "",
            "target": "b34ef60f9cf04307bce1d8bb9f694ac1",
            "source": "8bC9Kgj4cdY9hEUQcC5NH2ddSCznWiEq",
            "tAnchor": {
                "dir": "L"
            },
            "sAnchor": {
                "dir": "R"
            }
        }
    ]
}
```
