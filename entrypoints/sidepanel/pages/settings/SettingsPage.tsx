import "../../assets/css/pages/settings.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCog, FaPalette, FaGlobe, FaSlidersH, FaUndo } from "../../assets/constants/icons";
import SwitchPlatform from "../platformPage/PlatformPage";

const STORAGE_KEY = "hydra:ui-preferences";

type Preferences = {
  density: "comfortable" | "compact";
  reducedMotion: boolean;
  theme: "light" | "dark";
};

const DEFAULTS: Preferences = { density: "comfortable", reducedMotion: false, theme: "light" };

function readPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      density: parsed.density === "compact" ? "compact" : "comfortable",
      reducedMotion: parsed.reducedMotion === true,
      theme: parsed.theme === "dark" ? "dark" : "light",
    };
  } catch {
    return DEFAULTS;
  }
}

export function applyUiPreferences(value: Preferences) {
  document.documentElement.dataset.colorMode = value.theme;
  document.documentElement.style.colorScheme = value.theme;
  document.documentElement.dataset.uiDensity = value.density;
  document.documentElement.dataset.uiReducedMotion = String(value.reducedMotion);
}

export function initializeUiPreferences() {
  applyUiPreferences(readPreferences());
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    applyUiPreferences(preferences);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [preferences]);

  return (
    <main className="settings-page">
      <div className="settings-page__toolbar">
        <button type="button" className="settings-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft /> <span>Back</span>
        </button>
        <span className="settings-page__eyebrow">PREFERENCES</span>
      </div>

      <header className="settings-page__heading">
        <div className="settings-page__heading-icon"><FaCog /></div>
        <div>
          <h1>Settings</h1>
          <p>Customize your workspace and how the interface behaves.</p>
        </div>
      </header>

      <section
        id="settings-platform"
        className="settings-page__section settings-page__section--platform"
        aria-labelledby="settings-platform-title">
        <div className="settings-page__section-title">
          <span className="settings-page__section-icon"><FaGlobe /></span>
          <div><h2 id="settings-platform-title">Platform</h2><p>Choose a social network and manage its connection.</p></div>
        </div>
        <div className="settings-page__platform-content"><SwitchPlatform /></div>
      </section>

      <section className="settings-page__section" aria-labelledby="settings-appearance">
        <div className="settings-page__section-title">
          <span className="settings-page__section-icon"><FaPalette /></span>
          <div><h2 id="settings-appearance">Appearance</h2><p>Choose a comfortable layout for your workflow.</p></div>
        </div>
        <div className="settings-page__setting">
          <div className="settings-page__description"><strong>Color mode</strong><span>Choose a light or dark appearance across the application.</span></div>
          <div className="settings-page__segmented" role="group" aria-label="Color mode">
            <button type="button" className={preferences.theme === "light" ? "selected" : ""} aria-pressed={preferences.theme === "light"} onClick={() => setPreferences((p) => ({ ...p, theme: "light" }))}>Light</button>
            <button type="button" className={preferences.theme === "dark" ? "selected" : ""} aria-pressed={preferences.theme === "dark"} onClick={() => setPreferences((p) => ({ ...p, theme: "dark" }))}>Dark</button>
          </div>
        </div>
        <div className="settings-page__setting">
          <div className="settings-page__description"><strong>Interface density</strong><span>Control spacing within the application.</span></div>
          <div className="settings-page__segmented" role="group" aria-label="Interface density">
            <button type="button" className={preferences.density === "comfortable" ? "selected" : ""} aria-pressed={preferences.density === "comfortable"} onClick={() => setPreferences((p) => ({ ...p, density: "comfortable" }))}>Comfortable</button>
            <button type="button" className={preferences.density === "compact" ? "selected" : ""} aria-pressed={preferences.density === "compact"} onClick={() => setPreferences((p) => ({ ...p, density: "compact" }))}>Compact</button>
          </div>
        </div>
      </section>

      <section className="settings-page__section" aria-labelledby="settings-behavior">
        <div className="settings-page__section-title">
          <span className="settings-page__section-icon"><FaSlidersH /></span>
          <div><h2 id="settings-behavior">Behavior</h2><p>Adjust interface animations.</p></div>
        </div>
        <div className="settings-page__setting">
          <div className="settings-page__description"><strong>Reduce motion</strong><span>Minimize decorative animation and transitions.</span></div>
          <label className="settings-page__switch">
            <input type="checkbox" checked={preferences.reducedMotion} onChange={(e) => setPreferences((p) => ({ ...p, reducedMotion: e.target.checked }))} aria-label="Reduce motion" />
            <span className="settings-page__switch-track" aria-hidden="true" />
          </label>
        </div>
      </section>

      <footer className="settings-page__footer">
        <span className="settings-page__save-state" role="status">{saved ? <><FaCheckCircle /> Preferences saved automatically</> : "Unable to save preferences in this browser"}</span>
        <button type="button" className="settings-page__reset" onClick={() => setPreferences({ ...DEFAULTS })}><FaUndo /> Restore defaults</button>
      </footer>
    </main>
  );
}
