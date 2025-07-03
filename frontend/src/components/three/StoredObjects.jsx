    //  This file is based on code from vibe-draw (Copyright (C) [2025] [martin226])
    //  and is licensed under the GNU Affero General Public License v3.0 or later.
    //  Modified by [saumya-vyas], [2026]
    //  See LICENSE for details.

import { useEffect, useMemo, useRef } from 'react'
import { useObjectStore } from '@/store/useStore'
import { useStore } from '@/store/useStore'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

// Helper to create a mesh from stored object data
const createMeshFromStored = (data) => {
  let geometry;
  let material;
  
  // Try to get the object from the global references
  const objectId = data.geometry?.parameters?.objectId || data.id;
  const originalObject = window.__objectReferences?.get(objectId);
  if (originalObject instanceof THREE.Mesh) {
    console.log(`Found original mesh object: ${objectId}`);
    // We can reuse the entire original mesh
    const mesh = originalObject.clone();
    
    // Apply transforms from the stored data
    if (data.position) mesh.position.set(...data.position);
    if (data.rotation) mesh.rotation.set(...data.rotation);
    if (data.scale) mesh.scale.set(...data.scale);
    
    // Ensure userData is set correctly
    mesh.userData = { ...data.userData };
    mesh.userData.id = data.id;
    
    // Set the UUID to match the stored ID
    try {
      Object.defineProperty(mesh, 'uuid', { value: data.id });
    } catch (e) {
      console.warn("Could not set UUID, selection might not work correctly", e);
    }
    
    // console.log(`Created mesh from original object: id=${data.id}, uuid=${mesh.uuid}`);
    
    // After creating the mesh, force transforms and set material
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.rotation.set(0, 0, 0);
    if (mesh.material) {
      mesh.material.color.set('yellow');
      mesh.material.opacity = 1;
      mesh.material.transparent = false;
      mesh.material.wireframe = true;
    }
    // console.log(`Mesh ${data.id} position:`, mesh.position, 'scale:', mesh.scale, 'rotation:', mesh.rotation);
    
    return mesh;
  }
  
  // Try to use the original geometry from references
  const originalGeometry = window.__objectReferences?.get(`${objectId}_geometry`) ;
  const originalMaterial = window.__objectReferences?.get(`${objectId}_material`) ;
  
  if (originalGeometry) {
    console.log(`Found original geometry: ${objectId}`);
    geometry = originalGeometry;
  } else {
    // Fallback to basic geometry
    console.log(`Using fallback geometry for ${data.name}`);
    geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  if (originalMaterial) {
    console.log(`Found original material: ${objectId}`);
    material = originalMaterial.clone();
  } else {
    // Fallback to basic material
    console.log(`Using fallback material for ${data.name}`);
    let color = parseInt(data.material?.color || 'ffffff', 16);
    material = new THREE.MeshStandardMaterial({ color });
  }
  
  // Ensure we have valid geometry and material
  if (!geometry) {
    console.warn("Missing geometry, using fallback box");
    geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  if (!material) {
    console.warn("Missing material, using fallback material");
    material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  }
  
  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  
  // Apply transforms
  if (data.position) mesh.position.set(...data.position);
  if (data.rotation) mesh.rotation.set(...data.rotation);
  if (data.scale) mesh.scale.set(...data.scale);
  
  // Restore userData
  if (data.userData) {
    mesh.userData = { ...data.userData };
  }
  
  // Ensure these critical fields
  mesh.userData.id = data.id;
  mesh.userData.name = data.name;
  mesh.userData.isUserCreated = true;
  mesh.userData.isSerializedFromCode = true;
  
  // Try to use the stored ID as the UUID if possible
  try {
    Object.defineProperty(mesh, 'uuid', { value: data.id });
  } catch (e) {
    console.warn("Could not set UUID, selection might not work correctly", e);
  }
  
  // console.log(`Created mesh from storage: id=${data.id}, uuid=${mesh.uuid}`);
  
  // After creating the mesh, force transforms and set material
  mesh.position.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  mesh.rotation.set(0, 0, 0);
  if (mesh.material) {
    mesh.material.color.set('yellow');
    mesh.material.opacity = 1;
    mesh.material.transparent = false;
    mesh.material.wireframe = true;
  }
  // console.log(`Mesh ${data.id} position:`, mesh.position, 'scale:', mesh.scale, 'rotation:', mesh.rotation);
  
  return mesh;
};

// Helper to create a group from stored object data
const createGroupFromStored = (data) => {
  // Try to get the original group from global references
  const originalGroup = window.__objectReferences?.get(data.id) ;
  
  if (originalGroup instanceof THREE.Group) {
    // console.log(`Found original group object: ${data.id}`);
    // We can reuse the entire original group
    const group = originalGroup.clone();
    
    // Apply transforms from the stored data
    if (data.position) group.position.set(...data.position);
    if (data.rotation) group.rotation.set(...data.rotation);
    if (data.scale) group.scale.set(...data.scale);
    
    // Ensure userData is set correctly
    group.userData = { ...data.userData };
    group.userData.id = data.id;
    
    // Set the UUID to match the stored ID
    try {
      Object.defineProperty(group, 'uuid', { value: data.id });
    } catch (e) {
      console.warn("Could not set UUID, selection might not work correctly", e);
    }
    
    // console.log(`Created group from original object: id=${data.id}, uuid=${group.uuid}`);
    
    // After creating the group, force transforms for debugging
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    group.rotation.set(0, 0, 0);
    // console.log(`Group ${data.id} position:`, group.position, 'scale:', group.scale, 'rotation:', group.rotation);
    // console.log('Group children count:', group.children.length, group.children.map(child => child.type));
    
    return group;
  }
  
  // If we don't have the original group, create a new one
  const group = new THREE.Group();
  
  // Apply transforms
  if (data.position) group.position.set(...data.position);
  if (data.rotation) group.rotation.set(...data.rotation);
  if (data.scale) group.scale.set(...data.scale);
  
  // Restore userData
  if (data.userData) {
    group.userData = { ...data.userData };
  }
  
  // Add children
  if (data.children && data.children.length > 0) {
    // console.log(`Creating ${data.children.length} children for group ${data.id}`);
    data.children.forEach(childData => {
      let child = null;
      if (childData.type === 'mesh') {
        child = createMeshFromStored(childData);
      } else if (childData.type === 'group') {
        child = createGroupFromStored(childData);
      } else if (childData.type === 'object') {
        child = createObject3DFromStored(childData);
      }
      
      if (child) {
        group.add(child);
      }
    });
  }
  
  // Ensure these critical fields
  group.userData.id = data.id;
  group.userData.name = data.name;
  group.userData.isUserCreated = true;
  group.userData.isSerializedFromCode = true;
  
  // Try to use the stored ID as the UUID if possible
  try {
    Object.defineProperty(group, 'uuid', { value: data.id });
  } catch (e) {
    console.warn("Could not set UUID, selection might not work correctly", e);
  }
  
  // console.log(`Created group from storage: id=${data.id}, uuid=${group.uuid}, children: ${group.children.length}`);
  
  // After creating the group, force transforms for debugging
  group.position.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  group.rotation.set(0, 0, 0);
  // console.log(`Group ${data.id} position:`, group.position, 'scale:', group.scale, 'rotation:', group.rotation);
  // console.log('Group children count:', group.children.length, group.children.map(child => child.type));
  
  return group;
};

// Helper to create a generic Object3D from stored data
const createObject3DFromStored = () => {
  // Try to get the original object from global references
  const originalObject = window.__objectReferences?.get(data.id) ;
  
  if (originalObject && !(originalObject instanceof THREE.Mesh) && 
      !(originalObject instanceof THREE.Group)) {
    // console.log(`Found original object3D: ${data.id}`);
    // We can reuse the entire original object
    const obj = originalObject.clone();
    
    // Apply transforms from the stored data
    if (data.position) obj.position.set(...data.position);
    if (data.rotation) obj.rotation.set(...data.rotation);
    if (data.scale) obj.scale.set(...data.scale);
    
    // Ensure userData is set correctly
    obj.userData = { ...data.userData };
    obj.userData.id = data.id;
    
    // Set the UUID to match the stored ID
    try {
      Object.defineProperty(obj, 'uuid', { value: data.id });
    } catch (e) {
      console.warn("Could not set UUID, selection might not work correctly", e);
    }
    
    // console.log(`Created object3D from original object: id=${data.id}, uuid=${obj.uuid}`);
    return obj;
  }
  
  // If we don't have the original object, create a new one
  const obj = new THREE.Object3D();
  
  // Apply transforms
  if (data.position) obj.position.set(...data.position);
  if (data.rotation) obj.rotation.set(...data.rotation);
  if (data.scale) obj.scale.set(...data.scale);
  
  // Restore userData
  if (data.userData) {
    obj.userData = { ...data.userData };
  }
  
  // Add children
  if (data.children && data.children.length > 0) {
    // console.log(`Creating ${data.children.length} children for object3D ${data.id}`);
    data.children.forEach(childData => {
      let child = null;
      if (childData.type === 'mesh') {
        child = createMeshFromStored(childData);
      } else if (childData.type === 'group') {
        child = createGroupFromStored(childData);
      } else if (childData.type === 'object') {
        child = createObject3DFromStored(childData);
      }
      
      if (child) {
        obj.add(child);
      }
    });
  }
  
  // Ensure these critical fields
  obj.userData.id = data.id;
  obj.userData.name = data.name;
  obj.userData.isUserCreated = true;
  obj.userData.isSerializedFromCode = true;
  
  // Try to use the stored ID as the UUID if possible
  try {
    Object.defineProperty(obj, 'uuid', { value: data.id });
  } catch (e) {
    console.warn("Could not set UUID, selection might not work correctly", e);
  }
  
  // console.log(`Created generic object3D from storage: id=${data.id}, uuid=${obj.uuid}`);
  
  return obj;
};

export function StoredObjects() {
  const { objects } = useObjectStore();
  const { scene } = useThree();
  const objectRefs = useRef(new Map());
  const firstRender = useRef(true);
  const pendingObjectCode = useStore((state) => state.pendingObjectCode);
  const setPendingObjectCode = useStore((state) => state.setPendingObjectCode);
  const addObjectFromCode = useObjectStore((state) => state.addObjectFromCode);
  
  // Convert stored objects to Three.js objects
  const threeObjects = useMemo(() => {
    // Skip recreation on first render to avoid useEffect loop
    if (firstRender.current) {
      firstRender.current = false;
      return [];
    }
    
    // console.log("Creating objects from storage, count:", objects.length);
    
    return objects.map(obj => {
      // Check if we already have this object in the refs
      const existingObj = objectRefs.current.get(obj.id);
      if (existingObj) {
        // Just update transforms instead of recreating
        existingObj.position.set(...obj.position);
        existingObj.rotation.set(...obj.rotation);
        existingObj.scale.set(...obj.scale);
        return existingObj;
      }
      
      // Create new object if not in refs
      if (obj.type === 'mesh') {
        return createMeshFromStored(obj);
      } else if (obj.type === 'group') {
        return createGroupFromStored(obj);
      } else if (obj.type === 'object') {
        return createObject3DFromStored(obj);
      }
      return null;
    }).filter(Boolean);
  }, [objects]);
  
  // Add objects to scene
  useEffect(() => {
    if (threeObjects.length === 0) return;
    
    // console.log("Adding objects to scene, count:", threeObjects.length);
    
    // Add new objects to scene
    threeObjects.forEach(obj => {
      if (obj && !scene.getObjectById(obj.id)) {
        // console.log(`Adding object to scene: ${obj.uuid}`);
        scene.add(obj);
        objectRefs.current.set(obj.userData.id, obj);
      }
    });
    
    // Capture the current ref value
    const currentRefs = new Map(objectRefs.current);
    
    // Cleanup
    return () => {
      // Only remove objects that are not in the current set
      currentRefs.forEach((obj, id) => {
        if (!threeObjects.some(newObj => newObj.userData.id === id)) {
          // console.log(`Removing object from scene: ${id}`);
          scene.remove(obj);
          currentRefs.delete(id);
        }
      });
    };
  }, [scene, threeObjects]);
  
  // Effect to add pending object code when 3D world is ready
  useEffect(() => {
    if (pendingObjectCode) {
      // console.log('Adding pending object from code after 3D world mount');
      addObjectFromCode(pendingObjectCode);
      setPendingObjectCode(null);
    }
  }, [pendingObjectCode, addObjectFromCode, setPendingObjectCode]);
  
  // Only update the store when user explicitly changes objects via TransformControls
  // That's now handled in the CustomTransformControls component
  
  return null;
} 
