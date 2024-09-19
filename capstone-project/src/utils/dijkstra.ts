/**

// src/utils/dijkstra.ts

interface GraphNode {
    neighbors: string[];
}

// Dijkstra 算法实现
export function Dijkstra(graph: { [key: string]: GraphNode }, startId: string, endId: string): string[] | null {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: string[] = [];

    // 初始化距离和前驱节点
    for (const nodeId in graph) {
        distances[nodeId] = Infinity;
        previous[nodeId] = null;
    }

    distances[startId] = 0;
    queue.push(startId);

    while (queue.length > 0) {
        // 从队列中取出距离最小的节点
        queue.sort((a, b) => distances[a] - distances[b]);
        const current = queue.shift();

        if (current === endId) {
            // 构建路径
            const path: string[] = [];
            let temp: string | null = current;
            while (temp) {
                path.push(temp);
                temp = previous[temp];
            }
            return path.reverse();
        }

        if (current === undefined) {
            break;
        }

        // 遍历邻居
        for (const neighbor of graph[current].neighbors) {
            const alt = distances[current] + 1; // 假设边权重为1

            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
                previous[neighbor] = current;

                if (!queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }

    // 未找到路径
    return null;
}

**/