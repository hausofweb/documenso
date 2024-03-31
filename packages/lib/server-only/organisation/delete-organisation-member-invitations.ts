import { prisma } from '@documenso/prisma';

import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/organisations';

export type DeleteTeamMemberInvitationsOptions = {
  /**
   * The ID of the user who is initiating this action.
   */
  userId: number;
  organisationId: string;
  invitationIds: string[];
};

export const deleteOrganisationMemberInvitations = async ({
  userId,
  organisationId,
  invitationIds,
}: DeleteTeamMemberInvitationsOptions) => {
  await prisma.$transaction(async (tx) => {
    await tx.organisationMember.findFirstOrThrow({
      where: {
        userId,
        organisationId,
        role: {
          in: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_ORGANISATION'],
        },
      },
    });

    await tx.organisationMemberInvite.deleteMany({
      where: {
        id: {
          in: invitationIds,
        },
        organisationId,
      },
    });
  });
};
