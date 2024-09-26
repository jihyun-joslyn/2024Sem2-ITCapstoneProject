// src/components/ModelDisplay.tsx

import React, { useRef, useEffect, useContext } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import {
    Mesh,
    MeshStandardMaterial,
    BufferGeometry,
    LineBasicMaterial,
    LineSegments,
    Raycaster,
    Vector2,
    Vector3,
    BufferAttribute,
    SphereGeometry,
    MeshBasicMaterial,
    Line,
    WireframeGeometry
} from 'three';
import ModelContext from './ModelContext';
import { astar, Node } from '../utils/astar';

type ModelDisplayProps = {
    modelData: ArrayBuffer;
};

// 辅助函数：带有容差的向量比较
const vectorsAlmostEqual = (a: Vector3, b: Vector3, tolerance: number = 1e-4): boolean => {
    return a.distanceTo(b) < tolerance;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
    const { tool, color, selectedPoints, setSelectedPoints } = useContext(ModelContext);
    const { scene, camera } = useThree();
    const meshRef = useRef<Mesh>(null);
    const raycaster = useRef<Raycaster>(new Raycaster());
    const mouse = useRef<Vector2>(new Vector2());

    // 存储模型的顶点和节点信息
    const nodesRef = useRef<Node[]>([]);

    useEffect(() => {
        if (!meshRef.current) return;

        const loader = new STLLoader();
        const loadedGeometry: BufferGeometry = loader.parse(modelData);
        loadedGeometry.computeVertexNormals();

        // 创建节点
        const positions = loadedGeometry.attributes.position.array;
        const indices = loadedGeometry.index?.array;

        // 创建节点数组
        const tempNodes: Node[] = [];
        for (let i = 0; i < positions.length; i += 3) {
            const position = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
            tempNodes.push(new Node(position));
        }

        // 构建邻接关系
        if (indices) {
            for (let i = 0; i < indices.length; i += 3) {
                const a = indices[i];
                const b = indices[i + 1];
                const c = indices[i + 2];

                tempNodes[a].neighbors.add(tempNodes[b]);
                tempNodes[a].neighbors.add(tempNodes[c]);

                tempNodes[b].neighbors.add(tempNodes[a]);
                tempNodes[b].neighbors.add(tempNodes[c]);

                tempNodes[c].neighbors.add(tempNodes[a]);
                tempNodes[c].neighbors.add(tempNodes[b]);
            }
        }

        nodesRef.current = tempNodes;

        // 设置网格和线框几何体
        meshRef.current.geometry = loadedGeometry;

        // 移除旧的线框（如果存在）
        const existingWireframe = scene.getObjectByName('wireframe');
        if (existingWireframe) {
            scene.remove(existingWireframe);
        }

        const wireframeGeometry = new WireframeGeometry(loadedGeometry);
        const wireframeMaterial = new LineBasicMaterial({ color: 'white' });
        const wireframe = new LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.name = 'wireframe';
        scene.add(wireframe);

    }, [modelData, scene]);

    // 鼠标点击事件处理
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const currentTool = tool; // 捕获当前工具
            if (currentTool === 'path' || currentTool === 'spray') {
                const canvas = document.querySelector('canvas');
                if (!canvas) return;

                const rect = canvas.getBoundingClientRect();
                mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.current.setFromCamera(mouse.current, camera);

                if (meshRef.current) {
                    const intersects = raycaster.current.intersectObject(meshRef.current);
                    if (intersects.length > 0) {
                        const intersect = intersects[0];
                        const positionAttribute = meshRef.current.geometry.attributes.position as BufferAttribute;

                        if (currentTool === 'path') {
                            // 找到距离点击点最近的顶点
                            let closestVertex = new Vector3();
                            let minDistance = Infinity;
                            let closestIndex = -1;

                            for (let i = 0; i < positionAttribute.count; i++) {
                                const vertex = new Vector3().fromBufferAttribute(positionAttribute, i);
                                const distance = vertex.distanceTo(intersect.point);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestVertex = vertex.clone();
                                    closestIndex = i;
                                }
                            }

                            if (closestIndex !== -1) {
                                // 检查是否已经选中这个点
                                const isAlreadySelected = selectedPoints.some(p => vectorsAlmostEqual(p, closestVertex));
                                if (isAlreadySelected) {
                                    return; // 不重复选取
                                }

                                // 标记选中的顶点
                                const dotGeometry = new SphereGeometry(1, 32, 32); // 增大球体半径
                                const dotMaterial = new MeshBasicMaterial({ color });
                                const dot = new Mesh(dotGeometry, dotMaterial);
                                dot.position.copy(closestVertex);
                                dot.name = `path_dot_${closestIndex}`;
                                scene.add(dot);

                                // 更新选中的点列表
                                setSelectedPoints(prevPoints => {
                                    const newPoints = [...prevPoints, closestVertex];

                                    // 如果选中了两个及以上的点，计算最短路径
                                    if (newPoints.length >= 2) {
                                        const existingLine = scene.getObjectByName('pathLine');
                                        if (existingLine) {
                                            scene.remove(existingLine);
                                        }

                                        const startPoint = newPoints[newPoints.length - 2];
                                        const endPoint = newPoints[newPoints.length - 1];

                                        // 找到对应的节点
                                        const startNode = nodesRef.current.find(node => vectorsAlmostEqual(node.position, startPoint));
                                        const endNode = nodesRef.current.find(node => vectorsAlmostEqual(node.position, endPoint));

                                        if (startNode && endNode) {
                                            // 使用A*算法计算路径
                                            const pathNodes = astar(startNode, endNode);

                                            if (pathNodes) {
                                                console.log('Path found:', pathNodes.map(node => node.position));
                                                const pathPositions = pathNodes.map(node => node.position);
                                                const pathGeometry = new BufferGeometry().setFromPoints(pathPositions);
                                                const pathMaterial = new LineBasicMaterial({ color: 'yellow' }); // 使用明显颜色
                                                const pathLine = new Line(pathGeometry, pathMaterial);
                                                pathLine.name = 'pathLine';
                                                scene.add(pathLine);
                                            } else {
                                                console.warn('未找到路径');
                                            }
                                        } else {
                                            console.warn('起点或终点节点未找到');
                                        }
                                    }

                                    return newPoints;
                                });
                            }
                        } else if (currentTool === 'spray') {
                            // 喷漆功能
                            // 标记喷漆点
                            const sprayDot = new Mesh(
                                new SphereGeometry(0.5, 16, 16),
                                new MeshBasicMaterial({ color })
                            );
                            sprayDot.position.copy(intersect.point);
                            sprayDot.name = `spray_dot_${Date.now()}`;
                            scene.add(sprayDot);
                        }
                    }
                }
            }
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, [tool, camera, scene, color, setSelectedPoints, meshRef, selectedPoints]);

    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} />
            <mesh ref={meshRef} material={new MeshStandardMaterial({ color: 'gray' })} />
            <OrbitControls enableRotate={tool !== 'path'} enableZoom={true} enablePan={true} rotateSpeed={1.0} />
        </>
    );
};

const ModelDisplay: React.FC<ModelDisplayProps> = ({ modelData }) => {
    return (
        <Canvas style={{ background: 'black' }}>
            <ModelContent modelData={modelData} />
        </Canvas>
    );
};

export default ModelDisplay;
