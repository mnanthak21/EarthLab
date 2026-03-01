import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Dot } from './Dot.js';
import { Center } from './Center.js';

export const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Grab the .plane from every Center object
    const centerPlanes = centersArray.map(center => center.plane);

    const intersects = raycaster.intersectObjects(centerPlanes);

    if (intersects.length > 0) {
        const clickedPlane = intersects[0].object;
        
        // Make sure it's not hidden behind the globe
        if (clickedPlane.visible && clickedPlane.material.opacity > 0) {
            
            // Find our original Center class instance
            const clickedCenter = centersArray.find(c => c.plane === clickedPlane);
            on_center_click(clickedCenter);
        }
    }
});

export function on_center_click(centerObject) {
    teleport_to_region_phi_theta()
    console.log("Clicked on " + centerObject.country + " at Coordinates:", centerObject.lat, centerObject.lon);
    
    const coords = country_to_globe_coords(centerObject.region, centerObject.country);
    teleport_to_region_phi_theta(...coords);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

export let s_radius = 3;
export const s_geometry = new THREE.SphereGeometry(s_radius, 40, 40);
export const s_material = new THREE.MeshBasicMaterial( { color: '#1A164F', wireframe: true } );
export const sphere = new THREE.Mesh( s_geometry, s_material );

export let dot_radius = 3;
export let curr_region;

scene.add(sphere);

let country_codes;

async function load_country_codes() {
    const response = await fetch('codes.json');
    country_codes = await response.json();
}

await load_country_codes();

// Global variable to hold your data once it loads
let world_data = null;

async function loadWorldData() {
    const response = await fetch('world_data.json');
    world_data = await response.json();
}

await loadWorldData();

sphere.rotation.z = 23.5 * Math.PI / 180;
await user_input_region("South America");

camera.position.z = 5;

let dotsArray = [];
let centersArray = [];

// Make analyze function available globally
window.analyzeTradeData = analyzeTradeData;

await loadBorderCoordinates();
await loadCenterCoordinates();
renderer.setAnimationLoop(animate);

export function get_dot_radius() {
    return dot_radius;
}

// main program loop
function animate (time) {
    // 1. Spin the globe automatically like the Earth
    sphere.rotation.y += 0.002;
    if (dot_radius > .02) {
        dot_radius -= .02;
        console.log(dot_radius);
    }
    // 2. Update dot visibility/phasing
    draw_borders();
    draw_centers();
    
    renderer.render(scene, camera);
}

function draw_borders() {
    if (!dotsArray || dotsArray.length == 0) return;

    // Trigger the phase-out logic for each dot
    for (let i = 0; i < dotsArray.length; i++) {
        dotsArray[i].updateVisibility();
    }
}

function draw_centers() {
    if (!centersArray || centersArray.length === 0) return;

    // Trigger the phase-out logic for each center plane
    for (let i = 0; i < centersArray.length; i++) {
        centersArray[i].updateVisibility();
    }
}

async function loadBorderCoordinates() {
    try {
        const response = await fetch('world_coords.csv');
        const data = await response.text();

        // 1. Split the data into an array of rows first
        const rows = data.trim().split('\n');

        // 2. Initialize dotsArray as an empty array
        dotsArray = [];

        // 3. Loop through each row
        for (let i = 0; i < 10930; i++) {
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

// Trade data analysis function
async function analyzeTradeData() {
    const product = document.getElementById('product').value;
    const country = document.getElementById('country').value;
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const analyzeBtn = document.getElementById('analyze');
    
    // Validation
    if (!product || !country) {
        statusDiv.innerHTML = '<span class="error">Please enter both product and country code</span>';
        return;
    }
    
    // Show loading state
    statusDiv.innerHTML = 'Loading...';
    analyzeBtn.disabled = true;
    resultsDiv.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:5000/api/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: product,
                country: country
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch trade data');
        }
        
        if (result.success && result.data) {
            // Display results
            mapTradeData(result.data);
            statusDiv.innerHTML = '<span class="success">Analysis complete!</span>';
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        statusDiv.innerHTML = `<span class="error">Error: ${error.message}</span>`;
        console.error('Error fetching trade data:', error);
    } finally {
        analyzeBtn.disabled = false;
    }
}

function displayTradeData(data) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    
    if (!data || data.length === 0) {
        resultsContent.innerHTML = '<p>No trade data found.</p>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    // Build HTML for trade data
    let html = '';
    data.forEach((item, index) => {
		// console.log(item)
        html += `
            <div class="trade-item">
                <strong>${item.partnerDesc || 'Unknown'}</strong> → ${item.reporterDesc || 'Unknown'}<br/>
                <em>${item.cmdDesc || 'Unknown commodity'}</em><br/>
                Value: $${(item.primaryValue || 0).toLocaleString()}
            </div>
        `;
    });
    
    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}



async function mapTradeData(data) {
	const response = await fetch('Countries.json');
	const worldData = await response.json();

	
	let radius = s_radius;
	data.forEach((item) => {
		if (item.partnerDesc in worldData && item.reporterDesc in worldData) {
			
			let partner = worldData[item.partnerDesc];
			let reporter = worldData[item.reporterDesc];

						
			// Convert lat/lon to radians
			const phi2 = THREE.MathUtils.degToRad(90 - partner.lat);
			const theta2 = THREE.MathUtils.degToRad(partner.lon + 180);

			const phi1 = THREE.MathUtils.degToRad(90 - reporter.lat);
			const theta1 = THREE.MathUtils.degToRad(reporter.lon + 180);

			// Convert spherical to Cartesian coordinates
			const v2 = new THREE.Vector3().setFromSphericalCoords(
                radius,
				phi2,
				theta2
			);

			const v0 = new THREE.Vector3().setFromSphericalCoords(
				radius,
				phi1,
				theta1
			);
			
			// Elevated Midpoint
			const mid = v0.clone().add(v2).multiplyScalar(0.5);
			mid.normalize().multiplyScalar(radius + 2.0);

			// Create Bezier curve
			const curve = new THREE.QuadraticBezierCurve3(v0, mid, v2);
		    console.log(data.primaryValue);

			//let size = Math.log(data.primaryValue)/Math.log(100);
			//if (size < 0.05) {
			//	size = 0.05;
			//} 	
			// const geometry = new THREE.TubeGeometry(
			// 	curve,
			// 	25,
			// 	0.05,
			// 	8,
			// 	false
			// );

			// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
			// const mesh = new THREE.Mesh(geometry, material);

			const points = curve.getPoints(25);
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const material = new THREE.LineBasicMaterial({ color: 0xffffff });

			const line = new THREE.Line(geometry, material);
			sphere.add(line);
		};
	});
}

async function loadCenterCoordinates() {
    // 1. Use Object.entries to get BOTH the key (string) and the value (data object)
    for (const [regionName, regionData] of Object.entries(world_data)) {
        
        // 2. Do the exact same thing for the countries to get the country string name!
        for (const [countryName, countryData] of Object.entries(regionData.countries)) {
            
            // Now you have everything! 
            // regionName = "North America"
            // countryName = "Antigua and Barbuda"
            // countryData = { lat: 17.05, lon: -61.8 }
            
            centersArray.push(new Center(countryData.lat, countryData.lon, countryName, regionName));
        }
    }
    console.log("All centers loaded:", centersArray);
}

async function user_input_region(regionName) {
    curr_region = regionName;
    
    // 1. Await the function to get the actual array: [theta, phi]
    const coords = await region_to_globe_coords(regionName);
    
    // 2. Spread the array so theta goes to the first argument, phi to the second
    if (coords) {
        teleport_to_region_phi_theta(...coords); 
    }
} 

// user inputs region, function spits out latittude and longitude converted to globe coords
function region_to_globe_coords(regionName) {

    // 2. Grab the lat/lon directly
    const lat = world_data[regionName].lat;
    const lon = world_data[regionName].lon;

    // 3. Convert to Three.js angles
    const phi = THREE.MathUtils.degToRad(lat);
    const theta = THREE.MathUtils.degToRad(-lon - 180);

    return [theta, phi];
}

function country_to_globe_coords(regionName, countryName) {

    // 2. Grab the lat/lon directly
    const lat = world_data[regionName].countries[countryName].lat;
    const lon = world_data[regionName].countries[countryName].lon;

    // 3. Convert to Three.js angles
    const phi = THREE.MathUtils.degToRad(lat);
    const theta = THREE.MathUtils.degToRad(-lon - 180);

    return [theta, phi];
}

function teleport_to_region_phi_theta(theta, phi) {
    sphere.rotation.y = Number(theta);
    sphere.rotation.x = Number(phi);
}


function country_to_code(country) {
    return country_codes[country];
}
