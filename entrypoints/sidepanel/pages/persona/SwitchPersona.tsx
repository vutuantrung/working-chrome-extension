import "../../assets/css/pages/PersonaPage.css";
import { localStorageService } from "../../../../entrypoints/sidepanel/application/services/SidepanelServices";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getPersonas } from "../../infrastructure/api/user.api";
import { parseList } from "../../helpers/helpers";
import { Persona, ViewState } from "../../types/types";
import ConfirmModal from "../../components/modal/ConfirmModal";
import StatusScreen from "../../components/Persona/StatusScreen";
import PersonaCard from "../../components/Persona/PersonaCard";

interface SwitchPersonaProps {
  onSwitched: () => void;
}

const SwitchPersona: React.FC<SwitchPersonaProps> = ({ onSwitched }) => {
  const { user, canSwitchPersona, switchPersona } = useAuth();

  const [viewState, setViewState] = useState<ViewState>("initializing");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  const selectedPersona = personas.find((p) => p.id === selectedId);
  const personaDisplayName = selectedPersona
    ? [selectedPersona.first_name, selectedPersona.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    selectedPersona.nickname ||
    "this persona"
    : "this persona";

  useEffect(() => {
    if (!canSwitchPersona) {
      setViewState("unavailable");
      return;
    }

    const init = async () => {
      setViewState("initializing");
      setErrorMsg(null);

      const currentPersonaId = localStorageService.getItem("selectedPersonaId");

      try {
        const data = await getPersonas(user?.id ?? "");
        const list: Persona[] = parseList(data?.data ?? data);
        const switchable = list.filter((p) => p.id !== currentPersonaId);

        if (switchable.length === 0) {
          setViewState("no-options");
          return;
        }

        setPersonas(switchable);
        setViewState("ready");
      } catch (err) {
        console.error("[SwitchPersona] getPersonas error:", err);
        setErrorMsg("Failed to load personas. Please try again.");
        setViewState("ready");
      }
    };

    init();
  }, [user?.id, canSwitchPersona]);

  const handleSwitch = async () => {
    if (!selectedId || confirming) return;

    setShowConfirm(false);
    setConfirming(true);
    setViewState("activating");
    setErrorMsg(null);
    setStatusDetail("Activating persona…");

    try {
      setStatusDetail("Loading persona info…");
      const result = await switchPersona(selectedId);
      if (!result.success) {
        setErrorMsg(result.error ?? "Failed to switch persona.");
        setViewState("ready");
        return;
      }
      onSwitched();
    } catch (err) {
      console.error("[SwitchPersona] handleSwitch error:", err);
      setErrorMsg("Failed to switch persona. Please try again.");
      setViewState("ready");
    } finally {
      setConfirming(false);
      setStatusDetail(null);
    }
  };

  if (viewState === "unavailable") {
    return (
      <div className="persona-page">
        <div className="persona-panel persona-unavailable">
          <p className="persona-unavailable__title">
            Switch persona unavailable
          </p>
          <p className="persona-unavailable__text">
            Your session uses extension config. Persona switching only applies
            when extension config is not assigned.
          </p>
          <button type="button" onClick={onSwitched} className="persona-back-btn">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (viewState === "initializing") {
    return (
      <div className="persona-page">
        <StatusScreen icon="⏳" title="Loading personas…" />
      </div>
    );
  }

  if (viewState === "activating") {
    return (
      <div className="persona-page">
        <StatusScreen
          icon="🔄"
          title="Switching persona…"
          subtitle={statusDetail ?? undefined}
        />
      </div>
    );
  }

  if (viewState === "no-options") {
    return (
      <div className="persona-page">
        <div className="persona-panel">
          <div className="persona-panel__header">
            <h2 className="persona-panel__title">Switch Persona</h2>
            <p className="persona-panel__subtitle">No other personas to switch to</p>
          </div>
          <div className="persona-no-options">
            <span className="persona-no-options__icon">👤</span>
            <p className="persona-no-options__text">
              No other personas available
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="persona-page">
      <div className="persona-panel">
        <div className="persona-panel__header">
          <h2 className="persona-panel__title">Switch Persona</h2>
          <p className="persona-panel__subtitle">Select a persona to switch to</p>
        </div>

        {errorMsg && (
          <div className="notification-text notification-failed">
            {errorMsg}
          </div>
        )}

        <div className="persona-panel__list">
          {personas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              selected={selectedId === p.id}
              onSelect={() =>
                setSelectedId((prev) => (prev === p.id ? null : p.id))
              }
            />
          ))}
        </div>

        <div className="persona-panel__footer">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!selectedId || confirming}
            className="persona-primary-btn"
          >
            {confirming ? "Switching…" : "Switch →"}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Switch persona?"
        busy={confirming}
        message={
          <>
            <p className="confirm-copy__lead">
              You are about to switch to <strong>{personaDisplayName}</strong>.
            </p>
            <p className="confirm-copy__body">
              This will apply <strong>proxy</strong> for the new persona. If you
              use <strong>system account</strong> login, the extension will sign
              in with that persona&apos;s account for the current platform. If
              you use <strong>your own account</strong>, cookies for that
              platform will be cleared immediately so your session is not mixed
              with the previous persona — you can log in again afterward.
              Security checkpoints may occur.
            </p>
          </>
        }
        confirmLabel="Yes, switch"
        cancelLabel="Cancel"
        onCancel={() => !confirming && setShowConfirm(false)}
        onConfirm={() => {
          if (!confirming) void handleSwitch();
        }}
      />
    </div>
  );
};

export default SwitchPersona;
