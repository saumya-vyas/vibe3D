import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from "dotenv";
dotenv.config();


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});



export async function render3D({image}) {


  const system_prompt = `You are an expert Three.js developer. Your job is to analyze the provided image and generate a Three.js scene that faithfully represents the main object in 3D.

## INTERPRETATION:
- Identify and model only the main object; ignore background and unrelated elements.
- Maintain correct spatial relationships and proportions.
- Use a logical object hierarchy and scale (1 unit ≈ 1/10 scene width).

## TECHNICAL INSTRUCTIONS:
- Do not import 'three' (already imported as THREE).
- For Three.js extensions (e.g., OrbitControls, GLTFLoader), always use ES module imports.
- For OrbitControls, include at the top:
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    const controls = new OrbitControls(camera, renderer.domElement);
- Do NOT use THREE.OrbitControls or assume extensions are attached to THREE.
- Code will run in a Vite (ESM) environment.
- Set up a camera, ambient and directional lighting, and a ground/floor plane (unless the object is floating).
- Use realistic materials and textures based on the image.
- Add subtle animation or rotation to bring the scene to life.
- Ensure the scene is responsive to container size.

## RESPONSE FORMAT:
Return only valid JavaScript code (inside single backticks) with comments for major design decisions.`

  const base_text = `Transform this 2D drawing/wireframe into an interactive Three.js 3D scene. 
I need code that:
1. Creates appropriate 3D geometries based on the shapes in the image
2. Uses materials that match the colors and styles in the drawing
3. Implements OrbitControls for interaction
4. Sets up proper lighting to enhance the 3D effect
5. Includes subtle animations to bring the scene to life
6. Is responsive to container size
7. Creates a cohesive scene that represents the spatial relationships in the drawing
Return ONLY the JavaScript code that creates and animates the Three.js scene.`

const message_data = [{
        type: 'text',
        text: base_text,
      }]

if(image){
  message_data.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: image,
              },
            })
}else{
  console.log('No image provided')
  return;
}


try {
    const response = await client.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4096,
      system: system_prompt,
      messages: [
        {
          role: 'user',
          content: message_data,
        }
      ],
    });

    const content = response.content[0].text
    console.log("input tokens : ", response.usage.input_tokens)
    console.log("output tokens : ", response.usage.output_tokens)
    
    if(content){
      return {data : content, type : 'completed'}
    }else{
      return new Error('No content at render3D returned')
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } 
    
}


// const output = `
// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xf5f5f5);

// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1.2;

// document.getElementById('container').appendChild(renderer.domElement);

//         // Lighting setup
//         const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
//         scene.add(ambientLight);

//         const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//         directionalLight.position.set(10, 10, 5);
//         directionalLight.castShadow = true;
//         directionalLight.shadow.mapSize.width = 2048;
//         directionalLight.shadow.mapSize.height = 2048;
//         directionalLight.shadow.camera.near = 0.5;
//         directionalLight.shadow.camera.far = 50;
//         directionalLight.shadow.camera.left = -10;
//         directionalLight.shadow.camera.right = 10;
//         directionalLight.shadow.camera.top = 10;
//         directionalLight.shadow.camera.bottom = -10;
//         scene.add(directionalLight);

//         const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
//         rimLight.position.set(-5, 3, -5);
//         scene.add(rimLight);

//         // Create pencil group
//         const pencilGroup = new THREE.Group();
//         scene.add(pencilGroup);

//         // Pencil body (main yellow/orange cylinder)
//         const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 32);
//         const bodyMaterial = new THREE.MeshPhongMaterial({ 
//             color: 0xffa500,
//             shininess: 30,
//             specular: 0x444444
//         });
//         const pencilBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
//         pencilBody.rotation.z = Math.PI / 2;
//         pencilBody.castShadow = true;
//         pencilBody.receiveShadow = true;
//         pencilGroup.add(pencilBody);

//         // Ferrule (pink/red metal band)
//         const ferruleGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.8, 32);
//         const ferruleMaterial = new THREE.MeshPhongMaterial({ 
//             color: 0xff6b6b,
//             shininess: 80,
//             specular: 0x888888
//         });
//         const ferrule = new THREE.Mesh(ferruleGeometry, ferruleMaterial);
//         ferrule.position.x = -4.4;
//         ferrule.rotation.z = Math.PI / 2;
//         ferrule.castShadow = true;
//         ferrule.receiveShadow = true;
//         pencilGroup.add(ferrule);

//         // Wood tip section (light wood color)
//         const woodTipGeometry = new THREE.CylinderGeometry(0.15, 0.08, 0.6, 32);
//         const woodTipMaterial = new THREE.MeshPhongMaterial({ 
//             color: 0xf4e4bc,
//             shininess: 10
//         });
//         const woodTip = new THREE.Mesh(woodTipGeometry, woodTipMaterial);
//         woodTip.position.x = 4.3;
//         woodTip.rotation.z = Math.PI / 2;
//         woodTip.castShadow = true;
//         woodTip.receiveShadow = true;
//         pencilGroup.add(woodTip);

//         // Graphite tip (dark gray/black)
//         const graphiteGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.3, 16);
//         const graphiteMaterial = new THREE.MeshPhongMaterial({ 
//             color: 0x333333,
//             shininess: 100
//         });
//         const graphiteTip = new THREE.Mesh(graphiteGeometry, graphiteMaterial);
//         graphiteTip.position.x = 4.75;
//         graphiteTip.rotation.z = Math.PI / 2;
//         graphiteTip.castShadow = true;
//         pencilGroup.add(graphiteTip);

//         // Add brand text (embossed effect)
//         const textGeometry = new THREE.RingGeometry(0.16, 0.17, 8);
//         const textMaterial = new THREE.MeshPhongMaterial({ 
//             color: 0xffcc00,
//             transparent: true,
//             opacity: 0.8
//         });
//         const brandRing = new THREE.Mesh(textGeometry, textMaterial);
//         brandRing.position.set(1, 0.17, 0);
//         brandRing.rotation.x = Math.PI / 2;
//         pencilGroup.add(brandRing);

//         // Add floating particles for atmosphere
//         const particleGeometry = new THREE.SphereGeometry(0.01, 8, 8);
//         const particleMaterial = new THREE.MeshBasicMaterial({ 
//             color: 0xffffff,
//             transparent: true,
//             opacity: 0.6
//         });
        
//         const particles = [];
//         for (let i = 0; i < 20; i++) {
//             const particle = new THREE.Mesh(particleGeometry, particleMaterial);
//             particle.position.set(
//                 (Math.random() - 0.5) * 20,
//                 (Math.random() - 0.5) * 10,
//                 (Math.random() - 0.5) * 10
//             );
//             particles.push(particle);
//             scene.add(particle);
//         }

//         // Ground plane for shadows
//         const groundGeometry = new THREE.PlaneGeometry(50, 50);
//         const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
//         const ground = new THREE.Mesh(groundGeometry, groundMaterial);
//         ground.rotation.x = -Math.PI / 2;
//         ground.position.y = -2;
//         ground.receiveShadow = true;
//         scene.add(ground);

//         // Simple orbit controls implementation
//         let isMouseDown = false;
//         let mouseX = 0;
//         let mouseY = 0;
//         let targetRotationX = 0;
//         let targetRotationY = 0;
//         let currentRotationX = 0;
//         let currentRotationY = 0;

//         renderer.domElement.addEventListener('mousedown', (event) => {
//             isMouseDown = true;
//             mouseX = event.clientX;
//             mouseY = event.clientY;
//         });

//         renderer.domElement.addEventListener('mousemove', (event) => {
//             if (isMouseDown) {
//                 const deltaX = event.clientX - mouseX;
//                 const deltaY = event.clientY - mouseY;
//                 targetRotationY += deltaX * 0.01;
//                 targetRotationX += deltaY * 0.01;
//                 targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
//                 mouseX = event.clientX;
//                 mouseY = event.clientY;
//             }
//         });

//         renderer.domElement.addEventListener('mouseup', () => {
//             isMouseDown = false;
//         });

//         renderer.domElement.addEventListener('wheel', (event) => {
//             camera.position.z += event.deltaY * 0.01;
//             camera.position.z = Math.max(5, Math.min(20, camera.position.z));
//         });

//         // Camera setup
//         camera.position.set(8, 3, 10);
//         camera.lookAt(0, 0, 0);

//         // Animation loop
//         function animate() {
//             requestAnimationFrame(animate);

//             // Smooth camera rotation
//             currentRotationX += (targetRotationX - currentRotationX) * 0.05;
//             currentRotationY += (targetRotationY - currentRotationY) * 0.05;

//             // Update camera position based on rotation
//             const radius = camera.position.length();
//             camera.position.x = radius * Math.cos(currentRotationY) * Math.cos(currentRotationX);
//             camera.position.y = radius * Math.sin(currentRotationX);
//             camera.position.z = radius * Math.sin(currentRotationY) * Math.cos(currentRotationX);
//             camera.lookAt(0, 0, 0);

//             // Subtle pencil rotation
//             pencilGroup.rotation.x += 0.005;

//             // Animate particles
//             particles.forEach((particle, index) => {
//                 particle.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
//                 particle.position.x += Math.cos(Date.now() * 0.0008 + index) * 0.001;
//             });

//             // Subtle light animation
//             directionalLight.intensity = 0.8 + Math.sin(Date.now() * 0.001) * 0.1;

//             renderer.render(scene, camera);
//         }

//         // Handle window resize
//         function handleResize() {
//             camera.aspect = window.innerWidth / window.innerHeight;
//             camera.updateProjectionMatrix();
//             renderer.setSize(window.innerWidth, window.innerHeight);
//         }

//         window.addEventListener('resize', handleResize);

// // Start animation
// animate();
// `;

