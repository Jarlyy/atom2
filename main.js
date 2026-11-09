import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
//initial setup
const mycanvas = document.querySelector('#canvas');
const wraper = mycanvas.parentElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, wraper.clientWidth/ wraper.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: mycanvas, antialias:true});
renderer.setSize(wraper.clientWidth, wraper.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
function resize() {
    const width = wraper.clientWidth;
    const height = wraper.clientHeight;
    camera.aspect = width/height

    renderer.setSize(width,height)
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize()
const properties_wraper = document.querySelector('.properties_window_wraper')
const show_properties_button = document.querySelector('#show_properties_button')
document.querySelector('#properties_hide_button').addEventListener("click", () => {
    properties_wraper.classList.add('hidden')
    //resize();
    show_properties_button.style.display = "block";
});
show_properties_button.addEventListener('click',() => {
    properties_wraper.classList.remove('hidden')
    show_properties_button.style.display = 'none';
    //requestAnimationFrame(()=>{resize()})
})
camera.position.z = 30;
camera.position.y = 20;
camera.lookAt(0,0,0);
//control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
//define colors
const electron_color = "#75aafa"
const proton_color = "#bd112e"
const neutron_color = "#b8bab9"
const orbital_color = "#787b80"

let electrons = new Map();


//proton creating
function create_particle(posx = 0, posy = 0, posz = 0, color) {
    const sphere = new THREE.SphereGeometry(2);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(sphere, mat);

    particle.position.set(posx,posy,posz)
    scene.add(particle);
}
function create_electron(curve, start) {
    const sphere = new THREE.SphereGeometry(1);
    const mat = new THREE.MeshBasicMaterial({ color: electron_color });
    const particle = new THREE.Mesh(sphere, mat);
    // const startPoint = curve.getPointAt(start);
    // particle.position.set(startPoint.x, startPoint.y, startPoint.z);
    scene.add(particle)
    return particle
}



//===========================ORBITALS======================
function create_s_orbital(radius = 2, axis = 'y') {
    const curve_raw = new THREE.ArcCurve(0,0,radius);
    let points_rotated = [];
    if(axis == 'x') {
        for(let point of curve_raw.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(0, point.y, point.x));
        }
    }
    else if(axis =='z'){
        for(let point of curve_raw.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(point.x, point.y, 0));
        }
    } else {
        for(let point of curve_raw.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(point.x, 0, point.y))
        }
    }
    const curve = new THREE.CatmullRomCurve3(points_rotated,true);
    //const geometry = new THREE.BufferGeometry().setFromPoints(points_rotated)
    const geometry = new LineGeometry();
    geometry.setFromPoints(points_rotated)
    const mat = new LineMaterial({ color: orbital_color,linewidth: 5});
    const orbital = new Line2(geometry, mat);
    const speed = 0.02 /radius;
    scene.add(orbital);
    console.log('+')
    points_rotated = curve.getSpacedPoints(100*radius)
    return [points_rotated, speed];
}



function create_p_orbital(len, axis = 'x') {
    const width = len * 0.4
    const beta = Math.acos(width/len)
    const alpha = 2 * Math.PI - 2 * beta
    const height = width * Math.sin(beta);
    const line_length = Math.cos(Math.PI/2 - beta) * len;
    
    const arc_raw_1 = new THREE.ArcCurve(-len, 0, width,beta,  Math.PI * 2 - beta); 
    let points_rotated = [];
    if(axis == 'x') {
        for(let point of arc_raw_1.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(point.x, point.y, 0));
        }
    }
    else if(axis =='z'){
        for(let point of arc_raw_1.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(point.y, 0, point.x));
        }
    }
    else {
        for(let point of arc_raw_1.getPoints(64)) {
            points_rotated.push(new THREE.Vector3(0, point.x, point.y))
        }
    }

    const arc_raw_2 = new THREE.ArcCurve(len, 0, width, Math.PI + beta, Math.PI - beta)
    let points_rotated_2 = [];
    if(axis == 'x') {
        for(let point of arc_raw_2.getPoints(64).reverse()) {
            points_rotated_2.push(new THREE.Vector3(point.x, point.y, 0));
        }
    }
    else if(axis =='z'){
        for(let point of arc_raw_2.getPoints(64).reverse()) {
            points_rotated_2.push(new THREE.Vector3(point.y, 0, point.x));
        }
    }
    else {
        for(let point of arc_raw_2.getPoints(64).reverse()) {
            points_rotated_2.push(new THREE.Vector3(0, point.x, point.y))
        }
    }
    const line1 = new THREE.LineCurve3(points_rotated[points_rotated.length - 1], points_rotated_2[0])
    const line2 = new THREE.LineCurve3(points_rotated_2[points_rotated_2.length-1], points_rotated[0])
    const points_all = points_rotated.concat(line1.getPoints(100)).concat(points_rotated_2).concat(line2.getPoints(100))
    const curve = new THREE.CatmullRomCurve3(points_all)
    const mat = new LineMaterial({ color: orbital_color, linewidth: 5});
    const curve_points = curve.getSpacedPoints(100*len)
    const geometry = new LineGeometry().setFromPoints(curve_points);
    const orbital = new Line2(geometry, mat);
    scene.add(orbital);
    
    return [curve_points, 0.02/len];
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

function render_H() {
    electrons.clear();
    scene.clear();
    // create_particle(0,0,0,proton_color)
    arrange_particles(1,0)
    const list = create_s_orbital(15);
    const curve = list[0];
    const speed = list[1]
    electrons.set(create_electron(curve), [curve, 0,speed]);
}

function render_He() {
    electrons.clear();
    scene.clear();
    const list = create_s_orbital(15);
    const speed = list[1];
    const curve = list[0];
    arrange_particles(2,2);
    electrons.set(create_electron(curve,0), [curve, 0,speed])
    electrons.set(create_electron(curve,0.5), [curve, 0.5,speed])
}
function render_Li() {
    electrons.clear();
    scene.clear();
    const l1 = create_s_orbital(15);
    const s1 = l1[0];
    const speed1 = l1[1];
    const l2 = create_s_orbital(25);
    const s2 = l2[0];
    const speed2 = l2[1];
    arrange_particles(3,4)
    electrons.set(create_electron(s1,0.5), [s1, 0,speed1])
    electrons.set(create_electron(s1,1), [s1, 0.5, speed1])
    electrons.set(create_electron(s2,0), [s2, 0,speed2])
}
function render_Be() {
    electrons.clear();
    scene.clear();
    arrange_particles(4,5)
    const l1 = create_s_orbital(15);
    const s1 = l1[0];
    const speed1 = l1[1];
    const l2 = create_s_orbital(25);
    const s2 = l2[0];
    const speed2 = l2[1];
    electrons.set(create_electron(s1,0), [s1,0, speed1])
    electrons.set(create_electron(s1,0.5), [s1, 0.5, speed1])
    electrons.set(create_electron(s2,0), [s2, 0,speed2])
    electrons.set(create_electron(s2,0), [s2,0.5, speed2])
}
function render_B() {
    electrons.clear();
    scene.clear();
    arrange_particles(4,5)
    const l1 = create_s_orbital(15);
    const s1 = l1[0];
    const speed1 = l1[1];
    const l2 = create_s_orbital(25);
    const s2 = l2[0];
    const speed2 = l2[1];
    const l3 = create_p_orbital(20)
    const p2 = l3[0];
    const speed_2p = l3[1]
    electrons.set(create_electron(s1,0), [s1,0, speed1])
    electrons.set(create_electron(s1,0.5), [s1, 0.5, speed1])
    electrons.set(create_electron(s2,0), [s2, 0,speed2])
    electrons.set(create_electron(s2,0.5), [s2,0.5, speed2])
    electrons.set(create_electron(p2,0.5), [p2,0.5, speed_2p])
}
function render_C() {
    electrons.clear();
    scene.clear();
    arrange_particles(6,6)
    const l1 = create_s_orbital(15);
    const points_s1 = l1[0];
    const speed1 = l1[1];
    const l2 = create_s_orbital(25);
    const points_s2 = l2[0];
    const speed2 = l2[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    l2p = create_p_orbital(20,'y')
    const points_2py = l2p[0]
    electrons.set(create_electron(points_s1,0), [points_s1,0, speed1])
    electrons.set(create_electron(points_s1,0.5), [points_s1, 0.5, speed1])
    electrons.set(create_electron(points_s2,0), [points_s2, 0,speed2])
    electrons.set(create_electron(points_s2,0.5), [points_s2,0.5, speed2])
    electrons.set(create_electron(), [points_2p,0, speed_2p])
    electrons.set(create_electron(), [points_2py,0.5, speed_2p])


}
function render_N() {
    electrons.clear();
    scene.clear();
    arrange_particles(7,7)
    const l1 = create_s_orbital(15);
    const points_1s = l1[0];
    const speed1 = l1[1];
    const l2s = create_s_orbital(25);
    const points_2s = l2s[0];
    const speed2 = l2s[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    const points_2py = create_p_orbital(20,'y')[0]
    const points_2pz = create_p_orbital(20,'z')[0]
    electrons.set(create_electron(), [points_1s,0, speed1])
    electrons.set(create_electron(), [points_1s, 0.5, speed1])
    electrons.set(create_electron(), [points_2s, 0,speed2])
    electrons.set(create_electron(), [points_2s,0.5, speed2])
    electrons.set(create_electron(), [points_2p, 0, speed_2p])
    electrons.set(create_electron(), [points_2py, 0, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0, speed_2p])
}

function render_O() {
    electrons.clear();
    scene.clear();
    arrange_particles(8,8)
    const l1 = create_s_orbital(15);
    const points_1s = l1[0];
    const speed1 = l1[1];
    const l2s = create_s_orbital(25);
    const points_2s = l2s[0];
    const speed2 = l2s[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    const points_2py = create_p_orbital(20,'y')[0]
    const points_2pz = create_p_orbital(20,'z')[0]
    electrons.set(create_electron(), [points_1s,0, speed1])
    electrons.set(create_electron(), [points_1s, 0.5, speed1])
    electrons.set(create_electron(), [points_2s, 0,speed2])
    electrons.set(create_electron(), [points_2s,0.5, speed2])
    electrons.set(create_electron(), [points_2p, 0, speed_2p])
    electrons.set(create_electron(), [points_2p, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2py, 0, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0, speed_2p])


}
function render_F() {
    electrons.clear();
    scene.clear();
    arrange_particles(9,10)
    const l1 = create_s_orbital(15);
    const points_1s = l1[0];
    const speed1 = l1[1];
    const l2s = create_s_orbital(25);
    const points_2s = l2s[0];
    const speed2 = l2s[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    const points_2py = create_p_orbital(20,'y')[0]
    const points_2pz = create_p_orbital(20,'z')[0]
    electrons.set(create_electron(), [points_1s,0, speed1])
    electrons.set(create_electron(), [points_1s, 0.5, speed1])
    electrons.set(create_electron(), [points_2s, 0,speed2])
    electrons.set(create_electron(), [points_2s,0.5, speed2])
    electrons.set(create_electron(), [points_2p, 0, speed_2p])
    electrons.set(create_electron(), [points_2p, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2py, 0, speed_2p])
    electrons.set(create_electron(), [points_2py, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0, speed_2p])


}
function render_Ne() {
    electrons.clear();
    scene.clear();
    arrange_particles(10,10)
    const l1 = create_s_orbital(15);
    const points_1s = l1[0];
    const speed1 = l1[1];
    const l2s = create_s_orbital(25);
    const points_2s = l2s[0];
    const speed2 = l2s[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    const points_2py = create_p_orbital(20,'y')[0]
    const points_2pz = create_p_orbital(20,'z')[0]
    electrons.set(create_electron(), [points_1s,0, speed1])
    electrons.set(create_electron(), [points_1s, 0.5, speed1])
    electrons.set(create_electron(), [points_2s, 0,speed2])
    electrons.set(create_electron(), [points_2s,0.5, speed2])
    electrons.set(create_electron(), [points_2p, 0, speed_2p])
    electrons.set(create_electron(), [points_2p, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2py, 0, speed_2p])
    electrons.set(create_electron(), [points_2py, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0.5, speed_2p])
    electrons.set(create_electron(), [points_2pz, 0, speed_2p])
}
function render_Na() {
    electrons.clear();
    scene.clear();
    arrange_particles(11,12)
    const l1 = create_s_orbital(15);
    const points_1s = l1[0];
    const speed1 = l1[1];
    const l2s = create_s_orbital(25);
    const points_2s = l2s[0];
    const speed2 = l2s[1];
    let l2p = create_p_orbital(20)
    const points_2p = l2p[0];
    const speed_2p = l2p[1]
    const points_2py = create_p_orbital(15,'y')[0]
    const l3s = create_s_orbital(35)
    const points_3s = l3s[0];
    const speed_3s = l3s[1]
    electrons.set(create_electron(), [points_1s,0, speed1])
    electrons.set(create_electron(), [points_1s, 0.5, speed1])
    electrons.set(create_electron(), [points_2s, 0,speed2])
    electrons.set(create_electron(), [points_2s,0.5, speed2])
    electrons.set(create_electron(), [points_2p,0.5, speed_2p])
    electrons.set(create_electron(), [points_2p, 0, speed_2p])
    electrons.set(create_electron(), [points_2py, 0, speed_2p])
    electrons.set(create_electron(), [points_2py, 0.5, speed_2p])
}

//animation_function (used in the end)
function animate() {
    requestAnimationFrame(animate);  
    for (const [electron, array] of electrons) {
        const point = array[1]
        const points_array = array[0]
        const speed = array[2];
        const pos = points_array[Math.floor(point * points_array.length)]
        //pos = curve.getPointAt(point);
        electron.position.set(pos.x, pos.y, pos.z);
        let next_point = (point+speed) % 1
        if(next_point<0) {
            next_point += 1
        } 
        array[1] =next_point
    }
    controls.update();
    renderer.render(scene, camera);
}
 
const dialog = document.querySelector('#selection_menu')
const el_name = document.querySelector('.el_name');

document.getElementById('h').addEventListener('click',() =>
{
    dialog.close();
    el_name.textContent = 'Hydrogen';
    render_H();
});

document.getElementById('he').addEventListener('click', () =>
{
    dialog.close();
    el_name.textContent = 'Helium'
    render_H();
});

document.getElementById('Li').addEventListener('click',() =>
{
    dialog.close();
    el_name.textContent = 'Lithium'
    render_Li();
});



document.getElementById('Be').addEventListener('click', select_Be);
function select_Be() {
    dialog.close();
    el_name.textContent = 'Beryllium'
    render_Be();
}

document.getElementById('B').addEventListener('click', select_B);
function select_B() {
    dialog.close();
    el_name.textContent = 'Boron'
    render_B()
}

document.getElementById('C').addEventListener('click', () => 
{
    dialog.close();
    el_name.textContent = 'Carbon'
    render_C();
});

document.getElementById('N').addEventListener('click',() =>
{
    dialog.close()
    el_name.textContent = 'Nitrogen'
    render_N();
});

const O = document.getElementById('O');
O.addEventListener('click', () => {
    dialog.close();
    el_name.textContent = 'Oxygen'
    render_O();
});

document.getElementById('F').addEventListener('click', () => {
    dialog.close();
    el_name.textContent = 'Fluorine'
    render_F();
});

document.getElementById('Ne').addEventListener('click', () => {
    dialog.close();
    el_name.textContent = 'Neon'
    render_Ne();
});

document.getElementById('Na').addEventListener('click', () => {
    dialog.close();
    el_name.textContent = 'Natrium'
    render_Na();
});

render_H();
animate()