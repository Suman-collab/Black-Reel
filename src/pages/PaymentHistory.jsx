import React from 'react';
import './PaymentHistory.css';

export default function PaymentHistory() {
  const paymentData = [
    { date: 'Sep 5, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Apr. 8, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Mar. 7, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Jun. 6, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Jun. 6, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Mar. 5, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Mar. 4, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
    { date: 'Mar. 3, 2023', description: 'Premier Membership', method: 'Visa', amount: '$9.99', status: 'Success' },
  ];

  return (
    <div className="payment-history-page container">
      <div className="page-header center">
        <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
        <h1 className="page-title text-gold">Payment History</h1>
        <button className="btn-outline-gold mt-4">Billing Details</button>
      </div>

      <div className="payment-table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((payment, index) => (
              <tr key={index}>
                <td>{payment.date}</td>
                <td>{payment.description}</td>
                <td>{payment.method}</td>
                <td>{payment.amount}</td>
                <td className="text-gold">{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
