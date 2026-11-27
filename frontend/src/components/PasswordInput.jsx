import { useState } from "react";
import "./PasswordInput.css";

export default function PasswordInput({ className = "", style, wrapperStyle, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-field ${className}`.trim()} style={{ position: "relative", width: "100%", ...wrapperStyle }}>
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        style={{ ...style, paddingRight: 46, marginBottom: 0 }}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
          {visible ? (
            <>
              <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7" />
              <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.5 4.7 9.5 6.4a1.2 1.2 0 010 1.2 15 15 0 01-3.2 3.7M6.2 6.3a16 16 0 00-3.7 5.1 1.2 1.2 0 000 1.2C3.5 14.3 6.8 19 12 19a10 10 0 003-.5" />
            </>
          ) : (
            <>
              <path d="M2.5 12s3.3-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.3 6.5-9.5 6.5S2.5 12 2.5 12z" />
              <circle cx="12" cy="12" r="2.7" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
