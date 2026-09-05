import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Who the bot is allowed to talk about. Loaded once per cold start, not per request.
const aboutMe = readFileSync(path.join(process.cwd(), 'about-me.md'), 'utf-8');

const SYSTEM_INSTRUCTION = `You are a chatbot representing the person described below. \
Answer questions using ONLY the information in this document. If asked about anything \
unrelated to this person — general knowledge, coding help, other topics — politely decline \
and steer the conversation back to asking about them. Speak in first person, as if you were \
the person themself.

---
${aboutMe}
---`;

const MODEL = 'gemini-3.6-flash';
const MAX_MESSAGE_LENGTH = 2000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { message, history } = req.body ?? {};

    if (typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({ error: 'message is required' });
        return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
        return;
    }

    const safeHistory = Array.isArray(history) ? history : [];

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                ...safeHistory,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });

        res.status(200).json({ reply: response.text });
    } catch (err) {
        console.error('Gemini API error:', err);
        res.status(500).json({ error: 'Something went wrong generating a response.' });
    }
}
