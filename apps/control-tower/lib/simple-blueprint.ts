export type BlueprintPricing = {
  perLaunch: string;
  monthlyTower: string;
  priceSource: string;
};

export type BlueprintItem = {
  id: string;
  project: string;
  problem: string;
  solutionSteps: [string, string, string];
  buildList: [string, string, string];
  timeLabel: string;
  timeSource: string;
  pricing: BlueprintPricing;
  sourceLabel: string;
  sourceDetails: string[];
  missingSource: boolean;
  missingSourceReason: string | null;
  missingItems: string[];
  originalMessage: string;
  revisionCount: number;
};

export type ProofRecord = {
  proofId: string;
  workflowId: string;
  startedAtIso: string;
  plannedSummary: string;
  plannedSteps: [string, string, string];
  approvedBuildList: [string, string, string];
  approvedPrice: string;
  approvedTime: string;
  sourceLabel: string;
  sourceDetails: string[];
  buildingNow: Array<{ item: string; status: string }>;
  originalMessage: string;
};

export const QUICK_EXAMPLES = [
  "Launch my new project",
  "Follow up my site visit leads",
  "Create brochure and posts",
] as const;

export const CHAT_PLACEHOLDER =
  "Example: My launch campaign is late. I need brochure, posts, and follow up for my new project in Dubai.";

export const JARGON_FORBIDDEN_WORDS = [
  "orchestrator",
  "ag-ui",
  "cmo graph",
  "bucket",
  "control plane",
  "execution plane",
] as const;

const KNOWN_UAE_LOCATIONS = [
  "Dubai Creek Harbour",
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Palm Jebel Ali",
  "Business Bay",
  "JVC",
  "Jumeirah Village Circle",
  "Dubai Hills",
  "Emaar Beachfront",
  "Dubai Harbour",
  "Saadiyat Island",
  "Yas Island",
  "Abu Dhabi",
  "Sharjah",
  "Ras Al Khaimah",
  "Dubai",
  "UAE",
];

function extractExplicitLocation(text: string): string | null {
  const lower = text.toLowerCase();
  for (const loc of KNOWN_UAE_LOCATIONS) {
    if (lower.includes(loc.toLowerCase())) {
      return loc;
    }
  }
  return null;
}

function hasExplicitSourceAttribution(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\bsource\s*[:=-]/i.test(text) ||
    /\bprovided by\b/i.test(lower) ||
    /\bfrom (our|my|the) (brochure|pdf|sheet|file|price list|rera|sales team|developer|fact sheet)\b/i.test(
      lower,
    ) ||
    /\bdeveloper (sheet|pdf|brochure|confirmed|data|file)\b/i.test(lower) ||
    /\brera\b/i.test(lower) ||
    /\bdld\b/i.test(lower)
  );
}

/**
 * Strictly checks whether the developer asked to include factual claims
 * (property price, possession/handover date, offer/payment plan, or location)
 * without supplying a verifiable source. Never guesses or invents values.
 */
export function detectMissingSources(text: string): {
  missingSource: boolean;
  missingItems: string[];
  reason: string | null;
} {
  const lower = text.toLowerCase();
  const hasSource = hasExplicitSourceAttribution(text);
  const missingItems: string[] = [];

  const mentionsPropertyPrice =
    /\b(unit price|starting price|property price|price per sqft|sqft price|villa price|apartment price|pricing for (the |my |our )?(units?|tower|project|villas?|apartments?)|include (the )?price|add (the )?price|with price)\b/i.test(
      lower,
    );
  const hasAedNumber = /\baed\s*[\d,.]+/i.test(lower);

  const mentionsPossessionOrDate =
    /\b(possession date|handover date|completion date|launch date|delivery date|handover|possession)\b/i.test(
      lower,
    );
  const hasExplicitDateValue =
    /\b(q[1-4]\s*20\d{2}|20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(
      lower,
    );

  const mentionsOfferOrPlan =
    /\b(payment plan|special offer|launch offer|discount|post[- ]handover|free dld|waiver|offer)\b/i.test(
      lower,
    );
  const hasExplicitOfferValue = /\b\d{1,2}\s*\/\s*\d{1,2}\b|\b\d+%\b/.test(lower);

  if (mentionsPropertyPrice && (!hasAedNumber || !hasSource)) {
    missingItems.push("unit price");
  }
  if (mentionsPossessionOrDate && (!hasExplicitDateValue || !hasSource)) {
    missingItems.push("handover / possession date");
  }
  if (mentionsOfferOrPlan && (!hasExplicitOfferValue || !hasSource)) {
    missingItems.push("offer / payment plan");
  }

  // Direct question asking LUXOR9 to guess/invent a price, date, or location
  const asksToGuess =
    /\b(what is the|give me a|guess|estimate|make up|suggest a)\s+(price|possession date|handover date|launch date|offer|location)\b/i.test(
      lower,
    );
  if (asksToGuess && !hasSource) {
    if (!missingItems.length) {
      missingItems.push("verified project details");
    }
  }

  if (missingItems.length > 0) {
    return {
      missingSource: true,
      missingItems,
      reason: `Source needed. Please give source for: ${missingItems.join(", ")}. We never guess prices, dates, offers, or locations.`,
    };
  }

  return {
    missingSource: false,
    missingItems: [],
    reason: null,
  };
}

function cleanOneLineProblem(raw: string, fallback: string): string {
  const single = raw.replace(/\s+/g, " ").trim();
  if (!single) return fallback;
  const firstSentence = single.split(/[.!?]/)[0]?.trim() || single;
  return firstSentence.length > 95 ? `${firstSentence.slice(0, 92).trim()}...` : firstSentence;
}

export function buildSimpleBlueprint(
  message: string,
  previous?: BlueprintItem | null,
): BlueprintItem {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const combinedText = previous ? `${previous.originalMessage}\n${trimmed}` : trimmed;
  const location = extractExplicitLocation(combinedText);
  const sourceCheck = detectMissingSources(combinedText);

  const isExactDemoLaunch =
    lower === "launch my new project" ||
    (lower.includes("launch") && (lower.includes("late") || lower.includes("new project")));

  const isLeadsFollowUp =
    lower.includes("lead") || lower.includes("site visit") || lower.includes("follow up my");

  const isBrochureAndPosts =
    (lower.includes("brochure") || lower.includes("posts")) && !isExactDemoLaunch && !isLeadsFollowUp;

  const baseId = previous?.id ?? `bp_${Date.now()}`;
  const revisionCount = previous ? previous.revisionCount + 1 : 1;

  // Standard LUXOR9 service pricing — always explicitly attributed to source
  const standardPricing: BlueprintPricing = {
    perLaunch: "AED 2,500 per launch",
    monthlyTower: "AED 1,500 per month",
    priceSource: "LUXOR9 standard service rate card",
  };

  let project = location ? `New Project in ${location}` : "Example Launch in Dubai";
  let problem = "Launch campaign is late";
  let solutionSteps: [string, string, string] = [
    "Make brochure text",
    "Make 10 posts",
    "Make follow up messages",
  ];
  let buildList: [string, string, string] = ["Brochure", "Posts", "Follow up"];
  let timeLabel = "Ready in 3 days";

  if (previous) {
    // Applying a user-requested change to an existing blueprint
    project = location ? `Project in ${location}` : previous.project;
    problem = previous.problem;
    solutionSteps = [...previous.solutionSteps] as [string, string, string];
    buildList = [...previous.buildList] as [string, string, string];
    timeLabel = previous.timeLabel;

    if (lower.includes("arabic")) {
      if (!solutionSteps[0].toLowerCase().includes("arabic")) {
        solutionSteps[0] = `${solutionSteps[0]} (English + Arabic)`;
      }
      if (!buildList[0].toLowerCase().includes("en + ar")) {
        buildList[0] = `${buildList[0]} (EN + AR)`;
      }
    }
    const postMatch = trimmed.match(/\b(\d{1,2})\s+posts?\b/i);
    if (postMatch) {
      solutionSteps[1] = `Make ${postMatch[1]} posts`;
      buildList[1] = `${postMatch[1]} posts`;
    }
    if (lower.includes("whatsapp")) {
      solutionSteps[2] = "Make WhatsApp follow up messages";
      buildList[2] = "WhatsApp follow up";
    }
    if (
      !lower.includes("arabic") &&
      !postMatch &&
      !lower.includes("whatsapp") &&
      !hasExplicitSourceAttribution(trimmed)
    ) {
      solutionSteps[2] = cleanOneLineProblem(trimmed, solutionSteps[2]);
    }
  } else if (isExactDemoLaunch) {
    project = location && location !== "Dubai" ? `Example Launch in ${location}` : "Example Launch in Dubai";
    problem = lower.includes("late") ? "Launch campaign is late" : "Launch campaign is late";
    solutionSteps = [
      "Make brochure text",
      "Make 10 posts",
      "Make follow up messages",
    ];
    buildList = ["Brochure", "Posts", "Follow up"];
    timeLabel = "Ready in 3 days";
  } else if (isLeadsFollowUp) {
    project = location ? `Site Visit Follow-Up — ${location}` : "Developer Site Visit Leads";
    problem = cleanOneLineProblem(trimmed, "Site visit leads are not followed up fast enough");
    solutionSteps = [
      "Send WhatsApp thank-you message within 5 minutes of each visit",
      "Send 3 clear follow-up messages over 7 days",
      "Alert your sales team when a buyer replies",
    ];
    buildList = [
      "Instant WhatsApp follow-up",
      "7-day buyer message sequence",
      "Hot buyer alert for sales team",
    ];
    timeLabel = "Ready in 2 days";
  } else if (isBrochureAndPosts) {
    project = location ? `Brochure & Posts — ${location}` : "Developer Brochure & Social Pack";
    problem = cleanOneLineProblem(trimmed, "Need brochure and social posts ready fast");
    solutionSteps = [
      "Write clear English brochure text from your approved facts",
      "Create 10 ready-to-post Instagram and LinkedIn updates",
      "Prepare matching WhatsApp share text for brokers",
    ];
    buildList = [
      "Project brochure text",
      "10 social media posts",
      "Broker WhatsApp share pack",
    ];
    timeLabel = "Ready in 3 days";
  } else {
    // Custom problem — strictly reflect only what the developer wrote; never invent location
    project = location ? `Project in ${location}` : "Your Real Estate Project";
    problem = cleanOneLineProblem(trimmed, "Real estate marketing and follow-up needs automation");
    solutionSteps = [
      "Turn your brief and approved facts into clear sales copy",
      "Prepare ready-to-publish marketing posts and brochure text",
      "Set up fast buyer follow-up messages for your team",
    ];
    buildList = ["Brochure text", "Marketing posts", "Buyer follow-up messages"];
    timeLabel = "Ready in 3 days";
  }

  const developerSourceLine = hasExplicitSourceAttribution(combinedText)
    ? `Provided by developer (${trimmed.slice(0, 90)})`
    : "Provided by developer";

  const sourceDetails = sourceCheck.missingSource
    ? [
        "Service fee: LUXOR9 standard service rate card",
        "Delivery time: LUXOR9 standard delivery schedule",
        `Missing project facts: ${sourceCheck.missingItems.join(", ")} — Source needed`,
      ]
    : [
        `Project brief: ${developerSourceLine}`,
        `Service fee: ${standardPricing.priceSource}`,
        "Delivery time: LUXOR9 standard delivery schedule",
      ];

  return {
    id: baseId,
    project,
    problem,
    solutionSteps,
    buildList,
    timeLabel,
    timeSource: "LUXOR9 standard delivery schedule",
    pricing: standardPricing,
    sourceLabel: sourceCheck.missingSource
      ? "Source needed. Please give source."
      : "Provided by developer",
    sourceDetails,
    missingSource: sourceCheck.missingSource,
    missingSourceReason: sourceCheck.reason,
    missingItems: sourceCheck.missingItems,
    originalMessage: combinedText,
    revisionCount,
  };
}

export function buildProofRecord(
  blueprint: BlueprintItem,
  workflowId: string,
  startedAtIso: string,
): ProofRecord {
  return {
    proofId: `PROOF-${workflowId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
    workflowId,
    startedAtIso,
    plannedSummary: `${blueprint.project} — ${blueprint.problem}`,
    plannedSteps: blueprint.solutionSteps,
    approvedBuildList: blueprint.buildList,
    approvedPrice: `${blueprint.pricing.perLaunch} (or ${blueprint.pricing.monthlyTower} Monthly Tower)`,
    approvedTime: `${blueprint.timeLabel} (${blueprint.timeSource})`,
    sourceLabel: blueprint.sourceLabel,
    sourceDetails: blueprint.sourceDetails,
    buildingNow: blueprint.buildList.map((item, idx) => ({
      item,
      status: idx === 0 ? "In progress now" : "Queued next",
    })),
    originalMessage: blueprint.originalMessage,
  };
}
