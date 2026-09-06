import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Who the bot is allowed to talk about. Loaded once per cold start, not per request.
const aboutMe = readFileSync(path.join(process.cwd(), 'about-me.md'), 'utf-8');

const SYSTEM_INSTRUCTION = `You are a chatbot representing the person described below. \
Answer questions using ONLY the information in this document. If asked about anything \
unrelated to this person — general knowledge, coding help, other topics — politely decline \
and steer the conversation back to asking about them. Speak in first person, as if you were \
the person themself. Keep answers brief and conversational — a few sentences at most, only \
going longer if the question explicitly asks for detail or a list.

---
${aboutMe}
---`;

const MODEL = 'gemini-flash-latest';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_OUTPUT_TOKENS = 1024;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// Per-instance, in-memory rate limiting. Vercel functions can run as multiple
// concurrent instances and this map resets on every cold start, so it's a
// soft deterrent against casual abuse/quota-burning, not a hard guarantee.
// A shared store (e.g. Vercel KV / Upstash) would be needed for a strict limit.
const requestLog = new Map(); // ip -> { count, windowStart }

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    const entry = requestLog.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        requestLog.set(ip, { count: 1, windowStart: now });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (isRateLimited(getClientIp(req))) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
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
            config: { systemInstruction: SYSTEM_INSTRUCTION, maxOutputTokens: MAX_OUTPUT_TOKENS }
        });

        res.status(200).json({ reply: response.text });
    } catch (err) {
        console.error('Gemini API error:', err);

        if (err?.status === 429) {
            res.status(429).json({ error: "I've hit my daily response limit for today — please check back tomorrow!" });
            return;
        }

        res.status(500).json({ error: 'Something went wrong generating a response.' });
    }
}
