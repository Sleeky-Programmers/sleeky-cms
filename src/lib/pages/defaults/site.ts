import type { Field, PageValues } from "../fields";

// Contact details and links used across the whole website (header, footer,
// WhatsApp buttons, About page, structured data for Google).
export const siteFields: Field[] = [
  {
    type: "group",
    key: "contact",
    label: "Contact details",
    fields: [
      { type: "text", key: "phoneDisplay", label: "Phone number (as shown)", max: 30, required: true, placeholder: "0916 095 2000" },
      { type: "text", key: "phoneInternational", label: "Phone number (international)", max: 20, required: true, format: "tel", hint: "Used for tap-to-call links, e.g. +2349160952000." },
      { type: "text", key: "whatsappNumber", label: "WhatsApp number", max: 20, required: true, format: "whatsapp", hint: "Country code and number, digits only, e.g. 2349160952000." },
      { type: "textarea", key: "whatsappMessage", label: "Default WhatsApp message", max: 200, rows: 2, required: true, hint: "Pre-filled when someone taps a WhatsApp button." },
      { type: "text", key: "email", label: "Email", max: 120, required: true, format: "email" },
    ],
  },
  {
    type: "group",
    key: "address",
    label: "Studio address",
    fields: [
      { type: "text", key: "street", label: "Street", max: 80, required: true },
      { type: "text", key: "locality", label: "Area", max: 60, required: true },
      { type: "text", key: "region", label: "City or state", max: 60, required: true },
      { type: "text", key: "mapsUrl", label: "Google Maps link", max: 500, format: "url", hint: "Used for \"Get directions\"." },
      { type: "text", key: "openingHours", label: "Opening hours", max: 80, placeholder: "Mon–Fri, 9am–6pm", hint: "Shown on the About page. Leave empty to hide." },
    ],
  },
  {
    type: "list",
    key: "socials",
    label: "Social links",
    itemLabel: "Link",
    titleKey: "label",
    max: 8,
    fields: [
      { type: "text", key: "label", label: "Name", max: 30, required: true, placeholder: "LinkedIn" },
      { type: "text", key: "url", label: "Address", max: 300, required: true, format: "url" },
    ],
  },
  {
    type: "textarea",
    key: "footerTagline",
    label: "Footer description",
    max: 200,
    rows: 2,
    required: true,
  },
];

export const siteDefaults: PageValues = {
  contact: {
    phoneDisplay: "0916 095 2000",
    phoneInternational: "+2349160952000",
    whatsappNumber: "2349160952000",
    whatsappMessage: "Hi Sleeky Programmers, I'd like to discuss a project.",
    email: "support@sleekyprogrammers.com",
  },
  address: {
    street: "20 Olanrewaju Street",
    locality: "Akoka",
    region: "Lagos",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=20+Olanrewaju+Street%2C+Akoka%2C+Lagos",
    openingHours: "",
  },
  socials: [
    { label: "LinkedIn", url: "https://www.linkedin.com/company/sleeky-programmers-limited/" },
    { label: "Instagram", url: "https://www.instagram.com/sleekyprogrammers" },
    { label: "X", url: "https://x.com/sleekydevs" },
    { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61565977402117" },
  ],
  footerTagline: "Websites, apps and automation for ambitious businesses in Nigeria and beyond.",
};
