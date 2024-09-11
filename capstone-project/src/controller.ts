import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const controls = new OrbitControls(camera, document.body); // 假设渲染器的 DOM 元素为 document.body

export function zoomIn(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    if (controls && controls.enableZoom) {
        camera.position.z *= 0.9; // 相机拉近
        controls.update(); // 更新控制器状态
    } else {
        console.warn('Zoom is not enabled or controls are not provided.');
    }
}

export function zoomOut(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    if (controls && controls.enableZoom) {
        camera.position.z *= 1.1; // 相机拉远
        controls.update(); // 更新控制器状态
    } else {
        console.warn('Zoom is not enabled or controls are not provided.');
    }
}

