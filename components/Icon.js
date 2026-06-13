// Clean stroke-based SVG icons — replaces emoji throughout the app
const PATHS = {
  // Navigation
  profile:     <><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/></>,
  calendar:    <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  scale:       <><path d="M12 3v18M4 21h16M5 9c0 0 2 5 7 5s7-5 7-5"/></>,
  barbell:     <><path d="M6 8v8M4 9v6M18 8v8M20 9v6M6 12h12"/><rect x="7" y="9" width="4" height="6" rx="1"/><rect x="13" y="9" width="4" height="6" rx="1"/></>,
  menu:        <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  // People
  person:      <><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/></>,
  users:       <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  // Content
  book:        <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  target:      <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  trophy:      <><path d="M8 21h8M12 17v4"/><path d="M17 5H7a2 2 0 0 0-2 2v4a8 8 0 0 0 14 0V7a2 2 0 0 0-2-2z"/><path d="M5 9H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2M19 9h2a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/></>,
  camera:      <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  fileText:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>,
  star:        <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  lock:        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  activity:    <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  compass:     <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
  link:        <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  // Coach
  grid:        <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  list:        <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  inbox:       <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
  checkSquare: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
  heart:       <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
  zap:         <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  flame:       <><path d="M12 2c-5.33 5.12-8 10-8 13a8 8 0 0 0 16 0c0-3-2.67-7.88-8-13z"/><path d="M12 2c0 5.5 3 9.5 3 13"/></>,
  megaphone:   <><path d="M3 11l19-9v18L3 13M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>,
  smartphone:  <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></>,
  alertTriangle:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
  droplet:     <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>,
  medal:       <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
  tool:        <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
  // Hands/pray
  pray:        <><path d="M12 5v14M9 7l3-3 3 3M9 17l3 3 3-3M5 12h2M17 12h2"/></>,
  // Search
  search:      <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
  // Home
  home:        <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  // Lift categories (for PRLog)
  lower:       <><path d="M12 5v14M5 9l7-5 7 5"/><circle cx="12" cy="16" r="3"/></>,
  push:        <><path d="M4 14v5h16v-5"/><path d="M12 3v11M9 9l3-6 3 6"/></>,
  pull:        <><path d="M20 10v11H4V10"/><path d="M12 21V9M9 15l3 6 3-6"/></>,
  hinge:       <><path d="M20 12l-8 8-8-8M20 6l-8 8-8-8"/></>,
  // Award
  award:       <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
  // Anvil (wide top, narrow neck, wide base)
  anvil:       <><path d="M3 20h18M5 20v-2.5h14V20M8 17.5v-3c0-2.2 1.8-4 4-4s4 1.8 4 4v3"/><path d="M11 10.5V7.5h2v3"/></>,
  // Crown (for MCastles)
  crown:       <><path d="M3 19h18M5 19V9l3.5 4.5 3.5-8 3.5 8 3.5-4.5v10"/><circle cx="5" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="12" cy="4.5" r="1"/></>,
  // Map pin for journey
  mapPin:      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  // Chart bar
  barChart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  // Added for landing page
  bell:        <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  bellOff:     <><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  chat:        <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
  clock:       <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  chevronRight:<><polyline points="9 18 15 12 9 6"/></>,
  qr:          <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14.5" y1="14" x2="14.5" y2="17.5"/><line x1="17.5" y1="14.5" x2="21" y2="14.5"/><line x1="21" y1="17.5" x2="21" y2="21"/><line x1="14" y1="21" x2="17.5" y2="21"/></>,
};

export default function Icon({name, size=18, color="currentColor", style={}}) {
  const paths = PATHS[name];
  if(!paths) return <span style={{fontSize:size,...style}}>•</span>;
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}
    >
      {paths}
    </svg>
  );
}
