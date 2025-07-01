import {parentPort} from "worker_threads"
import {enhance} from "./imageEnhancer.js"
import {render3D} from "./render3DCode.js" 
import sharp from "sharp"


parentPort.on('message',async ({taskId, data, type}) => {
    try {


        let response;

        if(type === 'enhance'){
            response = await enhance({image: data});
        }
        else if(type === 'render'){
            response = await render3D({image : data});
        }


        const result = response.data
        const resultid = taskId


        if(type === 'render'){
                                //resultid, data, type
            parentPort.postMessage({resultid, ...response, width : 1, height : 1})
            return;
        }

        let dimensions
        try {
            dimensions = await getImageDimensionsFromBase64(result);
        } catch (err) {
            console.error("Dimension extraction failed:", err.message);
            dimensions = { width: null, height: null, error: err.message };
        } 
                            //{resultid, data, type, width, height}
        parentPort.postMessage({resultid, ...response, ...dimensions});
    } catch (err) {
        console.error('Error in worker:', err);
        parentPort.postMessage({
            resultid: taskId,
            error: err.message,
            type: 'error'
        });
    }
})

const getImageDimensionsFromBase64 = async (base64) => {
    try {
        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const metadata = await sharp(buffer).metadata();
        return { width: metadata.width, height: metadata.height };
    } catch (err) {
        throw new Error('Failed to get image dimensions: ' + err.message);
    }
  }

