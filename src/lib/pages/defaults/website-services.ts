// Starting text for the six service pages, copied from the website (sleeky-website,
// design/revamp: src/lib/content/data/services.ts). Converted to page fields in ./services.ts.
// DRAFT COPY for five of the six services and several FAQ answers: see the note below.

export type WebsiteService = {
  slug: string;
  number: string;
  name: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  headline: { lines: string[]; accent: string };
  intro: string;
  ctaLabel: string;
  whatsappMessage: string;
  flow: { title: string; steps: string[]; note: string };
  problems: { intro: string; items: { title: string; description: string }[] };
  tools: { heading: string; body: string; items: string[]; extra: string };
  process: { lead: string; accent: string; steps: { title: string; description: string }[] };
  relatedWork?: { slug: string; blurb: string };
  faqHeading: string;
  faqs: { question: string; answer: string }[];
  ctaHeading: string[];
};


// Business Automation follows the approved design canvas word for word, except
// for three FAQ answers the canvas leaves as placeholders.
// DRAFT COPY: the other five services follow the same template with draft copy,
// and all FAQ answers are still "Open" in the brief (section 9). Sleeky should
// review and approve before launch. No prices or estimates anywhere (brief 4.1).

export const websiteServices: WebsiteService[] = [
  {
    slug: "business-automation",
    number: "01",
    name: "Business Automation",
    summary: "Connect your tools and remove repetitive admin — invoicing, CRM, approvals, reports.",
    metaTitle: "Business Automation in Lagos & Nigeria | Sleeky Programmers",
    metaDescription:
      "We connect the tools your business already uses and automate invoicing, leads, approvals and reports, so your team gets its hours back.",
    headline: { lines: ["Give your team", "its hours"], accent: "back." },
    intro:
      "We connect the tools your business already uses and remove the copying, chasing and re-typing between them — so invoices, leads, approvals and reports run themselves.",
    ctaLabel: "Start an automation project",
    whatsappMessage: "Hi Sleeky, I'd like to automate part of my business.",
    flow: {
      title: "A typical sale, automated",
      steps: ["New order", "CRM updated", "Invoice sent", "Paid? Receipt", "Report built"],
      note: "0 manual steps",
    },
    problems: {
      intro: "These are the jobs we take off your team's plate first.",
      items: [
        { title: "Re-typing the same data", description: "Orders, customer details and stock copied between WhatsApp, spreadsheets and your accounting tool." },
        { title: "Chasing invoices", description: "Invoices sent late, payments matched by hand, reminders that depend on someone remembering." },
        { title: "Leads lost in chats", description: "Enquiries scattered across WhatsApp, Instagram and email with no follow-up record." },
        { title: "Reports built by hand", description: "Hours every week pulling numbers together before anyone can make a decision." },
        { title: "Approvals stuck in inboxes", description: "Expenses, discounts and purchase requests waiting on the right person to see them." },
        { title: "Stock surprises", description: "Running out because nobody saw the levels drop until a customer asked." },
      ],
    },
    tools: {
      heading: "We work with the tools you already have.",
      body: "No need to replace your systems. We wire them together and fill the gaps with custom software where off-the-shelf tools stop.",
      items: ["HubSpot", "Zoho Books", "Google Workspace", "Microsoft 365", "Paystack", "Flutterwave", "WhatsApp Business", "Slack", "Airtable", "Excel & Google Sheets"],
      extra: "+ your custom systems",
    },
    process: {
      lead: "How an automation",
      accent: "project runs",
      steps: [
        { title: "Process audit", description: "We map how work moves today and find the steps worth removing first." },
        { title: "Flow design", description: "You approve exactly what triggers what before anything is built." },
        { title: "Build and test", description: "We connect the systems and test with your real data, step by step." },
        { title: "Run and improve", description: "Monitoring, monthly reports and new automations as your business grows." },
      ],
    },
    relatedWork: {
      slug: "votely",
      blurb: "Performance voting that replaced manual award and evaluation cycles with live progress and results.",
    },
    faqHeading: "Automation questions",
    faqs: [
      {
        question: "What can you automate in my business?",
        // DRAFT answer (placeholder on the canvas)
        answer:
          "Common starting points are invoicing and payment reminders, lead follow-up, reporting, approvals, inventory alerts and customer onboarding. On the discovery call we look at how work moves through your team and pick the steps that save the most time first.",
      },
      {
        question: "Do I need to change the software I already use?",
        answer: "Usually not. We connect the tools you already have and only build custom software where they fall short.",
      },
      {
        question: "How long does an automation project take?",
        // DRAFT answer (placeholder on the canvas)
        answer:
          "It depends on how many tools are involved and how much of the process we automate. After the discovery call we agree a clear plan and timeline in your proposal before any work starts.",
      },
      {
        question: "What happens if something breaks?",
        // DRAFT answer (placeholder on the canvas)
        answer:
          "We build in monitoring and error alerts, so the right person is notified and nothing fails silently. Ongoing support is agreed in your proposal, and every automation we set up is documented.",
      },
    ],
    ctaHeading: ["What should", "run itself?"],
  },
  {
    slug: "websites",
    number: "02",
    name: "Websites",
    summary: "Fast, search-optimised sites that look premium and turn visitors into enquiries.",
    metaTitle: "Website Design in Lagos & Nigeria | Sleeky Programmers",
    metaDescription:
      "Premium, fast and search-optimised websites for businesses in Lagos and across Nigeria, built to turn visitors into enquiries.",
    headline: { lines: ["Websites that", "bring in"], accent: "enquiries." },
    intro:
      "Fast, search-optimised websites that make a premium first impression and turn visitors into enquiries — on WhatsApp, by phone or through your forms.",
    ctaLabel: "Start a website project",
    whatsappMessage: "Hi Sleeky, I'd like to discuss a new website.",
    flow: {
      title: "A visitor, converted",
      steps: ["Google search", "Fast page", "Enquiry sent", "Lead in CRM", "Follow-up"],
      note: "Every lead tracked",
    },
    problems: {
      intro: "These are the problems a new website should solve first.",
      items: [
        { title: "Looks dated next to competitors", description: "First impressions decide whether a visitor trusts you enough to get in touch." },
        { title: "Hard to find on Google", description: "One generic page can't rank for the services your customers are searching for." },
        { title: "Visitors don't get in touch", description: "No clear next step, so people leave without calling, messaging or filling a form." },
        { title: "Slow on mobile data", description: "Heavy pages that take too long to load on the phones most of your visitors use." },
        { title: "Can't update it yourself", description: "Every change waits on a developer, so the site falls out of date." },
        { title: "No idea where leads come from", description: "Without tracking, you can't tell which pages and channels actually bring business." },
      ],
    },
    tools: {
      heading: "Built on tools that grow with you.",
      body: "Modern, fast technology, a content system your team can edit, and analytics wired in from day one.",
      items: ["Next.js", "React", "Sanity CMS", "Google Analytics 4", "Search Console", "HubSpot", "WhatsApp Business", "Vercel"],
      extra: "+ your existing domain and email",
    },
    process: {
      lead: "How a website",
      accent: "project runs",
      steps: [
        { title: "Discover", description: "We learn your business, your customers and what the site needs to achieve." },
        { title: "Design", description: "Clickable designs you approve before any code is written." },
        { title: "Build", description: "Fast, search-ready pages, built and tested on real phones." },
        { title: "Launch and grow", description: "Go-live, training on your content system and monthly analytics." },
      ],
    },
    relatedWork: { slug: "tiqwa-travels", blurb: "Website development for a travel brand." },
    faqHeading: "Website questions",
    faqs: [
      {
        question: "Can you redesign our existing website?",
        answer: "Yes. We review what's working on your current site, protect your search rankings with proper redirects, and rebuild it to a higher standard.",
      },
      {
        question: "Will we be able to update the website ourselves?",
        answer: "Yes. We set up a content management system and show your team how to edit pages and publish articles.",
      },
      {
        question: "Do you help with getting found on Google?",
        answer:
          "Every site we build follows search best practice: fast pages, clean URLs, page titles and descriptions, structured data and a sitemap submitted to Google Search Console.",
      },
    ],
    ctaHeading: ["Ready for a site", "that sells?"],
  },
  {
    slug: "web-apps",
    number: "03",
    name: "Web Apps",
    summary: "Dashboards, portals and platforms built to scale with your operations.",
    metaTitle: "Web App Development in Lagos & Nigeria | Sleeky Programmers",
    metaDescription:
      "Custom web apps, dashboards, customer portals and internal tools, designed around how your business runs and engineered to scale.",
    headline: { lines: ["Software built", "around how you"], accent: "work." },
    intro:
      "Dashboards, portals and platforms designed around how your business actually runs — and engineered to scale as it grows.",
    ctaLabel: "Start a web app project",
    whatsappMessage: "Hi Sleeky, I'd like to discuss a web app.",
    flow: {
      title: "A request, end to end",
      steps: ["Portal login", "Request made", "Team alerted", "Status live", "Report ready"],
      note: "One shared system",
    },
    problems: {
      intro: "Signs you've outgrown spreadsheets and off-the-shelf tools.",
      items: [
        { title: "Spreadsheets everywhere", description: "Critical operations running on files that break, get overwritten or go out of date." },
        { title: "No single source of truth", description: "Different teams working from different numbers, and nobody sure which is right." },
        { title: "Customers calling for updates", description: "Your team answering status questions a customer portal could answer on its own." },
        { title: "Software that doesn't fit", description: "Paying for tools your team works around instead of with." },
        { title: "Manual approvals", description: "Requests passed around by email and chat with no record of who approved what." },
        { title: "No view of performance", description: "Decisions made on gut feel because the data is hard to see." },
      ],
    },
    tools: {
      heading: "Engineered on proven foundations.",
      body: "Secure, well-tested technology chosen to scale with your users — and connected to the systems you already run.",
      items: ["React", "Next.js", "Node.js", "PostgreSQL", "REST & GraphQL APIs", "Paystack", "Flutterwave", "Google Cloud", "AWS", "Vercel"],
      extra: "+ your existing systems",
    },
    process: {
      lead: "How a web app",
      accent: "project runs",
      steps: [
        { title: "Discover", description: "We map your users, roles and the workflows the app has to support." },
        { title: "Design", description: "A clickable prototype you test and approve before development starts." },
        { title: "Build", description: "Weekly demos, clear milestones and a shared progress board." },
        { title: "Launch and support", description: "Go-live, training, monitoring and new features as you grow." },
      ],
    },
    relatedWork: {
      slug: "votely",
      blurb: "Performance voting that replaced manual award and evaluation cycles with live progress and results.",
    },
    faqHeading: "Web app questions",
    faqs: [
      {
        question: "How do you keep a project on track?",
        answer: "We agree clear milestones, demo progress every week and share a progress board, so you always know what's done and what's next.",
      },
      {
        question: "Can the app grow with us?",
        answer: "Yes. We design the architecture with growth in mind, so new features, users and integrations can be added without starting again.",
      },
      {
        question: "Who owns the finished product?",
        answer: "Ownership and handover terms are agreed in the proposal before work starts, so you know exactly what you receive.",
      },
    ],
    ctaHeading: ["What should we", "build for you?"],
  },
  {
    slug: "mobile-apps",
    number: "04",
    name: "Mobile Apps",
    summary: "iOS and Android apps customers keep on their phones.",
    metaTitle: "Mobile App Development in Nigeria | Sleeky Programmers",
    metaDescription:
      "iOS and Android app development for businesses in Lagos and across Nigeria: designed for real users, reliable on real networks, supported after launch.",
    headline: { lines: ["Apps people", "keep on their"], accent: "phones." },
    intro:
      "iOS and Android apps that are simple to use, dependable on real-world networks and supported long after launch.",
    ctaLabel: "Start a mobile app project",
    whatsappMessage: "Hi Sleeky, I'd like to discuss a mobile app.",
    flow: {
      title: "A customer, retained",
      steps: ["App installed", "Signs up", "Books or buys", "Notified", "Comes back"],
      note: "Built for repeat use",
    },
    problems: {
      intro: "Where a mobile app makes the biggest difference.",
      items: [
        { title: "Bookings by phone and chat", description: "Customers waiting on replies when they could book or buy in a few taps." },
        { title: "No way to reach customers", description: "Offers and updates lost in crowded inboxes instead of a direct notification." },
        { title: "Loyalty you can't measure", description: "No record of who comes back, how often, or what keeps them returning." },
        { title: "A website squeezed onto a phone", description: "Everyday tasks that are awkward on a small screen." },
        { title: "Unreliable networks", description: "Apps that fail when the connection drops instead of saving progress." },
        { title: "Teams in the field", description: "Staff on the move with no simple way to log work or see what's next." },
      ],
    },
    tools: {
      heading: "Native quality, one codebase.",
      body: "Cross-platform where it saves time, native where it matters — connected to your payments, CRM and back office.",
      items: ["React Native", "Expo", "iOS", "Android", "Firebase", "Push notifications", "Paystack", "Flutterwave", "App Store", "Google Play"],
      extra: "+ your existing platform",
    },
    process: {
      lead: "How a mobile app",
      accent: "project runs",
      steps: [
        { title: "Discover", description: "We learn who will use the app, where and on which devices." },
        { title: "Design", description: "Flows tested with real users, approved by you before development." },
        { title: "Build", description: "Weekly builds on real phones, with clear milestones." },
        { title: "Launch and grow", description: "App store submission, analytics and a plan for updates." },
      ],
    },
    faqHeading: "Mobile app questions",
    faqs: [
      {
        question: "Do you build for both iOS and Android?",
        answer: "Yes. We usually build both from one codebase, which keeps the apps consistent and easier to maintain.",
      },
      {
        question: "Can you help publish the app?",
        answer: "Yes. We prepare the store listings and handle submission and review for the App Store and Google Play.",
      },
      {
        question: "Can the app connect to our existing systems?",
        answer: "Yes. We integrate with your website, CRM, payment provider or any system with an API.",
      },
    ],
    ctaHeading: ["Put your business", "in their pocket."],
  },
  {
    slug: "api-integrations",
    number: "05",
    name: "API Integrations",
    summary: "Payments, logistics, banking and third-party systems, wired together reliably.",
    metaTitle: "API Integrations in Lagos & Nigeria | Sleeky Programmers",
    metaDescription:
      "Reliable API integrations for payments, banking, logistics and third-party systems, built and monitored by our engineering team in Lagos.",
    headline: { lines: ["Your systems,", "finally"], accent: "connected." },
    intro:
      "Payments, banking, logistics and third-party services wired together securely — so data moves on its own and your team stops re-entering it.",
    ctaLabel: "Start an integration project",
    whatsappMessage: "Hi Sleeky, I'd like to discuss an API integration.",
    flow: {
      title: "A payment, reconciled",
      steps: ["Customer pays", "Payment OK", "Books updated", "Receipt sent", "Report synced"],
      note: "No re-keying",
    },
    problems: {
      intro: "These are the gaps between systems we close first.",
      items: [
        { title: "The same data, entered twice", description: "Orders and customer details re-typed from one system into another." },
        { title: "Payments matched by hand", description: "Hours spent reconciling transactions against invoices and bank statements." },
        { title: "Systems that don't talk", description: "Your CRM, accounts and operations tools each holding part of the picture." },
        { title: "Partners asking for an API", description: "Deals slowed down because partners can't connect to your platform." },
        { title: "Fragile integrations", description: "Connections that break quietly when a provider changes something." },
        { title: "No alerts when things fail", description: "Problems discovered by customers before your team knows about them." },
      ],
    },
    tools: {
      heading: "We integrate with the services your business runs on.",
      body: "Payment, banking, messaging and business tools used in Nigeria and internationally — plus custom APIs where none exist.",
      items: ["Paystack", "Flutterwave", "Monnify", "Mono", "Termii", "WhatsApp Business API", "HubSpot", "Zoho Books", "QuickBooks", "Google Sheets"],
      extra: "+ any service with an API",
    },
    process: {
      lead: "How an integration",
      accent: "project runs",
      steps: [
        { title: "Map the data", description: "We document what moves between which systems, and when." },
        { title: "Design the flow", description: "You approve the triggers, mappings and error handling." },
        { title: "Build and test", description: "Built against sandbox and real data, with edge cases covered." },
        { title: "Monitor", description: "Logging and alerts so issues are caught before customers notice." },
      ],
    },
    relatedWork: { slug: "straitpay", blurb: "Admin dashboard for payments operations." },
    faqHeading: "Integration questions",
    faqs: [
      {
        question: "Can you integrate with a service that has poor documentation?",
        answer: "Often, yes. We test the API thoroughly and build in safeguards for the edge cases the documentation misses.",
      },
      {
        question: "How do you keep integrations secure?",
        answer: "We store keys securely, use least-privilege access and validate every request, following each provider's security guidance.",
      },
      {
        question: "What happens when a provider changes their API?",
        answer: "Monitoring alerts us to failures, and we can maintain your integrations as providers release new versions.",
      },
    ],
    ctaHeading: ["What should", "talk to what?"],
  },
  {
    slug: "branding",
    number: "06",
    name: "Branding",
    summary: "Identity and visual systems that make you look as good as your work.",
    metaTitle: "Branding & Identity in Lagos & Nigeria | Sleeky Programmers",
    metaDescription:
      "Logo, brand identity and visual systems for businesses in Lagos and across Nigeria, designed to make you look as good as your work.",
    headline: { lines: ["Look as good", "as your"], accent: "work." },
    intro:
      "Identity and visual systems that make your business recognisable, credible and consistent everywhere it shows up.",
    ctaLabel: "Start a branding project",
    whatsappMessage: "Hi Sleeky, I'd like to discuss branding.",
    flow: {
      title: "A brand, rolled out",
      steps: ["Discovery", "Concepts", "Identity", "Guidelines", "Rollout"],
      note: "One consistent look",
    },
    problems: {
      intro: "Signs it's time for a new identity.",
      items: [
        { title: "Inconsistent everywhere", description: "Your website, socials and documents all look like different companies." },
        { title: "A logo that doesn't scale", description: "Hard to read on a phone, blurry in print, or unusable on dark backgrounds." },
        { title: "You've outgrown it", description: "The look you started with no longer matches the quality of your work." },
        { title: "Clients judge on looks", description: "Prospects compare you with competitors before they ever speak to you." },
        { title: "Designs made up on the spot", description: "Every new flyer or post starts from scratch, with no rules to follow." },
        { title: "No brand guide", description: "Partners and new hires guessing at colours, fonts and logo use." },
      ],
    },
    tools: {
      heading: "Everything your brand needs to show up well.",
      body: "From logo to templates, we deliver files and guidance your team and partners can use straight away.",
      items: ["Logo suite", "Colour palette", "Typography", "Brand guide", "Social templates", "Presentation templates", "Email signatures", "Stationery"],
      extra: "+ website design",
    },
    process: {
      lead: "How a branding",
      accent: "project runs",
      steps: [
        { title: "Discover", description: "We learn your story, audience and competitors." },
        { title: "Concepts", description: "Distinct directions to react to, each with its reasoning." },
        { title: "Refine", description: "We develop your chosen direction into a full identity." },
        { title: "Deliver", description: "Final files, a brand guide and templates your team can use." },
      ],
    },
    faqHeading: "Branding questions",
    faqs: [
      {
        question: "Can you refresh our existing brand rather than replace it?",
        answer: "Yes. We can evolve your current identity, keeping the recognition you've built while modernising how it looks.",
      },
      {
        question: "What files will we receive?",
        answer: "Logo files in vector and image formats for print and digital, plus a brand guide and any templates agreed in the proposal.",
      },
      {
        question: "Can you design our website as well?",
        answer: "Yes. Many clients pair branding with a new website so both launch together and feel consistent.",
      },
    ],
    ctaHeading: ["Ready to", "stand out?"],
  },
];
