// Sends a "visitor asked something I couldn't answer" note to Gunho via Resend.
// Kept as a plain fetch to Resend's REST API rather than pulling in their SDK —
// this is the only call this endpoint ever makes.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const NOTIFY_TO = 'hobak4all@gmail.com';
// Resend's sandbox sender (no verified domain needed) can only deliver to the
// email address the Resend account itself was signed up with — that's NOTIFY_TO.
const FROM_ADDRESS = 'Portfolio Chatbot <onboarding@resend.dev>';

const MAX_FIELD_LENGTH = 200;
const MAX_QUESTION_LENGTH = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

// Same per-instance, in-memory, soft-limit approach as api/chat.js — see the
// comment there for why this isn't a hard guarantee across instances.
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

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (isRateLimited(getClientIp(req))) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
        return;
    }

    const { name, email, role, question } = req.body ?? {};
    const fields = { name, email, role, question };

    for (const [key, value] of Object.entries(fields)) {
        if (typeof value !== 'string' || value.trim() === '') {
            res.status(400).json({ error: `${key} is required` });
            return;
        }
    }

    if (name.length > MAX_FIELD_LENGTH || role.length > MAX_FIELD_LENGTH) {
        res.status(400).json({ error: `name and role must be ${MAX_FIELD_LENGTH} characters or fewer` });
        return;
    }

    if (!EMAIL_PATTERN.test(email)) {
        res.status(400).json({ error: 'email is not a valid email address' });
        return;
    }

    if (question.length > MAX_QUESTION_LENGTH) {
        res.status(400).json({ error: `question must be ${MAX_QUESTION_LENGTH} characters or fewer` });
        return;
    }

    try {
        const resendResponse = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_ADDRESS,
                to: [NOTIFY_TO],
                reply_to: email,
                subject: `Chatbot: unanswered question from ${name}`,
                html: `
                    <p><strong>Question:</strong> ${escapeHtml(question)}</p>
                    <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
                    <p><strong>Current role/job:</strong> ${escapeHtml(role)}</p>
                `
            })
        });

        if (!resendResponse.ok) {
            const errorBody = await resendResponse.text().catch(() => '');
            console.error('Resend API error:', resendResponse.status, errorBody);
            res.status(502).json({ error: 'Something went wrong sending your note. Please try again.' });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Resend request failed:', err);
        res.status(502).json({ error: 'Something went wrong sending your note. Please try again.' });
    }
}
