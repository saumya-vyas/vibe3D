import  showPopup  from './popup';
import { blobToBase64 } from './blobTobase64';
import ThreeDbutton from './ThreeDbutton';
import api from './api';
import { useStore } from '@/store/useStore';

// The createButton function, moved from Canvas.jsx
export const createButton = (editor, container, setEnhancedImage, wsManager, popupRef, buttonRef, setCreatedShapes) => {
  const button = document.createElement('button');
  const button2 = document.createElement('button');
  const button3 = document.createElement('button');

  button.innerHTML = 'Enhance <i class="fa-solid fa-wand-magic-sparkles"></i>';
  button2.innerHTML = 'Render3D <i class="fa-solid fa-cube"></i>';
  button3.innerHTML = '<i class="fa-solid fa-circle-info"></i>';

  button.className = 'enhance-button';
  button2.className = 'enhance-button2';
  button3.className = 'enhance-button3';

  // Create popup element
  const popup = document.createElement('div');
  popup.className = 'popup-message';
  container.appendChild(popup);
  popupRef.current = popup;

  // Add event listener for enhance button
  button.onclick = async () => {
    const selectedIds = editor.getSelectedShapeIds();
    const bounds = editor.getSelectionPageBounds();
    const selectionBounds = bounds ? { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h } : null;

    if (selectedIds.length === 0) {
      showPopup('Select a Drawing!', 2000, button, popupRef);
    } else {
      try {
        // Convert selected shapes to image
        const { blob } = await editor.toImage(selectedIds);
        const base64 = await blobToBase64(blob);
        // HTTP request
        const response = await api.post("/enhance", { 
          image: base64, 
        });
        //HTTP response - response.data contains the parsed JSON
        const taskId = response.data.taskId;
        setEnhancedImage({
          taskId,
          selectionBounds,
          image: 'processing',
          imageDimension : {height:null, width: null}
        });
        //WebSocket request
        wsManager.sendMessage({taskId, type : 'enhance'});
      } catch (err) {
        console.error("Error during submission:", err); 
        showPopup('Error submitting image', 2000, button, popupRef);
      }
    }
  };
  
  // Add event listener for render 3D button
  button2.onclick = async () => {
    const selectedIds = editor.getSelectedShapeIds();
    const bounds = editor.getSelectionPageBounds();
    const selectionBounds = bounds ? { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h } : null;
  
    if (selectedIds.length === 0) {
      showPopup('Select an Image!', 2000, button2, popupRef);
    } else {
      try{
        // Get the latest enhancedImage state to avoid stale state issues
        const enhancedImage = useStore.getState().enhancedImage;
        ThreeDbutton(selectedIds, selectionBounds, editor, wsManager, setCreatedShapes, enhancedImage);
      } catch (err) {
        console.error("Error during submission:", err); 
        showPopup('Error submitting image', 2000, button, popupRef);
      }
    }
  };

  // Add event listener for info button
  button3.onclick = () => {
    // showPopup('Enhance image with AI', 2000, button3, popupRef);
    useStore.getState().setShowInfoSticker(true);
  };

  container.appendChild(button);
  container.appendChild(button2);
  container.appendChild(button3);
  
  buttonRef.current = [button, button2];
}; 