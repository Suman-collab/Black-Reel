import React from 'react';
import './Button.css';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  
  const baseClass = `btn btn-${variant === 'pill' ? 'ghost' : variant} ${className}`;

  return (
    <button className={baseClass.trim()} {...props}>
      {children}
    </button>
  );
}
