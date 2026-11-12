
import * as THREE from 'three';

import {
    CSS3DObject,
    CSS3DRenderer
} from 'three/addons/renderers/CSS3DRenderer.js';

import {
    TrackballControls
} from 'three/addons/controls/TrackballControls.js';

import { createDataCard } from './cards.js';

let scene;
let camera;
let renderer;
let controls;
let objects = [];
let layoutControls;
let resizeObserver;
let currentLayout = 'table';
let layoutAnimationId = null;
let cameraAnimationId = null;

// Initialize the visualization.

export function initializeVisualization(records, container) {

    // Clear the container and apply the visualization styling first.
    container.innerHTML = '';
    container.className = 'visualization-stage';

    // Get the container dimensions after applying its CSS.
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        40,
        width / Math.max(height, 1),
        1,
        10000
    );

    renderer = new CSS3DRenderer();

    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    // Create the 3D cards.
    objects = [];

    records.forEach(record => {

        const cardElement = createDataCard(record);
        const object = new CSS3DObject(cardElement);

        scene.add(object);
        objects.push(object);

    });

    // Start with the Table layout by default.
    currentLayout = 'table';

    arrangeTable();

    fitCameraToTable();

    // Create the layout selection buttons.
    createLayoutButtons(container);

    // Create mouse interaction controls.
    controls = new TrackballControls(
        camera,
        renderer.domElement
    );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving = true;

    // Add zoom and reset buttons.
    createZoomControls(container);

    // Start rendering loop.
    animate();

    // Observe changes to the visualization container.
    if (resizeObserver) {
        resizeObserver.disconnect();
    }

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

}

// Arrange cards in table 20 columns and 10 rows.
function arrangeTable() {

    const columns = 20;
    const horizontalSpacing = 200;
    const verticalSpacing = 260;

    objects.forEach((object, index) => {

        const column = index % columns;
        const row = Math.floor(index / columns);

        object.position.set(
            (column * horizontalSpacing) - 1900,
            1170 - (row * verticalSpacing),
            0
        );

        object.rotation.set(0, 0, 0);

    });

}

// Arrange cards in sphere.
function arrangeSphere() {

    const radius = 1800;
    const totalObjects = objects.length;

    objects.forEach((object, index) => {

        // Calculate the angular position of each card.
        const phi = Math.acos(
            -1 + (2 * index) / totalObjects
        );

        const theta = Math.sqrt(totalObjects * Math.PI) * phi;

        // Calculate the 3D coordinates.
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        // Position the card on the sphere.
        object.position.set(x, y, z);

        // Make the card face outward.
        object.lookAt(x * 2, y * 2, z * 2);

    });

}

// Arrange cards in double helix
function arrangeHelix() {

    const radius = 900;
    const verticalSpacing = 35;
    const totalPerStrand = Math.ceil(objects.length / 2);
    const angleStep = 0.22;

    objects.forEach((object, index) => {

        // Alternate cards between the two strands.
        const strand = index % 2;

        // Determine the card's position along its strand.
        const step = Math.floor(index / 2);

        // Calculate the twisting angle.
        const angle = step * angleStep + (strand * Math.PI);

        // Calculate the 3D coordinates.
        const x = radius * Math.cos(angle);
        const y = (step - (totalPerStrand - 1) / 2) * verticalSpacing;
        const z = radius * Math.sin(angle);

        // Position the card.
        object.position.set(x, y, z);

        // Make the card face outward.
        object.lookAt(x * 2, y, z * 2);

    });

}

// Arrange cards in grid with 5 columns, 4 rows, and 10 layers.
function arrangeGrid() {

    const columns = 5;
    const rows = 4;
    const layers = 10;

    const horizontalSpacing = 250;
    const verticalSpacing = 310;
    const depthSpacing = 320;

    objects.forEach((object, index) => {

        // Determine the card's position in the 3D grid.
        const column = index % columns;

        const row = Math.floor(index / columns) % rows;

        const layer = Math.floor(index / (columns * rows));

        // Calculate the 3D coordinates.
        const x =
            (column - (columns - 1) / 2) * horizontalSpacing;

        const y =
            ((rows - 1) / 2 - row) * verticalSpacing;

        const z =
            (layer - (layers - 1) / 2) * depthSpacing;

        // Position the card.
        object.position.set(x, y, z);

        // Keep all cards facing the same direction.
        object.rotation.set(0, 0, 0);

    });

}


// Calculate a suitable camera distance for the Table layout.
function fitCameraToTable() {

    const columns = 20;
    const rows = Math.ceil(objects.length / columns);

    const horizontalSpacing = 200;
    const verticalSpacing = 260;

    const cardWidth = 180;
    const cardHeight = 240;

    const tableWidth = (columns - 1) * horizontalSpacing + cardWidth;
    const tableHeight = (rows - 1) * verticalSpacing + cardHeight;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);

    const aspect = camera.aspect;

    const distanceForHeight =
        tableHeight / (2 * Math.tan(verticalFov / 2));

    const distanceForWidth =
        tableWidth / (2 * Math.tan(verticalFov / 2) * aspect);

    // Add 15% extra space around the cards.
    const distance = Math.max(
        distanceForHeight,
        distanceForWidth
    ) * 1.15;

    camera.position.set(0, 0, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }

}

// Calculate a suitable camera distance for the Sphere layout.
function fitCameraToSphere() {

    const radius = 1800;

    // Include some space for the card dimensions.
    const sphereSize = radius + 180;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;

    const distanceForHeight =
        (sphereSize * 2) / (2 * Math.tan(verticalFov / 2));

    const distanceForWidth =
        (sphereSize * 2) / (2 * Math.tan(verticalFov / 2) * aspect);

    // Add extra space around the sphere.
    const distance = Math.max(
        distanceForHeight,
        distanceForWidth
    ) * 1.15;

    camera.position.set(0, 0, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }

}

// Calculate a suitable camera distance for the Helix layout.
function fitCameraToHelix() {

    const radius = 900;
    const verticalSpacing = 35;
    const totalPerStrand = Math.ceil(objects.length / 2);

    const helixWidth = (radius + 90) * 2;

    const helixHeight =
        (totalPerStrand - 1) * verticalSpacing + 240;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;

    const distanceForHeight =
        helixHeight / (2 * Math.tan(verticalFov / 2));

    const distanceForWidth =
        helixWidth / (2 * Math.tan(verticalFov / 2) * aspect);

    const distance =
        radius + Math.max(
            distanceForHeight,
            distanceForWidth
        ) * 1.15;

    camera.position.set(0, 0, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }

}

// Calculate a suitable camera distance for the Grid layout.
function fitCameraToGrid() {

    const columns = 5;
    const rows = 4;
    const layers = 10;

    const horizontalSpacing = 250;
    const verticalSpacing = 310;
    const depthSpacing = 320;

    const cardWidth = 180;
    const cardHeight = 240;

    // Calculate the overall grid dimensions.
    const gridWidth =
        (columns - 1) * horizontalSpacing + cardWidth;

    const gridHeight =
        (rows - 1) * verticalSpacing + cardHeight;

    const gridDepth =
        (layers - 1) * depthSpacing;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;

    const distanceForHeight =
        gridHeight / (2 * Math.tan(verticalFov / 2));

    const distanceForWidth =
        gridWidth / (2 * Math.tan(verticalFov / 2) * aspect);

    // Account for the grid's depth.
    const halfDepth = gridDepth / 2;

    const distance =
        halfDepth + Math.max(
            distanceForHeight,
            distanceForWidth
        ) * 1.2;

    camera.position.set(0, 0, distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }

}

// Create zoom-in, zoom-out and reset buttons.
function createZoomControls(container) {

    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';

    const zoomInButton = document.createElement('button');
    zoomInButton.className = 'zoom-control-button';
    zoomInButton.textContent = '+';
    zoomInButton.title = 'Zoom In';

    zoomInButton.addEventListener('click', () => {
        const target = controls.target.clone();
        const direction = camera.position.clone().sub(target);
        camera.position.copy(
            target.add(direction.multiplyScalar(0.8))
        );
        controls.update();
    });

    const zoomOutButton = document.createElement('button');
    zoomOutButton.className = 'zoom-control-button';
    zoomOutButton.textContent = '−';
    zoomOutButton.title = 'Zoom Out';

    zoomOutButton.addEventListener('click', () => {
        const target = controls.target.clone();
        const direction = camera.position.clone().sub(target);
        camera.position.copy(
            target.add(direction.multiplyScalar(1.25))
        );
        controls.update();
    });

    const resetButton = document.createElement('button');
    resetButton.className = 'zoom-control-button reset-button';
    resetButton.textContent = '↺';
    resetButton.title = 'Reset View';

    resetButton.addEventListener('click', () => {
        switchLayout(currentLayout);
    });

    zoomControls.append(
        zoomInButton,
        zoomOutButton,
        resetButton
    );

    container.appendChild(zoomControls);

}

// Keep the camera and renderer updated when the container changes size.

function handleResize() {
    if (!renderer || !camera) return;

    const container = renderer.domElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Avoid invalid camera dimensions.
    if (!width || !height) return;

    // Update the camera's aspect ratio.
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Resize the CSS3D renderer.
    renderer.setSize(width, height);

    // Update TrackballControls.
    controls.handleResize();

    // Cancel any outdated camera animation.
    if (cameraAnimationId !== null) {
        cancelAnimationFrame(cameraAnimationId);
        cameraAnimationId = null;
    }

    // Recalculate the camera position for the current layout.
    switch (currentLayout) {
        case 'table':
            fitCameraToTable();
            break;

        case 'sphere':
            fitCameraToSphere();
            break;

        case 'helix':
            fitCameraToHelix();
            break;

        case 'grid':
            fitCameraToGrid();
            break;
    }
}

//add layout switching functions
function createLayoutButtons(container) {

    // Create the layout button container.
    layoutControls = document.createElement('div');
    layoutControls.className = 'layout-controls';

    // Define the four available layouts.
    const layouts = ['table', 'sphere', 'helix', 'grid'];

    layouts.forEach(layout => {

        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'layout-button';
        button.textContent =
            layout.charAt(0).toUpperCase() + layout.slice(1);

        button.dataset.layout = layout;

        // Switch layout when clicked.
        button.addEventListener('click', () => {
            switchLayout(layout);
        });

        layoutControls.appendChild(button);

    });

    container.appendChild(layoutControls);

    // Highlight Table as the initial layout.
    updateActiveLayoutButton();

}


function switchLayout(layout) {

    // Save the current card positions and rotations.
    const startPositions = objects.map(object =>
        object.position.clone()
    );

    const startQuaternions = objects.map(object =>
        object.quaternion.clone()
    );

    // Save the current camera position and viewing target.
    const startCameraPosition = camera.position.clone();
    const startCameraTarget = controls.target.clone();

    // Stop previous animations if the user switches quickly.
    if (layoutAnimationId !== null) {
        cancelAnimationFrame(layoutAnimationId);
        layoutAnimationId = null;
    }

    if (cameraAnimationId !== null) {
        cancelAnimationFrame(cameraAnimationId);
        cameraAnimationId = null;
    }

    currentLayout = layout;

    // Calculate the target card arrangement.
    switch (layout) {

        case 'table':
            arrangeTable();
            break;

        case 'sphere':
            arrangeSphere();
            break;

        case 'helix':
            arrangeHelix();
            break;

        case 'grid':
            arrangeGrid();
            break;

        default:
            return;

    }

    // Save the target card positions and rotations.
    const targetPositions = objects.map(object =>
        object.position.clone()
    );

    const targetQuaternions = objects.map(object =>
        object.quaternion.clone()
    );

    // Restore the original card positions.
    objects.forEach((object, index) => {

        object.position.copy(startPositions[index]);
        object.quaternion.copy(startQuaternions[index]);

    });

    // Calculate the ideal camera position for the new layout.
    switch (layout) {

        case 'table':
            fitCameraToTable();
            break;

        case 'sphere':
            fitCameraToSphere();
            break;

        case 'helix':
            fitCameraToHelix();
            break;

        case 'grid':
            fitCameraToGrid();
            break;

    }

    // Save the target camera position and viewing target.
    const targetCameraPosition = camera.position.clone();
    const targetCameraTarget = controls.target.clone();

    // Restore the original camera position.
    camera.position.copy(startCameraPosition);
    controls.target.copy(startCameraTarget);
    camera.lookAt(controls.target);
    controls.update();

    // Animate the cards.
    animateLayoutTransition(
        startPositions,
        startQuaternions,
        targetPositions,
        targetQuaternions
    );

    // Animate the camera.
    animateCameraTransition(
        startCameraPosition,
        startCameraTarget,
        targetCameraPosition,
        targetCameraTarget
    );

    updateActiveLayoutButton();

}

// add animation function for smooth transitions between layouts
function animateLayoutTransition(
    startPositions,
    startQuaternions,
    targetPositions,
    targetQuaternions
) {

    //transition duration in milliseconds
    const duration = 1800;
    const startTime = performance.now();

    function updateAnimation(currentTime) {

        const elapsed = currentTime - startTime;

        // Calculate animation progress from 0 to 1.
        const progress = Math.min(elapsed / duration, 1);

        // Apply smooth easing.
        const easedProgress =
            progress * progress * (3 - 2 * progress);

        objects.forEach((object, index) => {

            // Animate card positions.
            object.position.lerpVectors(
                startPositions[index],
                targetPositions[index],
                easedProgress
            );

            // Animate card rotations.
            object.quaternion.slerpQuaternions(
                startQuaternions[index],
                targetQuaternions[index],
                easedProgress
            );

        });

        // Continue until the animation finishes.
        if (progress < 1) {

            layoutAnimationId =
                requestAnimationFrame(updateAnimation);

        } else {

            layoutAnimationId = null;

        }

    }

    layoutAnimationId =
        requestAnimationFrame(updateAnimation);

}


//add animation function for smooth camera transitions between layouts
function animateCameraTransition(
    startPosition,
    startTarget,
    targetPosition,
    targetTarget
) {

    const duration = 1800;
    const startTime = performance.now();

    function updateCamera(currentTime) {

        const elapsed = currentTime - startTime;

        const progress = Math.min(elapsed / duration, 1);

        // Smoothly accelerate and decelerate the camera.
        const easedProgress =
            progress * progress * (3 - 2 * progress);

        // Move the camera position.
        camera.position.lerpVectors(
            startPosition,
            targetPosition,
            easedProgress
        );

        // Move the camera viewing target.
        controls.target.lerpVectors(
            startTarget,
            targetTarget,
            easedProgress
        );

        // Keep the camera facing the viewing target.
        camera.lookAt(controls.target);

        controls.update();

        if (progress < 1) {

            cameraAnimationId =
                requestAnimationFrame(updateCamera);

        } else {

            camera.position.copy(targetPosition);
            controls.target.copy(targetTarget);
            camera.lookAt(controls.target);
            controls.update();

            cameraAnimationId = null;

        }

    }

    cameraAnimationId =
        requestAnimationFrame(updateCamera);

}

function updateActiveLayoutButton() {

    if (!layoutControls) return;

    const buttons =
        layoutControls.querySelectorAll('.layout-button');

    buttons.forEach(button => {

        button.classList.toggle(
            'active',
            button.dataset.layout === currentLayout
        );

    });

}

// Continuously render the 3D scene.
function animate() {

    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);

}
