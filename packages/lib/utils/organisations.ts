import { WEBAPP_BASE_URL } from '../constants/app';
import type { ORGANISATION_MEMBER_ROLE_MAP } from '../constants/organisations';
import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../constants/organisations';
import { ORGANISATION_MEMBER_ROLE_HIERARCHY } from '../constants/organisations';

export const formatOrganisationUrl = (orgUrl: string, baseUrl?: string) => {
  const formattedBaseUrl = (baseUrl ?? WEBAPP_BASE_URL).replace(/https?:\/\//, '');

  return `${formattedBaseUrl}/orgs/${orgUrl}`;
};

// Todo: Maybe share with teams?
export const formatDocumentsPathProto = ({
  orgUrl,
  teamUrl,
}: {
  orgUrl?: string;
  teamUrl?: string;
}) => {
  if (!orgUrl && !teamUrl) {
    throw new Error('Todo?');
  }

  return teamUrl ? `/orgs/${orgUrl}/t/${teamUrl}/documents` : `/orgs/${orgUrl}/documents`;
};

// Todo: Maybe share with teams?
export const formatDocumentsPath = (orgUrl: string, teamUrl?: string) => {
  return teamUrl ? `/orgs/${orgUrl}/t/${teamUrl}/documents` : `/orgs/${orgUrl}/documents`;
};

// Todo: Orgs - Common templates between teams?
export const formatTemplatesPath = (orgUrl: string, teamUrl?: string) => {
  return `/orgs/${orgUrl}/t/${teamUrl}/templates`;
};

/**
 * Determines whether an organisation member can execute a given action.
 *
 * @param action The action the user is trying to execute.
 * @param role The current role of the user.
 * @returns Whether the user can execute the action.
 */
export const canExecuteOrganisationAction = (
  action: keyof typeof ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP,
  role: keyof typeof ORGANISATION_MEMBER_ROLE_MAP,
) => {
  return ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP[action].some((i) => i === role);
};

/**
 * Compares the provided `currentUserRole` with the provided `roleToCheck` to determine
 * whether the `currentUserRole` has permission to modify the `roleToCheck`.
 *
 * @param currentUserRole Role of the current user
 * @param roleToCheck Role of another user to see if the current user can modify
 * @returns True if the current user can modify the other user, false otherwise
 *
 * Todo: Orgs
 */
export const isOrganisationRoleWithinUserHierarchy = (
  currentUserRole: keyof typeof ORGANISATION_MEMBER_ROLE_MAP,
  roleToCheck: keyof typeof ORGANISATION_MEMBER_ROLE_MAP,
) => {
  return ORGANISATION_MEMBER_ROLE_HIERARCHY[currentUserRole].some((i) => i === roleToCheck);
};
