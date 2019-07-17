//图数据结构
var GRAPHVIS = {};

GRAPHVIS.Graph = function() {
    this.nodeSet = {};
    this.nodes = [] ;
    this.edges = [];
};

//结点数据结构

GRAPHVIS.Node = function(node_data) {
    this.id = node_data.id;
    this.nodesTo = [];//指向的结点集合
    this.nodesFrom = [];
    this.data = {};
    this.data.name = node_data.name;//名字
    this.data.post = node_data.position;//身份
    this.data.friend = [];//与之相连的点
    this.position = {};//位置
    this.body;//sphere物体，与上相同
    this.pbody;//物理对象
};

//边数据结构

GRAPHVIS.Edge = function(source, target) {
  this.source = source;
  this.target = target;
  this.data = {};
  this.body//mesh对象
};

