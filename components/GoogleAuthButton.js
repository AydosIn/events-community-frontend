import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function isGoogleSdkReady() {
  return typeof window !== "undefined" && Boolean(window.google?.accounts?.id);
}

export default function GoogleAuthButton({ onCredential, disabled = false, text = "continue_with" }) {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);
  const callbackRef = useRef(onCredential);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const instanceId = useId().replace(/:/g, "");

  callbackRef.current = onCredential;

  useEffect(() => {
    if (isGoogleSdkReady()) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptLoaded || !containerRef.current || !isGoogleSdkReady() || disabled) {
      return;
    }

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            callbackRef.current(response.credential);
          }
        },
      });

      initializedRef.current = true;
    }

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "pill",
      width: 320,
    });
  }, [disabled, scriptLoaded, text]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="auth-helper-text">Google sign-in will appear after the client ID is configured.</p>;
  }

  return (
    <>
      <Script
        id={`google-identity-${instanceId}`}
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (isGoogleSdkReady()) {
            setScriptLoaded(true);
          }
        }}
        onReady={() => {
          if (isGoogleSdkReady()) {
            setScriptLoaded(true);
          }
        }}
      />
      <div className="google-auth-block">
        <div
          ref={containerRef}
          className={`google-auth-button-shell${disabled ? " google-auth-button-shell-disabled" : ""}`}
          aria-hidden={disabled}
        />
      </div>
    </>
  );
}
