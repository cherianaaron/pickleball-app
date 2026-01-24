// Shared icon components using currentColor for theme matching
// These match the navbar icons in public/navbar-icons/

import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5"/>
      <path d="M6.5 10.5V20h11V10.5"/>
      <circle cx="10.2" cy="15.2" r="0.7"/>
      <circle cx="12" cy="14.3" r="0.7"/>
      <circle cx="13.8" cy="15.2" r="0.7"/>
    </g>
  </svg>
);

export const PlayersIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="9" r="2"/>
      <circle cx="16" cy="9" r="2"/>
      <path d="M4.5 19c.8-3 2.6-4.8 5.5-4.8"/>
      <path d="M19.5 19c-.8-3-2.6-4.8-5.5-4.8"/>
      <circle cx="12" cy="13.2" r="1.1"/>
      <circle cx="11.6" cy="12.8" r="0.25"/>
      <circle cx="12.4" cy="12.8" r="0.25"/>
      <circle cx="12" cy="13.7" r="0.25"/>
    </g>
  </svg>
);

export const RoundRobinIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.2 7.2a6.5 6.5 0 0 1 10 2.1"/>
      <path d="M18 6.8v3.6h-3.6"/>
      <path d="M16.8 16.8a6.5 6.5 0 0 1-10-2.1"/>
      <path d="M6 17.2v-3.6h3.6"/>
      <circle cx="12" cy="12" r="1.2"/>
      <circle cx="11.6" cy="11.6" r="0.25"/>
      <circle cx="12.4" cy="11.6" r="0.25"/>
      <circle cx="12" cy="12.5" r="0.25"/>
    </g>
  </svg>
);

export const BracketIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h3v3"/>
      <path d="M6 18h3v-3"/>
      <path d="M9 9h3v2"/>
      <path d="M9 15h3v-2"/>
      <path d="M15 10h3v4h-3"/>
      <path d="M12 11h3"/>
      <path d="M12 13h3"/>
    </g>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l3 3v15H7z"/>
      <path d="M14 3v3h3"/>
      <path d="M12 12.2v2.8l2 1.2"/>
      <circle cx="12" cy="14" r="4.2"/>
    </g>
  </svg>
);

export const JoinIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6H6v12h2"/>
      <path d="M16 6h2v12h-2"/>
      <path d="M12 9v6"/>
      <path d="M9 12h6"/>
    </g>
  </svg>
);

export const PricingIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </g>
  </svg>
);

export const HowItWorksIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19c-2.2-1.6-4.7-2.2-7.5-2.2V6.8C7.3 6.8 9.8 7.4 12 9"/>
      <path d="M12 19c2.2-1.6 4.7-2.2 7.5-2.2V6.8C16.7 6.8 14.2 7.4 12 9"/>
      <path d="M9.2 12.2h2.2v2.2H9.2z"/>
      <path d="M12.6 13.3h2.2"/>
      <path d="M11.4 14.4h1.2"/>
    </g>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.8l1 .6 1.4-.3.8 1.4 1.3.5v1.6l.9 1.1-.9 1.1v1.6l-1.3.5-.8 1.4-1.4-.3-1 .6-1-.6-1.4.3-.8-1.4-1.3-.5v-1.6l-.9-1.1.9-1.1V6l1.3-.5.8-1.4 1.4.3z"/>
      <circle cx="12" cy="12" r="1.7"/>
      <circle cx="11.6" cy="11.6" r="0.25"/>
      <circle cx="12.4" cy="11.6" r="0.25"/>
      <circle cx="12" cy="12.5" r="0.25"/>
    </g>
  </svg>
);

// Lock icon for sign-in prompts
export const LockIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      <circle cx="12" cy="16" r="1"/>
    </g>
  </svg>
);
