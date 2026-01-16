import React from "react";

export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="toggleUi" />
      <span className="toggleLabel">{label}</span>
    </label>
  );
}
