// ============================================================
// LinkX Central Motion Constants & Easings
// Measured from Dribbble CyberHacx reference specifications
// ============================================================

export const MOTION = {
  // Durations (in milliseconds)
  instant: 0,
  fast: 120,
  normal: 180,
  drawer: 220,
  progress: 250,
  splash: 1600,
  splashReduced: 600,

  // CSS cubic-bezier easing curves
  easing: {
    standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },

  // Transitions helper strings
  transitions: {
    fade: 'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    fast: 'all 120ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    drawer: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    progress: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export default MOTION;
