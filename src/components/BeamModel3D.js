import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

function Model({ deformation = 0, servoAngle = 0, masse = 0, mode = 'manual' }) {
  const { scene, nodes } = useGLTF('/models/11.glb');
  const modelRef = useRef();
  const servoMotorRef = useRef();
  const servoHeliceRef = useRef();
  const servoEngraneRef = useRef();
  const beamRef = useRef();
  const beamPivotRef = useRef(new THREE.Object3D());
  const weightSupportRef = useRef();
  const weightRefs = useRef([]);
  
  const { camera } = useThree();

  useEffect(() => {
    console.log("Model loaded with useGLTF");
    
    Object.keys(nodes).forEach(key => {
      if (nodes[key].isMesh) {
        if (nodes[key].material) {
          nodes[key].material.metalness = 0.7;
          nodes[key].material.roughness = 0.2;
          nodes[key].material.needsUpdate = true;
          nodes[key].receiveShadow = true;
          nodes[key].castShadow = true;
        }
        
        if (key.toLowerCase().includes('servo') && key.toLowerCase().includes('motor')) {
          servoMotorRef.current = nodes[key];
        }
        
        if (key.toLowerCase().includes('servo') && key.toLowerCase().includes('helice')) {
          servoHeliceRef.current = nodes[key];
          
          if (servoHeliceRef.current) {
            servoHeliceRef.current.userData.initialRotation = { 
              x: servoHeliceRef.current.rotation.x,
              y: servoHeliceRef.current.rotation.y,
              z: servoHeliceRef.current.rotation.z
            };
          }
        }
        
        if (key.toLowerCase().includes('engrane') || key.toLowerCase().includes('gear')) {
          servoEngraneRef.current = nodes[key];
        }
        
        if (key.toLowerCase().includes('part5')) {
          beamRef.current = nodes[key];
          console.log("Found beam:", key);
          
          if (beamRef.current && !beamRef.current.userData.pivotInitialized) {
            console.log("Initializing pivot for the beam");
            
            beamRef.current.userData.originalPosition = beamRef.current.position.clone();
            beamRef.current.userData.originalRotation = beamRef.current.rotation.clone();
            beamRef.current.userData.pivotInitialized = true;
            
            beamPivotRef.current.position.copy(beamRef.current.position);
            beamPivotRef.current.rotation.copy(beamRef.current.rotation);
            
            scene.add(beamPivotRef.current);
            
            beamPivotRef.current.attach(beamRef.current);
          }
        }
        
        if (key.toLowerCase().includes('part32')) {
          weightSupportRef.current = nodes[key];
          console.log("Found weight support:", key);
          
          weightSupportRef.current.userData.initialPosition = {
            x: weightSupportRef.current.position.x,
            y: weightSupportRef.current.position.y,
            z: weightSupportRef.current.position.z
          };
          
          if (beamRef.current) {
            beamRef.current.attach(weightSupportRef.current);
          }
        }
        
        if (key.toLowerCase().includes('20g') || key.toLowerCase().includes('50g') || key.toLowerCase().includes('10g')) {
          let weightValue = 0;
          let weightType = '';
          
          if (key.toLowerCase().includes('20g')) {
            weightValue = 20;
            if (key.toLowerCase().includes('l')) {
              weightType = '20gL';
            } else if (key.toLowerCase().includes('r')) {
              weightType = '20gR';
            } else {
              weightType = weightRefs.current.some(w => w.type === '20gL') ? '20gR' : '20gL';
            }
          } else if (key.toLowerCase().includes('50g')) {
            weightValue = 50;
            weightType = '50g';
          } else if (key.toLowerCase().includes('10g')) {
            weightValue = 10;
            weightType = '10g';
          }
          
          console.log(`Found weight: ${key} - identified as ${weightType}`);
          
          weightRefs.current.push({
            mesh: nodes[key],
            weight: weightValue,
            type: weightType,
            initialPosition: {
              x: nodes[key].position.x,
              y: nodes[key].position.y,
              z: nodes[key].position.z
            },
            initialVisibility: nodes[key].visible
          });
          
          nodes[key].visible = false;
          
          if (weightSupportRef.current) {
            weightSupportRef.current.attach(nodes[key]);
          }
        }
      }
    });
    
    if (!servoHeliceRef.current) {
      scene.traverse((object) => {
        if (object.isMesh) {
          const name = object.name.toLowerCase();
          if (name.includes('servo') && (name.includes('helice') || name.includes('motor'))) {
            servoHeliceRef.current = object;
            
            servoHeliceRef.current.userData.initialRotation = { 
              x: object.rotation.x,
              y: object.rotation.y,
              z: object.rotation.z
            };
          }
        }
      });
    }
    
    camera.position.set(0, 200, 500);
    camera.lookAt(0, 0, 0);
  }, [nodes, camera, scene]);
  
  useFrame(() => {
    if (servoHeliceRef.current && typeof servoAngle === 'number') {
      let calibratedAngle = servoAngle;
      calibratedAngle = servoAngle * 0.8 + 6;
      
      const adjustedAngle = Math.max(-90, Math.min(90, calibratedAngle - 90));
      
      const angleRad = (adjustedAngle * Math.PI) / 180;
      
      const initialRotation = servoHeliceRef.current.userData.initialRotation || { x: 0, y: 0, z: 0 };
      
      servoHeliceRef.current.rotation.y = initialRotation.y + angleRad;
      
      if (servoEngraneRef.current) {
        servoEngraneRef.current.rotation.y = initialRotation.y + angleRad;
      }
    }
    
    if (beamPivotRef.current && beamRef.current) {
      if (mode === 'automatic') {
        const maxAngle = 30 * Math.PI / 180;
        
        let weightFlexAngle = 0;
        
        if (masse > 0) {
          const maxWeight = 500;
          const clampedMasse = Math.min(masse, maxWeight);
          
          weightFlexAngle = (clampedMasse / maxWeight) * maxAngle;
          
          console.log(`💡 Mode Automatique - Masse: ${masse}g, Flexion: ${(weightFlexAngle * 180 / Math.PI).toFixed(2)}°`);
        }
        
        const servoFlexAngle = deformation > 0 ? Math.min(deformation * 5000, maxAngle * 0.1) : 0;
        
        const totalFlexAngle = Math.min(weightFlexAngle + servoFlexAngle, maxAngle);
        
        beamPivotRef.current.rotation.x = totalFlexAngle;
      } else {
        beamPivotRef.current.rotation.x = 0;
        console.log(`🎮 Mode Manuel - Lame fixe, Servo: ${servoAngle}°`);
      }
    }
    
    if (weightRefs.current.length > 0) {
      weightRefs.current.forEach(weightObj => {
        weightObj.mesh.visible = false;
      });
      
      const weight50g = weightRefs.current.find(w => w.type === '50g');
      const weight20gL = weightRefs.current.find(w => w.type === '20gL');
      const weight20gR = weightRefs.current.find(w => w.type === '20gR');
      const weight10g = weightRefs.current.find(w => w.type === '10g');
      
      if (masse === 20) {
        if (weight20gL) weight20gL.mesh.visible = true;
      } 
      else if (masse === 40) {
        if (weight20gL) weight20gL.mesh.visible = true;
        if (weight20gR) weight20gR.mesh.visible = true;
      }
      else if (masse === 50) {
        if (weight50g) weight50g.mesh.visible = true;
      }
      else if (masse === 70) {
        if (weight50g) weight50g.mesh.visible = true;
        if (weight20gL) weight20gL.mesh.visible = true;
      }
      else if (masse === 90) {
        if (weight50g) weight50g.mesh.visible = true;
        if (weight20gL) weight20gL.mesh.visible = true;
        if (weight20gR) weight20gR.mesh.visible = true;
      }
      else if (masse === 100) {
        if (weight50g) weight50g.mesh.visible = true;
        if (weight20gL) weight20gL.mesh.visible = true;
        if (weight20gR) weight20gR.mesh.visible = true;
        if (weight10g) weight10g.mesh.visible = true;
      }
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={[900, 900, 900]} 
      position={[-70, -100, 0]} 
      rotation={[0, Math.PI / 4, 0]}
    />
  );
}

export default function BeamModel3D({ deformation = 0, servoAngle = 0, masse = 0, mode = 'manual' }) {
  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-70 p-2 rounded shadow">
        <div className="text-sm">Mode: {mode === 'automatic' ? 'Automatique' : 'Manuel'}</div>
        <div className="text-sm">Angle Servo: {servoAngle}°</div>
        <div className="text-sm">Masse détectée: {masse}g</div>
        {mode === 'automatic' ? (
          <div className="text-sm text-green-600">Flexion: {((masse / 500) * 30).toFixed(1)}°</div>
        ) : (
          <div className="text-sm text-blue-600">Lame fixe</div>
        )}
      </div>
      
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 200, 500]} 
          fov={40}
          near={1}
          far={5000}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[200, 300, 200]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <directionalLight 
          position={[-200, 200, -200]} 
          intensity={0.4} 
        />
        
        <Environment preset="studio" />
        
        <React.Suspense fallback={null}>
          <Model 
            deformation={deformation} 
            servoAngle={servoAngle}
            masse={masse}
            mode={mode}
          />
        </React.Suspense>
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          target={[0, 0, 0]}
          minDistance={100}
          maxDistance={2000}
        />
      </Canvas>
    </div>
  );
}