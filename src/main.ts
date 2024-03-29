import * as THREE from 'three';
import { Pane } from 'tweakpane';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';


// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera setup
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.update();

// HDR Environment setup
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
new RGBELoader().setPath('assets/').load('environment.hdr', function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Dropzone and file input setup
const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

dropzone.addEventListener('dragover', event => {
    event.preventDefault();
    event.stopPropagation();
}, false);

dropzone.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    handleFile(event.dataTransfer!.files[0]);
}, false);

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    if (fileInput.files!.length > 0) {
        handleFile(fileInput.files![0]);
    }
});

function handleFile(file: File) {
    if (file.name.toLowerCase().endsWith('.glb')) {
        loadGLBFile(file);
    } else {
        alert('Unsupported file format. Please select only GLB files.');
    }
}

function loadGLBFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        hideDropzone();
        const loader = new GLTFLoader();
        loader.parse(event.target!.result as ArrayBuffer, '', (gltf) => {
            centerAndScaleModel(gltf.scene);
            scene.add(gltf.scene);
        }, (error) => {
            console.error('Error loading GLB file:', error);
        });
    };
    reader.readAsArrayBuffer(file);
}

function centerAndScaleModel(model: THREE.Object3D, scaleRadius = 2.0) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = scaleRadius / maxSize;
    model.scale.setScalar(scale);
}

function hideDropzone() {
    dropzone.style.display = 'none';
}

// Window resize event listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


const pane = new Pane({title: 'Controls'});
pane.element.style.position = 'absolute';
pane.element.style.top = '0px';
pane.element.style.right = '0px';
