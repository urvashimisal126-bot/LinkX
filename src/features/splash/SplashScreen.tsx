import React, { useEffect, useState, useRef } from 'react';
import LinkXMarkAnimated from '../../components/LinkXMarkAnimated';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Starting local engine');
  const [ariaLiveMsg, setAriaLiveMsg] = useState('LinkX is loading');
  const [fadingOut, setFadingOut] = useState(false);

  const completedRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minTime = prefersReducedMotion ? 600 : 1600;
    const maxTimeout = 3000;

    let isMounted = true;

    // Real startup initialization tasks
    async function runStartupWork() {
      try {
        // Step 1: Wait for web fonts (Inter, IBM Plex Mono)
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
        if (!isMounted) return;
        setProgress(45);
        setStatusText('Starting local engine');

        // Step 2: Fetch sample evidence manifest (local static check)
        try {
          const res = await fetch('/sample-evidence/manifest.json');
          if (res.ok) {
            await res.json();
          }
        } catch {
          // If manifest is optional or static, continue gracefully
        }
        if (!isMounted) return;
        setProgress(80);

        // Step 3: Initialization complete
        setProgress(100);
        setStatusText('Ready');
        setAriaLiveMsg('LinkX is ready');
      } catch (err) {
        console.warn('Startup initialization notice:', err);
      } finally {
        if (!isMounted) return;
        const elapsed = performance.now() - startTime;
        const remainingTime = Math.max(0, minTime - elapsed);

        setTimeout(() => {
          if (!isMounted || completedRef.current) return;
          setStatusText('Ready');
          setAriaLiveMsg('LinkX is ready');
          setFadingOut(true);

          setTimeout(() => {
            if (completedRef.current) return;
            completedRef.current = true;
            try {
              sessionStorage.setItem('linkx_splash_seen', '1');
            } catch {
              // ignore session storage access error
            }
            onComplete();
            // Set focus to main content
            const mainEl = document.getElementById('main-content');
            if (mainEl) {
              mainEl.focus();
            }
          }, 150); // 150ms fade out transition
        }, remainingTime);
      }
    }

    runStartupWork();

    // Fallback maximum safety timeout (3s)
    const maxTimer = setTimeout(() => {
      if (completedRef.current || !isMounted) return;
      completedRef.current = true;
      try {
        sessionStorage.setItem('linkx_splash_seen', '1');
      } catch {
        // ignore
      }
      onComplete();
      const mainEl = document.getElementById('main-content');
      if (mainEl) mainEl.focus();
    }, maxTimeout);

    return () => {
      isMounted = false;
      clearTimeout(maxTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`linkx-splash-screen ${fadingOut ? 'linkx-splash--fade-out' : ''}`}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(circle at 50% 30%, #05262F 0%, #021D24 80%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        transition: 'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      {/* Screen reader notification */}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {ariaLiveMsg}
      </span>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 320,
          width: '100%',
          padding: '0 24px',
        }}
      >
        {/* Animated Mark & Wordmark */}
        <LinkXMarkAnimated width={120} showWordmark={true} />

        {/* Clear space & Loading Area */}
        <div style={{ marginTop: 36, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Neon Lime Progress Line */}
          <div
            style={{
              width: 180,
              height: 3,
              background: 'var(--panel-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--accent)',
                boxShadow: '0 0 10px rgba(204, 243, 0, 0.5)',
                width: `${progress}%`,
                transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          {/* Status line */}
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              color: 'var(--muted)',
              lineHeight: 1.4,
              textAlign: 'center',
              marginBottom: 6,
              minHeight: 18,
            }}
          >
            {statusText}
          </div>

          {/* Local mode note */}
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              color: 'var(--cyan)',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--cyan-tint)',
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid rgba(106, 230, 239, 0.25)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
                display: 'inline-block',
              }}
            />
            Local mode, no network
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
