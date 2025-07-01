import { Editor } from "tldraw";
import { useStore } from "@/store/useStore";

export default function ThreeCodeHandler({id, status, data, type}) {   
    if(status === 'error'){
        console.log('3D redner error')
        return;
    }
    const editor = useStore.getState().editor
    if(!editor){
        console.log('editor instance not available')
        return;
    }
    const createdShapes = useStore.getState().createdShapes
    const shapeId = createdShapes[id].shapeId 
    const code = data.image;
    if (!code || typeof code !== 'string' || !code.trim()) {
        console.error('No valid Three.js code received:', code);
        return;
    }

    let threeJsCode = extractThreeJS(code);

    editor.updateShape({
        id : shapeId,
        type : 'model3d',
        props : {
            threeJsCode
        }
    })
    
}

function extractThreeJS(code){
    let processedCode = code;
  
    // Extract code from markdown code blocks if present
    const jsPattern = /```javascript\s*\n([\s\S]*?)```/;
    const jsMatch = processedCode.match(jsPattern);
    
    if (jsMatch && jsMatch[1]) {
        processedCode = jsMatch[1];
    } else {
        // Try to find any code block with or without language specification
        const codePattern = /```(?:\w*\s*)?\n([\s\S]*?)```/;
        const codeMatch = processedCode.match(codePattern);
        if (codeMatch && codeMatch[1]) {
        processedCode = codeMatch[1];
        } else {
        // If no markdown code blocks found, try to find script tags
        const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/;
        const scriptMatch = processedCode.match(scriptPattern);
        if (scriptMatch && scriptMatch[1]) {
            processedCode = scriptMatch[1];
        }
        }
    }
    
    // Process the code to adapt to the non-ES modules environment
    processedCode = processedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    processedCode = processedCode.replace(/^import\s+\*\s+as\s+.*?\s+from\s+['"].*?['"];?\s*$/gm, '');
    processedCode = processedCode.replace(/^import\s+['"].*?['"];?\s*$/gm, '');
    processedCode = processedCode.replace(/^const\s+.*?\s*=\s*require\(['"].*?['"]\);?\s*$/gm, '');
    
    processedCode = processedCode.replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"];?\s*/g, '');
    processedCode = processedCode.replace(/import\s+{\s*OrbitControls\s*}\s+from\s+['"]three\/addons\/controls\/OrbitControls\.js['"];?\s*/g, '');
    processedCode = processedCode.replace(/import\s+{\s*[^}]*\s*}\s+from\s+['"]three['"];?\s*/g, '');
    processedCode = processedCode.replace(/import\s+THREE\s+from\s+['"]three['"];?\s*/g, '');
    
    processedCode = processedCode.replace(/THREE\.OrbitControls/g, 'OrbitControls');
    
    return processedCode;
}