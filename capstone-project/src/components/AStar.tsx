// AStar.tsx

import { Graph, GraphNode } from './Graph';

export function aStarSearch(graph: Graph, startIndex: number, endIndex: number): number[] | null {
  const openSet: Set<number> = new Set();
  const cameFrom: Map<number, number | null> = new Map();

  const gScore: Map<number, number> = new Map();
  const fScore: Map<number, number> = new Map();

  graph.nodes.forEach((node, index) => {
    gScore.set(index, Infinity);
    fScore.set(index, Infinity);
  });

  gScore.set(startIndex, 0);
  fScore.set(startIndex, heuristicCostEstimate(graph.nodes.get(startIndex)!, graph.nodes.get(endIndex)!));

  openSet.add(startIndex);

  while (openSet.size > 0) {
    let currentIndex = getLowestFScoreNode(openSet, fScore);
    if (currentIndex === endIndex) {
      return reconstructPath(cameFrom, currentIndex);
    }

    openSet.delete(currentIndex);

    const currentNode = graph.nodes.get(currentIndex)!;
    for (let neighborIndex of currentNode.neighbors) {
      const tentativeGScore = gScore.get(currentIndex)! + distanceBetween(currentNode, graph.nodes.get(neighborIndex)!);

      if (tentativeGScore < gScore.get(neighborIndex)!) {
        cameFrom.set(neighborIndex, currentIndex);
        gScore.set(neighborIndex, tentativeGScore);
        fScore.set(neighborIndex, tentativeGScore + heuristicCostEstimate(graph.nodes.get(neighborIndex)!, graph.nodes.get(endIndex)!));

        if (!openSet.has(neighborIndex)) {
          openSet.add(neighborIndex);
        }
      }
    }
  }

  return null; // 未找到路径
}

function getLowestFScoreNode(openSet: Set<number>, fScore: Map<number, number>): number {
  let lowestNode = -1;
  let lowestScore = Infinity;

  for (let nodeIndex of openSet) {
    const score = fScore.get(nodeIndex)!;
    if (score < lowestScore) {
      lowestScore = score;
      lowestNode = nodeIndex;
    }
  }

  return lowestNode;
}

function heuristicCostEstimate(nodeA: GraphNode, nodeB: GraphNode): number {
  // 使用欧几里得距离作为启发式函数
  return nodeA.position.distanceTo(nodeB.position);
}

function distanceBetween(nodeA: GraphNode, nodeB: GraphNode): number {
  // 节点间的实际距离
  return nodeA.position.distanceTo(nodeB.position);
}

function reconstructPath(cameFrom: Map<number, number | null>, current: number): number[] {
  const totalPath = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    totalPath.unshift(current);
  }
  return totalPath;
}
