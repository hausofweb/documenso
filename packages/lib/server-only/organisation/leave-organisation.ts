import { prisma } from '@documenso/prisma';

import { AppError } from '../../errors/app-error';

export type LeaveOrganisationOptions = {
  /**
   * The ID of the user who is leaving the organisation.
   */
  userId: number;

  /**
   * The ID of the organisation the user is leaving.
   */
  organisationId: string;
};

export const leaveOrganisation = async ({ userId, organisationId }: LeaveOrganisationOptions) => {
  const organisation = await prisma.organisation.findFirstOrThrow({
    where: {
      id: organisationId,
      ownerUserId: {
        not: userId,
      },
    },
    include: {
      teams: {
        where: {
          ownerUserId: userId,
        },
      },
    },
  });

  // Todo: Orgs - Test this.
  if (organisation.teams.length > 0) {
    throw new AppError(
      'USER_HAS_TEAMS',
      'You cannot leave an organisation if you are the owner of a team in it.',
    );
  }

  await prisma.organisationMember.delete({
    where: {
      userId_organisationId: {
        userId,
        organisationId,
      },
      organisation: {
        ownerUserId: {
          not: userId,
        },
      },
    },
  });
};
