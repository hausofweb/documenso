import { AppError } from '@documenso/lib/errors/app-error';
import { createOrganisation } from '@documenso/lib/server-only/organisation/create-organisation';
import { createOrganisationMemberInvites } from '@documenso/lib/server-only/organisation/create-organisation-member-invites';
import { deleteOrganisationMemberInvitations } from '@documenso/lib/server-only/organisation/delete-organisation-member-invitations';
import { deleteOrganisationMembers } from '@documenso/lib/server-only/organisation/delete-organisation-members';
import { findOrganisationMemberInvites } from '@documenso/lib/server-only/organisation/find-organisation-member-invites';
import { findOrganisationMembers } from '@documenso/lib/server-only/organisation/find-organisation-members';
import { findOrganisations } from '@documenso/lib/server-only/organisation/find-organisations';
import { leaveOrganisation } from '@documenso/lib/server-only/organisation/leave-organisation';
import { resendOrganisationMemberInvitation } from '@documenso/lib/server-only/organisation/resend-organisation-member-invitation';
import { updateOrganisation } from '@documenso/lib/server-only/organisation/update-organisation';
import { updateOrganisationMember } from '@documenso/lib/server-only/organisation/update-organisation-member';

import { authenticatedProcedure, router } from '../trpc';
import {
  ZCreateOrganisationMemberInvitesMutationSchema,
  ZCreateOrganisationMutationSchema,
  ZDeleteOrganisationMemberInvitationsMutationSchema,
  ZDeleteOrganisationMembersMutationSchema,
  ZFindOrganisationMemberInvitesQuerySchema,
  ZFindOrganisationMembersQuerySchema,
  ZFindOrganisationsQuerySchema,
  ZLeaveOrganisationMutationSchema,
  ZResendOrganisationMemberInvitationMutationSchema,
  ZUpdateOrganisationMemberMutationSchema,
  ZUpdateOrganisationMutationSchema,
} from './schema';

export const organisationRouter = router({
  // acceptTeamInvitation: authenticatedProcedure
  //   .input(ZAcceptTeamInvitationMutationSchema)
  //   .mutation(async ({ input, ctx }) => {
  //     try {
  //       return await acceptTeamInvitation({
  //         teamId: input.teamId,
  //         userId: ctx.user.id,
  //       });
  //     } catch (err) {
  //       console.error(err);

  //       throw AppError.parseErrorToTRPCError(err);
  //     }
  //   }),

  // createBillingPortal: authenticatedProcedure
  //   .input(ZCreateTeamBillingPortalMutationSchema)
  //   .mutation(async ({ input, ctx }) => {
  //     try {
  //       return await createTeamBillingPortal({
  //         userId: ctx.user.id,
  //         ...input,
  //       });
  //     } catch (err) {
  //       console.error(err);

  //       throw AppError.parseErrorToTRPCError(err);
  //     }
  //   }),

  createOrganisation: authenticatedProcedure
    .input(ZCreateOrganisationMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await createOrganisation({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        // Todo: Alert

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  createOrganisationMemberInvites: authenticatedProcedure
    .input(ZCreateOrganisationMemberInvitesMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await createOrganisationMemberInvites({
          userId: ctx.user.id,
          userName: ctx.user.name ?? '',
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  deleteOrganisationMemberInvitations: authenticatedProcedure
    .input(ZDeleteOrganisationMemberInvitationsMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await deleteOrganisationMemberInvitations({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  deleteOrganisationMembers: authenticatedProcedure
    .input(ZDeleteOrganisationMembersMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await deleteOrganisationMembers({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  // findTeamInvoices: authenticatedProcedure
  //   .input(ZFindTeamInvoicesQuerySchema)
  //   .query(async ({ input, ctx }) => {
  //     try {
  //       return await findTeamInvoices({
  //         userId: ctx.user.id,
  //         ...input,
  //       });
  //     } catch (err) {
  //       console.error(err);

  //       throw AppError.parseErrorToTRPCError(err);
  //     }
  //   }),

  findOrganisationMemberInvites: authenticatedProcedure
    .input(ZFindOrganisationMemberInvitesQuerySchema)
    .query(async ({ input, ctx }) => {
      try {
        return await findOrganisationMemberInvites({
          userId: ctx.user.id,
          term: input.query,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  findOrganisationMembers: authenticatedProcedure
    .input(ZFindOrganisationMembersQuerySchema)
    .query(async ({ input, ctx }) => {
      try {
        return await findOrganisationMembers({
          userId: ctx.user.id,
          term: input.query,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  findOrganisations: authenticatedProcedure
    .input(ZFindOrganisationsQuerySchema)
    .query(async ({ input, ctx }) => {
      try {
        return await findOrganisations({
          userId: ctx.user.id,
          term: input.query,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  // getTeam: authenticatedProcedure.input(ZGetTeamQuerySchema).query(async ({ input, ctx }) => {
  //   try {
  //     return await getTeamById({ teamId: input.teamId, userId: ctx.user.id });
  //   } catch (err) {
  //     console.error(err);

  //     throw AppError.parseErrorToTRPCError(err);
  //   }
  // }),

  // getTeamEmailByEmail: authenticatedProcedure.query(async ({ ctx }) => {
  //   try {
  //     return await getTeamEmailByEmail({ email: ctx.user.email });
  //   } catch (err) {
  //     console.error(err);

  //     throw AppError.parseErrorToTRPCError(err);
  //   }
  // }),

  // getTeamInvitations: authenticatedProcedure.query(async ({ ctx }) => {
  //   try {
  //     return await getTeamInvitations({ email: ctx.user.email });
  //   } catch (err) {
  //     console.error(err);

  //     throw AppError.parseErrorToTRPCError(err);
  //   }
  // }),

  // getTeamMembers: authenticatedProcedure
  //   .input(ZGetTeamMembersQuerySchema)
  //   .query(async ({ input, ctx }) => {
  //     try {
  //       return await getTeamMembers({ teamId: input.teamId, userId: ctx.user.id });
  //     } catch (err) {
  //       console.error(err);

  //       throw AppError.parseErrorToTRPCError(err);
  //     }
  //   }),

  // getTeamPrices: authenticatedProcedure.query(async () => {
  //   try {
  //     return await getTeamPrices();
  //   } catch (err) {
  //     console.error(err);

  //     throw AppError.parseErrorToTRPCError(err);
  //   }
  // }),

  // getTeams: authenticatedProcedure.query(async ({ ctx }) => {
  //   try {
  //     return await getTeams({ userId: ctx.user.id });
  //   } catch (err) {
  //     console.error(err);

  //     throw AppError.parseErrorToTRPCError(err);
  //   }
  // }),

  leaveOrganisation: authenticatedProcedure
    .input(ZLeaveOrganisationMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await leaveOrganisation({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  updateOrganisation: authenticatedProcedure
    .input(ZUpdateOrganisationMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateOrganisation({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  updateOrganisationMember: authenticatedProcedure
    .input(ZUpdateOrganisationMemberMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateOrganisationMember({
          userId: ctx.user.id,
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  resendOrganisationMemberInvitation: authenticatedProcedure
    .input(ZResendOrganisationMemberInvitationMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await resendOrganisationMemberInvitation({
          userId: ctx.user.id,
          userName: ctx.user.name ?? '',
          ...input,
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),
});
