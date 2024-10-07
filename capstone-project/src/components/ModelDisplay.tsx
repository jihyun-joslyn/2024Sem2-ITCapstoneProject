import React, { useRef, useEffect, useCallback, useContext, useState } from 'react';
import { Canvas, useThree, extend, ThreeEvent } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import {Mesh,MeshStandardMaterial,BufferGeometry,WireframeGeometry,LineSegments,LineBasicMaterial } from 'three';
import ModelContext from './ModelContext';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData }) => {
  const { tool, color } = useContext(ModelContext);//get the tool and color state from siderbar
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



  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh ref={meshRef} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} />
      <OrbitControls  enableRotate={tool === 'pan'}  enableZoom  enablePan  rotateSpeed={1.0}/>
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