import i18n from "../localization/i18n";
import { GOOGLE_SIGN_IN_ERROR } from "./googleAuthErrors";

export function getGoogleSignInErrorMessage(errorKey) {
  switch (errorKey) {
    case GOOGLE_SIGN_IN_ERROR.CANCELLED:
      return null;
    case GOOGLE_SIGN_IN_ERROR.NOT_CONFIGURED:
      return i18n.t("auth.googleNotConfigured");
    case GOOGLE_SIGN_IN_ERROR.NETWORK:
      return i18n.t("errors.networkError");
    case GOOGLE_SIGN_IN_ERROR.PLAY_SERVICES:
      return i18n.t("auth.googlePlayServicesUnavailable");
    case GOOGLE_SIGN_IN_ERROR.IN_PROGRESS:
      return i18n.t("auth.googleSignInInProgress");
    case GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD:
      return i18n.t("auth.googleAccountExistsWithPassword");
    case GOOGLE_SIGN_IN_ERROR.POPUP_BLOCKED:
      return i18n.t("auth.googlePopupBlocked");
    default:
      return i18n.t("auth.googleSignInFailed");
  }
}
