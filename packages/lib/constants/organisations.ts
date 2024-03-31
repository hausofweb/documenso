import { OrganisationMemberRole } from '@documenso/prisma/client';

export const ORGANISATION_URL_ROOT_REGEX = new RegExp('^/orgs/[^/]+$');
export const ORGANISATION_URL_REGEX = new RegExp('^/orgs/[^/]+');

export const ORGANISATION_MEMBER_ROLE_MAP: Record<keyof typeof OrganisationMemberRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

// Todo: Orgs
export const ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP = {
  MANAGE_ORGANISATION: [OrganisationMemberRole.ADMIN, OrganisationMemberRole.MANAGER],
  MANAGE_BILLING: [OrganisationMemberRole.ADMIN],
  DELETE_ORGANISATION_TRANSFER_REQUEST: [OrganisationMemberRole.ADMIN],
} satisfies Record<string, OrganisationMemberRole[]>;

/**
 * A hierarchy of member roles to determine which role has higher permission than another.
 */
export const ORGANISATION_MEMBER_ROLE_HIERARCHY = {
  [OrganisationMemberRole.ADMIN]: [
    OrganisationMemberRole.ADMIN,
    OrganisationMemberRole.MANAGER,
    OrganisationMemberRole.MEMBER,
  ],
  [OrganisationMemberRole.MANAGER]: [OrganisationMemberRole.MANAGER, OrganisationMemberRole.MEMBER],
  [OrganisationMemberRole.MEMBER]: [OrganisationMemberRole.MEMBER],
} satisfies Record<OrganisationMemberRole, OrganisationMemberRole[]>;
