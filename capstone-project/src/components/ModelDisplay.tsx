import { OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent, extend, useThree } from '@react-three/fiber';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BufferGeometry, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, WireframeGeometry } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import ModelContext from './ModelContext';



extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color, hotkeys, controlsRef } = useContext(ModelContext);//get the tool and color state from siderbar
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray,setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const {states, setState, modelId,setModelId} = useModelStore();
  const sprayRadius = 1;

  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;

    const loader = new STLLoader();
    let geometry: BufferGeometry = loader.parse(modelData);

    const modelID = modelData.byteLength.toString();
    if (!geometry.index) {
      geometry = BufferGeometryUtils.mergeVertices(geometry);// merge the vertex to optimise the performance
      geometry.computeVertexNormals();
    }


    //use the BVH to accelerate the geometry
    geometry.computeBoundsTree = computeBoundsTree;
    geometry.disposeBoundsTree = disposeBoundsTree;
    meshRef.current.raycast = acceleratedRaycast;
    geometry.computeBoundsTree();

    // get all vertex and add the color about the vertex
    const vertexCount = geometry.attributes.position.count;
    // initialise the color, and default be white
    const colors = new Float32Array(vertexCount * 3).fill(1);

    //load the saved states of color
    const savedData = states[modelId] || {};
    
    if(savedData){
      Object.keys(savedData).forEach( index => {
        const color = new THREE.Color(savedData[Number(index)].color);
        colors[Number(index) * 3] = color.r;
        colors[Number(index)*3+1] = color.g;
        colors[Number(index) *3+2] = color.b;
    });
    }

    setModelId(modelID);


    // add the color into geometry, each vertex use three data to record color
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    //add the mesh effect to model
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    fitModel();
  }, [modelData]);

  const spray = useCallback((position : THREE.Vector2) => {
    
    if (!meshRef.current || !meshRef.current.geometry.boundsTree) return;
    const raycaster = raycasterRef.current;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const colorAttributes = geometry.attributes.color as THREE.BufferAttribute;
    const newColor = new THREE.Color(color);
    raycaster.setFromCamera(position,camera);

    const intersects = raycaster.intersectObject(meshRef.current, true);

    if(intersects.length>0){
        intersects.forEach((intersect: THREE.Intersection) => {
          if(intersect.face){
            const faceIndices = [intersect.face.a,intersect.face.b,intersect.face.c];
            faceIndices.forEach(index => {
              colorAttributes.setXYZ(index,newColor.r,newColor.g,newColor.b);
              setState(modelId,index,color);
            });
            colorAttributes.needsUpdate = true;
          }
        })
    }
  },[color,camera]);

  const handleMouseDown = useCallback((event : ThreeEvent<PointerEvent>) => {
    if(tool != 'spray') return;
    event.stopPropagation();
    setIsSpray(true);
  },[gl,spray]);

  const handleMouseMove = useCallback((event : ThreeEvent<PointerEvent>) => {
    //only spray when tool is spray and click the mouse
    if(!isSpray || tool !== 'spray') return;
    event.stopPropagation();

    // get the weight and height from canvas
    const rect = gl.domElement.getBoundingClientRect();
    //transfer to NDC
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const point = new THREE.Vector2(x,y);

    spray(point);
  },[isSpray,gl,spray]);

  const handleMouseUp = useCallback((event : ThreeEvent<PointerEvent>) => {
    setIsSpray(false);
  },[]);


  //Starting KeyPoint Marking function.
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


const zoomCamera = (factor: number) => {
  if (controlsRef.current) {
    const zoomDirection = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
    zoomDirection.multiplyScalar(factor - 1);
    camera.position.add(zoomDirection);
    controlsRef.current.update();
  }
};

const rotateHorizontal = (angle: number) => {
  if (controlsRef.current) {
      const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
      const cameraPosition = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
      cameraPosition.applyMatrix4(rotationMatrix);
      camera.position.copy(cameraPosition.add(controlsRef.current.target));
      camera.lookAt(controlsRef.current.target);
      controlsRef.current.update();
  }
};

const rotateVertical = (angle: number) => {
  if (controlsRef.current) {
    const rotationAxis = new THREE.Vector3().crossVectors(
      camera.position.clone().sub(controlsRef.current.target),
      camera.up
    ).normalize();
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, angle);
    const cameraPosition = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
    cameraPosition.applyMatrix4(rotationMatrix);
    camera.position.copy(cameraPosition.add(controlsRef.current.target));
    camera.lookAt(controlsRef.current.target);
    controlsRef.current.update();
  }
};

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

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    if (key === hotkeys.zoomIn.toUpperCase()) {
      zoomCamera(0.9);
    } else if (key === hotkeys.zoomOut.toUpperCase()) {
      zoomCamera(1.1);
    } else if (key === hotkeys.rotateLeft.toUpperCase()) {
      rotateHorizontal(-Math.PI / 32);
    } else if (key === hotkeys.rotateRight.toUpperCase()) {
      rotateHorizontal(Math.PI / 32);
    } else if (key === hotkeys.rotateUp.toUpperCase()) {
      rotateVertical(-Math.PI / 32);
    } else if (key === hotkeys.rotateDown.toUpperCase()) {
      rotateVertical(Math.PI / 32);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [hotkeys]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh ref={meshRef} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} />
      <OrbitControls ref={controlsRef} enableRotate={tool === 'pan'} enableZoom enablePan rotateSpeed={1.0}/>
      <lineSegments  ref={wireframeRef} material={new LineBasicMaterial({ color: 'white' })}  />
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