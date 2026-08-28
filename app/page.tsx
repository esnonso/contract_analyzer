import DocumentUploadForm from "../components/DocumentUploadForm";


export default function Home() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Contract Analyser home">
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Contract Analyser</span>
        </a>
        <div className="home-header-actions">
          <a className="documents-link" href="/documents">Saved documents</a>
          <span className="header-status"><span aria-hidden="true" /> Secure workspace</span>
        </div>
      </header>
      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">01 / Start a review</p>
          <h1 id="page-title">Make every clause<br /><em>count.</em></h1>
          <p className="hero-description">Upload a contract and get to the important parts faster. Clearer terms, fewer surprises, better decisions.</p>
        </div>
        <div className="upload-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">New analysis</p><h2>Bring in a document</h2></div>
            <span className="step-count">1 <span>/ 1</span></span>
          </div>
          <DocumentUploadForm />
        </div>
      </section>
      <footer className="site-footer"><span>Built for confident decisions</span><span>© 2026 Contract Analyser</span></footer>
    </main>
  );
}
