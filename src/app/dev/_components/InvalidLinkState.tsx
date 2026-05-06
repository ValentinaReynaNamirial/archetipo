export function InvalidLinkState() {
  return (
    <div className="oggi-scope">
      <div className="dev-shell">
        <header className="dev-header">
          <div className="brand-block">
            <span className="brand-mark">Oggi</span>
            <span className="brand-sub">Dev · Daily</span>
          </div>
          <div className="header-status">
            <span className="dot" />
            <span>Link not valid</span>
          </div>
        </header>

        <main className="invalid-main">
          <div className="invalid-glyph anim-fade-up">
            <div className="core">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.5 4.5L4.5 10.5" />
                <path d="M13.5 13.5l6 6" />
                <path d="M14 8a4 4 0 0 1 0 5.66l-1.5 1.5a4 4 0 1 1-5.66-5.66L8.5 8" />
                <path d="M10 16a4 4 0 0 1 0-5.66L11.5 8.84a4 4 0 1 1 5.66 5.66L15.5 16" />
              </svg>
            </div>
          </div>

          <div className="invalid-eyebrow anim-fade-up anim-delay-1">Section unavailable</div>

          <h1 className="invalid-title anim-fade-up anim-delay-1">
            This <em>link</em> isn&apos;t valid.
          </h1>

          <p className="invalid-text anim-fade-up anim-delay-2">
            We can&apos;t open a daily page for this address. The link may have been
            mistyped, or it&apos;s no longer in service.
          </p>

          <div className="help-block anim-fade-up anim-delay-3">
            <div className="help-eyebrow">What now</div>
            <div className="help-text">
              If you received this link from <strong>Valentina</strong>, check the original
              message - opening the link directly from there avoids typos. If you copy-pasted
              it, make sure no characters were dropped.
            </div>
            <div className="help-text">
              Still nothing? Reply to Valentina and ask for a fresh link.
            </div>
          </div>
        </main>

        <footer className="dev-foot">
          <span>Oggi · Dev surface</span>
          <span>No account required</span>
        </footer>
      </div>
    </div>
  );
}
