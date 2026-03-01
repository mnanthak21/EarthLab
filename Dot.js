import * as THREE from 'three';
import { s_radius, sphere, get_dot_radius } from './main.js';

export class Dot {
    constructor(lat, lon) {
        this.geometry = new THREE.PlaneGeometry( .018, .018 );
        this.material = new THREE.MeshBasicMaterial({ 
            color: 0x1C5E0F, 
            side: THREE.DoubleSide, // FIX 1: Allows us to see the plane even if the front faces inward
            transparent: true,     
            opacity: 1
        });
        
        this.plane = new THREE.Mesh( this.geometry, this.material );
        this.lat = lat;
        this.lon = lon;
        
        this.worldPos = new THREE.Vector3(); 

        this.init();
    }

    init() {
        
        sphere.add(this.plane);
    }
    
    updateVisibility() {
        this.plane.getWorldPosition(this.worldPos);
        
        // The globe has a radius of 2. The front is at Z=2, the equator/sides are at Z=0.
        const fadeThreshold = 1; 

        const phi = THREE.MathUtils.degToRad(90 - this.lat);
        const theta = THREE.MathUtils.degToRad(this.lon + 180);

        // FIX 2: Add + 0.01 to the radius so the dots hover slightly above the sphere to prevent Z-fighting
        this.plane.position.setFromSphericalCoords(s_radius + get_dot_radius(), phi, theta);

        // Make the plane lie flat against the surface of the sphere
        this.plane.lookAt(0, 0, 0);
        
        // FIX 3: Changed the hide threshold to 0.0 so they stay visible until they hit the actual horizon
        if (this.worldPos.z < 0.0) {
            this.plane.visible = false;
        } else {
            this.plane.visible = true;
            
            if (this.worldPos.z < fadeThreshold) {
                // Smoothly map Z from [0.0, 1.0] to Opacity [0.0, 1.0]
                this.material.opacity = this.worldPos.z / fadeThreshold;
            } else {
                this.material.opacity = 1;
            }
        }
    }
}
