import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const s_geometry = new THREE.SphereGeometry(2, 60, 60, 0, 2*Math.PI, 0, 2*Math.PI);
const s_material = new THREE.MeshBasicMaterial( { color: '#1A164F', wireframe: true, depthTest: true } );
const sphere = new THREE.Mesh( s_geometry, s_material );
scene.add(sphere);

const geometry = new THREE.PlaneGeometry( .01, .01 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
const plane = new THREE.Mesh( geometry, material );
scene.add( plane );

let sphere_phi = 0;
let sphere_theta = 0;

camera.position.z = 5;

// main program loop
function animate (time) {
    face_coords(-28.67, -48.88)
    draw_borders();
    renderer.render(scene, camera);
}
const dotsArray = await loadCoordinates('coords.csv');
renderer.setAnimationLoop(animate);

// TO-DO: rotate border dots
function face_coords(lat, lon) {
    const coords = convert_spherical_coords(lat, lon);
    sphere_phi = sphere.rotation.x = coords[0];
    sphere_theta = sphere.rotation.y = coords[1];
}

function draw_dot(lat, lon) {
    const geometry = new THREE.PlaneGeometry( .01, .01 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh( geometry, material );
    scene.add( plane );

    const coords = convert_spherical_coords(lat, lon);

    // take difference between globe and dot spherical coords
    // then convert spherical coords to rectangluar coords
    plane.position.x = 2*Math.sin(Number(coords[0]) - Number(sphere_phi));
    plane.position.y = 2*Math.sin(Number(coords[1]) - Number(sphere_theta));
    plane.position.z = 2*Math.cos(Number(coords[0]) - Number(sphere_phi));
}

function draw_borders() {
    if (!dotsArray || dotsArray.length === 0) {
        console.error("dotsArray is empty!");
        return;
    }

    for ( const [lon, lat] of dotsArray) {
        draw_dot(lat, lon);
    }
}

// return phi and theta coords from lat and lon
function convert_spherical_coords(lat, lon) {
    return [Number(lon * Math.PI/180), Number(lat * Math.PI/180)];
}

async function loadCoordinates(csvUrl) {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();

        // 1. Split by new line, 2. Filter out empty lines, 3. Map to numbers
        dotsArray = data.trim().split('\n').map(row => {
            // Split by comma and convert strings to Floats
            const [lon, lat] = row.split(',').map(Number);
            return [lon, lat]; 
        });

        // console.log("Loaded 2D Array:", dotsArray);
        return;
    } catch (error) {
        console.error("Error loading the CSV:", error);
    }
}