import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Eye, HelpCircle } from 'lucide-react';
import './LegalPage.css';

export default function Cookies() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-1');

  const menuItems = [
    { id: 'sec-1', label: '1. Cookie Technologies' },
    { id: 'sec-2', label: '2. Essential Cookies' },
    { id: 'sec-3', label: '3. Analytics Cookies' },
    { id: 'sec-4', label: '4. Functional Cookies' },
    { id: 'sec-5', label: '5. Advertising & Marketing' },
    { id: 'sec-6', label: '6. Cookie Management' }
  ];

  const handleScroll = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="legal-page">
      
      {/* Hero section */}
      <div className="legal-hero animate-fadeInUp" style={{ '--delay': 1 }}>
        <div className="legal-hero-glow"></div>
        <span className="legal-last-updated">LAST UPDATED: JUNE 2026</span>
        <h1 className="legal-title">Cookie Policy</h1>
        <p className="legal-subtitle">Detailed information about how Black Reel uses cookies, web beacons, and other local data caching technologies.</p>
      </div>

      <div className="legal-container">
        
        {/* Sticky Table of Contents sidebar */}
        <aside className="legal-sidebar animate-fadeInUp" style={{ '--delay': 2 }}>
          <h4 className="sidebar-title">NAVIGATION</h4>
          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => handleScroll(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Core content body */}
        <main className="legal-content-body animate-fadeInUp" style={{ '--delay': 3 }}>
          
          <section id="sec-1" className="legal-section">
            <span className="legal-section-number">SECTION 1</span>
            <h2>Cookie Technologies</h2>
            <p>
              Cookies are small text blocks saved directly to your browser memory when you visit web pages. Black Reel leverages cookies, local storage coordinates, and transparent web pixels to understand platform usage and secure user authentication sessions.
            </p>
            <p>
              Cookies are classified either as session-based (temporary data that vanishes when you close the browser) or persistent (retained across visits to remember your preferences).
            </p>
          </section>

          <section id="sec-2" className="legal-section">
            <span className="legal-section-number">SECTION 2</span>
            <h2>Essential Cookies</h2>
            <p>
              These cookies are strictly required to operate the basic infrastructure of our streaming system. Without these, core services like login auth sessions, payment checkout pathways, and system limit checks cannot function.
            </p>
            <div className="legal-highlight-box">
              <p>✓ Auth tokens keeping you signed in.</p>
              <p>✓ Active plan tokens managing content gating rules.</p>
              <p>✓ Device signature keys tracking screen concurrency limits.</p>
            </div>
          </section>

          <section id="sec-3" className="legal-section">
            <span className="legal-section-number">SECTION 3</span>
            <h2>Analytics Cookies</h2>
            <p>
              Analytics cookies collect aggregates regarding how members navigate Black Reel. We utilize this to gather performance logs, detect buffering trends, calculate playback error locations, and optimize file load speeds.
            </p>
            <p>
              The data remains fully anonymized and does not contain personal identity coordinates.
            </p>
          </section>

          <section id="sec-4" className="legal-section">
            <span className="legal-section-number">SECTION 4</span>
            <h2>Functional Cookies</h2>
            <p>
              Functional cookies allow the website to remember user preferences. They enable personalized enhancements:
            </p>
            <ul>
              <li>Persisting your language selection (e.g. English, Spanish).</li>
              <li>Keeping track of your expanded/collapsed table rows in Admin space.</li>
              <li>Preserving parental control restrict-flags without prompting on every screen load.</li>
            </ul>
          </section>

          <section id="sec-5" className="legal-section">
            <span className="legal-section-number">SECTION 5</span>
            <h2>Advertising & Marketing</h2>
            <p>
              We do not integrate intrusive behavioral advertising scripts or third-party ad networks on Black Reel. However, we occasionally employ basic marketing trackers to analyze the effectiveness of our social campaigns on Twitter or Instagram.
            </p>
          </section>

          <section id="sec-6" className="legal-section">
            <span className="legal-section-number">SECTION 6</span>
            <h2>Cookie Management</h2>
            <p>
              You have the right to accept, configure, or reject cookies. Most web browsers allow you to modify cookie configurations directly through browser settings panels:
            </p>
            <p>
              To clear cookies or prevent browser caching, access your browser's "Settings &gt; Privacy &gt; Clear Browsing Data" console.
            </p>
            <div className="legal-highlight-box">
              <p>⚠️ Note: Blocking or deleting essential cookies will sign you out and prevent core video stream features from loading correctly.</p>
            </div>
          </section>

          {/* Legal Footer Navigation Panel */}
          <div className="legal-footer-nav">
            <button className="legal-nav-btn" onClick={() => navigate('/terms')}>
              <FileText size={14} />
              Terms of Use
            </button>
            <button className="legal-nav-btn" onClick={() => navigate('/privacy')}>
              <Shield size={14} />
              Privacy Policy
            </button>
            <button className="legal-nav-btn active" onClick={() => navigate('/cookies')}>
              <Eye size={14} />
              Cookie Policy
            </button>
            <button className="legal-nav-btn" onClick={() => navigate('/compliance')}>
              <HelpCircle size={14} />
              Compliance
            </button>
          </div>

        </main>

      </div>
    </div>
  );
}
