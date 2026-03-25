"use client";

export function CookieSettingsButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("p2v_cookie_consent");
        window.location.reload();
      }}
      className="text-background/50 hover:text-background text-xs transition-colors cursor-pointer"
    >
      Cookie Settings
    </button>
  );
}
