import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//initial setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 30;
camera.lookAt(0,0,0);
//control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
//define colors
const electron_color = "#75aafa"
const proton_color = "#bd112e"
const neutron_color = "#b8bab9"
const orbital_color = "#ffffff"

let electrons = new Map();

//proton creating
function create_particle(posx = 0, posy = 0, posz = 0, color) {
    const sphere = new THREE.SphereGeometry(2);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(sphere, mat);

    particle.position.set(posx,posy,posz)
    scene.add(particle);
}
function create_electron(curve, start, scene) {
    const sphere = new THREE.SphereGeometry(1);
    const mat = new THREE.MeshBasicMaterial({ color: electron_color });
    const particle = new THREE.Mesh(sphere, mat);
    const startPoint = curve.getPointAt(start);
    particle.position.set(startPoint.x, startPoint.y, startPoint.z);
    scene.add(particle)
    return particle
}
function create_s_orbital(radius = 2) {
    const curve = new THREE.ArcCurve(0,0,radius);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64))
    const mat = new THREE.LineBasicMaterial({ color: orbital_color });
    const orbital = new THREE.LineLoop(geometry, mat);
    scene.add(orbital);
    return curve;
}

function render1() {
    electrons.clear();
    scene.clear();
    create_particle(0,0,0,proton_color)
    const curve = create_s_orbital(10);

    electrons.set(create_electron(curve, 0, scene), [curve, 0]);
    return curve
}

function render2() {
    electrons.clear();
    scene.clear();
    const curve = render1()
    create_particle(2,0,0,neutron_color)
    electrons.set(create_electron(curve,0.5,scene), [curve, 0.5])

}
function randint(min, max) {
  // случайное число от min до (max+1)
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}


function animate() {
    requestAnimationFrame(animate);  
    for (const [electron, array] of electrons) {
        let pos = new THREE.Vector3();
        const point = array[1]
        const curve = array[0]
        pos = curve.getPointAt(point);
        
        electron.position.set(pos.x, pos.y, pos.z);
        array[1] = (point + 0.005)%1
    }
    controls.update();
    renderer.render(scene, camera);
}
const dialog = document.getElementById('selection_menu');
function close_dialog() {
    dialog.close()
}

const he = document.getElementById('he');
he.addEventListener('click', render2);
he.addEventListener('click', close_dialog);


const h = document.getElementById('h');
h.addEventListener('click', render1);
h.addEventListener('click', close_dialog);
render1();
animate()