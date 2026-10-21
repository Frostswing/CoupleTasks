import React, { createContext, useContext } from "react";
import { useHouseholdPartner } from "../hooks/useHouseholdPartner";

const HouseholdPartnerContext = createContext(null);

export function HouseholdPartnerProvider({ children }) {
  const value = useHouseholdPartner();
  return (
    <HouseholdPartnerContext.Provider value={value}>{children}</HouseholdPartnerContext.Provider>
  );
}

/** Solo vs couple UI gating based on real partner_email / list-sharing. */
export function usePartnerMode() {
  const ctx = useContext(HouseholdPartnerContext);
  if (!ctx) {
    return {
      loading: false,
      isPartnered: false,
      profile: null,
      partnerEmail: null,
      partnerProfile: null,
      userFirstName: "",
      partnerFirstName: "",
      refresh: () => {},
    };
  }
  return ctx;
}
