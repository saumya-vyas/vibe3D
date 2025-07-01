import { createClient } from 'redis'
import { v4 } from 'uuid'

class RedisClient{
    constructor(){
        //for blocking operations (e.g. lPush, brPop)
        this.redis = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
            }
        })

        // Separate Redis client for hSet operations
        this.hsetRedis = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
            }
        })

        this.publisher = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
            }
        })

        this.subscriber = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
            }
        })

        this.connect()
        console.log('Connected to Redis')
    }

    async connect() {
        await this.redis.connect()
        await this.hsetRedis.connect()
        await this.publisher.connect()
        await this.subscriber.connect()
    }

    //Task queue method
    async addTask(data, type){
        const taskId = v4()

        await this.hsetRedis.hSet(`${type}:${taskId}:data`, 'image', data)
        await this.redis.lPush(`${type}:queue`, taskId)
       
        return taskId;
    }


    async getNextTaskFromQueues() {
        // brPop can take multiple keys and returns the first available
        const result = await this.redis.brPop(['enhance:queue', 'render:queue'], 0);
        if (!result) return null;

        const queue = result.key; // which queue
        const taskId = result.element;
        let data;
        if (queue === 'enhance:queue') {
            data = await this.hsetRedis.hGetAll(`enhance:${taskId}:data`);
        } else if (queue === 'render:queue') {
            data = await this.hsetRedis.hGetAll(`render:${taskId}:data`);
        }
        if (!data || !data.image) {
            console.error('Invalid data format in Redis:', data);
            return null;
        }
        return {
            taskId,
            data: data.image,
            type: queue.startsWith('enhance') ? 'enhance' : 'render'
        };
    }

    // Cleanup
    async cleanupTask(taskId) {
        const multi = this.hsetRedis.multi();
        
        // Delete task data
        multi.del(`enhance:${taskId}:data`);
        multi.del(`enhance:${taskId}:result`);
        
        // Unsubscribe from task channels
        await this.subscriber.unsubscribe(
            `enhance:${taskId}:status`,
            `enhance:${taskId}:error`
        );
        
        await multi.exec();
    }

    //Publish to channel
    async publish(channel, message){
        await this.publisher.publish(channel, JSON.stringify(message));
    }

    //Subscribe to channel
    async subscribeToTask(taskId, ws) {
        try {
            const statusChannel = `enhance:${taskId}:status`;
            const errorChannel = `enhance:${taskId}:error`;

            // Subscribe to status channel
            await this.subscriber.subscribe(statusChannel, async (message, channel) => {
                try {
                    const parsedMessage = JSON.parse(message);

                    if (parsedMessage.status === 'completed') {

                        const resultData = await this.hsetRedis.hGetAll(`enhance:${taskId}:result`);

                        if (!resultData || !resultData.image) {
                            throw new Error('No image data found in result');
                        }

                        const wsData = JSON.stringify({
                            id: taskId,
                            status: 'completed',
                            data: resultData,
                            type : 'enhance',
                        })

                        ws.send(wsData)

                        await this.cleanupTask(taskId);
                    }
                } catch (error) {
                    console.error('Error handling status message:', error);
                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: 'Error processing status message'
                    }));
                }
            });

            // Subscribe to error channel
            await this.subscriber.subscribe(errorChannel, async (message, channel) => {
                // console.log(`Received error message on ${channel}: ${message}`);

                try {
                    const parsedMessage = JSON.parse(message);

                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: parsedMessage.error
                    }));

                    await this.cleanupTask(taskId);
                } catch (error) {
                    console.error('Error handling error message:', error);
                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: 'Error processing error message'
                    }));
                }
            });

        } catch (error) {
            console.error('Error setting up subscription:', error);
            ws.send(JSON.stringify({
                id: taskId,
                status: 'error',
                data: 'Error setting up subscription'
            }));
        }
        
    }
    
    async subscribeToRenderTask(taskId, ws) {
        try {
            const statusChannel = `render:${taskId}:status`;
            const errorChannel = `render:${taskId}:error`;
    
            // Subscribe to status channel
            await this.subscriber.subscribe(statusChannel, async (message, channel) => {
                try {
                    const parsedMessage = JSON.parse(message);
    
                    if (parsedMessage.status === 'completed') {
    
                        const resultData = await this.hsetRedis.hGetAll(`render:${taskId}:result`);
    
                        if (!resultData || !resultData.image) {
                            throw new Error('No image data found in result');
                        }
    
                        const wsData = JSON.stringify({
                            id: taskId,
                            status: 'completed',
                            data: resultData,
                            type : 'render'
                        })
    
                        ws.send(wsData)
    
                        await this.cleanupTask(taskId);
                    }
                } catch (error) {
                    console.error('Error handling status message:', error);
                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: 'Error processing status message'
                    }));
                }
            });
    
            // Subscribe to error channel
            await this.subscriber.subscribe(errorChannel, async (message, channel) => {
                // console.log(`Received error message on ${channel}: ${message}`);
    
                try {
                    const parsedMessage = JSON.parse(message);
    
                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: parsedMessage.error
                    }));
    
                    await this.cleanupTask(taskId);
                } catch (error) {
                    console.error('Error handling error message:', error);
                    ws.send(JSON.stringify({
                        id: taskId,
                        status: 'error',
                        data: 'Error processing error message'
                    }));
                }
            });
    
        } catch (error) {
            console.error('Error setting up subscription:', error);
            ws.send(JSON.stringify({
                id: taskId,
                status: 'error',
                data: 'Error setting up subscription'
            }));
        }

    }
}

const redisClient = new RedisClient();

export default redisClient