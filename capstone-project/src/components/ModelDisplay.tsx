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


type HotkeyEvent = KeyboardEvent | MouseEvent | WheelEvent;

extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color, hotkeys, orbitControlsRef } = useContext(ModelContext);//get the tool and color state from siderbar
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray, setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const modelStore = useModelStore();
  const { states, keypoints, setState, modelId, setModelId } = useModelStore();
  const sprayRadius = 1;


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

    // add the color into geometry, each vertex use three data to record color
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    // Add the mesh effect to model
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    fitModel();
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
            modelStore.addPaintChange(modelStore.modelId, index, color);
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
  }, [tool, modelStore]);

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

        modelStore.setKeypoint(modelStore.modelId, { x: localPoint.x, y: localPoint.y, z: localPoint.z }, 'purple');
        modelStore.startPaintAction(modelStore.modelId, 'point');
        modelStore.addPaintChange(modelStore.modelId, -1, 'purple'); // Use -1 as a special index for keypoints
        modelStore.endPaintAction(modelStore.modelId);
      }
    };

    if (tool === 'keypoint') {
      window.addEventListener('click', handlePointerClick);
    }

    return () => {
      window.removeEventListener('click', handlePointerClick);
    };
  }, [tool, camera, gl, meshRef, modelStore]);


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

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.copy(center);
      orbitControlsRef.current.update();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {

      // Create hotkey string from event
      const modifiers = [
        event.ctrlKey && 'CONTROL',
        event.shiftKey && 'SHIFT',
        event.altKey && 'ALT'
      ].filter(Boolean);
      
      const keyString = [...modifiers, event.key.toUpperCase()].join('+');

      // Define rotation and zoom amounts
      const ROTATION_AMOUNT = Math.PI / 32; // About 5.625 degrees
      const ZOOM_FACTOR = 0.9; // 10% zoom per step
      // Match hotkeys and execute corresponding actions
      if (keyString === hotkeys.zoomIn) {
        event.preventDefault();
        zoomCamera(ZOOM_FACTOR);
      } else if (keyString === hotkeys.zoomOut) {
        event.preventDefault();
        zoomCamera(1/ZOOM_FACTOR);
      } else if (keyString === hotkeys.rotateLeft) {
        event.preventDefault();
        rotateHorizontal(ROTATION_AMOUNT);
      } else if (keyString === hotkeys.rotateRight) {
        event.preventDefault();
        rotateHorizontal(-ROTATION_AMOUNT);
      } else if (keyString === hotkeys.rotateUp) {
        event.preventDefault();
        rotateVertical(-ROTATION_AMOUNT);
      } else if (keyString === hotkeys.rotateDown) {
        event.preventDefault();
        rotateVertical(ROTATION_AMOUNT);
      } else if (keyString === hotkeys.prevStep) {
        event.preventDefault();
        modelStore.undo(modelStore.modelId);
        updateMeshColors();
      } else if (keyString === hotkeys.nextStep) {
        event.preventDefault();
        modelStore.redo(modelStore.modelId);
        updateMeshColors();
      }
    };

    // const handleMouseDown = (event: MouseEvent) => {
    //   if (checkHotkey(event, hotkeys.zoomIn)) {
    //     zoomCamera(0.9);
    //   } else if (checkHotkey(event, hotkeys.zoomOut)) {
    //     zoomCamera(1.1);
    //     console.log("zoom out triggered");
    //   } else if (checkHotkey(event, hotkeys.rotateLeft)) {
    //     rotateHorizontal(-Math.PI / 32);
    //   } else if (checkHotkey(event, hotkeys.rotateRight)) {
    //     rotateHorizontal(Math.PI / 32);
    //   } else if (checkHotkey(event, hotkeys.rotateUp)) {
    //     rotateVertical(-Math.PI / 32);
    //   } else if (checkHotkey(event, hotkeys.rotateDown)) {
    //     rotateVertical(Math.PI / 32);
    //   } else if (checkHotkey(event, hotkeys.prevStep)) {
    //     modelStore.undo(modelStore.modelId);
    //     updateMeshColors();
    //     //logSessionActions(modelStore.modelId);
    //     console.log("Undo triggered");
    //   } else if (checkHotkey(event, hotkeys.nextStep)) {
    //     modelStore.redo(modelStore.modelId);
    //     updateMeshColors();
    //     //logSessionActions(modelStore.modelId);
    //     console.log("Redo triggered");
    //   }
    // };

    // const handleWheel = (event: WheelEvent) => {
    //   if (checkHotkey(event, hotkeys.zoomIn)) {
    //     zoomCamera(0.9);
    //     event.preventDefault();
    //   } else if (checkHotkey(event, hotkeys.zoomOut)) {
    //     zoomCamera(1.1);
    //     event.preventDefault();
    //   }
    // };

    window.addEventListener('keydown', handleKeyDown);
    // window.addEventListener('mousedown', handleMouseDown);
    // window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // window.removeEventListener('mousedown', handleMouseDown);
      // window.removeEventListener('wheel', handleWheel);
    };
  }, [hotkeys, checkHotkey, zoomCamera, rotateHorizontal, rotateVertical, modelStore]);

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
