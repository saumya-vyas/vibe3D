import {create} from 'zustand'
import { persist } from 'zustand/middleware'
import * as THREE from 'three'

// Helper to convert a THREE.Object3D to a StoredObject
const threeObjectToStoredObject = (object) => {
  
  // Use the UUID consistently - critical for object identity
  const id = object.uuid;
  const name = object.userData?.name || `Object ${id.substring(0, 8)}`;
  const position = [object.position.x, object.position.y, object.position.z];
  const rotation = [object.rotation.x, object.rotation.y, object.rotation.z];
  const scale = [object.scale.x, object.scale.y, object.scale.z];
  
  // Ensure the userData.id is set consistently
  object.userData.id = id;
  object.userData.isSerializedFromCode = true;
  
  // Store as global reference to prevent garbage collection
  if (!window.__objectReferences) {
    window.__objectReferences = new Map();
  }
  window.__objectReferences.set(id, object);
  
  if (object instanceof THREE.Mesh) {
    // Get original geometry and material to preserve as much data as possible
    const geo = object.geometry;
    const mat = object.material;
    
    // Store references to prevent garbage collection
    window.__objectReferences.set(`${id}_geometry`, geo);
    window.__objectReferences.set(`${id}_material`, mat);
    
    return {
      id,
      type: 'mesh',
      name,
      position,
      rotation,
      scale,
      userData: { ...object.userData },
      geometry: {
        type: geo.type,
        parameters: {
          // We store the ID to look it up later
          objectId: id
        },
      },
      material: {
        type: mat.type,
        color: mat instanceof THREE.MeshStandardMaterial ? 
               mat.color?.getHexString() || 'ffffff' : 'ffffff',
        parameters: {
          // We store the ID to look it up later
          objectId: id
        },
      },
    };
  } else if (object instanceof THREE.Group) {
    // Process children
    const children = [];
    object.children.forEach(child => {
      if (child instanceof THREE.Object3D) {
        children.push(threeObjectToStoredObject(child));
      }
    });
    
    return {
      id,
      type: 'group',
      name,
      position,
      rotation,
      scale,
      userData: { ...object.userData },
      children,
    };
  }

  // If object is neither Mesh nor Group, return a generic stored object
  return {
    id,
    type: object.type || 'object3D',
    name,
    position,
    rotation,
    scale,
    userData: { ...object.userData },
  };
};

export const useObjectStore = create((set, get) => ({
  objects : [],
  meshCount : 0,

  addObject: (object) => {
    const storedObject = threeObjectToStoredObject(object);
    set((state) => ({
      objects: [...state.objects, storedObject],
      meshCount: state.meshCount + 1,
    }));
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
  },

    removeObject: (id) => {
    // Get current state
    const appState = useAppStore.getState();
    const { selectedObject, setSelectedObject } = appState;
    
    // Update the objects array first
    set((state) => ({
      objects: state.objects.filter(obj => obj.id !== id),
    }));
    
    // If we're removing the selected object, clear the selection
    // Use direct state setting instead of the setter function
    if (selectedObject && (selectedObject.uuid === id || selectedObject.userData?.id === id)) {
      // Use direct setState to avoid setter function which may have additional logic
      useAppStore.setState({ selectedObject: null });
      
      // Wait a tick before clearing the deletion flag to ensure all updates have propagated
      setTimeout(() => {
        useAppStore.setState({ isDeleting: false });
      }, 10);
    } else {
      // Not deleting the selected object, so just turn off deleting flag
      setTimeout(() => {
        useAppStore.setState({ isDeleting: false });
      }, 10);
    }
  },

  addObjectFromCode: (code) => {
    try {
      // Create a function from the code string
      const createObjectFunction = new Function('THREE', code);
      
      // Execute the function with THREE library as parameter
      const object = createObjectFunction(THREE);
      
      // Check that the object is a valid THREE.Object3D type (Mesh, Group, or generic Object3D)
      if (!(object instanceof THREE.Object3D)) {
        console.log("object:", object);
        console.error('The code must return a THREE.Object3D, THREE.Mesh, or THREE.Group object');
        return null;
      }
      
      // Log the specific type for debugging
      if (object instanceof THREE.Mesh) {
        console.log('Adding Mesh from code');
      } else if (object instanceof THREE.Group) {
        console.log('Adding Group from code');
      } else if (object instanceof THREE.Object3D) {
        console.log('Adding generic Object3D from code');
      }
      
      // Set properties
      object.userData.isUserCreated = true;
      object.userData.name = `User Object ${get().meshCount + 1}`;
      
      // Add to store - threeObjectToStoredObject will handle the specific type
      get().addObject(object);
      
      return object;
    } catch (err) {
      console.error('Error executing code:', err);
      return null;
    }
  },
}))

export const useAppStore = create((set) => ({
  isUIfocused : false,
  setUIFocused: (focused) => set({ isUIFocused: focused }),
  selectedObject: null,
  setSelectedObject: (object) => set((state) => {
    // Prevent selection changes during deletion
    if (state.isDeleting) return state;
    return { selectedObject: object };
  }),
  transformMode: 'translate',
  setTransformMode: (mode) => set(() => ({ transformMode: mode })),
  isDeleting: false,
  setIsDeleting: (isDeleting) => set(() => ({ isDeleting })),
}))

export const useStore = create(persist(
  (set, get) => ({
    //Drawing
    image: null,
    setImage: ({image}) => set(() => ({ image })),

    //Enhanced image
    enhancedImage: {},
    setEnhancedImage: (image) => {
        set((state) => ({ 
            enhancedImage: {
                ...state.enhancedImage,
                [image.taskId]: {
                    image: image.image,
                    selectionBounds: image.selectionBounds || state.enhancedImage[image.taskId]?.selectionBounds,
                    imageDimension: image.imageDimension
                }   
            }
        }));
    },

    //3Dprocessed code
    threeProcessed: {},
    // setThreeProcessed: ()

    //createdShapes
    createdShapes: {},
    setCreatedShapes: (shape) => 
        set((state) => ({
            createdShapes : {
                ...state.createdShapes,
                [shape.imageId] : {
                    shapeId :  shape.newShapeId,
                    assetId : shape.newAssetId,
                }
            }
    })),

    //editor
    editor : null, 
    setEditor : (editor) => set(() => ({editor})),

    //2D/3D toggle
    is2D : true,
    setIs2D : (is2D) => set(() => ({ is2D })),

    // Pending object code for 3D world
    pendingObjectCode: null,
    setPendingObjectCode: (code) => set(() => ({ pendingObjectCode: code })),

    // Info Sticker Modal
    showInfoSticker: false,
    setShowInfoSticker: (show) => set(() => ({ showInfoSticker: show })),
  }),
  {
    name: 'vibe-draw-storage', // unique name in localStorage
    partialize: (state) => ({
      enhancedImage: state.enhancedImage,
      createdShapes: state.createdShapes
    })
  }
));
