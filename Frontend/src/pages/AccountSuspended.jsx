import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_SUSPENSION_MESSAGE } from '../lib/accountStatus';
import { getStoredSuspension } from '../lib/suspension';
import './AccountSuspended.css';

export default function AccountSuspended() {
  const suspension = getStoredSuspension();
  const supportEmail = 'support@blackreel.com';
  const supportFormUrl = 'https://blackreel.com/support/contact';
  const helpCenterUrl = 'https://blackreel.com/help/account-access';
  const supportSubject = encodeURIComponent('Suspended Black Reel account review');
  const supportBody = encodeURIComponent(
    `Hello Support,\n\nMy account access is currently suspended and I would like a review.\nAccount email: ${
      suspension?.email || '[add your account email]'
    }\nReason shown: ${suspension?.message || DEFAULT_SUSPENSION_MESSAGE}\n\nThank you.`
  );

  return (
    <div className="account-suspended-page container">
      <div className="account-suspended-card">
        <p className="account-suspended-kicker">Account Status</p>
        <h1>Your account has been suspended</h1>
        <p className="account-suspended-copy">
          {suspension?.message || DEFAULT_SUSPENSION_MESSAGE}
        </p>

        <div className="account-suspended-actions">
          <a href={`mailto:${supportEmail}?subject=${supportSubject}&body=${supportBody}`} className="account-suspended-primary">
            Email Support
          </a>
          <a href={supportFormUrl} target="_blank" rel="noreferrer" className="account-suspended-secondary">
            Open Support Form
          </a>
          <Link to="/login" className="account-suspended-secondary">Back to sign in</Link>
        </div>

        <div className="account-suspended-help">
          <strong>Why access is restricted</strong>
          <span>Protected features stay locked until support reviews the restriction on this account.</span>
          <span>Status explanation: this account has a temporary or permanent access restriction based on trust and policy review.</span>
          <span>Account email: {suspension?.email || 'Use the email tied to your Black Reel account when contacting support.'}</span>
          <span>Email: {supportEmail}</span>
          <span>Support form: {supportFormUrl}</span>
          <span>Help center: {helpCenterUrl}</span>
          <span>Appeal process: include your account email, a short summary of what happened, and request an account review.</span>
          <span>Next steps: support will verify account history, run a manual review, and email your decision/result.</span>
          <span>Include your account email and the message shown on this page when contacting support.</span>
          <span>Response window: first response within 1 business day, resolution typically within 1-3 business days.</span>
        </div>
      </div>
    </div>
  );
}
