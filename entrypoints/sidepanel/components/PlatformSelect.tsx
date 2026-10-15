import React from "react";
import { PLATFORMS } from "../helpers/helpers-ui";
import type { PlatformId, PlatformObject } from "../types/types";

interface PlatformSelectProps {
  onSelectPlatform: (platform: PlatformObject) => void;
  busyId: PlatformId | null;
  variant?: "switch";
  currentPlatformId?: PlatformId | null;
}

const PlatformSelect = ({
  onSelectPlatform,
  busyId,
  variant,
  currentPlatformId,
}: PlatformSelectProps) => {
  return (
    <div className={`platform-select ${variant === "switch" ? "platform-select--switch" : ""}`}>
      <div className="platform-select__grid">
        {PLATFORMS.map((platform) => {
          const isDisabled = platform.disabled || busyId !== null;
          return (
            <button
              key={platform.id}
              type="button"
              disabled={isDisabled}
              aria-label={`${platform.label}${platform.disabled ? ", coming soon" : currentPlatformId === platform.id && variant === "switch" ? ", current platform" : ""}`}
              className={`platform-select__card ${isDisabled ? "platform-select__card--disabled" : ""} ${currentPlatformId === platform.id && variant === "switch" ? "platform-select__card--current" : ""}`}
              style={
                {
                  "--platform-gradient": platform.gradient,
                  "--platform-glow": platform.hoverGlow,
                } as React.CSSProperties
              }
              onClick={() => onSelectPlatform(platform)}
            >
              {platform.disabled && (
                <span className="platform-select__coming-soon">
                  Coming soon
                </span>
              )}
              {busyId === platform.id && (
                <span className="platform-select__spinner" />
              )}
              <span className="platform-select__icon">
                {platform.icon}
              </span>
              <span className="platform-select__label">
                {platform.label}
              </span>
              {variant === "switch" && !platform.disabled && <span className="platform-select__action">{currentPlatformId === platform.id ? "CURRENT" : "↗"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PlatformSelect;