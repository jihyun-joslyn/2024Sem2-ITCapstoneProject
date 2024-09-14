import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, BufferGeometry, WireframeGeometry, LineSegments, LineBasicMaterial } from 'three';

extend({ WireframeGeometry });

type ModelDisplayProps = {
  modelData: ArrayBuffer;
};

const ModelDisplay: React.FC<ModelDisplayProps> = ({ modelData }) => {
    const meshRef = useRef<Mesh>(null); 
    const wireframeRef = useRef<LineSegments>(null); 

    useEffect(() => {
        if (!meshRef.current || !wireframeRef.current) return; 

        const loader = new STLLoader();
        const geometry: BufferGeometry = loader.parse(modelData);

        meshRef.current.geometry = geometry;

        const wireframeGeometry = new WireframeGeometry(geometry);
        wireframeRef.current.geometry = wireframeGeometry;
    }, [modelData]);

    return (
        <Canvas>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} />
            <mesh ref={meshRef} material={new MeshStandardMaterial({ color: 'gray' })} />
            <OrbitControls enableRotate={true} enableZoom={true} enablePan={true} rotateSpeed={1.0} />   
            <lineSegments ref={wireframeRef} material={new LineBasicMaterial({ color: 'white' })} />
        </Canvas>
    );
};

export default ModelDisplay;