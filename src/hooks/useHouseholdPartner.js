import { useCallback, useEffect, useState } from "react";
import { User } from "../entities/User";
import { getCurrentUser, checkIfSharing } from "../services/userService";

function firstName(profile) {
  const raw = profile?.full_name || profile?.name || profile?.email || "";
  if (!raw) return "";
  if (raw.includes("@")) return raw.split("@")[0];
  return raw.split(" ")[0];
}

/**
 * Partnered when profile.partner_email is set OR Firebase list-sharing is active.
 */
export function useHouseholdPartner() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const authUser = getCurrentUser();
      const me = await User.me();
      setProfile(me);

      let shareResult = { success: true, isSharing: false };
      if (authUser?.uid) {
        shareResult = await checkIfSharing(authUser.uid);
        setSharing(shareResult);
      } else {
        setSharing(null);
      }

      let resolvedPartner = null;
      if (me?.partner_email) {
        try {
          resolvedPartner = await User.findByEmail(me.partner_email);
        } catch {
          resolvedPartner = { email: me.partner_email, full_name: me.partner_email };
        }
      } else if (shareResult?.isSharing && shareResult.sharingWith?.profile) {
        resolvedPartner = shareResult.sharingWith.profile;
      }
      setPartnerProfile(resolvedPartner);
    } catch (e) {
      console.error("useHouseholdPartner", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isSharingActive = !!sharing?.isSharing;
  const partnerEmail =
    profile?.partner_email ||
    partnerProfile?.email ||
    sharing?.sharingWith?.profile?.email ||
    null;

  const isPartnered = Boolean(partnerEmail || isSharingActive);

  const userFirstName = firstName(profile);
  const partnerFirstName = firstName(partnerProfile || sharing?.sharingWith?.profile);

  return {
    loading,
    profile,
    isPartnered,
    isSharingActive,
    partnerEmail,
    partnerProfile,
    userFirstName,
    partnerFirstName,
    refresh: load,
  };
}
