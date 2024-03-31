import { z } from 'zod';

import { PROTECTED_TEAM_URLS } from '@documenso/lib/constants/teams';
import { ZBaseTableSearchParamsSchema } from '@documenso/lib/types/search-params';
import { OrganisationMemberRole } from '@documenso/prisma/client';

/**
 * Restrict team URLs schema.
 *
 * Allowed characters:
 * - Alphanumeric
 * - Lowercase
 * - Dashes
 * - Underscores
 *
 * Conditions:
 * - 3-30 characters
 * - Cannot start and end with underscores or dashes.
 * - Cannot contain consecutive underscores or dashes.
 * - Cannot be a reserved URL in the PROTECTED_TEAM_URLS list
 */
// Todo: Orgs - Resuse from teams
export const ZTeamUrlSchema = z
  .string()
  .trim()
  .min(3, { message: 'Team URL must be at least 3 characters long.' })
  .max(30, { message: 'Team URL must not exceed 30 characters.' })
  .toLowerCase()
  .regex(/^[a-z0-9].*[^_-]$/, 'Team URL cannot start or end with dashes or underscores.')
  .regex(/^(?!.*[-_]{2})/, 'Team URL cannot contain consecutive dashes or underscores.')
  .regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    'Team URL can only contain letters, numbers, dashes and underscores.',
  )
  .refine((value) => !PROTECTED_TEAM_URLS.includes(value), {
    message: 'This URL is already in use.',
  });

export const ZTeamNameSchema = z
  .string()
  .trim()
  .min(3, { message: 'Team name must be at least 3 characters long.' })
  .max(30, { message: 'Team name must not exceed 30 characters.' });

export const ZAcceptTeamInvitationMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZCreateTeamBillingPortalMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZCreateOrganisationMutationSchema = z.object({
  organisationName: ZTeamNameSchema,
  organisationUrl: ZTeamUrlSchema,
});

export const ZCreateTeamEmailVerificationMutationSchema = z.object({
  organisationId: z.string(),
  name: z.string().trim().min(1, { message: 'Please enter a valid name.' }),
  email: z.string().trim().email().toLowerCase().min(1, 'Please enter a valid email.'),
});

export const ZCreateOrganisationMemberInvitesMutationSchema = z.object({
  organisationId: z.string(),
  invitations: z.array(
    z.object({
      email: z.string().email().toLowerCase(),
      role: z.nativeEnum(OrganisationMemberRole),
    }),
  ),
});

export const ZCreateTeamPendingCheckoutMutationSchema = z.object({
  interval: z.union([z.literal('monthly'), z.literal('yearly')]),
  pendingTeamId: z.number(),
});

export const ZDeleteTeamEmailMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZDeleteTeamEmailVerificationMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZDeleteOrganisationMembersMutationSchema = z.object({
  organisationId: z.string(),
  memberIds: z.array(z.string()),
});

export const ZDeleteOrganisationMemberInvitationsMutationSchema = z.object({
  organisationId: z.string(),
  invitationIds: z.array(z.string()),
});

export const ZDeleteTeamMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZDeleteTeamPendingMutationSchema = z.object({
  pendingTeamId: z.number(),
});

export const ZDeleteTeamTransferRequestMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZFindTeamInvoicesQuerySchema = z.object({
  organisationId: z.string(),
});

export const ZFindOrganisationMemberInvitesQuerySchema = ZBaseTableSearchParamsSchema.extend({
  organisationId: z.string(),
});

export const ZFindOrganisationMembersQuerySchema = ZBaseTableSearchParamsSchema.extend({
  organisationId: z.string(),
});

export const ZFindOrganisationsQuerySchema = ZBaseTableSearchParamsSchema;

export const ZGetTeamQuerySchema = z.object({
  organisationId: z.string(),
});

export const ZGetTeamMembersQuerySchema = z.object({
  organisationId: z.string(),
});

export const ZLeaveOrganisationMutationSchema = z.object({
  organisationId: z.string(),
});

export const ZUpdateOrganisationMutationSchema = z.object({
  organisationId: z.string(),
  data: z.object({
    name: ZTeamNameSchema, // Todo: Orgs
    url: ZTeamUrlSchema,
  }),
});

export const ZUpdateTeamEmailMutationSchema = z.object({
  organisationId: z.string(),
  data: z.object({
    name: z.string().trim().min(1),
  }),
});

export const ZUpdateOrganisationMemberMutationSchema = z.object({
  organisationId: z.string(),
  organisationMemberId: z.string(),
  data: z.object({
    role: z.nativeEnum(OrganisationMemberRole),
  }),
});

export const ZRequestTeamOwnerhsipTransferMutationSchema = z.object({
  organisationId: z.string(),
  newOwnerUserId: z.number(),
  clearPaymentMethods: z.boolean(),
});

export const ZResendOrganisationMemberInvitationMutationSchema = z.object({
  organisationId: z.string(),
  invitationId: z.string(),
});

export type TCreateOrganisationMemberInvitesMutationSchema = z.infer<
  typeof ZCreateOrganisationMemberInvitesMutationSchema
>;
