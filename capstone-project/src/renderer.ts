import './index.css';

function showPanel(panel: string): void {
    const labelPanel = document.getElementById('label-panel');
    const problemPanel = document.getElementById('problem-panel');

    if (panel === 'label') {
        labelPanel.style.display = 'block';
        problemPanel.style.display = 'none';
    } else if (panel === 'problem') {
        labelPanel.style.display = 'none';
        problemPanel.style.display = 'block';
    }
}

// add a listener, because webpack will package them so add lestener will be more security.
document.addEventListener('DOMContentLoaded', () => {
    const labelButton = document.getElementById('label-button');
    const problemButton = document.getElementById('problem-button');

    if (labelButton) {
        labelButton.addEventListener('click', () => showPanel('label'));
    }
    if (problemButton) {
        problemButton.addEventListener('click', () => showPanel('problem'));
    }
});


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function setupScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementsByClassName('display-area')[0].appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    return { scene, camera, renderer, controls };
}

function importSTL() {
    const { scene, camera, renderer, controls } = setupScene();
    const input = document.getElementById('file-input') as HTMLInputElement;

    document.getElementById('import').addEventListener('click', () => {
        input.click();
    });

    input.addEventListener('change', function(event) {
        const target = event.target as HTMLInputElement;
        const file = target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const loader = new STLLoader();
            const geometry = loader.parse(e.target.result as ArrayBuffer);
            const material = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframeGeometry = new THREE.WireframeGeometry(geometry);
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            scene.add(wireframe);

            // focus on the central of model
            const box = new THREE.Box3().setFromObject(mesh);
            const center = box.getCenter(new THREE.Vector3());
            controls.target.set(center.x, center.y, center.z);
            controls.update();

            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }
            animate();
        };
        reader.readAsArrayBuffer(file);
    });
}
window.onload = function() {
    importSTL();
};

//hotkey page
document.getElementById('hotkey').addEventListener('click', () => {
    const hotkeySettings = document.getElementById('hotkeySettings');
    if (hotkeySettings) {
        hotkeySettings.style.display = 'block';
    }
});

document.getElementById('closeHotkeySettings').addEventListener('click', () => {
    const hotkeySettings = document.getElementById('hotkeySettings');
    if (hotkeySettings) {
        hotkeySettings.style.display = 'none';
    }
});

const hotkeys = {
    hotkey1: 'KeyA',
    hotkey2: 'KeyB',
    hotkey3: 'KeyC',
};

function setHotkeyListeners() {
    const hotkeyKeys = ['hotkey1', 'hotkey2', 'hotkey3'] as const;

    hotkeyKeys.forEach(hotkeyId => {
        const hotkeyInput = document.getElementById(hotkeyId) as HTMLInputElement;
        hotkeyInput.value = hotkeys[hotkeyId]; // display current hotkey
        hotkeyInput.addEventListener('click', () => {
            document.addEventListener('keydown', function handler(e) {
                hotkeys[hotkeyId] = e.code;
                hotkeyInput.value = e.code;
                document.removeEventListener('keydown', handler);
            });
        });
    });
}


document.getElementById('saveHotkeys').addEventListener('click', () => {
    console.log('Hotkeys saved:', hotkeys);
    alert('Hotkeys saved successfully!');
    const hotkeySettings = document.getElementById('hotkeySettings');
    if (hotkeySettings) {
        hotkeySettings.style.display = 'none';
    }
});

// initialize hot key
setHotkeyListeners();