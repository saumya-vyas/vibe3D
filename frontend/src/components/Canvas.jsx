import { Tldraw, createShapeId,AssetRecordType } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useRef, useState } from 'react'
import {useStore} from '@/store/useStore'
import './Canvas.css'
import { LoadingShapeUtil, loadingShape } from '@/customshapes/loadingSkeletonShape'
import { ThreePreviewShapeUtil } from '@/customshapes/ThreePreviewShape'
import Toggle2D3D from './Toggle2D3D.jsx'
import Scene from './three/Scene'
import wsManager from '@/lib/websocket'
import { createButton } from '@/lib/createButton'

// Array of custom shape utilities
const customShapeUtils = [LoadingShapeUtil, ThreePreviewShapeUtil];


const Canvas = () => {
  const buttonRef = useRef([])
  const popupRef = useRef(null)
  const editorRef = useRef(null)
  const enhancedImage = useStore((state) => state.enhancedImage)
  const setEnhancedImage = useStore((state) => state.setEnhancedImage)
  const setCreatedShapes = useStore((state) => state.setCreatedShapes)
  const createdShapes = useStore((state) => state.createdShapes)
  const setEditor = useStore((state) => state.setEditor);
  const {is2D} = useStore()



  useEffect(() => {
    return () => {
      if (editorRef.current) {
           const editor = editorRef.current;

            // Clean up all created shapes and assets
            Object.values(createdShapes).forEach(({ shapeId, assetId }) => {
                try {
                    editor.deleteShape(shapeId);
                    if (assetId) {
                        editor.deleteAssets([assetId]);
                    }
                } catch (e) {
                    // Silently ignore if shape/asset doesn't exist
                }
            });
      }
    }
  }, [])

  useEffect(() => {
    if (enhancedImage && editorRef.current) {
        const editor = editorRef.current;

        // Process only the changed images
        Object.entries(enhancedImage).forEach(([imageId, imageData]) => {
            const { image, selectionBounds, imageDimension } = imageData;
            const {height, width} = imageDimension || {};
            
            if (!selectionBounds) {
                console.warn('Selection bounds not found for image:', imageId);
                return;
            }
            const { x, y, w, h } = selectionBounds;
            
            if (
              typeof x !== 'number' ||
              typeof y !== 'number' ||
              typeof w !== 'number' ||
              typeof h !== 'number'
            ) {
              console.error('Invalid selectionBounds:', selectionBounds);
              return;
            }
            
            // If this image already exists, update it
            if (createdShapes[imageId]) {
                const { shapeId, assetId } = createdShapes[imageId];

                if (image === 'processing') {
                    // If it's still processing, do nothing (loading shape already exists)
                    return;
                } else {
                    // If it's completed, replace loading shape with image
                    try {
                        // Delete existing shape
                        editor.deleteShape(shapeId);
                        if (assetId) {
                            editor.deleteAssets([assetId]);
                        }

                        // Create new asset
                        const newAssetId = AssetRecordType.createId();
                        editor.createAssets([
                            {
                                id: newAssetId,
                                type: 'image',
                                typeName: 'asset',
                                props: {
                                    name: 'improved-drawing.png',
                                    src: `data:image/png;base64,${image.replace(/^"+|"+$/g, "")}`,
                                    w: width,
                                    h: height,
                                    mimeType: 'image/png',
                                    isAnimated: false,
                                },
                                meta: {},
                            },
                        ]);

                        // Create new image shape
                        const newShapeId = createShapeId();
                        editor.createShape({
                            id: newShapeId,
                            type: 'image',
                            x: x + w + 100,
                            y: y,
                            props: {
                                assetId: newAssetId,
                                w: width,
                                h: height,
                            },
                        });

                        // Update created shapes record
                        setCreatedShapes({ imageId, newShapeId, newAssetId });
                    } catch (e) {
                        console.error('Error updating shape:', e);
                    }
                }
            } else {
                // New image, create it
                const newShapeId = createShapeId();
                let newAssetId;

                if (image === 'processing') {
                    // Create loading shape
                    editor.createShape({
                        id: newShapeId,
                        type: loadingShape.type,
                        x: x + w + 100,
                        y: y,
                        props: {
                            width: w,
                            height: h
                        },
                    });
                } else {
                    // Create image shape
                    newAssetId = AssetRecordType.createId();
                    editor.createAssets([
                        {
                            id: newAssetId,
                            type: 'image',
                            typeName: 'asset',
                            props: {
                                name: 'improved-drawing.png',
                                src: `data:image/png;base64,${image.replace(/^"+|"+$/g, "")}`,
                                w: width,
                                h: height,
                                mimeType: 'image/png',
                                isAnimated: false,
                            },
                            meta: {},
                        },
                    ]);

                    editor.createShape({
                        id: newShapeId,
                        type: 'image',
                        x: x + w + 100,
                        y: y,
                        props: {
                            assetId: newAssetId,
                            w: width,
                            h: height,
                        },
                    });
                }

                // Update created shapes record
                setCreatedShapes({ imageId, newShapeId, newAssetId });
            }
        });
    }
}, [enhancedImage]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor
    setEditor(editor);
    const container = editor.getContainer()
    
    if (!buttonRef.current || buttonRef.current.length === 0) {
      createButton(editor, container, setEnhancedImage, wsManager, popupRef, buttonRef, setCreatedShapes)
    }
    
    // Add change listener for button state
    editor.on('change', () => {
      const selectedShapes = editor.getSelectedShapes()
      
      if (buttonRef.current && buttonRef.current.length > 0) {
        buttonRef.current.forEach(button => {
          if (selectedShapes.length > 0) {
            button.classList.add('active')
          } else {
            button.classList.remove('active')
          }
        })
      }
    })
  }

  return (
    <div className="canvas-container">
      {/* 2D canvas */}
      {(() => { if (is2D) return null; })()}
      <div style={{ display: is2D ? 'block' : 'none', width: '100vw', height: '100vh' }}>
        <Tldraw
          shapeUtils={customShapeUtils}
          persistenceKey="example"
          onMount={handleEditorMount}
        />
      </div>

      {/* 3D world */}
      {(() => { if (!is2D) return null; })()}
      <div style={{ display: is2D ? 'none' : 'block', width: '100vw', height: '100vh' }}>
        <Scene />
      </div>
      <Toggle2D3D/>
    </div>
  )
}

export default Canvas
