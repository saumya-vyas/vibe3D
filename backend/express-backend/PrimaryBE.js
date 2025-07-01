import express from 'express';
import cors from 'cors'
import setupWebSocketServer from './websocket/wsServer.js';
import taskService from './services/taskService.js';
import extractCode from './services/extractCode.js';
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: process.env.FRONTEND_URL, 
}));

//routes
app.post('/enhance', async (req, res) => {
    const {image} = req.body;
    try{    
        //get taskId as object
        const taskId = await taskService.handleTask({image, type : 'enhance'});
        res.json(taskId)
    }catch(err){
        res.json({message : "submission failed :("})
    }
})

app.post('/render3d', async ( req, res) => {
    const {image} = req.body;
    try{
        const taskId = await taskService.handleTask({image, type : 'render'});
        res.json(taskId)
    }catch(err){
        res.json({message : 'submission failed :('})
    }
})

app.post('/parse', async (req, res) => {
    const {threeJsCode} = req.body;
    const extractedCode = await extractCode({threeJsCode})
    res.json({content : extractedCode})
})





async function main(){
    try{
        const httpServer = app.listen(3000);
        setupWebSocketServer(httpServer)
    }catch(err){
        console.error('Error connecting to Redis:', err);
        return;
    }
}

main()
