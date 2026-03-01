import * as THREE from 'three';
import { Dot } from './Dot.js';

export const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

export const s_radius = 2;
export const s_geometry = new THREE.SphereGeometry(s_radius, 60, 60);
export const s_material = new THREE.MeshBasicMaterial( { color: '#1A164F', wireframe: true } );
export const sphere = new THREE.Mesh( s_geometry, s_material );

export let dot_radius = 3;

scene.add(sphere);

// Optional: Give the Earth a realistic tilt
sphere.rotation.z = 23.5 * Math.PI / 180;
sphere.rotation.x = Math.PI/3;
sphere.rotation.y = -Math.PI/2;

camera.position.z = 5;

let dotsArray = [];

// let intialized = false;

let curr_start = 1;
await loadBorderCoordinates(curr_start, curr_start + 500);
renderer.setAnimationLoop(animate);

export function get_dot_radius() {
    return dot_radius;
}

// main program loop
function animate (time) {
    // 1. Spin the globe automatically like the Earth
    sphere.rotation.y += 0.001;
    if (dot_radius > .02) {
        dot_radius -= .02/(dot_radius);
        console.log(dot_radius);
    } else {
        dot_radius = .01;
    }
    
    // if (is_blank()) {
    //     curr_start += 501;
    // }
    
    // 2. Update dot visibility/phasing
    draw_borders();
    
    renderer.render(scene, camera);

    console.log(time);

    // if (initialized == true) {
    //     loadBorderCoordinates(1);
    //     initialized = false;
    // }

}

function draw_borders() {
    if (!dotsArray || dotsArray.length == 0) return;

    // Trigger the phase-out logic for each dot
    for (let i = 0; i < dotsArray.length; i++) {
        dotsArray[i].updateVisibility();
    }
}

function is_blank() {
    return sphere.rotation.y > 28 && sphere.rotation.y < 26;
}

async function loadBorderCoordinates(start, end) {
    try {
        const response = await fetch('world_coords.csv');
        const data = await response.text();

        // 1. Split the data into an array of rows first
        const rows = data.trim().split('\n');

        // 2. Initialize dotsArray as an empty array
        dotsArray = [];

        // 3. Loop through each row
        for (let i = 0; i < 8000 - 1; i++) {
            // Split by comma and convert strings to numbers
            const [lat, lon] = rows[i].split(',').map(Number);
            
            // Create the new Dot and push it into the array
            dotsArray.push(new Dot(lat, lon));
        }

        // console.log("Loaded Dots Array:", do tsArray);
    } catch (error) {
        console.error("Error loading the CSV:", error);
    }
}
