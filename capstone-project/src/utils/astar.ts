// src/utils/astar.ts

import * as THREE from 'three';

// 节点类，表示模型上的一个顶点
export class Node {
    position: THREE.Vector3;
    neighbors: Set<Node>;
    g: number;
    h: number;
    f: number;
    parent: Node | null;

    constructor(position: THREE.Vector3) {
        this.position = position;
        this.neighbors = new Set<Node>();
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

// 计算启发式函数，这里使用欧几里得距离
function heuristic(a: Node, b: Node): number {
    return a.position.distanceTo(b.position);
}

// A*算法实现
export function astar(start: Node, goal: Node): Node[] | null {
    const openSet: Set<Node> = new Set();
    const closedSet: Set<Node> = new Set();

    openSet.add(start);

    start.g = 0;
    start.h = heuristic(start, goal);
    start.f = start.g + start.h;

    while (openSet.size > 0) {
        // 找到f值最小的节点
        let current: Node | null = null;
        let minF = Infinity;
        openSet.forEach(node => {
            if (node.f < minF) {
                minF = node.f;
                current = node;
            }
        });

        if (current === goal) {
            // 构建路径
            const path: Node[] = [];
            let temp: Node | null = current;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            return path.reverse();
        }

        if (current) {
            openSet.delete(current);
            closedSet.add(current);

            current.neighbors.forEach(neighbor => {
                if (closedSet.has(neighbor)) {
                    return;
                }

                const tentativeG = current.g + current.position.distanceTo(neighbor.position);

                if (!openSet.has(neighbor) || tentativeG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    neighbor.h = heuristic(neighbor, goal);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.has(neighbor)) {
                        openSet.add(neighbor);
                    }
                }
            });
        }
    }

    // 未找到路径
    return null;
}
