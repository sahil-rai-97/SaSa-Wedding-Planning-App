"use client";

import { useState } from "react";
import { Heart, Loader2, Check, ArrowLeft, CalendarDays, MapPin, Sparkles, Bus, Car } from "lucide-react";

const EVENTS = [
  { id: "Saturday Welcome Dinner", label: "Saturday (4/25) Welcome Dinner", description: "San Francisco (exact location TBD)" },
  { id: "Sunday Wedding Ceremony", label: "Sunday (4/26) Wedding Ceremony", description: "Mill Valley, CA (Old Mill Park Amphitheater)" },
];

type Step = "code" | "form" | "success";

interface AdditionalGuest {
  fullName: string;
  email: string;
  phone: string;
  dietaryRestrictions: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  attending: "yes" | "no" | "maybe" | "";
  events: string[];
  numberOfGuests: number;
  dietaryRestrictions: string;
  additionalGuests: AdditionalGuest[];
  busTransportation: "bus" | "car" | "undecided" | "";
  message: string;
  songRequests: string;
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  attending: "",
  events: [],
  numberOfGuests: 1,
  dietaryRestrictions: "",
  additionalGuests: [],
  busTransportation: "",
  message: "",
  songRequests: "",
};

export default function RsvpPage() {
  const [step, setStep] = useState<Step>("code");
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    const trimmedCode = accessCode.trim();
    if (trimmedCode === "S&S_2026" || trimmedCode === "S&S-2026") {
      setStep("form");
    } else {
      setCodeError("Incorrect code. Please try again.");
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const handleNumberOfGuestsChange = (num: number) => {
    setFormData((prev) => {
      let updatedAdditionalGuests = [...prev.additionalGuests];
      const additionalCount = num - 1;

      if (updatedAdditionalGuests.length < additionalCount) {
        // Add new guest entries
        for (let i = updatedAdditionalGuests.length; i < additionalCount; i++) {
          updatedAdditionalGuests.push({
            fullName: "",
            email: "",
            phone: "",
            dietaryRestrictions: "",
          });
        }
      } else if (updatedAdditionalGuests.length > additionalCount) {
        // Remove extra guest entries
        updatedAdditionalGuests = updatedAdditionalGuests.slice(0, additionalCount);
      }

      return {
        ...prev,
        numberOfGuests: num,
        additionalGuests: updatedAdditionalGuests,
      };
    });
  };

  const updateAdditionalGuest = (index: number, field: keyof AdditionalGuest, value: string) => {
    setFormData((prev) => {
      const updatedAdditionalGuests = [...prev.additionalGuests];
      updatedAdditionalGuests[index] = {
        ...updatedAdditionalGuests[index],
        [field]: value,
      };
      return { ...prev, additionalGuests: updatedAdditionalGuests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.fullName.trim()) {
      setSubmitError("Please enter your name.");
      return;
    }
    if (!formData.attending) {
      setSubmitError("Please let us know if you're attending.");
      return;
    }
    if (!formData.phone.trim()) {
      setSubmitError("Please enter your WhatsApp number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/guests/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          accessCode: accessCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setStep("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="h-1.5 bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400" />

      {/* Hero image - panel width, full image visible (no crop) */}
      <div className="max-w-2xl mx-auto px-4 w-full">
        <img
          src="/rsvp-hero.png"
          alt="Saloni & Sahil"
          className="w-full h-auto object-contain object-center"
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-gray-900">
            Saloni & Sahil
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-sm">
              <CalendarDays className="h-4 w-4" />
              April 25-26, 2026
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4" />
              San Francisco & Mill Valley
            </span>
          </div>
        </div>

        {step === "code" && (
          <div className="bg-white rounded-2xl shadow-xl border p-8 sm:p-10">
            <div className="text-center mb-8">
              <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold">You&apos;re Invited!</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Enter the code from your invitation to RSVP
              </p>
            </div>
            <form onSubmit={handleCodeSubmit} className="max-w-xs mx-auto space-y-4">
              <div>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full text-center text-lg px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                  autoFocus
                />
                {codeError && (
                  <p className="text-sm text-red-600 text-center mt-2">
                    {codeError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {step === "form" && (
          <div className="bg-white rounded-2xl shadow-xl border p-8 sm:p-10">
            <button
              onClick={() => setStep("code")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="mb-8 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
              <h3 className="text-sm font-semibold text-rose-900 mb-2">Events Overview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We are excited to celebrate our special day with you! We will be hosting two events as part of the celebrations:
              </p>
              <ol className="space-y-4 text-sm">
                <li>
                  <span className="font-medium text-foreground">1. Welcome Dinner</span>
                  <p className="mt-1 text-muted-foreground">
                    Saturday 4/25 | 6:30pm - 10pm | Location: San Francisco (exact venue TBD)
                  </p>
                  <p className="mt-0.5 text-muted-foreground italic">
                    Dress code: Indo-western or western formal in dark jewel tones
                  </p>
                </li>
                <li>
                  <span className="font-medium text-foreground">2. Wedding Ceremony</span>
                  <p className="mt-1 text-muted-foreground">
                    Sunday 4/26 | 10:30am - 3pm | Location: Mill Valley, CA (Old Mill Park Amphitheater)
                  </p>
                  <p className="mt-0.5 text-muted-foreground italic">
                    Dress code: Indian traditional in light colors
                  </p>
                </li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mb-1">RSVP</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Please fill in your details below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={formData.dietaryRestrictions}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      dietaryRestrictions: e.target.value,
                    }))
                  }
                  placeholder="e.g. Vegetarian, Gluten-free, Nut allergy"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Will you be attending? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: "yes", label: "Joyfully Accept", emoji: "🎉" },
                      { value: "maybe", label: "Maybe", emoji: "🤔" },
                      { value: "no", label: "Regretfully Decline", emoji: "😢" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, attending: opt.value }))
                      }
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all text-sm
                        ${
                          formData.attending === opt.value
                            ? opt.value === "yes"
                              ? "border-green-500 bg-green-50 text-green-800"
                              : opt.value === "maybe"
                              ? "border-amber-500 bg-amber-50 text-amber-800"
                              : "border-red-400 bg-red-50 text-red-800"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="text-xl block mb-1">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(formData.attending === "yes" ||
                formData.attending === "maybe") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Which events will you attend?
                    </label>
                    <div className="flex flex-col gap-2">
                      {EVENTS.map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => toggleEvent(evt.id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                            ${
                              formData.events.includes(evt.id)
                                ? "border-rose-500 bg-rose-50"
                                : "border-gray-200 hover:border-gray-300"
                            }
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors
                              ${
                                formData.events.includes(evt.id)
                                  ? "bg-rose-500 border-rose-500"
                                  : "border-gray-300"
                              }
                            `}
                          >
                            {formData.events.includes(evt.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{evt.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {evt.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.events.includes("Sunday Wedding Ceremony") && (
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="text-sm font-medium text-gray-900">
                        Bus Transportation for Wedding Ceremony
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        We are offering bus transportation to and from San Francisco.
                        <br />
                        Pick up will be in Rincon Hill at 9:15am, and drop off will also be in Rincon Hill at around 4pm.
                        <br /><br />
                        <strong>Note:</strong> There will be sufficient parking for those who choose to come in their own cars.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, busTransportation: "bus" }))
                          }
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-center transition-all text-sm
                            ${
                              formData.busTransportation === "bus"
                                ? "border-rose-500 bg-rose-50 text-rose-800 font-medium"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }
                          `}
                        >
                          <Bus className="w-4 h-4" />
                          Will use bus transportation
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, busTransportation: "car" }))
                          }
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-center transition-all text-sm
                            ${
                              formData.busTransportation === "car"
                                ? "border-rose-500 bg-rose-50 text-rose-800 font-medium"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }
                          `}
                        >
                          <Car className="w-4 h-4" />
                          Will come independently
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, busTransportation: "undecided" }))
                          }
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-center transition-all text-sm
                            ${
                              formData.busTransportation === "undecided"
                                ? "border-rose-500 bg-rose-50 text-rose-800 font-medium"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }
                          `}
                        >
                          Undecided - will confirm by March 20th
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Number of Guests (including yourself)
                    </label>
                    <select
                      value={formData.numberOfGuests}
                      onChange={(e) =>
                        handleNumberOfGuestsChange(parseInt(e.target.value, 10))
                      }
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white transition-colors"
                    >
                      {[1, 2].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.additionalGuests.map((guest, index) => (
                    <div key={index} className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-4">
                      <h3 className="font-medium text-rose-900 flex items-center gap-2">
                        Guest {index + 2} Details
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={guest.fullName}
                            onChange={(e) =>
                              updateAdditionalGuest(index, "fullName", e.target.value)
                            }
                            placeholder="Guest name"
                            className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors bg-white"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <input
                              type="email"
                              value={guest.email}
                              onChange={(e) =>
                                updateAdditionalGuest(index, "email", e.target.value)
                              }
                              placeholder="Guest email"
                              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                              WhatsApp Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={guest.phone}
                              onChange={(e) =>
                                updateAdditionalGuest(index, "phone", e.target.value)
                              }
                              placeholder="Guest WhatsApp number"
                              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors bg-white"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Dietary Restrictions
                          </label>
                          <input
                            type="text"
                            value={guest.dietaryRestrictions}
                            onChange={(e) =>
                              updateAdditionalGuest(index, "dietaryRestrictions", e.target.value)
                            }
                            placeholder="e.g. Vegetarian, Vegan"
                            className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Any Notes
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, message: e.target.value }))
                  }
                  placeholder="Share your wishes or any notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Song Requests
                </label>
                <input
                  type="text"
                  value={formData.songRequests}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, songRequests: e.target.value }))
                  }
                  placeholder="Any songs you'd like to hear?"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-colors"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Submit RSVP
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-2xl shadow-xl border p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              Thank You{formData.fullName ? `, ${formData.fullName.split(" ")[0]}` : ""}!
            </h2>
            {formData.attending === "yes" && (
              <p className="text-muted-foreground">
                We&apos;re so excited to celebrate with you! See you on April 25-26.
              </p>
            )}
            {formData.attending === "maybe" && (
              <p className="text-muted-foreground">
                We hope you can make it! Let us know when you&apos;ve decided.
              </p>
            )}
            {formData.attending === "no" && (
              <p className="text-muted-foreground">
                We&apos;ll miss you! Thank you for letting us know.
              </p>
            )}
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setStep("form");
                }}
                className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Submit Another RSVP
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-xs text-muted-foreground">
            S & S &middot; April 25-26, 2026 &middot; San Francisco & Mill Valley
          </p>
        </div>
      </div>
    </div>
  );
}
