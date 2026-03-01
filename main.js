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

camera.position.z = 5;

let dotsArray = [];

// Make analyze function available globally
window.analyzeTradeData = analyzeTradeData;

await loadBorderCoordinates();
renderer.setAnimationLoop(animate);

export function get_dot_radius() {
    return dot_radius;
}

// main program loop
function animate (time) {
    // 1. Spin the globe automatically like the Earth
    sphere.rotation.y += 0.002;
    if (dot_radius > .02) {
        dot_radius -= .025/(dot_radius);
        console.log(dot_radius);
    }

    // 2. Update dot visibility/phasing
    draw_borders();
    
    renderer.render(scene, camera);
}

function draw_borders() {
    if (!dotsArray || dotsArray.length == 0) return;

    // Trigger the phase-out logic for each dot
    for (let i = 0; i < dotsArray.length; i++) {
        dotsArray[i].updateVisibility();
    }
}

async function loadBorderCoordinates() {
    try {
        const response = await fetch('coords.csv');
        const data = await response.text();

        dotsArray = data.trim().split('\n').map(row => {
            const [lat, lon] = row.split(',').map(Number);
            return new Dot(lat, lon); 
        });

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
            displayTradeData(result.data);
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
