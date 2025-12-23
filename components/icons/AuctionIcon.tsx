
import React from 'react';

const AuctionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V3m0 8h8m-8 0H3m0 0v8m0-8V3m0 8h8m-8 0H3m8 8V3" />
  </svg>
);

export default AuctionIcon;
