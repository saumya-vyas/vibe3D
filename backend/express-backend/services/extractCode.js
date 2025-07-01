import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.EXTRACTER_API


async function extractCode({ threeJsCode }) {
  // Initialize client with your key inline
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
You are provided with a JavaScript code containing Three.js scene. It has 3D object made with THREE.js geometries and materials. Extract that 3D object code while preserving the actual 3D model shape and material, including relevant geometries, materials, meshes, and groups. Completely remove all unrelated elements such as the scene, renderer, camera, lighting, ground planes, animation loops, event listeners, orbit controls, and window resize handling.

Present the resulting code directly, ending with a single statement explicitly returning only the main object (THREE.Mesh or THREE.Group) that was created.

Return pure code wrapped inside single backticks.

Do not wrap the code in a function or module. Do not import anything. .
${threeJsCode}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",  // pick a supported model from your list
      contents: [{ text: prompt }],
      temperature: 0,
      maxOutputTokens: 512,
    });

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

export default extractCode;
