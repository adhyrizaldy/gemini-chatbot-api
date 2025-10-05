import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const upload = multer();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// const ai = new GoogleGenAI({});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. POST API Chat
app.post(
  '/api/chat', 
  async (req, res) => {
    const { body } = req;
    const { conversation } = body;

    if (!conversation || !Array.isArray(conversation)) {
      res.status(400).json({
        message: "Percakapan harus valid!",
        data: null,
        success: false
      });
      return;
    }

    const conversationIsValid = conversation.every((message) => {
      // kondisi pertama -- message harus truthy
      if (!message) return false;

      // kondisi kedua -- message harus berupa object, namun bukan array!
      if (typeof message !== 'object' || Array.isArray(message)) return false;

      // kondisi ketiga -- message harus berisi hanya role dan text
      const keys = Object.keys(message);
      const keyLengthIsValid = keys.length === 2;
      const keyContainsValidName = keys.every(key => ['role', 'text'].includes(key));

      if (!keyLengthIsValid || !keyContainsValidName) return false;

      // kondisi keempat
      // -- role harus berupa 'user' | 'model'
      // -- text harus berupa string

      const { role, text } = message;
      const roleIsValid = ['user', 'model'].includes(role);
      const textIsValid = typeof text === 'string';

      if (!roleIsValid || !textIsValid) return false;

      // selebihnya...

      return true;
    });

    if (!conversationIsValid) {
      res.status(400).json({
        message: "Percakapan harus valid!",
        data: null,
        success: false
      });
      return;
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    try {
      const aiResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents
      });

      res.status(200).json({
        success: true,
        data: aiResponse.text,
        message: "Berhasil ditanggapi oleh Google Gemini Flash!"
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        data: null,
        message: e.message || "Ada masalah di server gan!"
      })
    }
  }
);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));