{/* The complete, corrected App.tsx file content from earlier, but with the syntax error fixed */}
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Menu, X, Settings2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type ShapeType = 'cube' | 'sphere' | 'cone' | 'cylinder' | 'torus';
type CoordinateSystem = 'cartesian' | 'polar' | 'spherical';

interface MaterialProperties {
  color: string;
  metalness: number;
  roughness: number;
  wireframe: boolean;
}

interface ShapeProperties {
  size: {
    width: number;
    height: number;
    depth: number;
  };
  material: MaterialProperties;
}

interface GridProperties {
  visible: boolean;
  size: number;
  divisions: number;
  color: string;
  opacity: number;
  coordinateSystem: CoordinateSystem;
}

interface Object3D {
  id: string;
  type: ShapeType;
  properties: ShapeProperties;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  rotationSpeed: number;
  rotationAxis: THREE.Vector3;
  parent?: string;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Objects management
  const [eulerObjects, setEulerObjects] = useState<Object3D[]>([{
    id: uuidv4(),
    type: 'cube',
    properties: {
      size: { width: 2, height: 2, depth: 2 },
      material: {
        color: '#ff4444',
        metalness: 0.5,
        roughness: 0.5,
        wireframe: false
      }
    },
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    quaternion: new THREE.Quaternion(),
    rotationSpeed: 0.02,
    rotationAxis: new THREE.Vector3(1, 1, 0)
  }]);

  const [quaternionObjects, setQuaternionObjects] = useState<Object3D[]>([{
    id: uuidv4(),
    type: 'cube',
    properties: {
      size: { width: 2, height: 2, depth: 2 },
      material: {
        color: '#44ff44',
        metalness: 0.5,
        roughness: 0.5,
        wireframe: false
      }
    },
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    quaternion: new THREE.Quaternion(),
    rotationSpeed: 0.02,
    rotationAxis: new THREE.Vector3(1, 1, 0)
  }]);

  // Grid properties
  const [gridProperties, setGridProperties] = useState<GridProperties>({
    visible: true,
    size: 10,
    divisions: 10,
    color: '#444444',
    opacity: 0.2,
    coordinateSystem: 'cartesian'
  });

  const createGeometry = (type: ShapeType, properties: ShapeProperties): THREE.BufferGeometry => {
    const { width, height, depth } = properties.size;
    switch (type) {
      case 'cube':
        return new THREE.BoxGeometry(width, height, depth);
      case 'sphere':
        return new THREE.SphereGeometry(width / 2, 32, 32);
      case 'cone':
        return new THREE.ConeGeometry(width / 2, height, 32);
      case 'cylinder':
        return new THREE.CylinderGeometry(width / 2, width / 2, height, 32);
      case 'torus':
        return new THREE.TorusGeometry(width / 2, depth / 4, 16, 100);
      default:
        return new THREE.BoxGeometry(width, height, depth);
    }
  };

  const createMaterial = (properties: MaterialProperties): THREE.Material => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(properties.color),
      metalness: properties.metalness,
      roughness: properties.roughness,
      wireframe: properties.wireframe
    });
  };

  const createGrid = (scene: THREE.Scene, properties: GridProperties) => {
    scene.children = scene.children.filter(child => !(child instanceof THREE.GridHelper));
    
    if (!properties.visible) return;

    const gridHelper = new THREE.GridHelper(
      properties.size,
      properties.divisions,
      new THREE.Color(properties.color),
      new THREE.Color(properties.color)
    );
    
    gridHelper.material.opacity = properties.opacity;
    gridHelper.material.transparent = true;

    if (properties.coordinateSystem === 'polar') {
      const circles = new THREE.Group();
      for (let r = 1; r <= properties.size / 2; r++) {
        const circle = new THREE.Line(
          new THREE.CircleGeometry(r * 2, 32),
          new THREE.LineBasicMaterial({ 
            color: properties.color,
            opacity: properties.opacity,
            transparent: true 
          })
        );
        circle.rotation.x = Math.PI / 2;
        circles.add(circle);
      }
      scene.add(circles);
    } else if (properties.coordinateSystem === 'spherical') {
      const sphereWireframe = new THREE.Mesh(
        new THREE.SphereGeometry(properties.size / 2, 16, 16),
        new THREE.MeshBasicMaterial({
          color: properties.color,
          wireframe: true,
          opacity: properties.opacity,
          transparent: true
        })
      );
      scene.add(sphereWireframe);
    }

    scene.add(gridHelper);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const width = menuOpen ? 
      window.innerWidth - 320 : 
      window.innerWidth;
    const height = window.innerHeight;

    // Create scenes
    const sceneEuler = new THREE.Scene();
    const sceneQuaternion = new THREE.Scene();

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.autoClear = false;
    containerRef.current.appendChild(renderer.domElement);

    // Create cameras
    const aspectRatio = (width / 2) / height;
    const camera1 = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    const camera2 = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera1.position.z = 5;
    camera2.position.z = 5;

    // Set up OrbitControls
    const controls1 = new OrbitControls(camera1, renderer.domElement);
    const controls2 = new OrbitControls(camera2, renderer.domElement);
    
    controls1.enableDamping = true;
    controls2.enableDamping = true;

    // Create objects
    const eulerMeshes = new Map<string, THREE.Mesh>();
    const quaternionMeshes = new Map<string, THREE.Mesh>();

    eulerObjects.forEach(obj => {
      const geometry = createGeometry(obj.type, obj.properties);
      const material = createMaterial(obj.properties.material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obj.position);
      mesh.rotation.copy(obj.rotation);
      eulerMeshes.set(obj.id, mesh);
      sceneEuler.add(mesh);

      if (obj.parent) {
        const parentMesh = eulerMeshes.get(obj.parent);
        if (parentMesh) {
          parentMesh.add(mesh);
        }
      }
    });

    quaternionObjects.forEach(obj => {
      const geometry = createGeometry(obj.type, obj.properties);
      const material = createMaterial(obj.properties.material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obj.position);
      mesh.quaternion.copy(obj.quaternion);
      quaternionMeshes.set(obj.id, mesh);
      sceneQuaternion.add(mesh);

      if (obj.parent) {
        const parentMesh = quaternionMeshes.get(obj.parent);
        if (parentMesh) {
          parentMesh.add(mesh);
        }
      }
    });

    // Add lights
    const setupLights = (scene: THREE.Scene) => {
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1);
      scene.add(light);
      
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      
      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(-2, 2, 2);
      scene.add(pointLight);
    };

    setupLights(sceneEuler);
    setupLights(sceneQuaternion);

    // Add axes
    const addAxes = (scene: THREE.Scene) => {
      const axesHelper = new THREE.AxesHelper(3);
      scene.add(axesHelper);
    };

    addAxes(sceneEuler);
    addAxes(sceneQuaternion);

    // Add grid
    createGrid(sceneEuler, gridProperties);
    createGrid(sceneQuaternion, gridProperties);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Update controls
      controls1.update();
      controls2.update();

      // Update Euler objects
      eulerObjects.forEach(obj => {
        const mesh = eulerMeshes.get(obj.id);
        if (mesh && !obj.parent) {
          mesh.rotation.x += obj.rotationSpeed;
          mesh.rotation.y += obj.rotationSpeed;
          mesh.rotation.z += obj.rotationSpeed;
        }
      });

      // Update Quaternion objects
      quaternionObjects.forEach(obj => {
        const mesh = quaternionMeshes.get(obj.id);
        if (mesh && !obj.parent) {
          const rotationQuaternion = new THREE.Quaternion();
          rotationQuaternion.setFromAxisAngle(obj.rotationAxis, obj.rotationSpeed);
          mesh.quaternion.multiply(rotationQuaternion);
        }
      });

      // Render scenes
      const halfWidth = width / 2;
      renderer.setViewport(0, 0, halfWidth, height);
      renderer.render(sceneEuler, camera1);
      
      renderer.setViewport(halfWidth, 0, halfWidth, height);
      renderer.render(sceneQuaternion, camera2);
    }

    // Handle window resize
    function onWindowResize() {
      const newWidth = menuOpen ? 
        window.innerWidth - 320 : 
        window.innerWidth;
      const newHeight = window.innerHeight;
      const newHalfWidth = newWidth / 2;
      
      camera1.aspect = newHalfWidth / newHeight;
      camera2.aspect = newHalfWidth / newHeight;
      
      camera1.updateProjectionMatrix();
      camera2.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      containerRef.current?.removeChild(renderer.domElement);
      
      eulerMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      
      quaternionMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      
      renderer.dispose();
      controls1.dispose();
      controls2.dispose();
    };
  }, [eulerObjects, quaternionObjects, gridProperties, menuOpen]);

  const addObject = (scene: 'euler' | 'quaternion') => {
    const newObject: Object3D = {
      id: uuidv4(),
      type: 'cube',
      properties: {
        size: { width: 2, height: 2, depth: 2 },
        material: {
          color: scene === 'euler' ? '#ff4444' : '#44ff44',
          metalness: 0.5,
          roughness: 0.5,
          wireframe: false
        }
      },
      position: new THREE.Vector3(
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2
      ),
      rotation: new THREE.Euler(0, 0, 0),
      quaternion: new THREE.Quaternion(),
      rotationSpeed: 0.02,
      rotationAxis: new THREE.Vector3(1, 1, 0)
    };

    if (scene === 'euler') {
      setEulerObjects(prev => [...prev, newObject]);
    } else {
      setQuaternionObjects(prev => [...prev, newObject]);
    }
  };

  const removeObject = (scene: 'euler' | 'quaternion', id: string) => {
    if (scene === 'euler') {
      setEulerObjects(prev => prev.filter(obj => obj.id !== id));
    } else {
      setQuaternionObjects(prev => prev.filter(obj => obj.id !== id));
    }
  };

  const updateObject = (scene: 'euler' | 'quaternion', id: string, updates: Partial<Object3D>) => {
    if (scene === 'euler') {
      setEulerObjects(prev => prev.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      ));
    } else {
      setQuaternionObjects(prev => prev.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      ));
    }
  };

  const ObjectControls = ({ 
    object, 
    scene,
    onUpdate,
    onRemove 
  }: { 
    object: Object3D;
    scene: 'euler' | 'quaternion';
    onUpdate: (updates: Partial<Object3D>) => void;
    onRemove: () => void;
  }) => (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-700">Object Controls</h4>
        <button
          onClick={onRemove}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Shape Type</label>
          <select
            value={object.type}
            onChange={(e) => onUpdate({ type: e.target.value as ShapeType })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="cube">Cube</option>
            <option value="sphere">Sphere</option>
            <option value="cone">Cone</option>
            <option value="cylinder">Cylinder</option>
            <option value="torus">Torus</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500">X</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={object.position.x}
                onChange={(e) => onUpdate({
                  position: new THREE.Vector3(
                    parseFloat(e.target.value),
                    object.position.y,
                    object.position.z
                  )
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Y</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={object.position.y}
                onChange={(e) => onUpdate({
                  position: new THREE.Vector3(
                    object.position.x,
                    parseFloat(e.target.value),
                    object.position.z
                  )
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Z</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={object.position.z}
                onChange={(e) => onUpdate({
                  position: new THREE.Vector3(
                    object.position.x,
                    object.position.y,
                    parseFloat(e.target.value)
                  )
                })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rotation Speed</label>
          <input
            type="range"
            min="-0.05"
            max="0.05"
            step="0.001"
            value={object.rotationSpeed}
            onChange={(e) => onUpdate({ rotationSpeed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {scene === 'quaternion' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Rotation Axis</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500">X</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={object.rotationAxis.x}
                  onChange={(e) => onUpdate({
                    rotationAxis: new THREE.Vector3(
                      parseFloat(e.target.value),
                      object.rotationAxis.y,
                      object.rotationAxis.z
                    )
                  })}
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
                  value={object.rotationAxis.y}
                  onChange={(e) => onUpdate({
                    rotationAxis: new THREE.Vector3(
                      object.rotationAxis.x,
                      parseFloat(e.target.value),
                      object.rotationAxis.z
                    )
                  })}
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
                  value={object.rotationAxis.z}
                  onChange={(e) => onUpdate({
                    rotationAxis: new THREE.Vector3(
                      object.rotationAxis.x,
                      object.rotationAxis.y,
                      parseFloat(e.target.value)
                    )
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Material</label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500">Color</label>
              <input
                type="color"
                value={object.properties.material.color}
                onChange={(e) => onUpdate({
                  properties: {
                    ...object.properties,
                    material: {
                      ...object.properties.material,
                      color: e.target.value
                    }
                  }
                })}
                className="w-full h-8 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Metalness</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={object.properties.material.metalness}
                onChange={(e) => onUpdate({
                  properties: {
                    ...object.properties,
                    material: {
                      ...object.properties.material,
                      metalness: parseFloat(e.target.value)
                    }
                  }
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Roughness</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={object.properties.material.roughness}
                onChange={(e) => onUpdate({
                  properties: {
                    ...object.properties,
                    material: {
                      ...object.properties.material,
                      roughness: parseFloat(e.target.value)
                    }
                  }
                })}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={object.properties.material.wireframe}
                onChange={(e) => onUpdate({
                  properties: {
                    ...object.properties,
                    material: {
                      ...object.properties.material,
                      wireframe: e.target.checked
                    }
                  }
                })}
                className="rounded"
              />
              <label className="text-xs text-gray-500">Wireframe</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`w-full h-screen transition-all duration-300 ${menuOpen ? 'pl-80' : ''}`} 
      ref={containerRef}
    >
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              <h2 className="text-xl font-bold">Controls</h2>
            </div>
          </div>

          {/* Euler Objects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-red-500">Euler Objects</h3>
              <button
                onClick={() => addObject('euler')}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {eulerObjects.map(obj => (
              <ObjectControls
                key={obj.id}
                object={obj}
                scene="euler"
                onUpdate={(updates) => updateObject('euler', obj.id, updates)}
                onRemove={() => removeObject('euler', obj.id)}
              />
            ))}
          </div>

          {/* Quaternion Objects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-green-500">Quaternion Objects</h3>
              <button
                onClick={() => addObject('quaternion')}
                className="p-1 text-green-500 hover:text-green-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {quaternionObjects.map(obj => (
              <ObjectControls
                key={obj.id}
                object={obj}
                scene="quaternion"
                onUpdate={(updates) => updateObject('quaternion', obj.id, updates)}
                onRemove={() => removeObject('quaternion', obj.id)}
              />
            ))}
          </div>

          {/* Grid Properties */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">Grid Properties</h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gridProperties.visible}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  visible: e.target.checked
                })}
                className="rounded"
              />
              <label className="text-sm text-gray-700">Show Grid</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Coordinate System</label>
              <select
                value={gridProperties.coordinateSystem}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  coordinateSystem: e.target.value as CoordinateSystem
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="cartesian">Cartesian</option>
                <option value="polar">Polar</option>
                <option value="spherical">Spherical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Size</label>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={gridProperties.size}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  size: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Divisions</label>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={gridProperties.divisions}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  divisions: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Color</label>
              <input
                type="color"
                value={gridProperties.color}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  color: e.target.value
                })}
                className="w-full h-8 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={gridProperties.opacity}
                onChange={(e) => setGridProperties({
                  ...gridProperties,
                  opacity: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
          </div>
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