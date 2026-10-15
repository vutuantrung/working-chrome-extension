import WorkspacePageHeader from "../../components/WorkspacePageHeader";
import "../../assets/css/features/platform.css";
import React, { useEffect, useState } from "react";
import {
  appStorage,
  extensionStorage,
  localStorageService,
} from "../../../../entrypoints/sidepanel/application/services/SidepanelServices";
import api from '../../../../entrypoints/sidepanel/infrastructure/api';
import { useLocation, useNavigate } from "react-router-dom";
import { setSelectedPlatformId } from "../../helpers/helpers";
import { normalizePersonaSocialAccount } from "../../../../entrypoints/sidepanel/utils/resolveEffectiveProxy";
import { PLATFORMS } from "../../helpers/helpers-ui";
import { useAuth } from "../../contexts/AuthContext";
import type { PlatformId, PlatformObject, SocialAccount } from "../../types/types";
import PlatformSelect from "../../components/PlatformSelect";

const chromeStorageKey = (id: PlatformId) => id === "facebook" ? "fbLoginMode" : `${id}LoginMode`;
const localStorageKey = (id: PlatformId) => id === "facebook" ? "local:fbLoginMode" : `local:${id}LoginMode`;

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  no_accounts: "No account is linked. Please add an account first.",
  no_cookies: "This account has no saved session. Please re-authenticate.",
  cookies_invalid: "The session for this account has expired or is invalid. Please log in again.",
  unknown: "Login failed. Please contact support or try again.",
};

const FacebookLoginMode: React.FC = () => {
  const { loginWithMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<"platform" | "loginMode">("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformObject | null>(null);
  const [busyId, setBusyId] = useState<PlatformId | null>(null);
  const [busyMode, setBusyMode] = useState<"auto" | "manual" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const navState = location.state as { platformId?: string } | null;
    if (navState?.platformId) {
      const platform = PLATFORMS.find((p) => p.id === navState.platformId);
      if (platform && !platform.disabled) {
        setSelectedPlatform(platform);
        setStep("loginMode");
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, []);

  const handleSelectPlatform = async (platform: PlatformObject) => {
    setErrorMessage(null);
    setSelectedPlatform(platform);
    setSelectedPlatformId(platform.id);

    try {
      const key = chromeStorageKey(platform.id);
      const result = await extensionStorage.get(key);
      const savedMode = result?.[key] as "auto" | "manual" | undefined;
      const hasActiveSession =
        localStorageService.getItem("fbLoginModeSelected") === "1";

      if (savedMode && hasActiveSession) {
        setBusyId(platform.id);

        await refreshPersonaAccounts(platform.id);

        const loginResult = await loginWithMode(savedMode, platform.id);
        setBusyId(null);

        console.log("Login result for platform:", platform.id, loginResult);

        if (loginResult.success === true) {
          console.log("Login successful for platform:", platform.id);
          localStorageService.setItem("login:login-success-redirect", "1");
          localStorageService.setItem("fbLoginModeSelected", "1");
          setSelectedPlatformId(platform.id);
          // Notify AppRoutes to sync React state before navigation so there
          // is no stale intermediate render with hasSelectedFbMode=false.
          window.dispatchEvent(new Event("localStorageSync"));
          console.log("Navigating to home after successful login for platform:", platform.id);
          navigate("/");
          return;
        }

        await extensionStorage.remove(key);
        await appStorage.removeItem(localStorageKey(platform.id) as any);
        localStorageService.removeItem("fbLoginModeSelected");

        setErrorMessage(
          LOGIN_ERROR_MESSAGES[loginResult.reason ?? "unknown"] ??
          LOGIN_ERROR_MESSAGES.unknown,
        );
        setStep("loginMode");
        return;
      }
    } catch { }

    setStep("loginMode");
  };

  const handleLoginMode = async (mode: "auto" | "manual") => {
    console.log("Handling login mode:", mode, busyMode);
    if (!selectedPlatform || busyMode) return;
    setErrorMessage(null);
    console.log("Selected platform:", selectedPlatform);

    try {
      await extensionStorage.set({ [chromeStorageKey(selectedPlatform.id)]: mode });
    } catch { }

    try {
      await appStorage.setItem("local:fbLoginMode", {
        mode,
        platform: selectedPlatform.id,
      });
    } catch { }

    setBusyMode(mode);

    if (mode === "auto") {
      await refreshPersonaAccounts(selectedPlatform.id);
    }

    const result = await loginWithMode(mode, selectedPlatform.id);
    setBusyMode(null);

    if (result.success === true) {
      console.log("Login successful for platform:", selectedPlatform.id);
      localStorageService.setItem("login:login-success-redirect", "1");
      localStorageService.setItem("fbLoginModeSelected", "1");
      setSelectedPlatformId(selectedPlatform.id);
      // Notify AppRoutes to sync React state before navigation so there
      // is no stale intermediate render with hasSelectedFbMode=false.
      window.dispatchEvent(new Event("localStorageSync"));
      console.log("Navigating to home after successful login for platform:", selectedPlatform.id);
      navigate("/");
      return;
    }

    try {
      await extensionStorage.remove(chromeStorageKey(selectedPlatform.id));
      await appStorage.removeItem(localStorageKey(selectedPlatform.id) as any);
      localStorageService.removeItem("fbLoginModeSelected");
    } catch { }

    setErrorMessage(
      LOGIN_ERROR_MESSAGES[result.reason ?? "unknown"] ??
      LOGIN_ERROR_MESSAGES.unknown,
    );
  };

  const refreshPersonaAccounts = async (platformId: PlatformId): Promise<void> => {
    try {
      const storedUser = await appStorage.getItem<{
        extension_session?: { extension_config_id?: string };
      }>("local:user");
      const extensionConfigId =
        storedUser?.extension_session?.extension_config_id;
      if (extensionConfigId) {
        console.log(
          "[refreshPersonaAccounts] Skipping — extension config mode",
        );
        return;
      }

      const personaId = localStorageService.getItem("selectedPersonaId");
      if (!personaId) return;

      const response = await api.socialAccount.getSocialAccountsByPersona(personaId);
      const accounts: SocialAccount[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      if (!accounts.length) return;

      // Normalize: twitter → x
      const normalized = accounts.map((a) => ({
        ...a,
        platform: a.platform === "twitter" ? "x" : a.platform,
      }));

      const rawAccounts = normalized.filter((a) => a.status === "active");

      const activeAccounts = await Promise.all(
        rawAccounts.map(async (account) => {
          if (
            account.proxy_id &&
            (!account.proxy || Object.keys(account.proxy).length === 0)
          ) {
            try {
              const proxyData = await api.proxy.getProxyInfo(account.proxy_id);
              return { ...account, proxy: proxyData };
            } catch (err) {
              console.warn(
                `Failed to fetch proxy info for account ${account.account_id}:`,
                err,
              );
            }
          }
          return account;
        }),
      );

      const sanitizedAccounts = activeAccounts
        .map((a) => normalizePersonaSocialAccount(a))
        .filter(
          (a): a is NonNullable<typeof a> => a !== null,
        ) as SocialAccount[];

      // Always update allSocialAccounts with sanitized list
      await appStorage.setItem("local:allSocialAccounts", sanitizedAccounts);
      await appStorage.setItem("local:personaSocialAccounts", sanitizedAccounts);

      // Update facebook-specific keys if applicable
      const facebookAccounts = sanitizedAccounts.filter((a) => a.platform === "facebook");
      if (facebookAccounts.length) {
        await appStorage.setItem("local:facebookAccounts", facebookAccounts);
        await appStorage.setItem(
          "local:personaFacebookAccounts",
          facebookAccounts,
        );
      }

      console.log(
        "[refreshPersonaAccounts] Loaded",
        activeAccounts.length,
        "accounts for platform:",
        platformId,
      );
    } catch (err) {
      console.warn("[refreshPersonaAccounts] Failed:", err);
      // Non-fatal — loginWithMode will use whatever is already cached
    }
  };

  const isModeBusy = busyMode !== null;
  const isAutoLoading = isModeBusy && busyMode === "auto";
  const isManualLoading = isModeBusy && busyMode === "manual";

  const footerLabel = step === "loginMode" && selectedPlatform ? selectedPlatform.label : null;

  return (
    <div className="fb-login-mode-container switch-platform-page switch-platform-redesign">
      {/* Platform switcher preview section */}
      <div className="switch-platform-redesign__shell">
        <WorkspacePageHeader
          eyebrow="WORKSPACE / PLATFORM"
          title={selectedPlatform
            ? "Choose how to connect"
            : "Switch platform"
          }
          description={selectedPlatform
            ? "Select a sign-in method for the selected network." :
            "Choose a network to manage in your workspace."
          } />

        {/* Progress indicator for platform switch steps */}
        <div className="switch-platform-redesign__progress">
          <span className="is-complete" /><span className={selectedPlatform ? "is-complete" : ""} />
        </div>

        {/* Platform switcher section */}
        {selectedPlatform
          ?
          < section className="switch-platform-redesign__section">
            <button className="switch-platform-redesign__back" onClick={() => setSelectedPlatform(null)}>← All platforms
            </button>
            <div className="switch-platform-redesign__selected">
              <strong>{selectedPlatform.label}</strong>
              <span className="switch-platform-redesign__selected-check">✓</span>
            </div>
            <div className="switch-platform-redesign__section-heading">
              <span>SIGN-IN METHOD</span>
            </div>
            <div className="switch-platform-redesign__mode-list">
              <button
                className="switch-platform-redesign__mode"
                onClick={() => void handleLoginMode("auto")}
              >
                <span className="switch-platform-redesign__mode-icon">⚡</span>
                <span className="switch-platform-redesign__mode-copy">
                  <strong>System account</strong>
                  <small>Continue with the account managed by your workspace.</small>
                </span>
                <span className="switch-platform-redesign__mode-arrow">→</span></button>
              <button
                className="switch-platform-redesign__mode"
                onClick={() => void handleLoginMode("manual")}
              >
                <span className="switch-platform-redesign__mode-icon">↗</span>
                <span className="switch-platform-redesign__mode-copy">
                  <strong>Personal account</strong>
                  <small>Sign in manually using your own credentials.</small>
                </span>
                <span className="switch-platform-redesign__mode-arrow">→</span>
              </button>
            </div>
          </section>
          :
          <section className="switch-platform-redesign__section">
            <div className="switch-platform-redesign__section-heading">
              <span>AVAILABLE NETWORKS</span>
              <span>Select a platform ↓</span>
            </div>
            <PlatformSelect
              busyId={null}
              variant="switch"
              currentPlatformId="facebook"
              onSelectPlatform={(platform) => handleSelectPlatform(platform)} />
            <p className="switch-platform-redesign__hint">
              Your current workspace and data will remain available when switching networks.
            </p>
          </section>
        }
      </div>
    </div >
  );
};

export default FacebookLoginMode;

// const oldUI = (
//     <div className="fb-login-mode-container">
//       <PlatformMetaBar platformLabel={footerLabel} />

//       {step === "platform" ? (
//         <>
//           <section className="switch-platform-redesign__section">
//             <div className="switch-platform-redesign__section-heading">
//               <span>AVAILABLE NETWORKS</span>
//               <span>Select a platform ↓</span>
//             </div>
//             <PlatformSelect
//               busyId={null}
//               variant="switch"
//               currentPlatformId="facebook"
//               onSelectPlatform={(platform) => handleSelectPlatform(platform)} />
//             <p className="switch-platform-redesign__hint">
//               Your current workspace and data will remain available when switching networks.
//             </p>
//           </section>
//         </>
//       ) : (
//         <>
//           <button
//             onClick={() => {
//               setStep("platform");
//               setErrorMessage(null);
//             }}
//             className="platform-back-btn"
//           >
//             ← Back to platforms
//           </button>

//           {selectedPlatform && (
//             <div className="login-mode-platform-badge">
//               <span className="login-mode-platform-icon">
//                 {selectedPlatform.icon}
//               </span>
//               <span className="login-mode-platform-name">
//                 {selectedPlatform.label}
//               </span>
//             </div>
//           )}

//           <div className="fb-login-mode-options">
//             <button
//               className="fb-login-mode-btn fb-login-mode-btn--auto"
//               disabled={isModeBusy}
//               onClick={() => void handleLoginMode("auto")}
//             >
//               {isAutoLoading && <span className="loading-spinner loading-spinner--inline" />}
//               {isAutoLoading ? "Logging in…" : "Log in to system account"}
//             </button>
//             <button
//               className="fb-login-mode-btn fb-login-mode-btn--manual"
//               disabled={isModeBusy}
//               onClick={() => void handleLoginMode("manual")}
//             >
//               {isManualLoading && (
//                 <span className="platform-flow-spinner platform-flow-spinner--inline platform-flow-spinner--manual" />
//               )}
//               {isManualLoading ? "Opening…" : "Log in to your account"}
//             </button>
//           </div>
//         </>
//       )}

//       {errorMessage && (
//         <div className="notification-text notification-failed">
//           {errorMessage}
//         </div>
//       )}
//     </div>
//   )