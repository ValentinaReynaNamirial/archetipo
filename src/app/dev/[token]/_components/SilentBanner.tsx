export function SilentBanner() {
  return (
    <div className="silent-banner" role="status">
      <span className="silent-banner-eyebrow">Silent</span>
      <p className="silent-banner-text">
        Your status currently appears as <strong>Silent</strong>. Submit your check-in to update it.
      </p>
    </div>
  );
}
