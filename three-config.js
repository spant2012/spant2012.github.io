// Three.js Configuration
let scene, camera, renderer, particles, techShapes;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let rafId = null;
let isVisible = true;

// Performance settings
const PERFORMANCE = {
    particles: {
        light: 1000,
        dark: 500     // Reduced from 800 to 500
    },
    cubes: {
        light: 15,
        dark: 5       // Reduced from 20 to 5
    },
    lines: {
        light: 30,
        dark: 10      // Reduced from 40 to 10
    },
    animationSpeed: {
        light: 0.3,
        dark: 0.4     // Reduced from 0.5 to 0.4
    },
    lastTime: 0
};

// Colors for different themes
const COLORS = {
    light: {
        background: 0xf8f9fa,
        particles: [0x4a90e2, 0x50e3c2],  // Blue and Teal
        circuit: 0x4a90e2,
        cubes: 0x50e3c2,
        lines: 0x4a90e2,
        ambientLight: 0xffffff,
        pointLight: 0xffffff
    },
    dark: {
        background: 0x000000,  // Pure black
        particles: [0xff2d55, 0x5856d6],  // Pink and Purple
        circuit: 0xff2d55,
        cubes: 0x5856d6,
        lines: 0xff2d55,
        ambientLight: 0x000000,  // No ambient light in dark mode
        pointLight: 0x5856d6
    }
};

// Initialize the scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.light.background);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create initial particles
    createParticles('light');
    createTechShapes('light');

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('themeChange', onThemeChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Start animation
    animate();
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Visibility change handler
function onVisibilityChange() {
    isVisible = !document.hidden;
    if (isVisible) {
        animate();
    } else {
        cancelAnimationFrame(rafId);
    }
}

function createParticles(theme) {
    if (particles) {
        scene.remove(particles);
    }

    const particleCount = PERFORMANCE.particles[theme];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = theme === 'dark' ? 15 : 15; // Reduced from 20 to 15
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        const color = new THREE.Color();
        if (theme === 'dark') {
            color.setHSL(Math.random() * 0.1 + 0.8, 0.6, 0.5); // Reduced saturation and brightness
        } else {
            color.setHSL(Math.random() * 0.1 + 0.5, 0.6, 0.7);
        }
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = theme === 'dark' ? Math.random() * 0.5 + 0.2 : Math.random() * 0.6 + 0.2; // Reduced size range
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: theme === 'dark' ? 0.6 : 0.8, // Reduced from 0.8 to 0.6
        vertexColors: true,
        transparent: true,
        opacity: theme === 'dark' ? 0.4 : 0.6, // Reduced from 0.7 to 0.4
        sizeAttenuation: true,
        blending: theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function createTechShapes(theme) {
    if (techShapes) {
        scene.remove(techShapes);
    }

    techShapes = new THREE.Group();

    // Update lights based on theme
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            scene.remove(child);
        }
    });

    const ambientLight = new THREE.AmbientLight(COLORS[theme].ambientLight, theme === 'dark' ? 0 : 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(COLORS[theme].pointLight, theme === 'dark' ? 1.5 : 0.8);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Circuit board pattern
    const circuitGeometry = new THREE.PlaneGeometry(40, 40, theme === 'dark' ? 15 : 20, theme === 'dark' ? 15 : 20); // Reduced complexity
    const circuitMaterial = new THREE.MeshBasicMaterial({
        color: COLORS[theme].circuit,
        wireframe: true,
        transparent: true,
        opacity: theme === 'dark' ? 0.08 : 0.1 // Reduced from 0.15 to 0.08
    });
    const circuit = new THREE.Mesh(circuitGeometry, circuitMaterial);
    circuit.rotation.x = Math.PI / 4;
    techShapes.add(circuit);

    // Floating cubes
    const cubeCount = PERFORMANCE.cubes[theme];
    for (let i = 0; i < cubeCount; i++) {
        const size = theme === 'dark' ? Math.random() * 0.4 + 0.2 : Math.random() * 0.4 + 0.3; // Reduced size range
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({
            color: COLORS[theme].cubes,
            transparent: true,
            opacity: theme === 'dark' ? 0.2 : 0.2, // Reduced from 0.4 to 0.2
            shininess: theme === 'dark' ? 100 : 100,
            wireframe: theme === 'dark'
        });
        const cube = new THREE.Mesh(geometry, material);
        
        const radius = theme === 'dark' ? 20 : 25; // Reduced from 25 to 20
        cube.position.set(
            (Math.random() - 0.5) * radius,
            (Math.random() - 0.5) * radius,
            (Math.random() - 0.5) * radius
        );
        cube.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        techShapes.add(cube);
    }

    // Data flow lines
    const lineCount = PERFORMANCE.lines[theme];
    for (let i = 0; i < lineCount; i++) {
        const points = [];
        const segments = theme === 'dark' ? 4 : 5; // Reduced from 6 to 4
        const radius = theme === 'dark' ? 20 : 25; // Reduced from 25 to 20
        
        for (let j = 0; j <= segments; j++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * radius,
                (Math.random() - 0.5) * radius,
                (Math.random() - 0.5) * radius
            ));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: COLORS[theme].lines,
            transparent: true,
            opacity: theme === 'dark' ? 0.15 : 0.1, // Reduced from 0.3 to 0.15
            linewidth: theme === 'dark' ? 1 : 1 // Reduced from 2 to 1
        });
        const line = new THREE.Line(geometry, material);
        techShapes.add(line);
    }

    scene.add(techShapes);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
}

function onThemeChange(event) {
    const theme = event.detail.theme;
    scene.background = new THREE.Color(COLORS[theme].background);
    createParticles(theme);
    createTechShapes(theme);
}

// Animation loop with performance optimization
function animate(time = 0) {
    if (!isVisible) return;
    
    rafId = requestAnimationFrame(animate);
    
    const delta = (time - PERFORMANCE.lastTime) / 1000;
    PERFORMANCE.lastTime = time;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const speed = PERFORMANCE.animationSpeed[currentTheme];

    if (particles) {
        particles.rotation.x += 0.0005 * speed;
        particles.rotation.y += 0.0005 * speed;
    }

    if (techShapes) {
        techShapes.rotation.x += 0.001 * speed;
        techShapes.rotation.y += 0.001 * speed;
    }

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Initialize the scene
init(); 
