import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
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


let globalControls: OrbitControls | null = null;
let globalCamera: THREE.PerspectiveCamera | null = null;
let globalScene: THREE.Scene | null = null;
let globalRenderer: THREE.WebGLRenderer | null = null;



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

    globalControls = controls;
    globalCamera = camera;
    globalScene = scene;
    globalRenderer = renderer;

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
    setupScene();
    importSTL();
    applyHotkeys();

    // Setup UI event listeners for new hotkeys
    ['flipRight', 'flipLeft', 'undo', 'redo'].forEach(action => {
        document.getElementById(`${action}Hotkey`)?.addEventListener('click', function () {
            hotkeyBeingSet = action as any;
            (this as HTMLInputElement).value = 'Press a key...';
        });
    });
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


// History for undo/redo
let history: THREE.Vector3[] = [];
let historyIndex: number = -1;

// store current hotkey settings
let currentZoomInHotkey = 'Z';
let currentZoomOutHotkey = 'X';
let currentFlipRightHotkey = 'R';
let currentFlipLeftHotkey = 'L';
let currentUndoHotkey = 'CONTROL+Z';
let currentRedoHotkey = 'CONTROL+Y';
let hotkeyBeingSet: 'zoomIn' | 'zoomOut' | 'flipRight' | 'flipLeft' | 'undo' | 'redo' | null = null;
let modifierKey = '';
const zoomInInput = document.getElementById('zoomInHotkey') as HTMLInputElement;
const zoomOutInput = document.getElementById('zoomOutHotkey') as HTMLInputElement;



document.getElementById('zoomInHotkey')!.addEventListener('click', function () {
    hotkeyBeingSet = 'zoomIn';
    zoomInInput.value = 'Press a key...';
});

document.getElementById('zoomOutHotkey')!.addEventListener('click', function () {
    hotkeyBeingSet = 'zoomOut';
    zoomOutInput.value = 'Press a key...';
});

// key presses and mouse events
document.addEventListener('keydown', (event) => {
    if (hotkeyBeingSet) {
        const key = event.key.toUpperCase();
        if (['SHIFT', 'ALT', 'CONTROL'].includes(key)) {
            modifierKey = key;
        } else {
            setHotkey(key);
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (['SHIFT', 'ALT', 'CONTROL'].includes(event.key.toUpperCase())) {
        modifierKey = '';
    }
});

document.addEventListener('wheel', (event) => {
    if (hotkeyBeingSet) {
        setHotkey(event.deltaY > 0 ? 'MouseWheelDown' : 'MouseWheelUp');
    }
});

document.addEventListener('mousedown', (event) => {
    if (hotkeyBeingSet) {
        const mouseButton = event.button === 0 ? 'MouseLeft' : event.button === 2 ? 'MouseRight' : '';
        if (mouseButton) {
            setHotkey(mouseButton);
        }
    }
});

function setHotkey(newKey: string) {
    const fullHotkey = modifierKey ? `${modifierKey}+${newKey}` : newKey;

    // Check for unique hotkey
    const currentHotkeys = [currentZoomInHotkey, currentZoomOutHotkey, currentFlipRightHotkey, currentFlipLeftHotkey, currentUndoHotkey, currentRedoHotkey];
    if (currentHotkeys.includes(fullHotkey)) {
        alert('This hotkey is already assigned.');
        return;
    }

    // Apply the hotkey
    switch (hotkeyBeingSet) {
        case 'zoomIn':
            currentZoomInHotkey = fullHotkey;
            (document.getElementById('zoomInHotkey') as HTMLInputElement).value = fullHotkey;
            break;
        case 'zoomOut':
            currentZoomOutHotkey = fullHotkey;
            (document.getElementById('zoomOutHotkey') as HTMLInputElement).value = fullHotkey;
            break;
        case 'flipRight':
            currentFlipRightHotkey = fullHotkey;
            (document.getElementById('flipRightHotkey') as HTMLInputElement).value = fullHotkey;
            break;
        case 'flipLeft':
            currentFlipLeftHotkey = fullHotkey;
            (document.getElementById('flipLeftHotkey') as HTMLInputElement).value = fullHotkey;
            break;
        case 'undo':
            currentUndoHotkey = fullHotkey;
            (document.getElementById('undoHotkey') as HTMLInputElement).value = fullHotkey;
            break;
        case 'redo':
            currentRedoHotkey = fullHotkey;
            (document.getElementById('redoHotkey') as HTMLInputElement).value = fullHotkey;
            break;
    }

    hotkeyBeingSet = null;
}

function handleHotkey(fullHotkey: string) {
    switch (fullHotkey) {
        case currentZoomInHotkey:
            zoomIn();
            break;
        case currentZoomOutHotkey:
            zoomOut();
            break;
        case currentFlipRightHotkey:
            flipRight();
            break;
        case currentFlipLeftHotkey:
            flipLeft();
            break;
        case currentUndoHotkey:
            undo();
            break;
        case currentRedoHotkey:
            redo();
            break;
    }
}

function applyHotkeys() {
    document.addEventListener('keydown', (event) => {
        const fullHotkey = getFullHotkey(event);
        handleHotkey(fullHotkey);
    });

    document.addEventListener('wheel', (event) => {
        const fullHotkey = getFullHotkey(event);
        handleHotkey(fullHotkey);
        // Prevent default scrolling behavior if the wheel is used for any hotkey
        if ([currentZoomInHotkey, currentZoomOutHotkey, currentFlipRightHotkey, currentFlipLeftHotkey].includes(fullHotkey)) {
            event.preventDefault();
        }
    });

    document.addEventListener('mousedown', (event) => {
        const fullHotkey = getFullHotkey(event);
        handleHotkey(fullHotkey);
    });
}

// assigned function
function zoomIn() {
    if (globalCamera) {
        globalCamera.zoom *= 1.1;
        globalCamera.updateProjectionMatrix();
    }
}

function zoomOut() {
    if (globalCamera) {
        globalCamera.zoom /= 1.1;
        globalCamera.updateProjectionMatrix();
    }
}

function flipRight() {
    if (globalCamera && globalControls) {
        const axis = new THREE.Vector3(0, 1, 0);
        const angle = -Math.PI / 8; // -22.5 degrees
        const point = globalControls.target;
        
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        const translationMatrix = new THREE.Matrix4().makeTranslation(point.x, point.y, point.z);
        const inverseTranslationMatrix = new THREE.Matrix4().makeTranslation(-point.x, -point.y, -point.z);
        
        const matrix = new THREE.Matrix4().multiply(translationMatrix).multiply(rotationMatrix).multiply(inverseTranslationMatrix);
        
        globalCamera.position.applyMatrix4(matrix);
        globalCamera.updateProjectionMatrix();
        saveState();
    }
}

function flipLeft() {
    if (globalCamera && globalControls) {
        const axis = new THREE.Vector3(0, 1, 0);
        const angle = Math.PI / 8; // 22.5 degrees
        const point = globalControls.target;
        
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        const translationMatrix = new THREE.Matrix4().makeTranslation(point.x, point.y, point.z);
        const inverseTranslationMatrix = new THREE.Matrix4().makeTranslation(-point.x, -point.y, -point.z);
        
        const matrix = new THREE.Matrix4().multiply(translationMatrix).multiply(rotationMatrix).multiply(inverseTranslationMatrix);
        
        globalCamera.position.applyMatrix4(matrix);
        globalCamera.updateProjectionMatrix();
        saveState();
    }
}

function saveState() {
    if (globalCamera) {
        history = history.slice(0, historyIndex + 1);
        history.push(globalCamera.position.clone());
        historyIndex = history.length - 1;
    }
}

function undo() {
    if (historyIndex > 0 && globalCamera) {
        historyIndex--;
        globalCamera.position.copy(history[historyIndex]);
        globalCamera.updateProjectionMatrix();
        if (globalRenderer && globalScene) {
            globalRenderer.render(globalScene, globalCamera);
        }
    }
}

function redo() {
    if (historyIndex < history.length - 1 && globalCamera) {
        historyIndex++;
        globalCamera.position.copy(history[historyIndex]);
        globalCamera.updateProjectionMatrix();
        if (globalRenderer && globalScene) {
            globalRenderer.render(globalScene, globalCamera);
        }
    }
}



function getModifiers(event: KeyboardEvent | MouseEvent | WheelEvent): string[] {
    const modifiers = [];
    if (event.shiftKey) modifiers.push('SHIFT');
    if (event.ctrlKey) modifiers.push('CONTROL');
    if (event.altKey) modifiers.push('ALT');
    return modifiers;
}

function getFullHotkey(event: KeyboardEvent | MouseEvent | WheelEvent): string {
    const modifiers = getModifiers(event);

    let key = '';
    if (event instanceof KeyboardEvent) {
        key = event.key.toUpperCase();
    } else if (event instanceof MouseEvent && !(event instanceof WheelEvent)) {
        key = event.button === 0 ? 'MouseLeft' : event.button === 2 ? 'MouseRight' : '';
    } else if (event instanceof WheelEvent) {
        key = event.deltaY > 0 ? 'MouseWheelDown' : 'MouseWheelUp';
    }

    return [...modifiers, key].join('+');
}

function handleZoom(fullHotkey: string) {
    if (fullHotkey === currentZoomInHotkey) {
        zoomIn();
    } else if (fullHotkey === currentZoomOutHotkey) {
        zoomOut();
    }
}


