import React, { useRef, useEffect, useCallback, useContext, useState } from 'react';
import { Canvas, useThree, extend, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import {
  Mesh,
  MeshStandardMaterial,
  BufferGeometry,
  WireframeGeometry,
  LineSegments,
  LineBasicMaterial,
  Vector2,
  Vector3,
  SphereGeometry,
  MeshBasicMaterial,
  Object3D,
} from 'three';
import ModelContext from './ModelContext';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Graph } from './Graph'; // 导入 Graph 类

extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color } = useContext(ModelContext); // 获取工具和颜色状态
  const { camera, gl, scene } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray, setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const { states, setState, modelId, setModelId } = useModelStore();
  const sprayRadius = 1;

  // 新增：用于存储选定的顶点
  const [selectedVertices, setSelectedVertices] = useState<Vector3[]>([]);
  const vertexSpheresRef = useRef<Object3D[]>([]);

  // 新增：用于存储网格的图结构
  const [graph, setGraph] = useState<Graph | null>(null);

  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;

    const loader = new STLLoader();
    let geometry: BufferGeometry = loader.parse(modelData);

    const modelID = modelData.byteLength.toString();
    if (!geometry.index) {
      geometry = BufferGeometryUtils.mergeVertices(geometry); // 合并顶点以优化性能
      geometry.computeVertexNormals();
    }

    // 使用BVH加速射线投射
    geometry.computeBoundsTree = computeBoundsTree;
    geometry.disposeBoundsTree = disposeBoundsTree;
    meshRef.current.raycast = acceleratedRaycast;
    geometry.computeBoundsTree();

    // 获取所有顶点并添加颜色属性，默认颜色为白色
    const vertexCount = geometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3).fill(1);

    // 加载已保存的顶点颜色状态
    const savedData = states[modelId] || {};

    if (savedData) {
      Object.keys(savedData).forEach((index) => {
        const color = new THREE.Color(savedData[Number(index)].color);
        colors[Number(index) * 3] = color.r;
        colors[Number(index) * 3 + 1] = color.g;
        colors[Number(index) * 3 + 2] = color.b;
      });
    }

    setModelId(modelID);

    // 将颜色属性添加到几何体中
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 设置网格的几何体和材质
    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    // 添加线框效果
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    // 构建图结构
    const newGraph = new Graph();
    newGraph.buildFromGeometry(geometry);
    setGraph(newGraph);

    // 调试：输出构建的图结构
    console.log('Graph has been built:', newGraph);
    console.log('Total nodes in graph:', newGraph.nodes.size);

    // 输出前5个节点的邻接列表
    newGraph.nodes.forEach((node, index) => {
      if (index < 5) {
        console.log(`Node ${node.index} neighbors:`, node.neighbors);
      }
    });

  }, [modelData]);

  // 喷涂功能的实现
  const spray = useCallback(
    (position: THREE.Vector2) => {
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
            faceIndices.forEach((index) => {
              colorAttributes.setXYZ(index, newColor.r, newColor.g, newColor.b);
              setState(modelId, index, color);
            });
            colorAttributes.needsUpdate = true;
          }
        });
      }
    },
    [color, camera]
  );

  // 处理鼠标按下事件
  const handleMouseDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (tool === 'spray') {
        event.stopPropagation();
        setIsSpray(true);
      }
    },
    [tool]
  );

  // 处理鼠标移动事件
  const handleMouseMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (isSpray && tool === 'spray') {
        event.stopPropagation();

        // 获取鼠标在画布中的位置，并转换为NDC坐标
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const point = new THREE.Vector2(x, y);

        spray(point);
      }
    },
    [isSpray, gl, spray, tool]
  );

  // 处理鼠标抬起事件
  const handleMouseUp = useCallback(() => {
    setIsSpray(false);
  }, []);

  // 顶点选择功能的实现
  useEffect(() => {
    const handlePointerClick = (event: MouseEvent) => {
      if (!meshRef.current || tool !== 'vertexSelect') return;

      // 获取鼠标在画布中的位置，并转换为NDC坐标
      const rect = gl.domElement.getBoundingClientRect();
      const mousePosition = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // 设置射线投射器
      raycasterRef.current.setFromCamera(mousePosition, camera);

      // 计算与模型的交点
      const intersects = raycasterRef.current.intersectObject(meshRef.current, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const geometry = meshRef.current.geometry as BufferGeometry;
        const positionAttribute = geometry.getAttribute('position');

        // 找到离交点最近的顶点索引
        const face = intersection.face!;
        const vertexIndices = [face.a, face.b, face.c];

        let closestVertexIndex = vertexIndices[0];
        let minDistance = Infinity;

        vertexIndices.forEach((index) => {
          const vertex = new Vector3().fromBufferAttribute(positionAttribute, index);
          const distance = vertex.distanceTo(intersection.point);
          if (distance < minDistance) {
            minDistance = distance;
            closestVertexIndex = index;
          }
        });

        // 获取最近的顶点坐标
        const selectedVertex = new Vector3().fromBufferAttribute(positionAttribute, closestVertexIndex);

        // 将选定的顶点添加到列表中
        setSelectedVertices((prevVertices) => [...prevVertices, selectedVertex]);

        // 可视化选定的顶点
        const sphereGeometry = new SphereGeometry(0.2, 16, 16);
        const sphereMaterial = new MeshBasicMaterial({ color: 'red' });
        const sphere = new Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(selectedVertex);
        scene.add(sphere);
        vertexSpheresRef.current.push(sphere);
      }
    };

    if (tool === 'vertexSelect') {
      gl.domElement.addEventListener('click', handlePointerClick);
    }

    return () => {
      gl.domElement.removeEventListener('click', handlePointerClick);
    };
  }, [tool, camera, gl, meshRef, scene]);

  // 调试：打印选定的顶点列表
  useEffect(() => {
    console.log('Selected Vertices:', selectedVertices);
  }, [selectedVertices]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh
        ref={meshRef}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
      />
      <OrbitControls enableRotate={tool === 'pan'} enableZoom enablePan rotateSpeed={1.0} />
      <lineSegments
        ref={wireframeRef}
        material={new LineBasicMaterial({ color: 'white' })}
      />
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
