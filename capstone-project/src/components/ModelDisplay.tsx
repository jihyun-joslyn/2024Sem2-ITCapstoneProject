import { Line, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent, extend, useThree } from '@react-three/fiber';
import * as _ from "lodash";
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, Vector3, WireframeGeometry } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import { AnnotationType } from '../datatypes/ClassDetail';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import { ProblemType } from '../datatypes/ProblemType';
import { PriorityQueue } from '../utils/PriorityQueue';
import ModelContext from './ModelContext';

type HotkeyEvent = KeyboardEvent | MouseEvent | WheelEvent;
type HotkeyHandler = (event: HotkeyEvent) => void;


extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
  currProblem: ProblemType[];
  updateProblems: (updateProblems: ProblemType[]) => void;
  currentFile: string | null;
  updateModelIDFileMapping : (mapping: ModelIDFileNameMap[]) => void;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData, currProblem, updateProblems, currentFile, updateModelIDFileMapping }) => {
  const { tool, color, hotkeys, orbitControlsRef ,controlsRef, hotkeysEnabled, setTool, setSpray, activateBrush, activateSpray,currentTool} = useContext(ModelContext);//get the tool and color state from siderbar
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray, setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const modelStore = useModelStore();
  const { states, keypoints, setState, modelId, setModelId } = useModelStore();
  const sprayRadius = 1;
  const [problems, setProblems] = useState(currProblem);
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
    setProblems(currProblem);

    if (!meshRef.current || !wireframeRef.current) return;

    // Remove previous keypoint spheres
    while (meshRef.current.children.length > 0) {
      meshRef.current.children.pop();
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


    //load the saved states of color
    const { colors: savedColors } = modelStore.getCurrentState(modelID);

    if (savedColors) {
      Object.entries(savedColors).forEach(([index, colorState]) => {
        const color = new THREE.Color(colorState.color);
        const i = Number(index);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      });
    }

    modelStore.setModelId(modelID);

    //mapping for modelId and fileName;
    {
      const modelIDFileNameMappingKey: string = "ModelIDFileNameMapping";
      var mappingArr: ModelIDFileNameMap[] = [];
      var mapping: ModelIDFileNameMap = { modelID: modelID, fileName: currentFile };


      if ((!_.isUndefined(localStorage.getItem(modelIDFileNameMappingKey)) && !_.isNull(localStorage.getItem(modelIDFileNameMappingKey)))) 
        mappingArr = JSON.parse(localStorage.getItem(modelIDFileNameMappingKey));

      if (_.findIndex(mappingArr, function(m) {
        return _.eq(m.fileName, currentFile)
      }) == -1)
        mappingArr.push(mapping);

      localStorage.setItem(modelIDFileNameMappingKey, JSON.stringify(mappingArr));
      updateModelIDFileMapping(mappingArr);
    }


    // Load the saved states of color
    const savedData = states[modelId] || {}; // Default to empty object if no saved data exists

    // Check if there are any spray annotations
    var hasSprayAnnotations = Object.keys(savedData).some(
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

    if (_.findIndex(currProblem, function (p) {
      return _.findIndex(p.classes, function (c) {
        return c.coordinates.length > 0
      }) != -1
    }) != -1) {
      currProblem.forEach(p => {
        p.classes.forEach(c => {
          if (c.coordinates.length > 0) {
            switch (c.annotationType) {
              case AnnotationType.SPRAY:
                const color = new THREE.Color(c.color || '#ffffff');

                c.coordinates.forEach(_c => {
                  colors[Number(_c) * 3] = color.r;
                  colors[Number(_c) * 3 + 1] = color.g;
                  colors[Number(_c) * 3 + 2] = color.b;
                });
                hasSprayAnnotations = true;
                break;
              case AnnotationType.KEYPOINT:
                const keypointSphere = new THREE.Mesh(
                  new THREE.SphereGeometry(0.05, 16, 16),
                  new THREE.MeshBasicMaterial({ color: c.color })
                );

                for (var i = 0; i < c.coordinates.length; i += 3) {
                  keypointSphere.position.set(c.coordinates[i], c.coordinates[i + 1], c.coordinates[i + 2]);
                  meshRef.current.add(keypointSphere);
                }
                break;
              default:
                break;
            }
          }
        })
      })
    }

    setModelId(modelID);


    // Only set colors in geometry if there are spray annotations
    if (hasSprayAnnotations) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    // add the color into geometry, each vertex use three data to record color
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    // Add the mesh effect to model
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    fitModel();
  }, [modelData, problems]);

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
            modelStore.addPaintChange(modelStore.modelId, index, color);
            setState(modelId,index,color);
            linkAnnotationToClass(index, color);
          });
          colorAttributes.needsUpdate = true;
        }
      })
    }
  }, [color, camera, modelStore]);

  const handleMouseDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (tool != 'spray') return;
    event.stopPropagation();
    setIsSpray(true);
    modelStore.startPaintAction(modelStore.modelId, 'spray');
  }, [tool, modelStore, gl, spray]);

  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    //only spray when tool is spray and click the mouse
    if (!isSpray || tool !== 'spray') return;
    event.stopPropagation();

    // Get the width and height from the canvas
    const rect = gl.domElement.getBoundingClientRect();
    // Transfer to NDC
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const point = new THREE.Vector2(x, y);

    spray(point);
  }, [isSpray, gl, spray, tool]);

  const handleMouseUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    setIsSpray(false);
    if (tool === 'spray') {
      modelStore.endPaintAction(modelStore.modelId);
    }
    // setClassToNotAnnotating();
  }, [tool, modelStore]);


  //Starting KeyPoint Marking function.
  const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small sphere
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: color });


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


        // Debugging log to show precise coordinates
        console.log(`Clicked point (local):\nX: ${localPoint.x.toFixed(2)}\nY: ${localPoint.y.toFixed(2)}\nZ: ${localPoint.z.toFixed(2)}`);

        modelStore.setKeypoint(modelStore.modelId, { x: localPoint.x, y: localPoint.y, z: localPoint.z }, color);
        modelStore.startPaintAction(modelStore.modelId, 'point');
        modelStore.addPaintChange(modelStore.modelId, -1, color); // Use -1 as a special index for keypoints
        modelStore.endPaintAction(modelStore.modelId);
        linkAnnotationToClass(localPoint, "");
      }
    };

    if (tool === 'keypoint') {
      window.addEventListener('click', handlePointerClick);
    }

    return () => {
      window.removeEventListener('click', handlePointerClick);
    };
  }, [tool, camera, gl, meshRef, modelStore]);

  
  //Starting coding for Shortest Path  

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

  //End Shortest Path function



  const isKeyboardEvent = (event: HotkeyEvent): event is KeyboardEvent => {
    return 'key' in event;
  };

  const isMouseEvent = (event: HotkeyEvent): event is MouseEvent => {
    return 'button' in event;
  };

  const isWheelEvent = (event: HotkeyEvent): event is WheelEvent => {
    return 'deltaY' in event;
  };

  const checkHotkey = useCallback((event: HotkeyEvent, hotkeyString: string) => {
    const hotKeyParts = hotkeyString.toUpperCase().split('+');

    const isCtrlPressed = event.ctrlKey;
    const isShiftPressed = event.shiftKey;
    const isAltPressed = event.altKey;

    const modifiers = [
      isCtrlPressed && 'CONTROL',
      isShiftPressed && 'SHIFT',
      isAltPressed && 'ALT'
    ].filter(Boolean);

    let key = '';
    if (isKeyboardEvent(event)) {
      key = event.key.toUpperCase();
    } else if (isMouseEvent(event)) {
      key = event.button === 0 ? 'LEFTCLICK' : event.button === 2 ? 'RIGHTCLICK' : '';
    } else if (isWheelEvent(event)) {
      key = (event as WheelEvent).deltaY < 0 ? 'WHEELUP' : 'WHEELDOWN';
    }

    const pressedKeys = [...modifiers, key];
    return hotKeyParts.every(part => pressedKeys.includes(part)) && pressedKeys.length === hotKeyParts.length;
  }, []);

  //updated accordying to HotKey branch
  const zoomCamera = useCallback((factor: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Get the current zoom level
      const currentZoom = camera.position.distanceTo(controls.target);
      // Calculate new zoom
      const newZoom = currentZoom * factor;
      
      // Update camera position
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).add(direction.multiplyScalar(newZoom));
      
      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const rotateHorizontal = useCallback((angle: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Create a rotation matrix around the Y axis
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(angle);
      
      // Get vector from target to camera
      const cameraPosition = camera.position.clone().sub(controls.target);
      // Apply rotation
      cameraPosition.applyMatrix4(rotationMatrix);
      // Set new camera position
      camera.position.copy(controls.target).add(cameraPosition);
      
      // Update camera orientation
      camera.lookAt(controls.target);
      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const rotateVertical = useCallback((angle: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Get the right vector (perpendicular to up vector and camera direction)
      const right = new THREE.Vector3();
      right.crossVectors(camera.up, camera.position.clone().sub(controls.target).normalize());
      
      // Create rotation matrix around the right vector
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationAxis(right.normalize(), angle);
      
      // Get vector from target to camera
      const cameraPosition = camera.position.clone().sub(controls.target);
      // Apply rotation
      cameraPosition.applyMatrix4(rotationMatrix);
      // Set new camera position
      camera.position.copy(controls.target).add(cameraPosition);
      
      // Update camera orientation
      camera.lookAt(controls.target);
      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const fitModel = () => {
    if (!meshRef.current) return;
    const box = new THREE.Box3().setFromObject(meshRef.current);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.position.copy(center);
    camera.position.x += size / 2.0;
    camera.position.y += size / 5.0;
    camera.position.z += size / 2.0;
    camera.lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };
      // switch class
      const switchToNextClass = useCallback(() => {
        const updatedProblems = [...currProblem];
        let foundActiveClass = false;
        let switched = false;
    
        for (let i = 0; i < updatedProblems.length; i++) {
          const problem = updatedProblems[i];
          const classes = problem.classes;
          
          for (let j = 0; j < classes.length; j++) {
            if (classes[j].isAnnotating) {
              foundActiveClass = true;
              classes[j].isAnnotating = false;
              if (j < classes.length - 1) {
                classes[j + 1].isAnnotating = true;
                switched = true;
                break;
              }
            }
          }
          
          if (foundActiveClass && !switched && i < updatedProblems.length - 1) {
            const nextProblem = updatedProblems[i + 1];
            if (nextProblem.classes.length > 0) {
              nextProblem.classes[0].isAnnotating = true;
              switched = true;
            }
          } 
          if (switched) break;
        }
        if (foundActiveClass && !switched && updatedProblems.length > 0) {
          const firstProblem = updatedProblems[0];
          if (firstProblem.classes.length > 0) {
            firstProblem.classes[0].isAnnotating = true;
          }
        }
        updateProblems(updatedProblems);
      }, [currProblem, updateProblems]);
      
      const updateMeshColors = useCallback(() => {
        if (!meshRef.current) return;
        const geometry = meshRef.current.geometry as BufferGeometry;
        const colorAttributes = geometry.attributes.color as THREE.BufferAttribute;
        const { colors, keypoints } = modelStore.getCurrentState(modelStore.modelId);
    
        // Update vertex colors
        for (let i = 0; i < colorAttributes.count; i++) {
          const color = colors[i] ? new THREE.Color(colors[i].color) : new THREE.Color(0xffffff);
          colorAttributes.setXYZ(i, color.r, color.g, color.b);
        }
    
        // Update keypoints
        meshRef.current.children = meshRef.current.children.filter(child => !(child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry));
        keypoints.forEach(keypoint => {
          const sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: keypoint.color }));
          sphere.position.set(keypoint.position.x, keypoint.position.y, keypoint.position.z);
          meshRef.current?.add(sphere);
        });
    
        colorAttributes.needsUpdate = true;
      }, [modelStore]);

      useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (!hotkeysEnabled) {
            return;
          }
          
          // 忽略输入框中的按键事件
          if (document.activeElement?.tagName === 'INPUT' || 
              document.activeElement?.tagName === 'TEXTAREA') {
            return;
          }
    
          // 创建热键字符串
          const keyString = [
            event.ctrlKey && 'CONTROL',
            event.shiftKey && 'SHIFT',
            event.altKey && 'ALT',
            event.key.toUpperCase()
          ].filter(Boolean).join('+');
    
          // 防止默认行为
          const preventDefaultFor = [
            hotkeys.zoomIn,
            hotkeys.zoomOut,
            hotkeys.rotateLeft,
            hotkeys.rotateRight,
            hotkeys.rotateUp,
            hotkeys.rotateDown,
            hotkeys.prevStep,
            hotkeys.nextStep,
            hotkeys.brush,
            hotkeys.spray,
            hotkeys.switchClass
          ];
    
          if (preventDefaultFor.includes(keyString)) {
            event.preventDefault();
          }
    
          // 工具切换热键处理
          if (keyString === hotkeys.brush) {
            activateBrush();
            return;
          }
    
          if (keyString === hotkeys.spray) {
            activateSpray();
            setSpray('#ffffff'); // 设置默认颜色
            return;
          }
    
          // 其他热键处理
          switch (keyString) {
            case hotkeys.zoomIn:
              zoomCamera(0.9);
              break;
            case hotkeys.zoomOut:
              zoomCamera(1.1);
              break;
            case hotkeys.rotateLeft:
              rotateHorizontal(-Math.PI / 32);
              break;
            case hotkeys.rotateRight:
              rotateHorizontal(Math.PI / 32);
              break;
            case hotkeys.rotateUp:
              rotateVertical(-Math.PI / 32);
              break;
            case hotkeys.rotateDown:
              rotateVertical(Math.PI / 32);
              break;
            case hotkeys.prevStep:
              modelStore.undo(modelStore.modelId);
              updateMeshColors();
              break;
            case hotkeys.nextStep:
              modelStore.redo(modelStore.modelId);
              updateMeshColors();
              break;
            case hotkeys.switchClass:
              switchToNextClass();
              break;
          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [
        hotkeys,
        hotkeysEnabled,
        zoomCamera,
        rotateHorizontal,
        rotateVertical,
        modelStore,
        switchToNextClass,
        activateBrush,
        activateSpray,
        setSpray,
        setTool,
        updateMeshColors
      ]);


  // debugging function to log session actions
  // const logSessionActions = (modelId: string) => {
  //   const sessionState = modelStore.sessionStates[modelId];
  //   if (sessionState) {
  //     console.log("Current Session State:");
  //     console.log(`Total Actions: ${sessionState.actions.length}`);
  //     console.log(`Current Action Index: ${sessionState.currentActionIndex}`);
  //     console.log("Actions:");
  //     sessionState.actions.forEach((action, index) => {
  //       console.log(`${index}: ${action.type} - ${JSON.stringify(action.changes)}`);
  //     });
  //   } else {
  //     console.log("No session state found for this model.");
  //   }
  // };


  const linkAnnotationToClass = (coordinates: any, color: string) => {
    if (_.findIndex(currProblem, function (p) {
      return _.findIndex(p.classes, function (c) {
        return c.isAnnotating == true;
      }) != -1;
    }) == -1) return;

    var _currProblem = currProblem;
    _currProblem.forEach(p => {
      p.classes.forEach(c => {
        if (c.isAnnotating) {
          switch (tool) {
            case "spray":
              if (c.annotationType != AnnotationType.SPRAY) {
                c.coordinates = [];
                c.color = "";
              }

              if (!_.includes(c.coordinates, coordinates))
                c.coordinates.push(coordinates);

              c.color = color;
              c.annotationType = AnnotationType.SPRAY;
              break;
            case "keypoint":
              if (c.annotationType != AnnotationType.KEYPOINT) {
                c.coordinates = [];
                c.color = "";
              }

              c.coordinates.push(coordinates.x);
              c.coordinates.push(coordinates.y);
              c.coordinates.push(coordinates.z);

              c.annotationType = AnnotationType.KEYPOINT;
              c.isAnnotating = false;
              break;
            default:
              break;
          }
        }
      })
    })

    updateProblems(_currProblem);
  }

  const setClassToNotAnnotating = () => {
    var _currProblem = currProblem;

    _currProblem.forEach(p => {
      p.classes.forEach(c => {
        c.isAnnotating = c.isAnnotating ? false : c.isAnnotating;
      })
    });

    updateProblems(_currProblem);
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh ref={meshRef} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} />
      <OrbitControls
      ref={orbitControlsRef}
      enableRotate={tool === 'pan'}
      enableZoom
      enablePan
      rotateSpeed={1.0}
      zoomSpeed={1.0}
      panSpeed={1.0}
      minDistance={1}
      maxDistance={100}
    />
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

const ModelDisplay: React.FC<{ modelData: ArrayBuffer, currProblem: ProblemType[], updateProblems: (updateProblems: ProblemType[]) => void; currentFile: string | null; updateModelIDFileMapping : (mapping: ModelIDFileNameMap[]) => void;}> = ({ modelData, currProblem, updateProblems, currentFile, updateModelIDFileMapping}) => {
  return (
    <Canvas style={{ background: 'black' }}>
      <ModelContent modelData={modelData} currProblem={currProblem} updateProblems={updateProblems} currentFile={currentFile} updateModelIDFileMapping={updateModelIDFileMapping}/>
    </Canvas>
  );
};

export default ModelDisplay;
