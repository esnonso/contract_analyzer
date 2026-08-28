"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function DocumentUploadForm() {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSubmitted(false);

    if (!file) {
      setSelectedFile(null);
      setError("");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setSelectedFile(null);
      setError("Please choose a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("PDFs must be smaller than 25 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);

    if (!selectedFile) {
      setError("Add a PDF before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("documentName", documentName.trim());
    formData.append("documentFile", selectedFile);

    fetch("/api/documents", { method: "POST", body: formData })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The document could not be analysed.");
        sessionStorage.setItem("contract-analyser-result", JSON.stringify(result));
        router.push("/document/view");
      })
      .catch((submissionError: unknown) => {
        setError(submissionError instanceof Error ? submissionError.message : "The document could not be analysed.");
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="document-name">Document name</label>
        <input
          id="document-name"
          name="documentName"
          type="text"
          placeholder="e.g. Service Agreement"
          value={documentName}
          onChange={(event) => {
            setDocumentName(event.target.value);
            setSubmitted(false);
          }}
          required
        />
      </div>

      <div className="field-group">
        <label htmlFor="document-file">PDF document</label>
        <label className={`file-dropzone${selectedFile ? " has-file" : ""}`} htmlFor="document-file">
          <span className="file-mark" aria-hidden="true">PDF</span>
          <span className="file-copy">
            <strong>{selectedFile ? selectedFile.name : "Choose a PDF to analyse"}</strong>
            <small>{selectedFile ? formatFileSize(selectedFile.size) : "Drop it here or browse from your device"}</small>
          </span>
          <span className="browse-label">Browse</span>
          <input
            id="document-file"
            name="documentFile"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            required={!selectedFile}
          />
        </label>
      </div>

      <div className="form-footer">
        <p className="file-note">PDF only · up to 25 MB</p>
        <button type="submit" disabled={!documentName.trim() || !selectedFile || isSubmitting}>
          {isSubmitting ? "Extracting text..." : "Analyse document"} {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>
      </div>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {submitted && <p className="form-message success-message" role="status">Ready to analyse {documentName.trim()}.</p>}
    </form>
  );
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB selected`;
}
