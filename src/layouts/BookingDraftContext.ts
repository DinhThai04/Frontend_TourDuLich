import { createContext } from 'react';

export type BookingDraftController = {
  /** Explicit domain event: the booking draft now contains user changes worth guarding. */
  markDirty: () => void;
  /** Clear the guard after a successful submit or an allowed navigation. */
  clearDraft: () => void;
};

const noop = () => {};

export const BookingDraftContext = createContext<BookingDraftController>({
  markDirty: noop,
  clearDraft: noop,
});
