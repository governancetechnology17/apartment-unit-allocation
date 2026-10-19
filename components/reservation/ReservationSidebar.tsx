"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
// import { paymentPlans } from "./payment-plans";
import { AboutYouStep, type AboutYouValues } from "./steps/AboutYouStep";
import { ContactStep } from "./steps/ContactStep";
import { DocumentsStep, type DocumentFiles } from "./steps/DocumentsStep";
import { NextOfKinStep, type NextOfKinValues } from "./steps/NextOfKinStep";
import { PaymentPlanStep } from "./steps/PaymentPlanStep";
import { PaymentSummaryStep } from "./steps/PaymentSummaryStep";
import { ReservationSuccess } from "./steps/ReservationSuccess";
import { VerificationStep } from "./steps/VerificationStep";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchBundlePaymentPlans, fetchProjectBundles, fetchProjectDocumentsQuery, makeEquityPayment } from "@/lib/api/investment";
import { PaymentPlan } from "./payment-plans";
import { useToast } from "@chakra-ui/react";
import { loginWithOTP, registerUser, requestOTPForEmailVerification } from "@/lib/api/auth";
import { getProfileData, updateProfile } from "@/lib/api/profile";
import { encodeFileToBase64, stripDataUrlBase64Prefix } from "@/lib/constants/encode-base64";
import { business_id, store_name } from "@/lib/constants/store-name";

interface SalesContact {
  name: string;
  role: string;
  whatsappLink: string;
  email: string;
  img: string;
}

interface ReservationSidebarProps {
  esubDetails: any;
  unitId?: number;
  unitNumber: string;
  propertyName: string;
  allocationId: number;
  available: boolean;
  salesSubject: string;
  contacts: SalesContact[];
}

const emptyAboutYou: AboutYouValues = { firstName: "", lastName: "", dateOfBirth: "", maritalStatus: "", gender: "", education: "" };
const emptyNextOfKin: NextOfKinValues = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+234",
  phoneNumber: "",
  relationship: "",
  residentialAddress: "",
};

export function ReservationSidebar({
  esubDetails,
  unitId,
  unitNumber,
  propertyName,
  allocationId,
  available,
  salesSubject,
  contacts,
}: ReservationSidebarProps) {
  const project = esubDetails?.project;

  const bundleQuery = useQuery({ queryKey: ["fetchProjectBundles"], queryFn: () => fetchProjectBundles(project?.id), enabled: !!project?.id });
  const allUnits = bundleQuery?.data?.data?.results;
  const fetchedUnit = allUnits?.find((unit: any) => unit.id === unitId);
  const paymentPlansQuery = useQuery({
    queryKey: ["fetchBundlePaymentPlans"],
    queryFn: () => fetchBundlePaymentPlans(fetchedUnit?.id),
    enabled: !!fetchedUnit?.id,
  });
  const fetchedPlans = paymentPlansQuery?.data?.data?.results as PaymentPlan[];
  const paymentPlans = fetchedPlans?.filter((plan) => !!plan.id);

  const toast = useToast();
  const [step, setStep] = useState<
    "overview" | "payment-plan" | "payment-summary" | "contact" | "verification" | "about-you" | "next-of-kin" | "documents" | "success"
  >("overview");

  const [success, setSuccess] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [aboutYou, setAboutYou] = useState<AboutYouValues>(emptyAboutYou);
  const [nextOfKin, setNextOfKin] = useState<NextOfKinValues>(emptyNextOfKin);
  const [documents, setDocuments] = useState<DocumentFiles>({ governmentId: null, utilityBill: null });
  const selectedPlan = selectedPlanId === "outright" ? fetchedUnit : paymentPlans?.find((plan) => plan.id === selectedPlanId);
  const selectPaymentPlan = (planId: string) => {
    if (planId !== selectedPlanId) setAcceptedTerms(false);
    setSelectedPlanId(planId);
  };
  const [newUser, setNewUser] = useState(false);
  const returnToUnit = useCallback(() => {
    setStep("overview");
    setSelectedPlanId(null);
    setAcceptedTerms(false);
    setEmail("");
    setVerificationCode("");
    setAboutYou(emptyAboutYou);
    setNextOfKin(emptyNextOfKin);
    setDocuments({ governmentId: null, utilityBill: null });
  }, []);
  const reservationActive = step !== "overview";
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle("reservation-flow-active", reservationActive);
    if (!reservationActive) return () => document.body.classList.remove("reservation-flow-active");

    const isMobileDrawer = window.matchMedia("(max-width: 700px)").matches;
    const previouslyFocused = isMobileDrawer && document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = isMobileDrawer ? window.requestAnimationFrame(() => drawerCloseRef.current?.focus()) : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") returnToUnit();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("reservation-flow-active");
      previouslyFocused?.focus();
    };
  }, [reservationActive, returnToUnit]);

  const renderFlow = (content: ReactNode) => (
    <>
      <button className="reservation-drawer-backdrop" type="button" aria-label="Close reservation" onClick={returnToUnit} />
      <aside className="sales-panel reservation-flow-panel is-open" role="dialog" aria-label={`Reserve unit ${unitNumber}`}>
        <div className="reservation-drawer-chrome">
          <span aria-hidden="true" />
          <button ref={drawerCloseRef} type="button" aria-label="Close reservation" onClick={returnToUnit}>
            ×
          </button>
        </div>
        {content}
      </aside>
    </>
  );

  const docParam = !selectedPlan?.initial_deposit_in_value ? `unit=${fetchedUnit?.id}&purpose=outright` : `plan=${selectedPlan?.id}&purpose=paymentplan`;
  const queryEnabled = !selectedPlan?.initial_deposit_in_value ? fetchedUnit?.id : selectedPlan?.id;

  const docQuery = useQuery({
    queryKey: ["project-documents", docParam],
    queryFn: () => fetchProjectDocumentsQuery(docParam),
    enabled: !!queryEnabled,
  });
  const docResults = docQuery?.data?.data?.results;
  const documentUrl = docResults?.[0]?.document_file ?? docResults?.[0]?.document_url ?? null;

  const sendCodeMutation = useMutation({
    mutationFn: () => requestOTPForEmailVerification({ email: email?.trim(), verify: true }),
    onSuccess: (res) => {
      setVerificationCode("");
      setStep("verification");
    },
    onError: (err: any) => {
      toast({
        title: `${err?.response?.data?.message || "There was an error sending an OTP for authentication"}`,
        description: "",
        status: "error",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (field: "next-of-kin" | "success") => {
      if (field === "next-of-kin") {
        if (newUser) {
          const storeName = store_name();
          const res = await registerUser({
            store_name: storeName,
            email: email,
            first_name: aboutYou.firstName,
            last_name: aboutYou.lastName,
            date_of_birth: aboutYou.dateOfBirth,
            marital_status: aboutYou.maritalStatus,
            gender: aboutYou.gender,
            highest_education: aboutYou.education,
          });
          if (res?.data?.token) sessionStorage.setItem("token", res?.data?.token);
        } else {
          await updateProfile({
            first_name: aboutYou.firstName,
            last_name: aboutYou.lastName,
            date_of_birth: aboutYou.dateOfBirth?.split("/")?.reverse()?.join("-"),
            marital_status: aboutYou.maritalStatus,
            gender: aboutYou.gender,
            highest_education: aboutYou.education,
            profile_details: true,
          });
        }


        const strip = stripDataUrlBase64Prefix;
        if (documents.governmentId instanceof File)
          await updateProfile({
            document: [
              {
                document_type: "id_document",
                document_name: (documents.governmentId)?.name,
                id_number: null,
                image: await encodeFileToBase64(documents.governmentId).then(strip),
              },
            ],
            // utility_bill: [
            //   {
            //     utility_bill_type: null,
            //     document_name: documents?.utilityBill?.name,
            //     utility_bill: await encodeFileToBase64(documents.utilityBill as File).then(strip),
            //   },
            // ],
            documents: true,
          });
      }

      if (field === "success")
        await updateProfile({
          first_name: nextOfKin?.firstName,
          last_name: nextOfKin?.lastName,
          email: nextOfKin?.email,
          phone: nextOfKin?.phoneNumber,
          relationship: nextOfKin?.relationship,
          residential_address: nextOfKin?.residentialAddress,
          next_of_kin: true,
        });

      return field;
    },
    onSuccess: async (field) => {
      setStep(field);
      setNewUser(false);
      if (field === "success") {
        const storename = store_name();
        const businessId = business_id();
        const objToSubmit = {
          amount_to_pay: selectedPlan?.initial_deposit_in_value ? selectedPlan?.initial_deposit_in_value : selectedPlan?.price,
          bundle_id: fetchedUnit.id,
          business_id: businessId,
          from_store: true,
          payment_option: "virtual_bank",
          paymentplan_id: selectedPlan?.initial_deposit_in_value ? selectedPlan?.id : undefined,
          redirect_url: `https://${storename}.6787878.com`,
          store_name: storename,
          type: "WHOLE",
          allocation_id: allocationId,
        };

        paymentMutation.mutate(objToSubmit);
      }
    },
    onError: (err: any) => {
      toast({
        title: `${err?.response?.data?.message || "There was an error updating data"}`,
        description: "",
        status: "error",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      return await makeEquityPayment(formData);
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err: any) => {
      toast({
        status: "error",
        description: err?.response?.data?.message ?? err?.message ?? "Payment request failed.",
        position: "top-right",
      });
    },
  });

  const docsSettingsMutation = useMutation({
    mutationFn: () => getProfileData({ documents: true }),
    onSuccess: (res) => {
      const documentData = res?.data?.data?.[0];
      setDocuments({
        governmentId: (documentData?.kyc_document) as string,
        utilityBill: (documentData?.kyc_document) as string,
      });
      setStep("about-you");
    },
  });

  const nokSettingsMutation = useMutation({
    mutationFn: () => getProfileData({ next_of_kin: true }),
    onSuccess: (res) => {
      const { first_name, last_name, phone, relationship, residential_address } = res?.data?.data;
      setNextOfKin({
        firstName: first_name,
        lastName: last_name,
        email: email,
        countryCode: "+234",
        phoneNumber: phone,
        relationship: relationship,
        residentialAddress: residential_address,
      });

      docsSettingsMutation.mutate();
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () => getProfileData({ profile: true }),
    onSuccess: (res) => {
      const { first_name, last_name, date_of_birth, highest_education, marital_status, gender } = res?.data?.data;
      setAboutYou({
        firstName: first_name,
        lastName: last_name,
        dateOfBirth: date_of_birth?.split("-")?.reverse()?.join("/"),
        maritalStatus: marital_status,
        gender: gender,
        education: highest_education,
      });
      nokSettingsMutation.mutate();
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: () => loginWithOTP({ email, code: verificationCode }),
    onSuccess: (res) => {
      console.log("res?.data", res?.data);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (res?.data?.token) sessionStorage.setItem("token", res?.data?.token);

      setTimeout(() => {
        settingsMutation.mutate();
      }, 1000);
    },
    onError: (err: any) => {
      if (err?.response?.status === 404) {
        setNewUser(true);
        setTimeout(() => {
          setStep("about-you");
        }, 1000);
      } else {
        return toast({
          description: `${err?.response?.data?.message || "There was an error authenticating this account. Please try again"}`,
          status: "error",
          duration: 5000,
        });
      }
    },
  });

  if (step === "payment-plan") {
    return renderFlow(
      <PaymentPlanStep
        fetchedUnit={fetchedUnit}
        paymentPlans={paymentPlans}
        isLoading={paymentPlansQuery.isLoading}
        selectedPlanId={selectedPlanId}
        onSelect={selectPaymentPlan}
        onBack={() => setStep("overview")}
        onContinue={() => {
          if (selectedPlanId) setStep("payment-summary");
        }}
      />,
    );
  }
  if (step === "payment-summary" && selectedPlan) {
    return renderFlow(
      <PaymentSummaryStep
        fetchedUnit={fetchedUnit}
        plan={selectedPlan}
        acceptedTerms={acceptedTerms}
        onAcceptedTermsChange={setAcceptedTerms}
        onBack={() => setStep("payment-plan")}
        documentUrl={documentUrl}
        onProceed={() => {
          if (documentUrl) {
            if (acceptedTerms) setStep("contact");
          } else {
            setStep("contact");
          }
        }}
      />,
    );
  }
  if (step === "contact") {
    return renderFlow(
      <ContactStep
        unitNumber={unitNumber}
        email={email}
        onEmailChange={(nextEmail) => {
          if (nextEmail !== email) setVerificationCode("");
          setEmail(nextEmail);
        }}
        loading={sendCodeMutation.isPending}
        onBack={() => setStep("payment-summary")}
        onSendCode={() => sendCodeMutation.mutate()}
      />,
    );
  }
  if (step === "verification") {
    return renderFlow(
      <VerificationStep
        email={email}
        code={verificationCode}
        onCodeChange={setVerificationCode}
        onChangeAddress={() => setStep("contact")}
        onBack={() => setStep("contact")}
        onResend={() => sendCodeMutation.mutate()}
        loading={verifyCodeMutation.isPending || settingsMutation.isPending || nokSettingsMutation.isPending || docsSettingsMutation.isPending}
        onVerify={() => {
          if (/^\d{6}$/.test(verificationCode)) verifyCodeMutation.mutate();
        }}
      />,
    );
  }
  if (step === "about-you") {
    return renderFlow(
      <AboutYouStep
        values={aboutYou}
        onChange={setAboutYou}
        onBack={() => setStep("verification")}
        loading={updateProfileMutation.isPending}
        onContinue={() => updateProfileMutation.mutate("next-of-kin")}
        files={documents}
        onDocumentChange={setDocuments}
      />,
    );
  }
  if (step === "next-of-kin") {
    return renderFlow(
      <NextOfKinStep
        values={nextOfKin}
        onChange={setNextOfKin}
        onBack={() => setStep("about-you")}
        loading={updateProfileMutation.isPending}
        onContinue={() => updateProfileMutation.mutate("success")}
      />,
    );
  }
  if (step === "success" && selectedPlan) {
    return renderFlow(
      <ReservationSuccess
        loading={paymentMutation.isPending}
        propertyName={propertyName}
        unitNumber={unitNumber}
        email={email}
        reservedBy={`${aboutYou.firstName} ${aboutYou.lastName}`.trim()}
        plan={selectedPlan}
        onBackToUnit={returnToUnit}
        success={success}
      />,
    );
  }

  return (
    <aside className="sales-panel">
      <section className="reservation-block">
        <small>Your new home</small>
        <h2>
          {available ? "Reserve" : "Ask about"} unit {unitNumber} {available ? "in your name" : "with our sales team"}
        </h2>
        <p>
          {available
            ? "Tell us a few things about yourself, review the price and payment options, and decide from there."
            : "Get the full specification, payment schedule and current availability directly from our sales team."}
        </p>
        {/* {available ? ( */}
        <button className="primary-button" type="button" onClick={() => setStep("payment-plan")}>
          Reserve this unit <span aria-hidden="true">→</span>
        </button>
        {/* ) : (
          <a className="primary-button" href={salesEsmail}>
            Request information <span aria-hidden="true">→</span>
          </a>
        )} */}
      </section>

      <section className="sales-contact">
        <small>Your sales contact</small>
        {contacts.map((contact) => (
          <div key={contact.name} className="contact-card">
            <img className="contact-avatar" src={contact.img} alt="" />
            <div className="contact-details">
              <h3>{contact.name}</h3>
              <p>{contact.role}</p>
              <a href={`mailto:${contact.email}?subject=${salesSubject}`}>{contact.email}</a>
            </div>
            <div className="contact-actions">
              <a
                className="contact-action"
                href={contact.whatsappLink.replace(/unit%2061/i, `unit%20${encodeURIComponent(unitNumber)}`)}
                aria-label={`Message ${contact.name} on WhatsApp`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.82 9.82 0 0 0 4.69 1.19c5.43 0 9.85-4.42 9.85-9.86A9.79 9.79 0 0 0 12.04 2zm0 17.94a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2a8.15 8.15 0 0 1 8.19 8.2c0 4.52-3.68 8.18-8.19 8.18z" />
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
                </svg>
              </a>
              <a className="contact-action" href={`mailto:${contact.email}?subject=${salesSubject}`} aria-label={`Email ${contact.name}`}>
                ✉
              </a>
            </div>
          </div>
        ))}
        <a
          className="share-unit"
          href={`mailto:?subject=${encodeURIComponent(`Myxellia unit ${unitNumber}`)}&body=${encodeURIComponent(`Take a look at Myxellia unit ${unitNumber}: /units/${unitNumber}`)}`}
        >
          Send to a friend
        </a>
      </section>
    </aside>
  );
}
