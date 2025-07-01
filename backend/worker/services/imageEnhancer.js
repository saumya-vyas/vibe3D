import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import * as fs from "node:fs";

export async function enhance({image}) {
  const ai = new GoogleGenAI({ apiKey: process.env.ENHANCER_API });
  try{
    
    // Ensure we have a valid base64 string
    if (typeof image !== 'string') {
      throw new Error('Invalid image data: expected string, got ' + typeof image)
    }

    // Prepare the content parts
    const contents = [
      { text: "Convert this rough sketch into a stylish image of a structured low-poly 3D model with proper lighting. Include only the object in the image, with nothing else." },
      {
        inlineData: {
          mimeType: "image/png",
          data: image,
        },
      },
    ];

    // Set responseModalities to include "Image" so the model can generate an image
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      // Based on the part type, either show the text or save the image
      if (part.text) {
        // console.log(part.text);
      } else if (part.inlineData) {
        const data = part.inlineData.data;
        console.log("Image Enhanced Successfully");
        return {data, type : 'completed'}
      }
    }
  } catch (error) {
    console.error("Image enhancement failed:", error.message);
    return { error: error.message, type: 'error' };
  }
}

