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
function create_s_orbital(radius = 2, axis) {
    const curve = new THREE.ArcCurve(0,0,radius); 
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64))
    const mat = new THREE.LineBasicMaterial({ color: orbital_color });
    const orbital = new THREE.LineLoop(geometry, mat);
    scene.add(orbital);
    return curve;
}
function arrange_particles(protons, neutrons) {
    let particles = [];
    const particles_count = protons + neutrons;
    const radius = Math.pow(particles_count, 1/3) * 1.2
    let to_create = [];
    for(let i = 0; i<protons; i++) to_create.push(proton_color)
    for(let i = 0; i<neutrons; i++) to_create.push(neutron_color)
    let search_radius = 2.5;
    for(let color of to_create) {  //for each particle to create
        let placed = 0;
        let attempts = 0;
        while(!placed) {   //trying to place particle
            attempts ++ 
            if(attempts>100) {  //increase search radius if too many attemps
                search_radius += 0.5
                attempts = 0;
            }
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = Math.cbrt(Math.random()) * search_radius;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            let enought_length = true;
            for(let particle of particles) {  //colision check
                const dist = Math.sqrt(Math.pow(particle[0] - x, 2) + Math.pow(particle[1] -y, 2) + Math.pow(particle[2] - z, 2))
                if(dist<3.8) {
                    enought_length = false;
                    break;
                }
            }
            if (enought_length) {
                particles.push([x,y,z,color]); 
                placed = true;
            }
        }
    }
    for(let el of particles) {
        create_particle(el[0], el[1], el[2], el[3])
    }
    console.log('+')
    return particles;
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render1() {
    electrons.clear();
    scene.clear();
    // create_particle(0,0,0,proton_color)
    arrange_particles(1,0)
    const curve = create_s_orbital(10);

    electrons.set(create_electron(curve, 0, scene), [curve, 0]);
}

function render2() {
    electrons.clear();
    scene.clear();
    const curve = create_s_orbital(10);
    arrange_particles(2,2);
    electrons.set(create_electron(curve,0.5,scene), [curve, 0.5])
    electrons.set(create_electron(curve,1,scene), [curve, 1])
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
he.addEventListener('click', () => {document.getElementById('el_name').textContent = 'Helium'});


const h = document.getElementById('h');
h.addEventListener('click', render1);
h.addEventListener('click', close_dialog);
h.addEventListener('click', () => {document.getElementById('el_name').textContent = 'Hydrogen'});

render1();
animate()