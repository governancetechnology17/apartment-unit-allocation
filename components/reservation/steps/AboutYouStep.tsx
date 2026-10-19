import { useState } from "react";
import { ReservationActionContent } from "../ReservationActionContent";
import { DocumentFiles, DocumentsStep } from "./DocumentsStep";

export interface AboutYouValues {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  education: string;
}

interface AboutYouStepProps {
  values: AboutYouValues;
  onChange(values: AboutYouValues): void;
  onBack(): void;
  onContinue(): void;
  loading: boolean;
  files: DocumentFiles;
  onDocumentChange(files: DocumentFiles): void;
}

const maritalStatuses = ["Married", "Single", "Divorced", "Widowed", "Rather not say"];
const genders = ["Female", "Male", "Prefer not to say"];
const educationLevels = ["High School Diploma", `Bachelor's Degree`, "Post-Secondary Certificate", "College", `Master's Degree`, "Ph.D"];

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

function dateFromDisplay(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function validDateOfBirth(value: string) {
  const date = dateFromDisplay(value);
  if (!date) return false;
  const today = new Date();
  const earliest = new Date(Date.UTC(1900, 0, 1));
  return date >= earliest && date.getTime() <= Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

export function AboutYouStep({ loading, values, onChange, onBack, onContinue, files, onDocumentChange }: AboutYouStepProps) {
  const [errors, setErrors] = useState<{ governmentId: string | null; utilityBill: string | null }>({ governmentId: null, utilityBill: null });

  const update = <Key extends keyof AboutYouValues>(key: Key, value: AboutYouValues[Key]) => onChange({ ...values, [key]: value });
  const complete =
    values.firstName.trim().length >= 2 &&
    values.lastName.trim().length >= 2 &&
    validDateOfBirth(values.dateOfBirth) &&
    Boolean(values.maritalStatus && values.gender && values.education) &&
    Boolean(files.governmentId && !errors.governmentId);

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 5 of 7 <span aria-hidden="true">·</span> About you
        </p>
      </header>

      <div className="reservation-step-scroll about-you-scroll">
        <section className="about-you-intro">
          <h2>Tell us more about yourself</h2>
          <p>This information will appear on the reservation form and sales agreement. Enter your name exactly as it appears on your identification.</p>
        </section>

        <div className="about-you-fields">
          <div className="reservation-field">
            <label htmlFor="reservation-first-name">
              First name <span aria-hidden="true">*</span>
            </label>
            <input
              id="reservation-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="As written on your ID"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-last-name">
              Last name <span aria-hidden="true">*</span>
            </label>
            <input
              id="reservation-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="As written on your ID"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-date-of-birth">
              Date of birth <span aria-hidden="true">*</span>
            </label>
            <input
              id="reservation-date-of-birth"
              name="dateOfBirth"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              value={values.dateOfBirth}
              onChange={(event) => update("dateOfBirth", formatTypedDate(event.target.value))}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-marital-status">
              Marital status <span aria-hidden="true">*</span>
            </label>
            <select
              id="reservation-marital-status"
              value={values.maritalStatus?.toLowerCase()}
              onChange={(event) => update("maritalStatus", event.target.value)}
              required
            >
              <option value="">Select</option>
              {maritalStatuses.map((status) => (
                <option key={status} value={status?.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-gender">
              Gender <span aria-hidden="true">*</span>
            </label>
            <select id="reservation-gender" value={values.gender?.toLowerCase()} onChange={(event) => update("gender", event.target.value)} required>
              <option value="">Select</option>
              {genders.map((gender) => (
                <option key={gender} value={gender?.toLowerCase()}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-education">
              Highest level of education <span aria-hidden="true">*</span>
            </label>
            <select id="reservation-education" value={values.education?.toLowerCase()} onChange={(event) => update("education", event.target.value)} required>
              <option value="">Select</option>
              {educationLevels.map((education) => (
                <option key={education} value={education?.toLowerCase()}>
                  {education}
                </option>
              ))}
            </select>
          </div>
          <DocumentsStep
            files={files}
            onDocumentChange={onDocumentChange}
            errors={errors} setErrors={setErrors}
          />
        </div>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!complete || loading} aria-busy={loading} onClick={onContinue}>
          <ReservationActionContent loading={loading} label="Continue" loadingLabel="Saving..." />
        </button>
      </footer>
    </div>
  );
}
