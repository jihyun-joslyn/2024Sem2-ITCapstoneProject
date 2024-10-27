import React, { useRef, useEffect, useCallback, useContext, useState } from 'react';
import { Canvas, useThree, extend, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls, Line } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, BufferGeometry, WireframeGeometry, LineSegments, LineBasicMaterial, Shape, ExtrudeGeometry, DoubleSide, Vector2, Box3, Triangle, Vector3, BufferAttribute } from 'three';
import ModelContext from './ModelContext';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { PriorityQueue } from '../utils/PriorityQueue';
extend({ WireframeGeometry });
type ModelDisplayProps = {
  modelData: ArrayBuffer;
};
const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color, pathPoints, setPathPoints } = useContext(ModelContext);
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray, setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const { states, keypoints, setState, modelId, setModelId } = useModelStore();
  const sprayRadius = 1;
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [redPoints, setRedPoints] = useState<THREE.Vector3[]>([]);
  const [paths, setPaths] = useState<THREE.Vector3[][]>([]);
  const redSphereRef = useRef<THREE.Group>(new THREE.Group());
  const pathRef = useRef<THREE.Line>(null);
  const [filledShape, setFilledShape] = useState<THREE.Mesh | null>(null);
  const [isPathClosed, setIsPathClosed] = useState(false);
  const [closedPath, setClosedPath] = useState<THREE.Vector3[][]>([]);
  const getDistance = (positions: ArrayLike<number>, i: number, j: number) => {
    const x1 = positions[i*3], y1 = positions[i*3+1], z1 = positions[i*3+2];
    const x2 = positions[j*3], y2 = positions[j*3+1], z2 = positions[j*3+2];
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2);
  };
  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;
      // Remove previous keypoint spheres
      while (meshRef.current.children.length > 0) {
        meshRef.current.remove(meshRef.current.children[0]);
      }
    const loader = new STLLoader();
    let geometry: BufferGeometry = loader.parse(modelData);
    const modelID = modelData.byteLength.toString();
    if (!geometry.index) {
      geometry = BufferGeometryUtils.mergeVertices(geometry); // Merge the vertex to optimize performance
      geometry.computeVertexNormals();
    }
    // Use the BVH to accelerate the geometry
    geometry.computeBoundsTree = computeBoundsTree;
    geometry.disposeBoundsTree = disposeBoundsTree;
    meshRef.current.raycast = acceleratedRaycast;
    geometry.computeBoundsTree();
    // Get all vertices and initialize colors (default to white)
    const vertexCount = geometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3).fill(1);
    // Load the saved states of color
    const savedData = states[modelId] || {}; // Default to empty object if no saved data exists
    // Check if there are any spray annotations
    const hasSprayAnnotations = Object.keys(savedData).some(
      (index) => savedData[Number(index)]?.color // Check if color exists in any savedData entry
    );
    // If there are spray annotations, apply the colors to the vertices
    if (hasSprayAnnotations) {
      Object.keys(savedData).forEach((index) => {
        const color = new THREE.Color(savedData[Number(index)]?.color || '#ffffff'); // Default to white if color is missing
        colors[Number(index) * 3] = color.r;
        colors[Number(index) * 3 + 1] = color.g;
        colors[Number(index) * 3 + 2] = color.b;
      });
    }
    // Load keypoints and add spheres at the saved positions
    const savedKeypoints = keypoints[modelId] || []; // Default to empty array if no keypoints exist
    if (savedKeypoints.length > 0) {
      savedKeypoints.forEach(({ position, color }) => {
        if (position && color) { // Ensure both position and color are valid
          const keypointSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 16, 16),
            new THREE.MeshBasicMaterial({ color })
          );
          keypointSphere.position.set(position.x, position.y, position.z);
          meshRef.current.add(keypointSphere);
        }
      });
    }
    setModelId(modelID);
    // Only set colors in geometry if there are spray annotations
    if (hasSprayAnnotations) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });
    // Add the mesh effect to model
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;
  }, [modelData]);
  const spray = useCallback((position: THREE.Vector2) => {
    if (!meshRef.current || !meshRef.current.geometry.boundsTree) return;
    const raycaster = raycasterRef.current;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const colorAttributes = geometry.attributes.color as THREE.BufferAttribute;
    const newColor = new THREE.Color(color);
    raycaster.setFromCamera(position, camera);
    const intersects = raycaster.intersectObject(meshRef.current, true);
    if (intersects.length > 0) {
      intersects.forEach((intersect: THREE.Intersection) => {
        if (intersect.face) {
          const faceIndices = [intersect.face.a, intersect.face.b, intersect.face.c];
          faceIndices.forEach(index => {
            colorAttributes.setXYZ(index, newColor.r, newColor.g, newColor.b);
            setState(modelId, index, color);
          });
          colorAttributes.needsUpdate = true;
        }
      });
    }
  }, [color, camera]);
  const handleMouseDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (tool !== 'spray') return;
    event.stopPropagation();
    setIsSpray(true);
  }, [gl, spray]);
  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    // Only spray when tool is spray and click the mouse
    if (!isSpray || tool !== 'spray') return;
    event.stopPropagation();
    // Get the width and height from the canvas
    const rect = gl.domElement.getBoundingClientRect();
    // Transfer to NDC
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const point = new THREE.Vector2(x, y);
    spray(point);
  }, [isSpray, gl, spray]);
  const handleMouseUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    setIsSpray(false);
  }, []);
  // Starting KeyPoint Marking function.
  const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small sphere
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 'purple' });
  useEffect(() => {
    const handlePointerClick = (event: MouseEvent) => {
      if (!meshRef.current || tool !== 'keypoint') return;
      const rect = gl.domElement.getBoundingClientRect();
      const mousePosition = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      // Update raycaster with the mouse position and camera
      raycasterRef.current.setFromCamera(mousePosition, camera);
      // Raycast to find intersections with the mesh
      const intersects = raycasterRef.current.intersectObject(meshRef.current, true);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const localPoint = intersection.point.clone(); // The point of intersection
        // Apply object matrix world to get the correct local position
        const inverseMatrix = new THREE.Matrix4();
        inverseMatrix.copy(meshRef.current.matrixWorld).invert(); // Invert the world matrix
        localPoint.applyMatrix4(inverseMatrix); // Transform point into local coordinates
        // Create a precise sphere at the local intersection point
        const preciseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        preciseSphere.position.copy(localPoint); // Apply precise local point
        meshRef.current.add(preciseSphere); // Add sphere to the mesh in local space
      // Use Zustand store to update the keypoints for the current modelId
      useModelStore.getState().setKeypoint(modelId, { x: localPoint.x, y: localPoint.y, z: localPoint.z }, 'purple');
    
      // Debugging log to show precise coordinates
      console.log(`Clicked point (local):\nX: ${localPoint.x.toFixed(2)}\nY: ${localPoint.y.toFixed(2)}\nZ: ${localPoint.z.toFixed(2)}`);
    }
  
    };
    if (tool === 'keypoint') {
      window.addEventListener('click', handlePointerClick);
    }
    return () => {
      window.removeEventListener('click', handlePointerClick);
    };
  }, [tool, camera, gl, meshRef]);
  // 添加新的函数来处理路径工具的点
  const handlePathToolClick = useCallback((event: MouseEvent) => {
    if (!meshRef.current || tool !== 'path') return;

    const rect = gl.domElement.getBoundingClientRect();
    const mousePosition = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycasterRef.current.setFromCamera(mousePosition, camera);
    const intersects = raycasterRef.current.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const localPoint = intersection.point.clone();
      const inverseMatrix = new THREE.Matrix4();
      inverseMatrix.copy(meshRef.current.matrixWorld).invert();
      localPoint.applyMatrix4(inverseMatrix);

      const graph = buildGraph(meshRef.current.geometry);
      const nearestVertex = findNearestVertex(localPoint, graph);
      const nearestPoint = new THREE.Vector3(
        meshRef.current.geometry.attributes.position.getX(nearestVertex),
        meshRef.current.geometry.attributes.position.getY(nearestVertex),
        meshRef.current.geometry.attributes.position.getZ(nearestVertex)
      );

      // 创建红色球体并添加到场景
      const redSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 'red' })
      );
      redSphere.position.copy(nearestPoint);
      redSphereRef.current.add(redSphere);

      setRedPoints(prevPoints => {
        const newPoints = [...prevPoints, nearestPoint];
        console.log('Red points:', newPoints);

        if (newPoints.length >= 2) {
          const lastIndex = newPoints.length - 1;
          const path = findShortestPath(newPoints[lastIndex - 1], newPoints[lastIndex], meshRef.current!.geometry);
          console.log('New path:', path);
          if (path.length >= 2) {
            setPaths(prevPaths => {
              const newPaths = [...prevPaths, path];
              console.log('All paths:', newPaths);
              
              // 检查图形是否封闭
              const closed = isShapeClosed(newPaths);
              setIsPathClosed(closed);  // 更新闭合状态
              
              if (closed) {
                console.log('Shape is closed, creating filled shape');
                const fillingSuccess = createFilledShape(newPaths);
                if (fillingSuccess) {
                  // 保存闭合的路径
                  setClosedPath(newPaths);
                  // 清除当前路径和红点
                  setTimeout(() => {
                    setRedPoints([]);
                    setPaths([]);
                  }, 100);
                }
              }
              
              return newPaths;
            });
          } else {
            console.warn('Invalid path found:', path);
          }
        }

        return newPoints;
      });

      console.log(`Clicked point (nearest vertex):\nX: ${nearestPoint.x.toFixed(2)}\nY: ${nearestPoint.y.toFixed(2)}\nZ: ${nearestPoint.z.toFixed(2)}`);
    }
  }, [tool, camera, gl, meshRef]);
  // 修改 findShortestPath 函数
  const findShortestPath = (start: THREE.Vector3, end: THREE.Vector3, geometry: THREE.BufferGeometry) => {
    console.log('Finding path from', start, 'to', end);
    const graph = buildGraph(geometry);
    console.log('Graph built, size:', graph.size);
    const startVertex = findNearestVertex(start, graph);
    const endVertex = findNearestVertex(end, graph);
    console.log('Start vertex:', startVertex, 'End vertex:', endVertex);
    
    const path = aStar(graph, startVertex, endVertex);
    
    console.log('Raw path:', path);
    
    const validPath = path.map(vertexIndex => new THREE.Vector3(
      geometry.attributes.position.getX(vertexIndex),
      geometry.attributes.position.getY(vertexIndex),
      geometry.attributes.position.getZ(vertexIndex)
    ));

    console.log('Valid path:', validPath);
    
    if (validPath.length < 2) {
      console.warn('No valid path found, attempting direct connection');
      const directPath = attemptDirectConnection(start, end, geometry);
      if (directPath.length >= 2) {
        console.log('Direct connection successful:', directPath);
        return directPath;
      }
      console.warn('Direct connection failed, returning straight line');
      return [start, end];
    }
    
    return validPath;
  };
  // 修改 aStar 函数
  const aStar = (graph: Map<number, Set<number>>, start: number, goal: number) => {
    const openSet = new PriorityQueue<number>((a, b) => a[1] < b[1]);
    openSet.enqueue([start, 0]);

    const cameFrom: Map<number, number> = new Map();
    const gScore: Map<number, number> = new Map();
    gScore.set(start, 0);

    const fScore: Map<number, number> = new Map();
    fScore.set(start, heuristic(start, goal));

    const maxIterations = 10000;
    let iterations = 0;

    while (!openSet.isEmpty() && iterations < maxIterations) {
      iterations++;
      const current = openSet.dequeue()![0];

      if (current === goal) {
        return reconstructPath(cameFrom, current);
      }

      for (const neighbor of graph.get(current) || []) {
        const tentativeGScore = gScore.get(current)! + 1; // 使用固定重1

        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)!) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, gScore.get(neighbor)! + heuristic(neighbor, goal));

          if (!openSet.includes([neighbor, fScore.get(neighbor)!])) {
            openSet.enqueue([neighbor, fScore.get(neighbor)!]);
          }
        }
      }
    }

    console.warn('A* algorithm reached maximum iterations without finding a path');
    return [];
  };
  // 修改 buildGraph 函数以确保图的连通性
  const buildGraph = (geometry: THREE.BufferGeometry) => {
    const graph: Map<number, Set<number>> = new Map();
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;

    const addEdge = (v1: number, v2: number) => {
      if (!graph.has(v1)) graph.set(v1, new Set());
      if (!graph.has(v2)) graph.set(v2, new Set());
      graph.get(v1)!.add(v2);
      graph.get(v2)!.add(v1);
    };

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        addEdge(indices[i], indices[i+1]);
        addEdge(indices[i+1], indices[i+2]);
        addEdge(indices[i+2], indices[i]);
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = i/3, v2 = (i+3)/3, v3 = (i+6)/3;
        addEdge(v1, v2);
        addEdge(v2, v3);
        addEdge(v3, v1);
      }
    }

    return graph;
  };
  // 添加边
  const addEdge = (graph: Map<number, Set<number>>, from: number, to: number) => {
    if (!graph.has(from)) graph.set(from, new Set());
    if (!graph.has(to)) graph.set(to, new Set());
    graph.get(from)!.add(to);
    graph.get(to)!.add(from);
  };
  // 找到最近的顶点
  const findNearestVertex = (point: THREE.Vector3, graph: Map<number, Set<number>>) => {
    let nearestVertex = -1;
    let minDistance = Infinity;

    for (const [vertex, _] of graph) {
      const vertexPosition = new THREE.Vector3(
        meshRef.current!.geometry.attributes.position.getX(vertex),
        meshRef.current!.geometry.attributes.position.getY(vertex),
        meshRef.current!.geometry.attributes.position.getZ(vertex)
      );
      const distance = point.distanceTo(vertexPosition);
      if (distance < minDistance) {
        minDistance = distance;
        nearestVertex = vertex;
      }
    }

    return nearestVertex;
  };
  // 启发式函
  const heuristic = (a: number, b: number) => {
    const posA = new THREE.Vector3(
      meshRef.current!.geometry.attributes.position.getX(a),
      meshRef.current!.geometry.attributes.position.getY(a),
      meshRef.current!.geometry.attributes.position.getZ(a)
    );
    const posB = new THREE.Vector3(
      meshRef.current!.geometry.attributes.position.getX(b),
      meshRef.current!.geometry.attributes.position.getY(b),
      meshRef.current!.geometry.attributes.position.getZ(b)
    );
    return Math.round(posA.distanceTo(posB) * 100) / 100; // 保持与边权重相同的精度
  };
  // 重建路径
  const reconstructPath = (cameFrom: Map<number, number>, current: number) => {
    const totalPath = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      totalPath.unshift(current);
    }
    return totalPath;
  };
  // 添加一个新的类型定义
  type EdgeToTriangles = Map<string, Set<number>>;

  // 在 ModelContent 组件中添加一个 useRef 来存储边到三角形的映射
  const edgeToTrianglesRef = useRef<EdgeToTriangles>(new Map());

  // 在加载模型时建立边到三角形的映射关系（在 useEffect 中添加）
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry as BufferGeometry;
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    
    // 建立边到三角形的映射
    const edgeToTriangles = new Map<string, Set<number>>();
    
    for (let i = 0; i < indices!.count; i += 3) {
        const triangleIndex = Math.floor(i / 3);
        const ia = indices!.getX(i);
        const ib = indices!.getX(i + 1);
        const ic = indices!.getX(i + 2);

        const va = new Vector3().fromBufferAttribute(positions, ia);
        const vb = new Vector3().fromBufferAttribute(positions, ib);
        const vc = new Vector3().fromBufferAttribute(positions, ic);

        // 为三角形的每条边添加映射
        const edges = [
            createEdgeKey(va, vb),
            createEdgeKey(vb, vc),
            createEdgeKey(vc, va)
        ];

        edges.forEach(edge => {
            if (!edgeToTriangles.has(edge)) {
                edgeToTriangles.set(edge, new Set());
            }
            edgeToTriangles.get(edge)!.add(triangleIndex);
        });
    }
    
    edgeToTrianglesRef.current = edgeToTriangles;
  }, [modelData]); // 只在模型加载时执行一次

  // 添加一个函数来判断路径的方向（顺时针或逆时针）
  const isClockwise = (path: THREE.Vector3[]): boolean => {
    let sum = 0;
    // 计算路径的有向面积
    for (let i = 0; i < path.length; i++) {
        const current = path[i];
        const next = path[(i + 1) % path.length];
        sum += (next.x - current.x) * (next.y + current.y);
    }
    return sum > 0;
  };

  // 修三角形内外侧判断函数
  const isTriangleOnInnerSide = (
    triangleIndex: number,
    pathEdge: [THREE.Vector3, THREE.Vector3],
    geometry: THREE.BufferGeometry,
    isPathClockwise: boolean
  ): boolean => {
    const indices = geometry.index!;
    const positions = geometry.attributes.position;
    
    // 获取三角形的三个顶点
    const i = triangleIndex * 3;
    const va = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i));
    const vb = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 1));
    const vc = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 2));
    
    // 计算三角形的质心
    const centroid = new THREE.Vector3()
        .add(va)
        .add(vb)
        .add(vc)
        .divideScalar(3);
    
    // 计算路径边的方向向量
    const edgeDirection = new THREE.Vector3()
        .subVectors(pathEdge[1], pathEdge[0]);
    
    // 计算从路径起点到三角形质心的向量
    const toCentroid = new THREE.Vector3()
        .subVectors(centroid, pathEdge[0]);
    
    // 计算叉积来判断方向
    const crossProduct = new THREE.Vector3()
        .crossVectors(edgeDirection, toCentroid);
    
    // 根据路径的方向（顺时针/逆时针）来判断内外侧
    return isPathClockwise ? crossProduct.z < 0 : crossProduct.z > 0;
  };

  // 修改获取相邻三角形的函数，使用边来判断相邻关系
  const getAdjacentTriangles = (
      triangleIndex: number,
      geometry: THREE.BufferGeometry
  ): Set<number> => {
      const indices = geometry.index!;
      const positions = geometry.attributes.position;
      const adjacent = new Set<number>();
      
      // 获取当前三角形的三个顶点
      const i = triangleIndex * 3;
      const v1 = indices.getX(i);
      const v2 = indices.getX(i + 1);
      const v3 = indices.getX(i + 2);

      // 获取三个顶点的位置
      const p1 = new THREE.Vector3().fromBufferAttribute(positions, v1);
      const p2 = new THREE.Vector3().fromBufferAttribute(positions, v2);
      const p3 = new THREE.Vector3().fromBufferAttribute(positions, v3);

      // 创建三条边的key
      const edges = [
          createEdgeKey(p1, p2),
          createEdgeKey(p2, p3),
          createEdgeKey(p3, p1)
      ];

      // 通过边找到相邻的三角形
      edges.forEach(edge => {
          const adjacentToEdge = edgeToTrianglesRef.current.get(edge);
          if (adjacentToEdge) {
              adjacentToEdge.forEach(adjTriangle => {
                  if (adjTriangle !== triangleIndex) {
                      adjacent.add(adjTriangle);
                  }
              });
          }
      });
      
      return adjacent;
  };

  // 修改 createFilledShape 函数，使用 context 中的 color
  const createFilledShape = (paths: THREE.Vector3[][]): boolean => {
    if (!meshRef.current || paths.length < 3) return false;

    const geometry = meshRef.current.geometry as BufferGeometry;
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    const colors = geometry.attributes.color || new BufferAttribute(new Float32Array(positions.count * 3), 3);

    if (!geometry.attributes.color) {
      geometry.setAttribute('color', colors);
    }

    // 将所有路径合并成一个完整的路径
    const completePath = paths.reduce((acc, curr) => [...acc, ...curr], []);
    const isPathClockwise = isClockwise(completePath);

    // 收集边界三角形
    const boundaryTriangles = new Set<number>();
    const allTrianglesToColor = new Set<number>();
    const processedTriangles = new Set<number>();
    
    // 添加打印语句来查看 color 的值
    console.log('Current color value:', color);
    console.log('Color type:', typeof color);
    
    // 修改颜色判断逻辑
    const fillColor = new THREE.Color(color === '#ffffff' ? '#00FF00' : color);  // 默认白色，则使用绿色

    // 首先找到所有边界三角形
    paths.forEach(path => {
        for (let i = 0; i < path.length - 1; i++) {
            const edge = createEdgeKey(path[i], path[i + 1]);
            const pathEdge: [THREE.Vector3, THREE.Vector3] = [path[i], path[i + 1]];
            
            const adjacentTriangles = edgeToTrianglesRef.current.get(edge);
            if (adjacentTriangles) {
                adjacentTriangles.forEach(triangleIndex => {
                    if (isTriangleOnInnerSide(triangleIndex, pathEdge, geometry, isPathClockwise)) {
                        boundaryTriangles.add(triangleIndex);
                        allTrianglesToColor.add(triangleIndex);
                        processedTriangles.add(triangleIndex);
                    }
                });
            }
        }
    });

    // 递归填充函数
    const fillRecursively = (triangleIndex: number) => {
        const adjacentTriangles = getAdjacentTriangles(triangleIndex, geometry);
        
        adjacentTriangles.forEach(adjTriangle => {
            if (!processedTriangles.has(adjTriangle)) {
                processedTriangles.add(adjTriangle);
                
                const adjCentroid = getTriangleCentroid(adjTriangle, geometry);
                if (isPointInPolygon(adjCentroid, completePath)) {
                    allTrianglesToColor.add(adjTriangle);
                    // 递归处理相邻三角形
                    fillRecursively(adjTriangle);
                }
            }
        });
    };

    // 从每个边界三角形开始递归填充
    boundaryTriangles.forEach(triangleIndex => {
        fillRecursively(triangleIndex);
    });

    // 对所有收集到的三角形进行染色
    allTrianglesToColor.forEach(triangleIndex => {
        const i = triangleIndex * 3;
        const ia = indices!.getX(i);
        const ib = indices!.getX(i + 1);
        const ic = indices!.getX(i + 2);

        // 使用选择的颜色进行填充
        colors.setXYZ(ia, fillColor.r, fillColor.g, fillColor.b);
        colors.setXYZ(ib, fillColor.r, fillColor.g, fillColor.b);
        colors.setXYZ(ic, fillColor.r, fillColor.g, fillColor.b);
    });

    colors.needsUpdate = true;
    return true;
  };

  // 添加获取三角形质心的辅助函数
  const getTriangleCentroid = (triangleIndex: number, geometry: THREE.BufferGeometry): THREE.Vector3 => {
    const indices = geometry.index!;
    const positions = geometry.attributes.position;
    
    const i = triangleIndex * 3;
    const va = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i));
    const vb = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 1));
    const vc = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 2));
    
    return new THREE.Vector3()
        .add(va)
        .add(vb)
        .add(vc)
        .divideScalar(3);
  };

  // 添加判断点是否在多边形内的函数
  const isPointInPolygon = (point: THREE.Vector3, polygon: THREE.Vector3[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  // 添加创建边键值的辅助函数
  const createEdgeKey = (v1: THREE.Vector3, v2: THREE.Vector3): string => {
      // 为了确保边的唯一性，我们总是用较小的坐标值在前
      const points = [
          [v1.x, v1.y, v1.z],
          [v2.x, v2.y, v2.z]
      ].sort((a, b) => {
          if (a[0] !== b[0]) return a[0] - b[0];
          if (a[1] !== b[1]) return a[1] - b[1];
          return a[2] - b[2];
      });
      
      return `${points[0].join(',')}-${points[1].join(',')}`;
  };

  useEffect(() => {
    if (tool === 'path') {
      window.addEventListener('click', handlePathToolClick);
    }
    return () => {
      window.removeEventListener('click', handlePathToolClick);
    };
  }, [tool, handlePathToolClick]);
  useEffect(() => {
    console.log('Paths updated:', paths);
  }, [paths]);
  // 在 return 语句之前添加这个函数
  const formatPathForLine = (path: THREE.Vector3[]) => {
    return path.flatMap(p => [p.x, p.y, p.z]);
  };
  // 在其他函数定义之后，添加这个新函数
  const attemptDirectConnection = (start: THREE.Vector3, end: THREE.Vector3, geometry: THREE.BufferGeometry) => {
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const step = distance / 100; // 将路径分成100个步骤
    const path = [start.clone()];
    const graph = buildGraph(geometry); // 构建图结构一次，避免重复计算

    for (let i = 1; i <= 100; i++) {
      const point = start.clone().add(direction.clone().multiplyScalar(i / 100));
      const nearestVertex = findNearestVertex(point, graph);
      if (nearestVertex !== -1) {
        path.push(new THREE.Vector3(
          geometry.attributes.position.getX(nearestVertex),
          geometry.attributes.position.getY(nearestVertex),
          geometry.attributes.position.getZ(nearestVertex)
        ));
      }
    }

    return path;
  };
  // 添加判断图形是否封闭的函数
  const isShapeClosed = (paths: THREE.Vector3[][]): boolean => {
    if (paths.length < 3) return false;
    
    const firstPoint = paths[0][0];
    const lastPoint = paths[paths.length - 1][paths[paths.length - 1].length - 1];
    const newPoint = paths[paths.length - 1][0]; // 最新添加的点
    
    const tolerance = 0.001; // 可以根据需要调整这个值
    return firstPoint.distanceTo(lastPoint) < tolerance || firstPoint.distanceTo(newPoint) < tolerance;
  };
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh ref={meshRef} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} />
      <OrbitControls enableRotate={tool === 'pan'} enableZoom enablePan rotateSpeed={1.0} />
      <lineSegments ref={wireframeRef} material={new LineBasicMaterial({ color: 'white' })} />
      
      {/* 渲红点 */}
      <primitive object={redSphereRef.current} />

      {/* 渲染路径 */}
      {paths.map((path, index) => {
        console.log(`Rendering path ${index}:`, path);
        return path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={index}
            points={formatPathForLine(path)}
            color={isPathClosed ? "blue" : "yellow"}  // 根据闭合状态决定颜色
            lineWidth={2}
          />
        );
      })}

      {/* 渲染填充形状 */}
      {/* {filledShape && <primitive object={filledShape} />} */}

      {/* 渲染当前路径（黄色） */}
      {paths.map((path, index) => (
        path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={`current-${index}`}
            points={formatPathForLine(path)}
            color="yellow"
            lineWidth={2}
          />
        )
      ))}

      {/* 渲染已闭合的路径（蓝色） */}
      {closedPath.map((path, index) => (
        path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={`closed-${index}`}
            points={formatPathForLine(path)}
            color="blue"
            lineWidth={2}
          />
        )
      ))}
    </>
  );
};
const ModelDisplay: React.FC<{ modelData: ArrayBuffer }> = ({ modelData }) => {
  return (
    <Canvas style={{ background: 'black' }}>
      <ModelContent modelData={modelData} />
    </Canvas>
  );
};
export default ModelDisplay;
