import {Worker} from 'worker_threads';
import redisClient from '../shared/redisClient.js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv'

dotenv.config()
console.log('process.env.REDIS_URL22 : ', process.env.REDIS_URL)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processTask() {
    try {
        const raw = await redisClient.getNextTaskFromQueues();
        if (raw) {
            const {taskId, data, type} = raw;
            const worker = new Worker(path.resolve(__dirname, 'services/worker.js'));

            worker.postMessage({taskId, data, type});
            

            worker.on('message', async (response) => {
                //response : {resultid, data, type, width, height} 
                switch(response.type){
                    case 'error':
                        await redisClient.publish(
                            `${type}:${taskId}:error`,
                            { error: response.error }
                        );
                        break;

                    case 'completed':
                        // Store result in Redis using separate hset client
                        await redisClient.hsetRedis.hSet(`${type}:${response.resultid}:result`,{
                            image : response.data, 
                            imageDimensions : JSON.stringify({
                                width : response.width, 
                                height : response.height
                            })
                        });

                        // Publish completion
                        await redisClient.publish(
                            `${type}:${taskId}:status`,
                            { status: 'completed' }
                        );

                        break;
                }
            })

            // Handle worker errors
            worker.on('error', async (error) => {
                await redisClient.publish(
                    `${type}:${taskId}:error`,
                    { error: error.message }
                );
                
            });
        }
    } catch(err) {
        console.error('Error processing enhance:', err);
    }
    
    // Schedule next check
    setTimeout(processTask, 1000); // Check every second
}

async function main() {
    try {
        console.log('Worker listening...');
        processTask(); // Start the processing loop
    } catch(err) {
        console.error('Error in worker process:', err);
        return;
    }
}

main();





