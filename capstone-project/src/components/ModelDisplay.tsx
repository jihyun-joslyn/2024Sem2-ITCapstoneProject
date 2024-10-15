import React, { useRef, useEffect, useCallback, useContext, useState } from 'react';
import { Canvas, useThree, extend, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, BufferGeometry, LineBasicMaterial, SphereGeometry, MeshBasicMaterial } from 'three';
import ModelContext from './ModelContext';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from './StateStore';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import usePointStore from './PointStore'; // 引入PointStore
import { Graph } from './Graph'; // 引入图类
import { aStarSearch } from './AStar'; // 引入A*算法

extend({});

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color } = useContext(ModelContext); // 获取当前工具状态和颜色
  const { camera, gl, scene } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const { addPoint, points, clearPoints } = usePointStore(); // 从状态管理中获取方法和数据
  const { states, setState, modelId, setModelId } = useModelStore(); // 获取模型和颜色状态
  const [isSpray, setIsSpray] = useState(false);
  const graphRef = useRef<Graph | null>(null); // 用于存储构建的图
  const lineRef = useRef<THREE.Line | null>(null); // 用于存储路径线的引用

  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;

    const loader = new STLLoader();
    let geometry: BufferGeometry = loader.parse(modelData);

    const modelID = modelData.byteLength.toString();
    if (!geometry.index) {
      geometry = BufferGeometryUtils.mergeVertices(geometry); // 合并顶点，优化性能
      geometry.computeVertexNormals();
    }

    // 使用BVH加速射线投射
    geometry.computeBoundsTree = computeBoundsTree;
    geometry.disposeBoundsTree = disposeBoundsTree;
    meshRef.current.raycast = acceleratedRaycast;
    geometry.computeBoundsTree();

    // 获取所有顶点并添加颜色，默认颜色为白色
    const vertexCount = geometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3).fill(1);

    // 加载已保存的顶点颜色状态
    const savedData = states[modelId] || {};
    if (savedData) {
      Object.keys(savedData).forEach(index => {
        const savedColor = new THREE.Color(savedData[Number(index)].color);
        colors[Number(index) * 3] = savedColor.r;
        colors[Number(index) * 3 + 1] = savedColor.g;
        colors[Number(index) * 3 + 2] = savedColor.b;
      });
    }

    setModelId(modelID);

    // 为几何体设置颜色属性
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    // 添加线框效果
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    // 构建图结构
    graphRef.current = new Graph(geometry); // 构建图结构
  }, [modelData]);

  // 处理用户点击事件，选择点
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (tool !== 'select') return; // 确保当前工具为“选择”模式

      event.stopPropagation();
      if (!meshRef.current) return;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const rect = gl.domElement.getBoundingClientRect();

      // 将鼠标位置转换为标准化设备坐标（NDC）
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(meshRef.current, false);

      if (intersects.length > 0) {
        // 获取点击位置
        const intersect = intersects[0];
        const point = intersect.point;

        // 获取几何体的顶点属性
        const geometry = meshRef.current.geometry as BufferGeometry;
        const positions = geometry.attributes.position as THREE.BufferAttribute;

        // 查找距离点击点最近的顶点索引
        let closestVertexIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < positions.count; i++) {
          const vertex = new THREE.Vector3(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );
          const distance = vertex.distanceTo(point);
          if (distance < minDistance) {
            minDistance = distance;
            closestVertexIndex = i;
          }
        }

        if (closestVertexIndex !== -1) {
          const closestVertex = new THREE.Vector3(
            positions.getX(closestVertexIndex),
            positions.getY(closestVertexIndex),
            positions.getZ(closestVertexIndex)
          );
          addPoint({ position: closestVertex, index: closestVertexIndex });

          // 在模型上显示选取的点
          const sphereGeometry = new SphereGeometry(0.2, 16, 16); // 小球体
          const sphereMaterial = new MeshBasicMaterial({ color: 'red' });
          const sphere = new Mesh(sphereGeometry, sphereMaterial);
          sphere.position.copy(closestVertex);
          scene.add(sphere);
        }

        // 如果选取了两个点，执行A*算法
        if (points.length === 2 && graphRef.current) {
          const startIndex = points[0].index;
          const endIndex = points[1].index;

          const path = aStarSearch(graphRef.current, startIndex, endIndex);

          if (path) {
            // 从节点索引获取位置
            const pathPositions = path.map(index => graphRef.current!.nodes.get(index)!.position.clone());
          
            // 绘制路径线
            const lineMaterial = new LineBasicMaterial({ color: 'blue' });
            const lineGeometry = new BufferGeometry().setFromPoints(pathPositions);
          
            // 移除之前的线
            if (lineRef.current) {
              scene.remove(lineRef.current);
            }
          
            const line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
            lineRef.current = line;
          } else {
            console.error('未找到路径');
          }
          // 清除选取的点，以便下一次选择
          clearPoints();
        }
      }
    },
    [tool, camera, gl, addPoint, points, scene, clearPoints]
  );

  // 处理鼠标按下，开启喷涂模式
  const handleMouseDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (tool !== 'spray') return;
    event.stopPropagation();
    setIsSpray(true);
  }, [tool]);

  // 处理鼠标移动，进行喷涂操作
  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isSpray || tool !== 'spray') return;
    event.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const point = new THREE.Vector2(x, y);
    spray(point);
  }, [isSpray, tool]);

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
            setState(modelId, index, color); // 保存颜色状态
          });
          colorAttributes.needsUpdate = true;
        }
      });
    }
  }, [color, camera, modelId, setState]);

  // 绘制点之间的连线
  useEffect(() => {
    if (points.length < 2) return;

    // 创建线段的几何体
    const lineMaterial = new LineBasicMaterial({ color: 'yellow' });
    const lineGeometry = new BufferGeometry().setFromPoints(points.map(p => p.position));

    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);

    // 清除先前的线段，确保只显示最新的
    return () => {
      scene.remove(line);
    };
  }, [points, scene]);

  // 处理鼠标抬起，结束喷涂
  const handleMouseUp = useCallback(() => {
    setIsSpray(false);
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh
        ref={meshRef}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onClick={handleClick} // 添加点击事件处理
      />
      <OrbitControls enableRotate={tool === 'pan'} enableZoom enablePan rotateSpeed={1.0} />
      <lineSegments ref={wireframeRef} material={new LineBasicMaterial({ color: 'white' })} />
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
