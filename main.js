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
// const show_properties_button = document.querySelector('#show_properties_button')
// document.querySelector('#properties_hide_button').addEventListener("click", () => {
//     properties_wraper.classList.add('hidden')
//     resize();
//     show_properties_button.classList.remove("hidden")
//     //show_properties_button.style.display = "block";
// });
// show_properties_button.addEventListener('click',() => {
//     properties_wraper.classList.remove('hidden')
//     show_properties_button.classList.add("hidden")
//     //show_properties_button.style.display = 'none';
//     //resize();
//     requestAnimationFrame(() => resize());
// })
const resizeObserver = new ResizeObserver(() => {
    resize();
});
if (wraper) resizeObserver.observe(wraper);
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
const active_orbital_color = "#73c795"
const active_electron_color = "#4a92ff"
const inactive_orbital_color = "#373737"
const inactive_electron_color = "#3e4760"

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
    return [points_rotated, speed, orbital];
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
    
    return [curve_points, 0.02/len,orbital];
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

let orbitals_list = new Map();



const electron_configurations = {
    H: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>1</sup></span>
    `,
    He: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span>
    `,
    Li: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>1</sup></span>
    `,
    Be: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span>
    `,
    B: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>1</sup></span>
    `,
    C: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>2</sup></span>
    `,
    N: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>3</sup></span>
    `,
    O: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>4</sup></span>
    `,
    F: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>5</sup></span>
    `,
    Ne: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>6</sup></span>
    `,
    Na: `
        <span class="orbital-clickable" data-orbital="1s">1s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2s">2s<sup>2</sup></span> 
        <span class="orbital-clickable" data-orbital="2p">2p<sup>6</sup></span> 
        <span class="orbital-clickable" data-orbital="3s">3s<sup>1</sup></span>
    `
};
//updating electron configuration label in properties window
const electron_conf = document.querySelector(".electron_conf");
function update_electron_conf(key) {
    electron_conf.innerHTML = electron_configurations[key];
}
//============================================selecting orbital
properties_wraper.addEventListener('click', (event) => {
    if (event.target.classList.contains('orbital-clickable')) {
        const orbitalName = event.target.dataset.orbital; 
        for(const [orb,name] of orbitals_list) {
            if(name==orbitalName) {
                orb.material.color.set(active_orbital_color);
                console.log("set color")
            }
            else{
                orb.material.color.set(inactive_orbital_color)
            }
        }
        for(const [electron,array] of electrons) {
            if(array[3] == orbitalName) {
                electron.material.color.set(active_electron_color)
            }
            else{
                electron.material.color.set(inactive_electron_color)
            }
            
        }
    }
});
const deselect_button = document.querySelector(".deselect_button")
deselect_button.addEventListener("click", () => {
    for(const [electron,array] of electrons) {
        electron.material.color.set(electron_color);
    }
    for(const [orb,] of orbitals_list) {
        orb.material.color.set(orbital_color)
    }
})
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
const neutrons_number= [
        0, 
        0, 2, 4, 5, 6, 6, 7, 8, 10, 10,       // 1 - 10 (H - Ne)
        12, 12, 14, 14, 16, 16, 18, 22, 20, 20, // 11 - 20 (Na - Ca)
        24, 26, 28, 28, 30, 30, 32, 31, 35, 35, // 21 - 30 (Sc - Zn)
        39, 41, 42, 45, 45, 48, 48, 50, 50, 51, // 31 - 40 (Ga - Zr)
        52, 54, 55, 57, 58, 60, 61, 64, 66, 69, // 41 - 50 (Nb - Sn)
        71, 76, 74, 77, 78, 82, 82, 82, 82, 84, // 51 - 60 (Sb - Nd)
        84, 88, 89, 93, 94, 97, 98, 99, 100, 103, // 61 - 70 (Pm - Yb)
        104, 106, 108, 110, 111, 114, 115, 117, 118, 121, // 71 - 80 (Lu - Hg)
        123, 125, 126, 125, 125, 136, 136, 138, 138, 142, // 81 - 90 (Tl - Th)
        140, 146, 144, 150, 148, 151, 150, 153, 153, 157, // 91 - 100 (Pa - Fm)
        157, 157, 159, 163, 163, 163, 163, 169, 169, 171, // 101 - 110 (Md - Ds)
        171, 173, 173, 175, 175, 177, 177, 176  // 111 - 118 (Rg - Og)
    ];
const elements = [
  null,
  ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'],
  ['B', 'Boron'], ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'],
  ['F', 'Fluorine'], ['Ne', 'Neon'], ['Na', 'Sodium'], ['Mg', 'Magnesium'],
  ['Al', 'Aluminium'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'],
  ['Cl', 'Chlorine'], ['Ar', 'Argon'], ['K', 'Potassium'], ['Ca', 'Calcium'],
  ['Sc', 'Scandium'], ['Ti', 'Titanium'], ['V', 'Vanadium'], ['Cr', 'Chromium'],
  ['Mn', 'Manganese'], ['Fe', 'Iron'], ['Co', 'Cobalt'], ['Ni', 'Nickel'],
  ['Cu', 'Copper'], ['Zn', 'Zinc'], ['Ga', 'Gallium'], ['Ge', 'Germanium'],
  ['As', 'Arsenic'], ['Se', 'Selenium'], ['Br', 'Bromine'], ['Kr', 'Krypton'],
  ['Rb', 'Rubidium'], ['Sr', 'Strontium'], ['Y', 'Yttrium'], ['Zr', 'Zirconium'],
  ['Nb', 'Niobium'], ['Mo', 'Molybdenum'], ['Tc', 'Technetium'], ['Ru', 'Ruthenium'],
  ['Rh', 'Rhodium'], ['Pd', 'Palladium'], ['Ag', 'Silver'], ['Cd', 'Cadmium'],
  ['In', 'Indium'], ['Sn', 'Tin'], ['Sb', 'Antimony'], ['Te', 'Tellurium'],
  ['I', 'Iodine'], ['Xe', 'Xenon'], ['Cs', 'Caesium'], ['Ba', 'Barium'],
//   ['La', 'Lanthanum'], ['Ce', 'Cerium'], ['Pr', 'Praseodymium'], ['Nd', 'Neodymium'],
//   ['Pm', 'Promethium'], ['Sm', 'Samarium'], ['Eu', 'Europium'], ['Gd', 'Gadolinium'],
//   ['Tb', 'Terbium'], ['Dy', 'Dysprosium'], ['Ho', 'Holmium'], ['Er', 'Erbium'],
//   ['Tm', 'Thulium'], ['Yb', 'Ytterbium'], ['Lu', 'Lutetium'], ['Hf', 'Hafnium'],
  ['Ta', 'Tantalum'], ['W', 'Tungsten'], ['Re', 'Rhenium'], ['Os', 'Osmium'],
  ['Ir', 'Iridium'], ['Pt', 'Platinum'], ['Au', 'Gold'], ['Hg', 'Mercury'],
  ['Tl', 'Thallium'], ['Pb', 'Lead'], ['Bi', 'Bismuth'], ['Po', 'Polonium'],
  ['At', 'Astatine'], ['Rn', 'Radon'], ['Fr', 'Francium'], ['Ra', 'Radium'],
//   ['Ac', 'Actinium'], ['Th', 'Thorium'], ['Pa', 'Protactinium'], ['U', 'Uranium'],
//   ['Np', 'Neptunium'], ['Pu', 'Plutonium'], ['Am', 'Americium'], ['Cm', 'Curium'],
//   ['Bk', 'Berkelium'], ['Cf', 'Californium'], ['Es', 'Einsteinium'], ['Fm', 'Fermium'],
//   ['Md', 'Mendelevium'], ['No', 'Nobelium'], ['Lr', 'Lawrencium'], ['Rf', 'Rutherfordium'],
  ['Db', 'Dubnium'], ['Sg', 'Seaborgium'], ['Bh', 'Bohrium'], ['Hs', 'Hassium'],
  ['Mt', 'Meitnerium'], ['Ds', 'Darmstadtium'], ['Rg', 'Roentgenium'], ['Cn', 'Copernicium'],
  ['Nh', 'Nihonium'], ['Fl', 'Flerovium'], ['Mc', 'Moscovium'], ['Lv', 'Livermorium'],
  ['Ts', 'Tennessine'], ['Og', 'Oganesson']
];

const neutrons_number_label = document.querySelector('.neutrons_number')
const protons_number_label = document.querySelector('.protons_number')
const dialog = document.querySelector('#selection_menu')
const el_name = document.querySelectorAll('.el_name');
function change_title(element) {
    for(const i of el_name) {
        i.textContent = element;
    } 
}
//==========================================================SELECTING ELEMENTS
for(let el_index = 1; el_index < elements.length; el_index += 1) {
    const el = elements[el_index]
    document.getElementById(el[0]).addEventListener('click', () => {
        render_el(el_index)
        dialog.close();
        change_title(el[1]);
        update_electron_conf(el[0])
        protons_number_label.textContent = el_index;
        neutrons_number_label.textContent = neutrons_number[el_index]
    });
}

/////////////////////////////////rendering elements
function render_el(number) {
    electrons.clear();
    scene.clear();
    
    arrange_particles(number, neutrons_number[number])
    const orbitals_max = [
        { name: '1s', max: 2 },
        { name: '2s', max: 2 }, { name: '2p', max: 6 },
        { name: '3s', max: 2 }, { name: '3p', max: 6 },
        { name: '4s', max: 2 }, { name: '3d', max: 10 }, { name: '4p', max: 6 },
        { name: '5s', max: 2 }, { name: '4d', max: 10 }, { name: '5p', max: 6 },
        { name: '6s', max: 2 }, { name: '4f', max: 14 }, { name: '5d', max: 10 }, { name: '6p', max: 6 },
        { name: '7s', max: 2 }, { name: '5f', max: 14 }, { name: '6d', max: 10 }, { name: '7p', max: 6 }
    ];
    for(const orb of orbitals_max) {
        let size = 0
        let create_orbital = () => {}
        let orientations = []
        if(number > 0) {
            if (orb.name[1] == 's') {
                size = parseInt(orb.name[0]) * 10 + 5
                orientations = ['y']
                create_orbital = (size,orientation) => create_s_orbital(size,orientation);
            }else if(orb.name[1]=='p') {
                size = parseInt(orb.name[0]) * 10
                orientations = ['x','y','z']
                create_orbital = (size,orientation) => create_p_orbital(size,orientation);
            }
            let local_orbitals = []
            let electrons_to_add = Math.min(number,orb.max) 
            for(const orient of orientations) {
                if(electrons_to_add <=0) break;
                const l = create_orbital(size,orient)
                const points_array = l[0]
                const speed = l[1]
                electrons.set(create_electron(), [points_array,0, speed,orb.name])
                local_orbitals.push(l)
                orbitals_list.set(l[2], orb.name)
                electrons_to_add -= 1
                number -= 1
                
            }
            for(const orbital of local_orbitals) {
                if (electrons_to_add <= 0) break;
                electrons.set(create_electron(), [orbital[0],0.5,orbital[1],orb.name])
                number -=1
                electrons_to_add -= 1
            }
            
        }
    }
} 

render_el(1)
update_electron_conf("H")
animate()