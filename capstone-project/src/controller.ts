import * as THREE from 'three';

export function zoomIn(camera: THREE.Camera, controls?: any) {
    camera.position.z *= 0.9;
    camera.updateProjectionMatrix();
    if (controls) {
        controls.update();
    }
}

export function zoomOut(camera: THREE.Camera, controls?: any) {
    camera.position.z *= 1.1;
    camera.updateProjectionMatrix();
    if (controls) {
        controls.update();
    }
}
