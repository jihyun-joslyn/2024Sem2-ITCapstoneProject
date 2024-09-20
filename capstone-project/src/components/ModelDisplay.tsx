import React, { useRef, useEffect, useCallback, useContext, useState} from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, BufferGeometry, WireframeGeometry, LineSegments, LineBasicMaterial } from 'three';
import ModelContext from './ModelContext';
import * as THREE from 'three';

extend({ WireframeGeometry });

type ModelDisplay = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplay> = ({ modelData }) => {
    const { tool, color } = useContext(ModelContext);
    const { scene, camera, raycaster } = useThree();
    const meshRef = useRef<Mesh>(null); 
    const wireframeRef = useRef<LineSegments>(null); 
    const [mousePosition, setMousePosition] = useState<THREE.Vector2>(new THREE.Vector2());
    const [isMouseDown, setIsMouseDown] = useState(false);

    useEffect(() => {
        if (!meshRef.current || !wireframeRef.current) return;

         
        if (meshRef.current.geometry) {
            meshRef.current.geometry.dispose();
            meshRef.current.geometry = null;
        }
        if (wireframeRef.current.geometry) {
            wireframeRef.current.geometry.dispose();
            wireframeRef.current.geometry = null;
        }

         
        const loader = new STLLoader();
        const geometry: BufferGeometry = loader.parse(modelData);
        meshRef.current.geometry = geometry;

        const wireframeGeometry = new WireframeGeometry(geometry);
        wireframeRef.current.geometry = wireframeGeometry;

    }, [modelData]);  

    useEffect(() => {
        const handleMouseDown = () => {
            setIsMouseDown(true);
        };
        const handleMouseUp = () => {
            setIsMouseDown(false);
        };
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition(new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            ));
        };
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    //Starting KeyPoint Marking function.
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small sphere
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 'purple' });
  
    useEffect(() => {
      const handlePointerClick = (event: MouseEvent) => {
        if (!meshRef.current || tool !== 'keypoint') return;
  
        // Update raycaster with the mouse position and camera
        raycaster.setFromCamera(mousePosition, camera);
        
        // Raycast to find intersections with the mesh
        const intersects = raycaster.intersectObject(meshRef.current, true);
        
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
    }, [tool, camera, scene, meshRef, mousePosition, raycaster]);
  



    useFrame(() => {
        if (tool === 'spray' && isMouseDown) {
            raycaster.setFromCamera(mousePosition, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                const [intersect] = intersects;
                const sprayDot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 16, 16),
                    new THREE.MeshBasicMaterial({ color })
                );
                sprayDot.position.copy(intersect.point);
                scene.add(sprayDot);
            }
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} />
            <mesh ref={meshRef} material={new MeshStandardMaterial({ color: 'gray' })} />
            <OrbitControls enableRotate={tool === 'pan'} enableZoom={true} enablePan={true} rotateSpeed={1.0} />
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
