import api from './api';
import { createShapeId } from 'tldraw';
import { useStore } from '@/store/useStore';

export default async function ThreeDbutton(selectedIds, selectionBounds, editor, wsManager, setCreatedShapes, enhancedImage) {
    const createdShapes = useStore.getState().createdShapes;
    const { x, y, w, h } = selectionBounds;

    const selectedShapeId = selectedIds[0]

    const taskId = Object.entries(createdShapes).find(([_,value]) => value.shapeId === selectedShapeId)?.[0]

    const base64 = enhancedImage[taskId].image

    const response = await api.post('/render3d', {
        image : base64
    })

    console.log('step1')

    const newtaskId = response.data.taskId  

    //Loading shape

    const newShapeId = createShapeId()
    editor.createShape({
        id: newShapeId,
        type: 'model3d',
        x: x + w + 100,
        y: y,
        props: {
            threeJsCode : '',
        },
    });

    setCreatedShapes({ imageId: newtaskId, newShapeId, newAssetId: null });

    wsManager.sendMessage({taskId: newtaskId, type : 'render'});
}

async function waitforcodegeneration(taskId){

}