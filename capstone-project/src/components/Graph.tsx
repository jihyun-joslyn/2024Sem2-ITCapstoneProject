import * as THREE from 'three';

export class GraphNode {
  index: number;
  position: THREE.Vector3;
  neighbors: Set<number>; // 使用Set存储邻居索引

  constructor(index: number, position: THREE.Vector3) {
    this.index = index;
    this.position = position;
    this.neighbors = new Set<number>();
  }
}

export class Graph {
  nodes: Map<number, GraphNode>;

  constructor(geometry: THREE.BufferGeometry) {
    this.nodes = new Map<number, GraphNode>();
    this.buildGraph(geometry);
  }

  buildGraph(geometry: THREE.BufferGeometry) {
    const positionAttr = geometry.attributes.position;
    const indexAttr = geometry.index;

    // 创建节点
    for (let i = 0; i < positionAttr.count; i++) {
      const position = new THREE.Vector3(
        positionAttr.getX(i),
        positionAttr.getY(i),
        positionAttr.getZ(i)
      );
      this.nodes.set(i, new GraphNode(i, position));
    }

    // 构建邻接关系
    if (indexAttr) {
      const indices = indexAttr.array as Uint32Array | Uint16Array;
      for (let i = 0; i < indices.length; i += 3) {
        const a = Number(indices[i]);
        const b = Number(indices[i + 1]);
        const c = Number(indices[i + 2]);

        this.addEdge(a, b);
        this.addEdge(b, c);
        this.addEdge(c, a);
      }
    } else {
      // 非索引几何体
      for (let i = 0; i < positionAttr.count; i += 3) {
        const a = i;
        const b = i + 1;
        const c = i + 2;

        this.addEdge(a, b);
        this.addEdge(b, c);
        this.addEdge(c, a);
      }
    }

    // 输出节点及其邻居关系
    console.log('Graph Nodes and Neighbors:');
    this.nodes.forEach((node, index) => {
      console.log(`Node ${index}: Neighbors -> [${Array.from(node.neighbors).join(', ')}]`);
    });
  }

  addEdge(indexA: number, indexB: number) {
    const nodeA = this.nodes.get(indexA);
    const nodeB = this.nodes.get(indexB);

    if (nodeA && nodeB) {
      nodeA.neighbors.add(indexB);
      nodeB.neighbors.add(indexA);
    }
  }
}
