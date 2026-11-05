export type AiStatus = 'RESULTS' | 'CLARIFICATION' | 'NO_RESULTS' | 'ANSWER' | 'OUT_OF_SCOPE';
export type AiCriteria = {
  region: 'NORTH' | 'CENTRAL' | 'SOUTH' | null;
  destinationId: number | null;
  originId: number | null;
  maxBudgetVnd: number | null;
  budgetScope: 'PER_ADULT' | 'TOTAL_GROUP' | null;
  departureFrom: string | null;
  departureTo: string | null;
  party: {
    adults: number | null;
    children: number | null;
    toddlers: number | null;
    infants: number | null;
    unclassifiedChildren: number | null;
  } | null;
  searchMode: 'BOOKABLE' | 'CATALOG';
};
export type AiTourCard = {
  tourId: number;
  tourProgram: string;
  title: string;
  destinationName: string;
  region: string;
  durationDays: number;
  imageUrl: string | null;
  detailPath: string;
  price: {
    amountVnd: number;
    currency: 'VND';
    basis: 'PER_ADULT' | 'TOTAL_GROUP';
    isEstimate: boolean;
    singleSupplementIncluded: boolean;
    checkedAt: string;
  };
  availability: {
    status: string;
    departureId: number | null;
    departureAt: string | null;
    availableSeats: number | null;
    checkedAt: string;
  };
};
export type AiDetail = {
  tourId: number;
  title: string;
  itinerary: { dayNumber: number; title: string; description: string; meal: string }[];
  dataAsOf: string;
  truncated: boolean;
};
export type AiComparison = {
  tourIds: number[];
  items: {
    tourId: number;
    title: string;
    durationDays: number;
    destinationName: string;
    referenceAdultPriceVnd: number;
    hasFutureDeparture: boolean;
  }[];
  dataAsOf: string;
};
export type AiPolicy = { policyKey: string; policyVersion: string; sourceLabel: string };
export type AiPolicyDocument = {
  version: string;
  sourceLabel: string;
  effectiveDate: string;
  scope: string;
  entries: {
    key: string;
    title: string;
    status: 'SUPPORTED' | 'PARTIAL' | 'NOT_IMPLEMENTED';
    keywords: string[];
    text: string;
  }[];
};
export type AiBookingHelp = {
  handled: boolean;
  reply: string;
  selectedBookingId: number | null;
  choices: { bookingId: number; tourTitle: string; departureAt: string | null; state: string }[];
  checkedAt: string | null;
  policy: AiPolicy | null;
};
export type AiSession = { conversationId: string; turnVersion: number; expiresAt: string };
export type AiResult = AiSession & {
  requestId: string;
  status: AiStatus;
  reply: string;
  criteria: AiCriteria;
  tours: AiTourCard[];
  clarification: {
    reason: string;
    fields: string[];
    question: string;
    suggestedReplies: string[];
  } | null;
  detail: AiDetail | null;
  comparison: AiComparison | null;
  policy: AiPolicy | null;
  searchSummary: {
    returnedCount: number;
    hasMore: boolean;
    matchingCatalogCount: number;
    matchingBookableCount: number;
    dataAsOf: string;
  } | null;
};
export type AiChatRequest = { conversationId: string; requestId: string; message: string };
export type AiMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
  result?: AiResult;
  bookingHelp?: AiBookingHelp;
};
