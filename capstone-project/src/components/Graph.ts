// src/components/Graph.ts
import * as THREE from 'three';

export class GraphNode {
    index: number; // 顶点索引
    position: [number, number, number]; // 顶点坐标 [x, y, z]
    neighbors: number[]; // 相邻顶点的索引列表
  
    constructor(index: number, position: [number, number, number]) {
      this.index = index;
      this.position = position;
      this.neighbors = [];
    }
  }
  
  export class Graph {
    nodes: Map<number, GraphNode>;
  
    constructor() {
      this.nodes = new Map();
    }
  
    // 从几何体中构建图
    buildFromGeometry(geometry: THREE.BufferGeometry) {
      const positionAttribute = geometry.getAttribute('position');
      const indexAttribute = geometry.getIndex();
  
      if (!indexAttribute) {
        console.error('Geometry does not have index attribute.');
        return;
      }
  
      const indices = indexAttribute.array;
      const vertexCount = positionAttribute.count;
  
      // 初始化所有节点
      for (let i = 0; i < vertexCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        this.nodes.set(i, new GraphNode(i, [x, y, z]));
      }
  
      // 构建邻接列表
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];
  
        this.addEdge(a, b);
        this.addEdge(b, c);
        this.addEdge(c, a);
      }
    }
  
    // 添加边（无向图）
    addEdge(u: number, v: number) {
      this.nodes.get(u)?.neighbors.push(v);
      this.nodes.get(v)?.neighbors.push(u);
    }
  }
  