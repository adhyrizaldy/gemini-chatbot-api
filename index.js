import express from 'express';
import multer from 'multer';
import cors from 'cors';

import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// const ai = new GoogleGenAI({});

app.use(cors());
app.use(express.json());

function extractText(resp) {
  try {
    // Cari parts di berbagai kemungkinan jalur
    const parts =
      resp?.response?.candidates?.[0]?.content?.parts ??
      resp?.candidates?.[0]?.content?.parts;

    // Kalau parts array dan berisi teks → gabungkan semua
    if (Array.isArray(parts)) {
      const textSegments = parts
        .map(p => p?.text) 
        .filter(Boolean); 
      if (textSegments.length > 0) {
        return textSegments.join("\n");
      }
    }

    // Kalau tidak ada parts array → coba jalur lain
    const text =
      resp?.response?.candidates?.[0]?.content?.text ??
      resp?.output ??
      resp?.data;

    return text ?? JSON.stringify(resp, null, 2);
  } catch (err) {
    console.error("Error extracting text:", err);
    return JSON.stringify(resp, null, 2);
  }
}

// 1. POST API Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) throw new Error("messages must be an array");
    
    const contents = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    
    const resp = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents
    });
    
    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. From image

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));