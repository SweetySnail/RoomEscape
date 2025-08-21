import React from 'react';
import '../styles/Global.css';

function BoxMain({ children }) {
  return (
    <div className="main-page-wrapper">
      {children}
    </div>
  );
}

export default BoxMain;