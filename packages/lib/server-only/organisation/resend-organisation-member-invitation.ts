import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '@documenso/lib/constants/organisations';
import { AppError } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

import { sendOrganisationMemberInviteEmail } from './create-organisation-member-invites';

export type ResendOrganisationMemberInvitationOptions = {
  /**
   * The ID of the user who is initiating this action.
   */
  userId: number;

  /**
   * The name of the user who is initiating this action.
   */
  userName: string;

  /**
   * The ID of the organisation.
   */
  organisationId: string;

  /**
   * The IDs of the invitations to resend.
   */
  invitationId: string;
};

/**
 * Resend an email for a given organisation member invite.
 */
export const resendOrganisationMemberInvitation = async ({
  userId,
  userName,
  organisationId,
  invitationId,
}: ResendOrganisationMemberInvitationOptions) => {
  await prisma.$transaction(
    async (tx) => {
      const organisation = await tx.organisation.findUniqueOrThrow({
        where: {
          id: organisationId,
          members: {
            some: {
              userId,
              role: {
                in: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_ORGANISATION'],
              },
            },
          },
        },
      });

      if (!organisation) {
        throw new AppError(
          'OrganisationNotFound',
          'User is not a valid member of the organisation.',
        );
      }

      const organisationMemberInvite = await tx.organisationMemberInvite.findUniqueOrThrow({
        where: {
          id: invitationId,
          organisationId,
        },
      });

      if (!organisationMemberInvite) {
        throw new AppError('InviteNotFound', 'No invite exists for this user.');
      }

      await sendOrganisationMemberInviteEmail({
        email: organisationMemberInvite.email,
        token: organisationMemberInvite.token,
        organisationName: organisation.name,
        organisationUrl: organisation.url,
        senderName: userName,
      });
    },
    { timeout: 30_000 },
  );
};
