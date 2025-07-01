import { useState, useEffect } from "react";
import Canvas from "./components/Canvas";
import InfoSticker from "./components/InfoSticker";
import { useStore } from "./store/useStore";
import wsManager from "./lib/websocket";
import ThreeCodeHandler from "./lib/ThreeCodeHandler"
import "./App.css";

function App() {
  const setEnhanced = useStore((state) => state.setEnhancedImage);


 
  useEffect(() => {
    wsManager.connect();

    // Add message handler for enhancement
    const enhanceMessageHandler = (response) => {
      if (response.status === 'completed') {
        const imageDimension = JSON.parse(response.data.imageDimensions)
        setEnhanced({
          taskId: response.id,
          image: response.data.image,
          imageDimension
        })
      } else if (response.status === 'error') {
        setEnhanced({
          taskId: response.id,
          result: 'error',
          selectionBounds: null
        })
        console.error('Enhancement error:', response.data)
      }
    }

    //Add message handler for 3D render
    const renderMessageHandler = (response) => {
      ThreeCodeHandler(response)
    }

    wsManager.addMessageHandler(enhanceMessageHandler)
    wsManager.addMessageHandler(renderMessageHandler)

    // Cleanup
    return () => {
      wsManager.removeMessageHandler(enhanceMessageHandler)
      wsManager.removeMessageHandler(renderMessageHandler)
      wsManager.disconnect()
    }
  }, [])

  return (
    <div className="app-container">
        <Canvas />
        <InfoSticker />
    </div>
  );
}

export default App;
