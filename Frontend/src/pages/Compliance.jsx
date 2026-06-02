import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Eye, HelpCircle } from 'lucide-react';
import './LegalPage.css';

export default function Compliance() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-1');

  const menuItems = [
    { id: 'sec-1', label: '1. Platform Standards' },
    { id: 'sec-2', label: '2. Copyright & DMCA' },
    { id: 'sec-3', label: '3. Accessibility Commitment' },
    { id: 'sec-4', label: '4. Security Practices' },
    { id: 'sec-5', label: '5. Content Rating Rules' },
    { id: 'sec-6', label: '6. Regulatory Information' }
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
        <h1 className="legal-title">Compliance</h1>
        <p className="legal-subtitle">Regulatory platform standards, copyright DMCA filings, web accessibility statements, and metadata details.</p>
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
            <h2>Platform Standards</h2>
            <p>
              Black Reel is committed to offering a premium, secure, and respectful streaming environment for general audiences, creators, and administrators alike. We enforce strict policies against terms abuse, screen concurrency deadlock hacks, and content harvesting behaviors.
            </p>
            <p>
              Our automated content-checking networks verify that all files conform to platform safety, quality benchmarks, and ratings classifications prior to showcase release.
            </p>
          </section>

          <section id="sec-2" className="legal-section">
            <span className="legal-section-number">SECTION 2</span>
            <h2>Copyright & DMCA Information</h2>
            <p>
              We strongly defend intellectual property rights. Black Reel strictly adheres to the provisions of the Digital Millennium Copyright Act (DMCA).
            </p>
            <p>
              If you identify video catalog items or content hosted on our service that infringes upon your exclusive copyright holdings, you can submit a formal DMCA take-down request containing:
            </p>
            <ul>
              <li>A physical or electronic signature of the copyright owner or representative.</li>
              <li>A description of the copyrighted work claimed to have been infringed.</li>
              <li>Direct URLs of the infringing material on Black Reel.</li>
              <li>Your contact coordinates (address, phone, email).</li>
            </ul>
            <p>
              All copyright compliance complaints should be dispatched to our registered copyright compliance agent: <code>dmca@blackreel.example.com</code>.
            </p>
          </section>

          <section id="sec-3" className="legal-section">
            <span className="legal-section-number">SECTION 3</span>
            <h2>Accessibility Commitment</h2>
            <p>
              We firmly believe that high-quality storytelling should be accessible to everyone. We continually review and optimize the Black Reel platform to align with **WCAG 2.1 Level AA** web accessibility standards.
            </p>
            <div className="legal-highlight-box">
              <p>✓ Optimized contrast typography for dark themes.</p>
              <p>✓ Explicit ARIA labels on all interactive sliders and toggle components.</p>
              <p>✓ Keyboard navigation routing support.</p>
            </div>
          </section>

          <section id="sec-4" className="legal-section">
            <span className="legal-section-number">SECTION 4</span>
            <h2>Security Practices</h2>
            <p>
              Black Reel enforces robust security protocols. All data transit streams are encrypted under secure socket layers (SSL/TLS 1.3). System microservices undergo regular auditing, and session tokens are protected against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) vectors.
            </p>
          </section>

          <section id="sec-5" className="legal-section">
            <span className="legal-section-number">SECTION 5</span>
            <h2>Content Rating Guidelines</h2>
            <p>
              Our video player and movie cards feature standardized content ratings (e.g., General, Mature, PG-13). Parents can utilize our **Parental Controls** feature in the profile dashboard to lock mature content classifications (Action, Horror, Thriller, Originals) with secure authorization blocks.
            </p>
          </section>

          <section id="sec-6" className="legal-section">
            <span className="legal-section-number">SECTION 6</span>
            <h2>Regulatory Information</h2>
            <p>
              Black Reel complies with all applicable digital streaming regulations and payment processing mandates within its operational jurisdictions. We cooperate with law enforcement and consumer protection bureaus to ensure compliance.
            </p>
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
            <button className="legal-nav-btn" onClick={() => navigate('/cookies')}>
              <Eye size={14} />
              Cookie Policy
            </button>
            <button className="legal-nav-btn active" onClick={() => navigate('/compliance')}>
              <HelpCircle size={14} />
              Compliance
            </button>
          </div>

        </main>

      </div>
    </div>
  );
}
