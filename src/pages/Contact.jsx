import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sendContactMessage } from '../lib/api';
import { CONTACT_TOPICS } from '../lib/contactTopics';
import './Contact.css';

const MAX_MESSAGE = 3000;
const EMPTY = { name: '', email: '', subject: '', message: '', consent: false, website: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (form.subject.trim().length < 3) errors.subject = 'Please add a short subject (at least 3 characters).';
  if (form.message.trim().length < 10) errors.message = 'Please write a little more (at least 10 characters).';
  if (!form.consent) errors.consent = 'Please confirm so we can store your message and reply.';
  return errors;
}

export default function Contact() {
  const [params] = useSearchParams();
  const initialTopic = CONTACT_TOPICS.some((t) => t.value === params.get('topic')) ? params.get('topic') : 'general';
  const [form, setForm] = useState({ ...EMPTY, category: initialTopic });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ sending: false, sent: '', error: '' });

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setStatus({ sending: true, sent: '', error: '' });
    try {
      const res = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        consent: true,
        website: form.website,
      });
      setStatus({ sending: false, sent: res.message, error: '' });
      setForm({ ...EMPTY, category: 'general' });
    } catch (err) {
      setStatus({ sending: false, sent: '', error: err.message });
    }
  }

  const fieldProps = (field) => ({
    id: `contact-${field}`,
    value: form[field],
    onChange: set(field),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `contact-${field}-error` : undefined,
  });

  return (
    <div className="page contact">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Contact us</h1>
          <p className="page-desc">
            Questions, ideas, or spotted a wrong fare or bus stop? Send us a message and the team will get back to you.
          </p>
        </div>
      </section>

      <section className="section contact-content">
        <div className="container contact-grid">
          <div className="contact-card">
            {status.sent ? (
              <div className="notice notice-success" role="status">
                <span className="notice-icon" aria-hidden="true">✅</span>
                <div>
                  <strong>Message sent</strong>
                  {status.sent}
                  <div className="notice-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setStatus({ sending: false, sent: '', error: '' })}>
                      Send another message
                    </button>
                    <Link to="/" className="btn btn-primary">Back to the journey planner</Link>
                  </div>
                </div>
              </div>
            ) : (
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <div className="contact-row">
                  <div className="contact-field">
                    <label htmlFor="contact-name">Your name</label>
                    <input type="text" autoComplete="name" maxLength={100} {...fieldProps('name')} />
                    {errors.name && <p className="contact-error" id="contact-name-error">{errors.name}</p>}
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-email">Email address</label>
                    <input type="email" autoComplete="email" maxLength={254} {...fieldProps('email')} />
                    {errors.email && <p className="contact-error" id="contact-email-error">{errors.email}</p>}
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-category">What's it about?</label>
                  <select id="contact-category" value={form.category} onChange={set('category')}>
                    {CONTACT_TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-subject">Subject</label>
                  <input type="text" maxLength={150} {...fieldProps('subject')} />
                  {errors.subject && <p className="contact-error" id="contact-subject-error">{errors.subject}</p>}
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-message">Message</label>
                  <textarea rows={7} maxLength={MAX_MESSAGE} {...fieldProps('message')} />
                  <div className="contact-field-meta">
                    {errors.message ? (
                      <p className="contact-error" id="contact-message-error">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <span className="contact-count">{form.message.length}/{MAX_MESSAGE}</span>
                  </div>
                </div>

                {/* Bot trap: hidden from people and screen readers, so only bots fill it in */}
                <div className="contact-trap" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </div>

                <div className="contact-consent">
                  <input
                    id="contact-consent"
                    type="checkbox"
                    checked={form.consent}
                    onChange={set('consent')}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
                  />
                  <label htmlFor="contact-consent">
                    I agree that my name, email and message are stored so the team can reply. They're deleted after
                    12 months — see the <Link to="/privacy">Privacy Policy</Link>.
                  </label>
                </div>
                {errors.consent && <p className="contact-error" id="contact-consent-error">{errors.consent}</p>}

                {status.error && (
                  <div className="notice notice-error" role="alert">
                    <span className="notice-icon" aria-hidden="true">⚠️</span>
                    <div>{status.error}</div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary contact-submit" disabled={status.sending}>
                  {status.sending ? <span className="spinner" /> : '✉️'} {status.sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <aside className="contact-aside">
            <div className="contact-aside-card">
              <h2>What happens next</h2>
              <ul>
                <li>Your message goes straight to the app's admin team.</li>
                <li>We aim to reply by email within 5 working days.</li>
                <li>Corrections to fares, zones or stops are checked and fixed as quickly as we can.</li>
              </ul>
            </div>
            <div className="contact-aside-card">
              <h2>Need travel help right now?</h2>
              <ul>
                <li><a href="https://www.nexus.org.uk" target="_blank" rel="noopener noreferrer">Nexus (Metro)</a></li>
                <li><a href="https://www.gonortheast.co.uk/contact-us" target="_blank" rel="noopener noreferrer">Go North East</a></li>
                <li><a href="https://www.stagecoachbus.com/contact" target="_blank" rel="noopener noreferrer">Stagecoach</a></li>
                <li><a href="https://www.northernrailway.co.uk" target="_blank" rel="noopener noreferrer">Northern Trains</a></li>
              </ul>
              <p className="contact-aside-note">For lost property, delays or ticket refunds, please contact the operator directly.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
