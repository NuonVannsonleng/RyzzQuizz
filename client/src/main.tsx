import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import { I18nProvider } from './i18n/index.js';
import { ToastProvider } from './components/ToastProvider.js';
import { AuthProvider } from './lib/authContext.js';
import { useSettings } from './lib/settings.js';
import { primeMusicOnFirstGesture } from './lib/music.js';
import { HomePage } from './pages/HomePage.js';
import { HostPage } from './pages/HostPage.js';
import { PlayPage } from './pages/PlayPage.js';
import { DevPage } from './pages/DevPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import './styles.css';

// domMax (not domAnimation) — layout projection is what drives the leaderboard
// reorder. strict forces `m.*` over `motion.*` so the lazy bundle stays lazy.
const loadFeatures = () => import('./lib/motionFeatures.js').then((mod) => mod.default);

/** reducedMotion reads the in-app override first, falling back to the OS setting ("user") when unset. */
function App() {
  const settings = useSettings();
  const reducedMotion = settings.reducedMotion === null ? 'user' : settings.reducedMotion ? 'always' : 'never';

  // Browsers block audio.play() until a real user gesture — this arms a
  // one-time listener that unlocks whichever track a page has queued up.
  useEffect(() => {
    primeMusicOnFirstGesture();
  }, []);

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/host" element={<HostPage />} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/dev" element={<DevPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <LazyMotion features={loadFeatures} strict>
        <App />
      </LazyMotion>
    </I18nProvider>
  </StrictMode>,
);
