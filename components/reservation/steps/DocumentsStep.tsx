"use client";

import { type DragEvent, type ReactNode, useState } from "react";
import { ReservationActionContent } from "../ReservationActionContent";

export interface DocumentFiles {
  governmentId: File | string | null;
  utilityBill: File | string | null;
}

interface DocumentsStepProps {
  files: DocumentFiles;
  onDocumentChange(files: DocumentFiles): void;
}

interface UploadFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint: string;
  file: File | string | null;
  error: string | null;
  onFile(file: File | null): void;
  onError(error: string | null): void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function validateFile(file: File) {
  const supportedExtension = /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!ACCEPTED_TYPES.includes(file.type) && !supportedExtension) return "Upload an image or PDF file.";
  if (file.size > MAX_FILE_SIZE) return "The file must be 10 MB or smaller.";
  return null;
}

function UploadField({ id, label, required, hint, file, error, onFile, onError }: UploadFieldProps) {
  const [dragging, setDragging] = useState(false);

  const chooseFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    const nextError = validateFile(nextFile);
    onError(nextError);
    if (!nextError) onFile(nextFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const fileName = file instanceof File ? file.name : file ? file : 'File'

  let content: ReactNode;
  if (file) {
    content = (
      <>
        <span className="document-upload-icon uploaded" aria-hidden="true">
          ✓
        </span>
        <span className="document-upload-copy">
          <strong title={fileName}>{fileName}</strong>
          <small>
            Uploaded ·{" "}
            <button
              type="button"
              onClick={() => {
                onFile(null);
                onError(null);
              }}
            >
              Remove
            </button>
          </small>
        </span>
      </>
    );
  } else {
    content = (
      <>
        <span className="document-upload-icon" aria-hidden="true">
          ↓
        </span>
        <span className="document-upload-copy">
          <strong>
            Drag a file here or <label htmlFor={id}>browse</label>
          </strong>
          <small>{hint}</small>
        </span>
      </>
    );
  }

  return (
    <div className="document-field">
      <label className="document-field-label" htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div
        className={`document-upload${file ? " has-file" : ""}${dragging ? " is-dragging" : ""}${error ? " has-error" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.pdf"
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {content}
      </div>
      {error && <small className="document-error">{error}</small>}
    </div>
  );
}

export function DocumentsStep({ files, onDocumentChange }: DocumentsStepProps) {
  const [errors, setErrors] = useState<{ governmentId: string | null; utilityBill: string | null }>({ governmentId: null, utilityBill: null });

  return (

    <div className="document-fields">
      <UploadField
        id="government-id"
        label="Government ID"
        required
        hint="Passport, national ID or driver licence"
        file={files.governmentId}
        error={errors.governmentId}
        onFile={(governmentId) => onDocumentChange({ ...files, governmentId })}
        onError={(governmentId) => setErrors((current) => ({ ...current, governmentId }))}
      />
      {/* <UploadField
        id="utility-bill"
        label="Proof of residence"
        required
        hint="Dated within the last three months"
        file={files.utilityBill}
        error={errors.utilityBill}
        onFile={(utilityBill) => onDocumentChange({ ...files, utilityBill })}
        onError={(utilityBill) => setErrors((current) => ({ ...current, utilityBill }))}
      /> */}
    </div>
  );
}
