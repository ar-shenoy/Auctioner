
import React from 'react';

const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14zM12 11v5m0 0l-2-2m2 2l2-2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m-1-4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-6 4a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1zm12-4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
  </svg>
);

export default TrophyIcon;
