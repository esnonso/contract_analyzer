"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type DocumentResult = {
  documentId: string;
  documentName: string;
  fileName: string;
  text: string;
};

export default function DocumentViewPage() {
  const params = useParams<{ documentId?: string }>();
  const [document, setDocument] = useState<DocumentResult | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState("");

  useEffect(() => {
    const documentId = params.documentId;

    if (documentId) {
      fetch(`/api/documents/${documentId}`)
        .then(async (response) => {
          const result = await response.json() as DocumentResult & { error?: string };
          if (!response.ok) throw new Error(result.error || "The document could not be loaded.");
          setDocument(result);
        })
        .catch(() => setDocument(null));
      return;
    }

    const storedDocument = sessionStorage.getItem("contract-analyser-result");
    if (!storedDocument) return;

    try {
      setDocument(JSON.parse(storedDocument) as DocumentResult);
    } catch {
      sessionStorage.removeItem("contract-analyser-result");
    }
  }, [params.documentId]);

  return (
    <main className="document-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Contract Analyser home">
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Contract Analyser</span>
        </Link>
        <Link className="back-link" href="/">← New analysis</Link>
      </header>
      {document ? (
        <section className="document-content" aria-labelledby="document-title">
          <div className="document-heading">
            <p className="eyebrow">Extracted text</p>
            <h1 id="document-title">{document.documentName}</h1>
            <div className="document-meta">
              <p className="document-file">{document.fileName}</p>
              <p className="document-id">Document ID: {document.documentId}</p>
            </div>
          </div>
          <form
            className="question-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const trimmedQuestion = question.trim();
              if (!trimmedQuestion) return;
              setIsAsking(true);
              setAnswer("");
              setQuestionError("");

              try {
                const response = await fetch(`/api/documents/${document.documentId}/ask`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ question: trimmedQuestion }),
                });
                const result = await response.json() as { answer?: string; error?: string };
                if (!response.ok) throw new Error(result.error || "The question could not be answered.");
                setAnswer(result.answer || "No answer was returned.");
                setQuestion("");
              } catch (error) {
                setQuestionError(error instanceof Error ? error.message : "The question could not be answered.");
              } finally {
                setIsAsking(false);
              }
            }}
          >
            <label htmlFor="document-question">Ask about this document</label>
            <div className="question-controls">
              <input
                id="document-question"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What would you like to know?"
              />
              <button type="submit" disabled={!question.trim() || isAsking}>{isAsking ? "Thinking..." : "Ask"} {!isAsking && <span aria-hidden="true">→</span>}</button>
            </div>
            {questionError && <p className="question-status error-message" role="alert">{questionError}</p>}
            {answer && (
              <div className="answer-block" role="status">
                <p className="answer-label">Answer</p>
                <p className="answer-text">{answer}</p>
              </div>
            )}
          </form>
        </section>
      ) : (
        <section className="empty-document" aria-labelledby="empty-title">
          <p className="eyebrow">No document loaded</p>
          <h1 id="empty-title">Start with a PDF.</h1>
          <p>Upload a document to see its extracted text here.</p>
          <Link className="primary-link" href="/">Upload a document <span aria-hidden="true">→</span></Link>
        </section>
      )}
    </main>
  );
}
