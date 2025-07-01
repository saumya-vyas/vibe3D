import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation,toDomPrecision, useIsEditing } from "tldraw";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useStore, useObjectStore } from "@/store/useStore";
import { useState } from "react";
import api from "@/lib/api";

// 1. Define the type for your custom shape
export const threePreviewShape = {
  type: "model3d",
  props: {
    threeJsCode: '',
    w: 1400,
    h: 1400,
  },
};

export class ThreePreviewShapeUtil extends BaseBoxShapeUtil {
  static type = "model3d";

  // Default props for new shapes
   getDefaultProps() {
    return {
      threeJsCode: '',
      w: 1400,
      h: 1400,
    };
  }

  canEdit = () => true

  // Render the shape
  component(shape) {
    const { w, h } = shape.props;
    const is2D = useStore((state) => state.is2D)
    const setIs2D = useStore((state) => state.setIs2D)
    const isEditing = useIsEditing(shape.id);
    const {addObjectFromCode} = useObjectStore();
    const setPendingObjectCode = useStore((state) => state.setPendingObjectCode);
    const [isExporting, setIsExporting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const htmltoUse = shape.props.threeJsCode
        ? `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>3D Model Preview</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        width: 100%; 
                        height: 100%;
                        background-color: transparent;
                    }
                    canvas { 
                        display: block; 
                        width: 100% !important; 
                        height: 100% !important;
                    }
                    /* Help tooltip */
                    .help-tooltip {
                        position: absolute;
                        bottom: 10px;
                        left: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-family: sans-serif;
                        font-size: 12px;
                        opacity: 0.7;
                        pointer-events: none;
                    }
                </style>
            </head>
            <body>
                <div id="container" style="width: 100%; height: 100%"></div>
             
                <script type="module">
                import * as THREE from "https://esm.sh/three";
                import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";
                ${shape.props.threeJsCode}
                // Prevent zooming issues
                document.body.addEventListener('wheel', e => { 
                    if (!e.ctrlKey) return; 
                    e.preventDefault(); 
                    return 
                }, { passive: false });
                </script>
            </body>
            </html>`
        : "";

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          position: 'relative',
          width: shape.props.width,
          height: shape.props.height,
          border: '3px solid #111',
          borderRadius: 32,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Button column inside the preview, top-right overlay (black-white theme) */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
            zIndex: 20,
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 40,
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            padding: '32px 24px',
            border: '2.5px solid #111',
            minWidth: 110,
            pointerEvents: 'auto',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Add to 3D World Button (circular, black-white) */}
          <button
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '3px solid #fff',
              background: isAdding ? '#333' : '#111',
              color: '#fff',
              fontSize: 40,
              fontWeight: 900,
              boxShadow: isAdding ? '0 2px 8px rgba(0,0,0,0.10)' : '0 4px 16px rgba(0,0,0,0.18)',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              position: 'relative',
              transition: 'background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s, transform 0.1s',
              opacity: isAdding ? 0.7 : 1,
              marginBottom: 0,
              letterSpacing: 1,
              padding: 0,
              pointerEvents: 'auto',
            }}
            onMouseOver={e => {
              if (!isAdding) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#111';
                e.currentTarget.style.border = '3px solid #111';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseOut={e => {
              if (!isAdding) {
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.border = '3px solid #fff';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onClick={async () => {
              if (shape.props.threeJsCode && !isAdding) {
                setIsAdding(true);
                try {
                  const res = await api.post('/parse', {
                    "threeJsCode": shape.props.threeJsCode
                  })
                  let objectCode = res.data.content;
                  if (typeof objectCode === 'string') {
                    objectCode = objectCode.replace(/^`+\s*javascript\s*/i, '').replace(/`+\s*$/i, '');
                  }
                  if (is2D) {
                    setIs2D(false);
                    setPendingObjectCode(objectCode);
                    setIsAdding(false);
                  } else {
                    const result = addObjectFromCode(objectCode);
                    if (!result) {
                      console.log('Failed to add object.');
                    }
                    setIsAdding(false);
                  }
                } catch (e) {
                  setIsAdding(false);
                  alert('Failed to add object.');
                }
              }
            }}
            disabled={isAdding}
            title="Add to 3D World"
          >
            {isAdding ? (
              <LoadingSkeleton width={28} height={28} />
            ) : (
              <span style={{fontSize: 38, fontWeight: 900, color: 'inherit', lineHeight: 1, marginRight: 0}}>+</span>
            )}
          </button>
          {/* Export as GLTF Button (circular, black-white) */}
          <button
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '3px solid #fff',
              background: isExporting ? '#333' : '#111',
              color: '#fff',
              fontSize: 26,
              fontWeight: 800,
              boxShadow: isExporting ? '0 2px 8px rgba(0,0,0,0.10)' : '0 4px 16px rgba(0,0,0,0.18)',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              position: 'relative',
              transition: 'background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s, transform 0.1s',
              opacity: isExporting ? 0.7 : 1,
              letterSpacing: 1,
              padding: 0,
              pointerEvents: 'auto',
            }}
            onMouseOver={e => {
              if (!isExporting) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#111';
                e.currentTarget.style.border = '3px solid #111';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseOut={e => {
              if (!isExporting) {
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.border = '3px solid #fff';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onClick={async () => {
              if (!shape.props.threeJsCode || isExporting) return;
              setIsExporting(true);
              let objectCode = shape.props.threeJsCode;
              try {
                const res = await api.post('/parse', { threeJsCode: shape.props.threeJsCode });
                objectCode = res.data.content;
                if (typeof objectCode === 'string') {
                  objectCode = objectCode.replace(/^`+\s*javascript\s*/i, '').replace(/`+\s*$/i, '');
                }
              } catch (e) {
                alert('Failed to parse 3D code from backend.');
                setIsExporting(false);
                return;
              }
              const THREE = await import('three');
              const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
              let object = null;
              try {
                // eslint-disable-next-line no-new-func
                const createObject = new Function('THREE', `${objectCode}; return typeof object !== 'undefined' ? object : null;`);
                object = createObject(THREE);
              } catch (e) {
                alert('Failed to create 3D object from code.');
                setIsExporting(false);
                return;
              }
              if (!object) {
                alert('No 3D object found in code.');
                setIsExporting(false);
                return;
              }
              const exporter = new GLTFExporter();
              exporter.parse(
                object,
                (gltf) => {
                  const output = JSON.stringify(gltf, null, 2);
                  const blob = new Blob([output], { type: 'application/octet-stream' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = 'scene.gltf';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }, 100);
                  setIsExporting(false);
                },
                { binary: false }
              );
            }}
            disabled={!shape.props.threeJsCode || isExporting}
            title={shape.props.threeJsCode ? 'Export as GLTF' : 'No 3D code to export'}
          >
            {isExporting ? (
              <LoadingSkeleton width={28} height={28} />
            ) : (
              <span style={{fontSize: 20, fontWeight: 800, color: 'inherit', lineHeight: 1, marginRight: 0}}>GLTF</span>
            )}
          </button>
        </div>
        {/* The preview area */}
        {htmltoUse ? (
          <>
            <iframe
              id={`iframe-1-${shape.id}`}
              srcDoc={htmltoUse}
              width={toDomPrecision(shape.props.w)}
              height={toDomPrecision(shape.props.h)}
              draggable={false}
              style={{
                pointerEvents: isEditing ? 'auto' : 'none', 
                border: '1px solid var(--color-panel-contrast)',
                borderRadius: 'var(--radius-2)',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
            />
          </> ) : (
            <div
                onPointerDown={e => {
                    // Prevent parent from handling drag/select
                    e.stopPropagation();
                }}
                style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--color-muted-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-muted-1)',
                }}
            >
              <LoadingSkeleton
                shapeId={shape.id}
                width={w}
                height={h}
                onPointerDown={stopEventPropagation} 
              />
            </div>
        )}
        {/* Tooltip */}
      {!isEditing && (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            minWidth: 380,
            maxWidth: '98%',
            textAlign: 'center',
            pointerEvents: 'none',
            fontSize: 36,
            fontWeight: 900,
            color: '#111',
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 28,
            padding: '32px 64px',
            boxShadow: '0 12px 48px rgba(76,161,241,0.22)',
            letterSpacing: 1.5,
            zIndex: 40,
            border: '3px solidrgb(25, 152, 210)',
            opacity: 1,
            textShadow: '0 4px 16px rgba(0,0,0,0.13)',
            lineHeight: 1.25,
          }}
        >
          Double click to interact with 3D model
        </div>
      )}
      </HTMLContainer>
    );
  }

  // Draw selection outline
  indicator(shape) {
    return <rect width={shape.props.width} height={shape.props.height} />;
  }
}
