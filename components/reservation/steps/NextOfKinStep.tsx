import { AddressAutocompleteInput } from "@/components/ui/AddressAutoComplete";
import { ReservationActionContent } from "../ReservationActionContent";

export interface NextOfKinValues {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  relationship: string;
  residentialAddress: string;
}

interface NextOfKinStepProps {
  values: NextOfKinValues;
  onChange(values: NextOfKinValues): void;
  onBack(): void;
  onContinue(): void;
  loading: boolean;
}

const countryCodes = [
  { code: "+234", country: "Nigeria" },
  { code: "+372", country: "Estonia" },
  { code: "+233", country: "Ghana" },
  { code: "+254", country: "Kenya" },
  { code: "+27", country: "South Africa" },
  { code: "+44", country: "United Kingdom" },
  { code: "+1", country: "United States and Canada" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+91", country: "India" },
  { code: "+86", country: "China" },
];

const relationships = ["Father", "Mother", "Brother", "Sister", "Partner"];

function isValidEmail(email: string) {
  return !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function NextOfKinStep({ loading, values, onChange, onBack, onContinue }: NextOfKinStepProps) {
  const update = <Key extends keyof NextOfKinValues>(key: Key, value: NextOfKinValues[Key]) => onChange({ ...values, [key]: value });
  const complete =
    values.firstName.trim().length >= 2 &&
    values.lastName.trim().length >= 2 &&
    isValidEmail(values.email) &&
    Boolean(values.countryCode) &&
    isValidPhone(values.phoneNumber) &&
    Boolean(values.relationship) &&
    values.residentialAddress.trim().length >= 5;

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 6 of 7 <span aria-hidden="true">·</span> Next of kin
        </p>
      </header>

      <div className="reservation-step-scroll next-of-kin-scroll">
        <section className="next-of-kin-intro">
          <h2>Next of kin</h2>
          <p>The person we should contact about this unit if we cannot reach you.</p>
        </section>

        <div className="next-of-kin-fields">
          <div className="reservation-field">
            <label htmlFor="next-of-kin-name">
              First name <span aria-hidden="true">*</span>
            </label>
            <input
              id="next-of-kin-name"
              name="nextOfKinName"
              type="text"
              autoComplete="name"
              placeholder="First name"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="next-of-kin-name">
              Last name <span aria-hidden="true">*</span>
            </label>
            <input
              id="next-of-kin-name"
              name="nextOfKinName"
              type="text"
              autoComplete="name"
              placeholder="Last name"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="next-of-kin-email">Email address</label>
            <input
              id="next-of-kin-email"
              name="nextOfKinEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Optional"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="next-of-kin-phone">
              Phone number <span aria-hidden="true">*</span>
            </label>
            {/* <div className="phone-number-control"> */}
            {/* <select value={values.countryCode} onChange={(event) => update("countryCode", event.target.value)} aria-label="Country calling code" required>
                {countryCodes.map(({ code, country }) => (
                  <option key={`${country}-${code}`} value={code} title={country}>
                    {code}
                  </option>
                ))}
              </select> */}
            <input
              id="next-of-kin-phone"
              name="nextOfKinPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="817 281 0271"
              value={values.phoneNumber}
              onChange={(event) => update("phoneNumber", event.target.value.replace(/[^\d ()-]/g, ""))}
              required
            />
            {/* </div> */}
          </div>

          <div className="reservation-field">
            <label htmlFor="next-of-kin-relationship">
              Relationship <span aria-hidden="true">*</span>
            </label>
            <select
              id="next-of-kin-relationship"
              value={values.relationship?.toLowerCase()}
              onChange={(event) => update("relationship", event.target.value)}
              required
            >
              <option value="">Select</option>
              {relationships.map((relationship) => (
                <option key={relationship} value={relationship?.toLowerCase()}>
                  {relationship}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-field">
            <label htmlFor="next-of-kin-address">
              Residential address <span aria-hidden="true">*</span>
            </label>
            {/* <input
              id="next-of-kin-address"
              name="nextOfKinAddress"
              type="text"
              autoComplete="street-address"
              placeholder="Street, city, country"
              value={values.residentialAddress}
              onChange={(event) => update("residentialAddress", event.target.value)}
              required
            /> */}
            <AddressAutocompleteInput
              id="next-of-kin-address"
              name="nextOfKinAddress"
              type="text"
              autoComplete="street-address"
              placeholder="Street, city, country"
              value={values.residentialAddress}
              onChange={(value) => update("residentialAddress", value)}
            />
          </div>
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
