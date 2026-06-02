import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Eye, HelpCircle } from 'lucide-react';
import './LegalPage.css';

export default function Privacy() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-1');

  const menuItems = [
    { id: 'sec-1', label: '1. Data Collection' },
    { id: 'sec-2', label: '2. Data Usage & Logistics' },
    { id: 'sec-3', label: '3. Account Safeguards' },
    { id: 'sec-4', label: '4. Cookies & Web Beacons' },
    { id: 'sec-5', label: '5. Analytics Tools' },
    { id: 'sec-6', label: '6. Third-Party Access' },
    { id: 'sec-7', label: '7. Your GDPR & CCPA Rights' }
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
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">How Black Reel collects, safeguards, and utilizes user account records, streaming patterns, and payment telemetry.</p>
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
            <h2>Data Collection</h2>
            <p>
              We collect information that you directly provide to us during account creation and setup. This includes your name, email address, password coordinates, active profile configurations, and payment details required to verify active subscription tiers.
            </p>
            <p>
              Additionally, we automatically log browser parameters, IP addresses, operating systems, session lengths, relative device locations, network performance parameters, and streaming history records (movies watched, genres hovered, skeleton logs).
            </p>
          </section>

          <section id="sec-2" className="legal-section">
            <span className="legal-section-number">SECTION 2</span>
            <h2>Data Usage & Logistics</h2>
            <p>
              The primary purpose of collecting your information is to deliver a smooth and personalized premium OTT dashboard experience:
            </p>
            <ul>
              <li>Process transactions and bill monthly/annual subscription cycles.</li>
              <li>Analyze stream metrics to optimize 60 FPS video players.</li>
              <li>Provide personalized "Continue Watching" slides and recommendations.</li>
              <li>Enforce subscription screen limits using our active device swapping controllers.</li>
            </ul>
          </section>

          <section id="sec-3" className="legal-section">
            <span className="legal-section-number">SECTION 3</span>
            <h2>Account Safeguards</h2>
            <p>
              Black Reel uses advanced encryption standards (AES-256) to protect user passwords and transaction logs. Payment card details are processed directly via secure payment gates conforming to PCI-DSS standards; card numbers never touch our core backend logs.
            </p>
            <p>
              While we take every precaution to safeguard your credentials, no digital transmission is entirely secure. We encourage users to maintain unique passwords and audit active sessions within the Device Management console regularly.
            </p>
          </section>

          <section id="sec-4" className="legal-section">
            <span className="legal-section-number">SECTION 4</span>
            <h2>Cookies & Web Beacons</h2>
            <p>
              Cookies are small data blocks stored on your browser disk. We leverage cookies to authenticate active sessions (preventing constant logins), preserve language preferences, cache watchlist triggers, and understand client navigation clicks.
            </p>
            <p>
              Disabling cookies will restrict access to authenticated areas like the Profile Dashboard and payment checkouts. For detailed management steps, consult our dedicated **Cookie Policy** page.
            </p>
          </section>

          <section id="sec-5" className="legal-section">
            <span className="legal-section-number">SECTION 5</span>
            <h2>Analytics Tools</h2>
            <p>
              To improve user experiences and analyze video player buffering logs, we employ specialized anonymous analytics integrations. These tools monitor click maps, error rates, and load speeds across different viewports without logging identity traits or email addresses.
            </p>
          </section>

          <section id="sec-6" className="legal-section">
            <span className="legal-section-number">SECTION 6</span>
            <h2>Third-Party Access</h2>
            <p>
              We do not sell, trade, or rent personal user records to third-party marketing brokers. Information is shared only with trusted operational service partners:
            </p>
            <div className="legal-highlight-box">
              <p>✓ Database hosts keeping servers active.</p>
              <p>✓ Secure payment gateways billing transactions.</p>
              <p>✓ Automated email services dispatching password reset links.</p>
            </div>
          </section>

          <section id="sec-7" className="legal-section">
            <span className="legal-section-number">SECTION 7</span>
            <h2>Your GDPR & CCPA Rights</h2>
            <p>
              Depending on your country or state of residence, you possess legal rights regarding your personal information under frameworks like GDPR or CCPA:
            </p>
            <ul>
              <li><strong>Access:</strong> The right to request copies of data logs we hold.</li>
              <li><strong>Correction:</strong> The right to update incomplete name/email details.</li>
              <li><strong>Erasure:</strong> The right to request full account delete sequences.</li>
              <li><strong>Portability:</strong> The right to export watched histories.</li>
            </ul>
            <p>
              To exercise these privileges, please file an inquiry directly with our support team using the Contact Support section.
            </p>
          </section>

          {/* Legal Footer Navigation Panel */}
          <div className="legal-footer-nav">
            <button className="legal-nav-btn" onClick={() => navigate('/terms')}>
              <FileText size={14} />
              Terms of Use
            </button>
            <button className="legal-nav-btn active" onClick={() => navigate('/privacy')}>
              <Shield size={14} />
              Privacy Policy
            </button>
            <button className="legal-nav-btn" onClick={() => navigate('/cookies')}>
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
