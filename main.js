import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let player;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let playerSpeed = 0.05; // Réduction de la vitesse de déplacement
let tasks = [];
let obstacles = [];
let nearTask = null;
let score = 0;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Controls setup
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    const blocker = document.getElementById('blocker');

    instructions.addEventListener('click', function () {
        controls.lock();
    }, false);

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    scene.add(controls.getObject());

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50); // Terrain plus grand
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player (simple cube for now)
    const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    scene.add(player);

    // Add some obstacles
    addObstacles();

    // Add tasks
    createTasks();

    // Add roof
    addRoof();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function addObstacles() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 2, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });

    for (let i = 0; i < 10; i++) { // Plus d'obstacles pour un terrain plus grand
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            Math.random() * 40 - 20,
            1,
            Math.random() * 40 - 20
        );
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

function createTasks() {
    const taskGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const taskMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    for (let i = 0; i < 10; i++) { // Plus de tâches pour un terrain plus grand
        const task = new THREE.Mesh(taskGeometry, taskMaterial);
        task.position.set(
            Math.random() * 40 - 20,
            0.25,
            Math.random() * 40 - 20
        );
        scene.add(task);
        tasks.push(task);
    }
}

function addRoof() {
    const roofGeometry = new THREE.PlaneGeometry(50, 50); // Toit de la même taille que le sol
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5; // Position du toit au-dessus du joueur
    roof.rotation.x = Math.PI / 2;
    scene.add(roof);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'KeyE':
            if (nearTask) {
                console.log('Task completed!');
                scene.remove(nearTask);
                tasks = tasks.filter(t => t !== nearTask);
                score++;
                nearTask = null;
                updateUI();
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function checkTaskProximity() {
    nearTask = null;
    for (let task of tasks) {
        if (player.position.distanceTo(task.position) < 1) {
            nearTask = task;
            break;
        }
    }
}

function checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(player);

    for (let obstacle of obstacles) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            console.log('Collision detected!');
            return true;
        }
    }
    return false;
}

function updateUI() {
    document.getElementById('taskCount').textContent = tasks.length;
    document.getElementById('score').textContent = score;
}

function animate() {
    requestAnimationFrame(animate);

    // Save player's initial position
    const initialPosition = player.position.clone();

    // Player movement
    if (moveForward) player.position.z -= playerSpeed;
    if (moveBackward) player.position.z += playerSpeed;
    if (moveLeft) player.position.x -= playerSpeed;
    if (moveRight) player.position.x += playerSpeed;

    // Check for collisions
    if (checkCollisions()) {
        // Revert to initial position if a collision is detected
        player.position.copy(initialPosition);
    }

    // Update camera to follow player
    controls.getObject().position.x = player.position.x;
    controls.getObject().position.z = player.position.z;
    controls.getObject().position.y = player.position.y + 1.5;

    checkTaskProximity();
    renderer.render(scene, camera);
}

init();
updateUI();
animate();
