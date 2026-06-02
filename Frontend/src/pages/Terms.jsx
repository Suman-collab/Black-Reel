import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Eye, HelpCircle } from 'lucide-react';
import './LegalPage.css';

export default function Terms() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-1');

  const menuItems = [
    { id: 'sec-1', label: '1. User Responsibilities' },
    { id: 'sec-2', label: '2. Account Usage & Integrity' },
    { id: 'sec-3', label: '3. Subscription Billing' },
    { id: 'sec-4', label: '4. Content & Copyright' },
    { id: 'sec-5', label: '5. Concurrent Streaming' },
    { id: 'sec-6', label: '6. Cancellation & Refunds' },
    { id: 'sec-7', label: '7. Liability & Warranties' }
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
        <h1 className="legal-title">Terms of Use</h1>
        <p className="legal-subtitle">Rules, streaming guidelines, and service agreements governing your access to the Black Reel streaming platform.</p>
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
            <h2>User Responsibilities</h2>
            <p>
              By accessing, browsing, or utilizing the Black Reel platform, services, or mobile applications, you explicitly acknowledge and agree to comply with these terms. You agree to use our streaming services only for lawful personal, non-commercial purposes.
            </p>
            <p>
              Under no circumstances are you permitted to download, capture, modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, or sell any content obtained from or through the Black Reel platform, except as explicitly authorized under these terms.
            </p>
          </section>

          <section id="sec-2" className="legal-section">
            <span className="legal-section-number">SECTION 2</span>
            <h2>Account Usage & Integrity</h2>
            <p>
              To access advanced catalog libraries, custom creator fandom rooms, and watchlist triggers, you must create a validated account. You are solely responsible for safeguarding the credentials, emails, and passwords associated with your session.
            </p>
            <p>
              You agree to provide true, accurate, and current profile fields. Sharing credentials with third parties outside your household subscription limits is prohibited and constitutes a material breach of this agreement that may result in immediate suspension or termination of access.
            </p>
          </section>

          <section id="sec-3" className="legal-section">
            <span className="legal-section-number">SECTION 3</span>
            <h2>Subscription Billing</h2>
            <p>
              Active subscriptions are required for unlimited video playback, high-definition viewing tiers, and creator fandom showcases. By initiating a premium subscription, you authorize Black Reel to charge your linked payment method (Credit Card, Debit, or dummy payment models) for the recurring subscription fee.
            </p>
            <p>
              Subscription pricing plans cycle automatically on a monthly or annual timeline. Billing rates, fees, and promotional offers are subject to change, with advance notifications sent to your primary profile email.
            </p>
            <div className="legal-highlight-box">
              <p>⚠️ Billing rates will cycle automatically on your renewal date unless cancelled prior to the end of the current billing sequence.</p>
            </div>
          </section>

          <section id="sec-4" className="legal-section">
            <span className="legal-section-number">SECTION 4</span>
            <h2>Content & Copyright</h2>
            <p>
              All video assets, cinematic stories, layout visuals, underlying scripts, code databases, brand logos, and audio tracks hosted on Black Reel are the exclusive property of Black Reel or its licensed creators.
            </p>
            <p>
              The platform respects DMCA copyright notices. Unauthorized posting, framing, or distribution of copyright-restricted media on public websites or forums will trigger immediate IP bans and session revocations.
            </p>
          </section>

          <section id="sec-5" className="legal-section">
            <span className="legal-section-number">SECTION 5</span>
            <h2>Concurrent Streaming & Screens Limit</h2>
            <p>
              Your active subscription plan sets strict boundaries on concurrent screen capacities. Sharing or accessing account nodes across multiple physical addresses is monitored:
            </p>
            <ul>
              <li><strong>Free / Base Plan:</strong> 1 concurrent screen allowed at standard definition.</li>
              <li><strong>Premium Plan:</strong> Up to 4 concurrent screens supported in Ultra HD 4K + HDR quality.</li>
            </ul>
            <p>
              Exceeding plan limits will trigger our **Smart Device Replacement Modal**, requiring you to explicitly choose and sign out of an active device session to authorize the new node login.
            </p>
          </section>

          <section id="sec-6" className="legal-section">
            <span className="legal-section-number">SECTION 6</span>
            <h2>Cancellation & Refunds Policy</h2>
            <p>
              You can cancel your subscription plan at any time through your Profile Dashboard page. Cancellation stops future recurring billing sequences, leaving your membership active through the expiration of the current cycle.
            </p>
            <p>
              Subscription fees are non-refundable. We do not provide prorated cash refunds or credits for partially unused monthly cycles or unwatched movie playlists.
            </p>
          </section>

          <section id="sec-7" className="legal-section">
            <span className="legal-section-number">SECTION 7</span>
            <h2>Liability & Warranties</h2>
            <p>
              THE BLACK REEL PLATFORM AND ALL INCLUDED CREATOR CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p>
              IN NO EVENT SHALL BLACK REEL, ITS DEVELOPERS, OR CONTENT PARTNERS BE LIABLE FOR DIRECT, INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF OR INABILITY TO USE THIS STREAMING SYSTEM.
            </p>
          </section>

          {/* Legal Footer Navigation Panel */}
          <div className="legal-footer-nav">
            <button className="legal-nav-btn active" onClick={() => navigate('/terms')}>
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
