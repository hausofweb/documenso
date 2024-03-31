import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isOrganisationRoleWithinUserHierarchy } from '@documenso/lib/utils/organisations';
import { prisma } from '@documenso/prisma';

import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/organisations';

export type DeleteOrganisationMembersOptions = {
  /**
   * The ID of the user who is initiating this action.
   */
  userId: number;

  /**
   * The ID of the organisation to remove members from.
   */
  organisationId: string;

  /**
   * The IDs of the members to remove.
   */
  memberIds: string[];
};

export const deleteOrganisationMembers = async ({
  userId,
  organisationId,
  memberIds,
}: DeleteOrganisationMembersOptions) => {
  await prisma.$transaction(async (tx) => {
    // Find the organisation and validate that the user is allowed to remove members.
    const organisation = await tx.organisation.findFirstOrThrow({
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
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
    });

    const currentMember = organisation.members.find((member) => member.userId === userId);
    const membersToRemove = organisation.members.filter((member) => memberIds.includes(member.id));

    if (!currentMember) {
      throw new AppError(AppErrorCode.NOT_FOUND, 'Organisation member record does not exist');
    }

    if (membersToRemove.find((member) => member.userId === organisation.ownerUserId)) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove the organisation owner');
    }

    const isMemberToRemoveHigherRole = membersToRemove.some(
      (member) => !isOrganisationRoleWithinUserHierarchy(currentMember.role, member.role),
    );

    if (isMemberToRemoveHigherRole) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove a member with a higher role');
    }

    // Remove the members.
    await tx.organisationMember.deleteMany({
      where: {
        id: {
          in: memberIds,
        },
        organisationId,
        userId: {
          not: organisation.ownerUserId,
        },
      },
    });
  });
};
