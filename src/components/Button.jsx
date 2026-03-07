import React from 'react';
import './Button.css';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  // variants: primary, outline, pill, icon
  const baseClass = `btn btn-${variant} ${className}`;

  return (
    <button className={baseClass.trim()} {...props}>
      {children}
    </button>
  );
}
