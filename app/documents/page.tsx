"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedDocument = {
  documentId: string;
  documentName: string;
  fileName: string;
  timeStamps: { createdAt: string };
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/documents")
      .then(async (response) => {
        const result = await response.json() as SavedDocument[] | { error?: string };
        if (!response.ok) throw new Error("error" in result ? result.error : "The documents could not be loaded.");
        setDocuments(result as SavedDocument[]);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "The documents could not be loaded."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="document-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Contract Analyser home">
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Contract Analyser</span>
        </Link>
        <Link className="back-link" href="/">← New analysis</Link>
      </header>
      <section className="documents-content" aria-labelledby="documents-title">
        <p className="eyebrow">Saved workspace</p>
        <h1 id="documents-title">Your documents.</h1>
        {isLoading && <p className="document-status">Loading documents...</p>}
        {error && <p className="document-status error-message" role="alert">{error}</p>}
        {!isLoading && !error && !documents.length && (
          <div className="empty-document-list">
            <p>No documents have been uploaded yet.</p>
            <Link className="primary-link" href="/">Upload a document <span aria-hidden="true">→</span></Link>
          </div>
        )}
        {documents.length > 0 && (
          <div className="document-list">
            {documents.map((document) => (
              <article className="document-list-item" key={document.documentId}>
                <div>
                  <h2>{document.documentName}</h2>
                  <p>{document.fileName}</p>
                  <small>{new Date(document.timeStamps.createdAt).toLocaleDateString()}</small>
                </div>
                <Link className="document-view-link" href={`/document/view/${document.documentId}`}>View <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}