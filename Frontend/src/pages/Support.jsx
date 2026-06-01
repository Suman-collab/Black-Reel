import React, { useState } from 'react';
import { Mail, Clock, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../lib/toast';
import './Support.css';

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'How do I cancel my subscription?',
      a: 'You can cancel your subscription at any time by visiting your Profile page, clicking the "Cancel Subscription" button under the Subscription section. Your premium access will remain active until the end of your current billing period.',
    },
    {
      q: 'Why was my account suspended?',
      a: 'Accounts are suspended if we detect violations of our terms of service, payment failures, or unusual concurrent usage patterns across too many distinct devices. Please reach out to us using the form below or via support@blackshortz.com to dispute or resolve a suspension.',
    },
    {
      q: 'How do I reset my password?',
      a: 'If you cannot sign in, click on the "Forgot password?" link on the login page. Enter your registered email address, and we will send a password reset link to your inbox.',
    },
    {
      q: 'Why is a video not playing?',
      a: 'Ensure you have a stable network connection. If you are not subscribed, please note you are allowed exactly one free video playback across your account history. Active plans are required for unlimited viewing.',
    },
    {
      q: 'How do I manage devices?',
      a: 'Go to your Settings page and locate the Device Management section to see all current active browsers and devices. You can click "Sign out from device" or sign out from all sessions to clear device limits.',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      await api.post('/support/contact', { name, email, subject, message });
      setSuccess(true);
      toast.success('Your message has been sent successfully!');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send support request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="support-page container animate-fade-in-up">
      <div className="support-hero">
        <h1 className="support-title text-gold uppercase tracking-wider">Contact Customer Support</h1>
        <p className="support-subtitle">We are here to help you get the best streaming experience possible.</p>
      </div>

      <div className="support-grid">
        {/* Info Column */}
        <div className="support-info-col">
          <div className="support-card glassmorphism">
            <h3>Direct Contact</h3>
            <div className="support-info-item">
              <Mail className="support-icon-gold" size={24} />
              <div>
                <strong>Email Address</strong>
                <p><a href="mailto:support@blackshortz.com" className="support-link">support@blackshortz.com</a></p>
              </div>
            </div>
            <div className="support-info-item" style={{ marginTop: '20px' }}>
              <Clock className="support-icon-gold" size={24} />
              <div>
                <strong>Average Response Time</strong>
                <p>We respond within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="support-card glassmorphism faq-card" style={{ marginTop: '24px' }}>
            <h3>Frequently Asked Questions</h3>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                  <button 
                    className="faq-question-btn" 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <ArrowRight size={16} className="faq-arrow" />
                  </button>
                  {activeFaq === idx && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="support-form-col">
          <div className="support-card glassmorphism form-card">
            <h3>Send a Message</h3>
            <p className="form-helper-text">Have a specific question, concern, or need help with a payment? Send us a message and our support team will get right back to you.</p>

            {success && (
              <div className="support-success-banner">
                <CheckCircle size={20} />
                <span>Thank you! Your message was sent successfully. We will email you within 24 hours.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="form-input form-textarea"
                  rows={5}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block support-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Sending Message...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
