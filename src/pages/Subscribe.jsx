import React from 'react';
import './Subscribe.css';

export default function Subscribe() {
  return (
    <div className="subscribe-page container">
      <div className="subscribe-header">
        <h1 className="subscribe-title text-gold">Subscribe</h1>
        <p className="subscribe-subtitle">Choose the plan that's right for you</p>
      </div>

      <div className="pricing-cards">
        {/* Basic Plan */}
        <div className="pricing-card">
          <h2 className="plan-name">Basic</h2>
          <div className="plan-price">
            <span className="currency">$</span>
            <span className="amount">4.99</span>
          </div>
          <p className="plan-period">per month</p>
          <ul className="plan-features">
            <li>Watch on 1 device</li>
            <li>Access to all originals</li>
            <li>Ad-supported</li>
          </ul>
          <button className="btn-subscribe">SUBSCRIBE</button>
        </div>

        {/* Standard Plan */}
        <div className="pricing-card popular">
          <div className="popular-badge">MOST POPULAR</div>
          <h2 className="plan-name">Standard</h2>
          <div className="plan-price text-gold">
            <span className="currency">$</span>
            <span className="amount">7.99</span>
          </div>
          <p className="plan-period">per month</p>
          <ul className="plan-features">
            <li>Watch on 2 devices</li>
            <li>Access to all originals</li>
            <li>Ad-free</li>
          </ul>
          <button className="btn-subscribe">SUBSCRIBE</button>
        </div>

        {/* Premium Plan */}
        <div className="pricing-card">
          <h2 className="plan-name">Premium</h2>
          <div className="plan-price">
            <span className="currency">$</span>
            <span className="amount">9.99</span>
          </div>
          <p className="plan-period">per month</p>
          <ul className="plan-features">
            <li>Watch on 4 devices</li>
            <li>Access to all originals</li>
            <li>Ad-free</li>
          </ul>
          <button className="btn-subscribe">SUBSCRIBE</button>
        </div>
      </div>
    </div>
  );
}
