export default function Loading() {
  return (
    <main className="document-page">
      <header className="site-header">
        <div className="wordmark" aria-label="Contract Analyser">
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Contract Analyser</span>
        </div>
      </header>
      <section className="empty-document" aria-live="polite" aria-busy="true">
        <p className="eyebrow">Loading document</p>
        <h1>Opening your document.</h1>
        <p>Retrieving the saved document details.</p>
      </section>
    </main>
  );
}
