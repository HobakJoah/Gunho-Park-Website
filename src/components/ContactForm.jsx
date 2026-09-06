import { useState } from 'react'
import './ContactForm.css'

// Shown under a robot reply the backend flagged as "couldn't answer this from
// about-me.md" (see api/chat.js's UNANSWERED_MARKER). Collects who's asking so
// Gunho can actually get back to them, then forwards it via /api/contact.
export function ContactForm({ question, onSent }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        if (!name.trim() || !email.trim() || !role.trim()) {
            setError('Please fill in all three fields.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, role, question })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || 'Something went wrong sending your note. Please try again.');
                setIsSubmitting(false);
                return;
            }

            onSent();
        } catch (err) {
            console.error('Contact request failed:', err);
            setError('Something went wrong sending your note. Please try again.');
            setIsSubmitting(false);
        }
    }

    return (
        <form className="contact-form" onSubmit={handleSubmit}>
            <p className="contact-form-prompt">
                Want to send this question to Gunho? Let him know who's asking:
            </p>
            <input
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="contact-form-input"
            />
            <input
                placeholder="Your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="contact-form-input"
            />
            <input
                placeholder="Current role/job"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="contact-form-input"
            />
            {error && <p className="contact-form-error">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="contact-form-submit">
                {isSubmitting ? 'Sending...' : 'Send to Gunho'}
            </button>
        </form>
    );
}
