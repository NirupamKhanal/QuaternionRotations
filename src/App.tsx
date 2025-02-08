import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Menu, X, Settings2, RotateCcw, Box, Circle, Cone as ConeIcon, Cylinder as CylinderIcon } from 'lucide-react';

type ShapeType = 'cube' | 'sphere' | 'cone' | 'cylinder' | 'torus';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Shape selection
  const [eulerShape, setEulerShape] = useState<ShapeType>('cube');
  const [quaternionShape, setQuaternionShape] = useState<ShapeType>('cube');
  
  // Rotation controls
  const [eulerSpeed, setEulerSpeed] = useState(0.02);
  const [quaternionSpeed, setQuaternionSpeed] = useState(0.02);
  const [quaternionAxis, setQuaternionAxis] = useState({ x: 1, y: 1, z: 0 });
  const [eulerCenter, setEulerCenter] = useState({ x: 0, y: 0, z: 0 });
  const [quaternionCenter, setQuaternionCenter] = useState({ x: 0, y: 0, z: 0 });

  const createGeometry = (type: ShapeType): THREE.BufferGeometry => {
    switch (type) {
      case 'cube':
        return new THREE.BoxGeometry(2, 2, 2);
      case 'sphere':
        return new THREE.SphereGeometry(1, 32, 32);
      case 'cone':
        return new THREE.ConeGeometry(1, 2, 32);
      case 'cylinder':
        return new THREE.CylinderGeometry(1, 1, 2, 32);
      case 'torus':
        return new THREE.TorusGeometry(1, 0.4, 16, 100);
      default:
        return new THREE.BoxGeometry(2, 2, 2);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Create two scenes
    const sceneEuler = new THREE.Scene();
    const sceneQuaternion = new THREE.Scene();

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    containerRef.current.appendChild(renderer.domElement);

    // Create two cameras
    const aspectRatio = (window.innerWidth / 2) / window.innerHeight;
    const camera1 = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    const camera2 = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera1.position.z = 5;
    camera2.position.z = 5;

    // Set up OrbitControls for both cameras
    const controls1 = new OrbitControls(camera1, renderer.domElement);
    const controls2 = new OrbitControls(camera2, renderer.domElement);
    
    // Configure controls
    controls1.enableDamping = true;
    controls2.enableDamping = true;
    
    // Restrict controls to left/right viewport
    controls1.domElement = renderer.domElement;
    controls2.domElement = renderer.domElement;
    
    controls1.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls2.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    // Create shapes
    const geometryEuler = createGeometry(eulerShape);
    const geometryQuaternion = createGeometry(quaternionShape);
    
    // Euler shape (red)
    const materialEuler = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      flatShading: true,
    });
    const shapeEuler = new THREE.Mesh(geometryEuler, materialEuler);
    sceneEuler.add(shapeEuler);

    // Quaternion shape (green)
    const materialQuaternion = new THREE.MeshPhongMaterial({
      color: 0x44ff44,
      flatShading: true,
    });
    const shapeQuaternion = new THREE.Mesh(geometryQuaternion, materialQuaternion);
    sceneQuaternion.add(shapeQuaternion);

    // Add lights to both scenes
    const setupLights = (scene: THREE.Scene) => {
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404040));
    };

    setupLights(sceneEuler);
    setupLights(sceneQuaternion);

    // Add coordinate axes to both scenes
    const addAxes = (scene: THREE.Scene) => {
      const axesHelper = new THREE.AxesHelper(3);
      scene.add(axesHelper);
    };

    addAxes(sceneEuler);
    addAxes(sceneQuaternion);

    // Add grid to both scenes
    const addGrid = (scene: THREE.Scene) => {
      const gridHelper = new THREE.GridHelper(10, 10);
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);
    };

    addGrid(sceneEuler);
    addGrid(sceneQuaternion);

    // Rotation setup
    const quaternion = new THREE.Quaternion();

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Update controls
      controls1.update();
      controls2.update();

      // Update shape positions
      shapeEuler.position.set(eulerCenter.x, eulerCenter.y, eulerCenter.z);
      shapeQuaternion.position.set(quaternionCenter.x, quaternionCenter.y, quaternionCenter.z);

      // Euler rotation
      shapeEuler.rotation.x += eulerSpeed;
      shapeEuler.rotation.y += eulerSpeed;
      shapeEuler.rotation.z += eulerSpeed;

      // Quaternion rotation
      const axis = new THREE.Vector3(
        quaternionAxis.x,
        quaternionAxis.y,
        quaternionAxis.z
      ).normalize();
      const rotationQuaternion = new THREE.Quaternion();
      rotationQuaternion.setFromAxisAngle(axis, quaternionSpeed);
      quaternion.multiply(rotationQuaternion);
      shapeQuaternion.quaternion.copy(quaternion);

      // Render both scenes
      renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
      renderer.render(sceneEuler, camera1);
      
      renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
      renderer.render(sceneQuaternion, camera2);
    }

    // Handle window resize
    function onWindowResize() {
      const newAspectRatio = (window.innerWidth / 2) / window.innerHeight;
      
      camera1.aspect = newAspectRatio;
      camera2.aspect = newAspectRatio;
      
      camera1.updateProjectionMatrix();
      camera2.updateProjectionMatrix();
      
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      containerRef.current?.removeChild(renderer.domElement);
      geometryEuler.dispose();
      geometryQuaternion.dispose();
      materialEuler.dispose();
      materialQuaternion.dispose();
      renderer.dispose();
      controls1.dispose();
      controls2.dispose();
    };
  }, [eulerSpeed, quaternionSpeed, quaternionAxis, eulerCenter, quaternionCenter, eulerShape, quaternionShape]);

  const resetControls = () => {
    setEulerSpeed(0.02);
    setQuaternionSpeed(0.02);
    setQuaternionAxis({ x: 1, y: 1, z: 0 });
    setEulerCenter({ x: 0, y: 0, z: 0 });
    setQuaternionCenter({ x: 0, y: 0, z: 0 });
  };

  const ShapeSelector = ({ value, onChange, label }: { value: ShapeType; onChange: (shape: ShapeType) => void; label: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onChange('cube')}
          className={`flex items-center justify-center p-2 rounded ${value === 'cube' ? 'bg-blue-100' : 'bg-gray-50'}`}
        >
          <Box className="w-6 h-6" />
        </button>
        <button
          onClick={() => onChange('sphere')}
          className={`flex items-center justify-center p-2 rounded ${value === 'sphere' ? 'bg-blue-100' : 'bg-gray-50'}`}
        >
          <Circle className="w-6 h-6" />
        </button>
        <button
          onClick={() => onChange('cone')}
          className={`flex items-center justify-center p-2 rounded ${value === 'cone' ? 'bg-blue-100' : 'bg-gray-50'}`}
        >
          <ConeIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => onChange('cylinder')}
          className={`flex items-center justify-center p-2 rounded ${value === 'cylinder' ? 'bg-blue-100' : 'bg-gray-50'}`}
        >
          <CylinderIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => onChange('torus')}
          className={`flex items-center justify-center p-2 rounded ${value === 'torus' ? 'bg-blue-100' : 'bg-gray-50'}`}
        >
          <span className="text-xl">◎</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen" ref={containerRef}>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white/100 transition-colors"
      >
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white/95 shadow-xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-8">
            <Settings2 className="w-5 h-5" />
            <h2 className="text-xl font-bold">Rotation Controls</h2>
          </div>

          {/* Shape Selection */}
          <div className="space-y-6">
            <ShapeSelector
              value={eulerShape}
              onChange={setEulerShape}
              label="Euler Shape"
            />
            <ShapeSelector
              value={quaternionShape}
              onChange={setQuaternionShape}
              label="Quaternion Shape"
            />
          </div>

          {/* Euler Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-red-500 border-b pb-2">Euler Rotation</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rotation Speed</label>
              <input
                type="range"
                min="-0.05"
                max="0.05"
                step="0.001"
                value={eulerSpeed}
                onChange={(e) => setEulerSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">{eulerSpeed.toFixed(3)}</div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Center of Rotation</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={eulerCenter.x}
                    onChange={(e) => setEulerCenter({ ...eulerCenter, x: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={eulerCenter.y}
                    onChange={(e) => setEulerCenter({ ...eulerCenter, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Z</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={eulerCenter.z}
                    onChange={(e) => setEulerCenter({ ...eulerCenter, z: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quaternion Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-green-500 border-b pb-2">Quaternion Rotation</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rotation Speed</label>
              <input
                type="range"
                min="-0.05"
                max="0.05"
                step="0.001"
                value={quaternionSpeed}
                onChange={(e) => setQuaternionSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">{quaternionSpeed.toFixed(3)}</div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Rotation Axis</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={quaternionAxis.x}
                    onChange={(e) => setQuaternionAxis({ ...quaternionAxis, x: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={quaternionAxis.y}
                    onChange={(e) => setQuaternionAxis({ ...quaternionAxis, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Z</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={quaternionAxis.z}
                    onChange={(e) => setQuaternionAxis({ ...quaternionAxis, z: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Center of Rotation</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={quaternionCenter.x}
                    onChange={(e) => setQuaternionCenter({ ...quaternionCenter, x: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={quaternionCenter.y}
                    onChange={(e) => setQuaternionCenter({ ...quaternionCenter, y: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Z</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={quaternionCenter.z}
                    onChange={(e) => setQuaternionCenter({ ...quaternionCenter, z: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={resetControls}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 mt-4"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Controls
          </button>
        </div>
      </div>

      {/* Scene Labels */}
      <div className="fixed top-4 left-20 bg-white/80 p-4 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold mb-2 text-red-500">Euler Rotation</h1>
        <p className="text-sm text-gray-700">
          Traditional XYZ rotation<br />
          Shows gimbal lock
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Left click: Rotate view<br />
          Middle click: Zoom<br />
          Right click: Pan
        </p>
      </div>

      <div className="fixed top-4 right-4 bg-white/80 p-4 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold mb-2 text-green-500">Quaternion Rotation</h1>
        <p className="text-sm text-gray-700">
          Custom axis rotation<br />
          Smooth continuous rotation
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Left click: Rotate view<br />
          Middle click: Zoom<br />
          Right click: Pan
        </p>
      </div>
    </div>
  );
}

export default App;