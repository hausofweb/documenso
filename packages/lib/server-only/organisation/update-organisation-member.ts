import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '@documenso/lib/constants/organisations';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isOrganisationRoleWithinUserHierarchy } from '@documenso/lib/utils/organisations';
import { prisma } from '@documenso/prisma';
import type { OrganisationMemberRole } from '@documenso/prisma/client';

export type UpdateOrganisationMemberOptions = {
  userId: number;
  organisationId: string;
  organisationMemberId: string;
  data: {
    role: OrganisationMemberRole;
  };
};

export const updateOrganisationMember = async ({
  userId,
  organisationId,
  organisationMemberId,
  data,
}: UpdateOrganisationMemberOptions) => {
  await prisma.$transaction(async (tx) => {
    // Find the organisation and validate that the user is allowed to update members.
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

    const currentOrganisationMember = organisation.members.find(
      (member) => member.userId === userId,
    );
    const organisationMemberToUpdate = organisation.members.find(
      (member) => member.id === organisationMemberId,
    );

    if (!organisationMemberToUpdate || !currentOrganisationMember) {
      throw new AppError(AppErrorCode.NOT_FOUND, 'Organisation member does not exist');
    }

    if (organisationMemberToUpdate.userId === organisation.ownerUserId) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot update the owner');
    }

    const isMemberToUpdateHigherRole = !isOrganisationRoleWithinUserHierarchy(
      currentOrganisationMember.role,
      organisationMemberToUpdate.role,
    );

    if (isMemberToUpdateHigherRole) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot update a member with a higher role');
    }

    const isNewMemberRoleHigherThanCurrentRole = !isOrganisationRoleWithinUserHierarchy(
      currentOrganisationMember.role,
      data.role,
    );

    if (isNewMemberRoleHigherThanCurrentRole) {
      throw new AppError(
        AppErrorCode.UNAUTHORIZED,
        'Cannot give a member a role higher than the user initating the update',
      );
    }

    return await tx.organisationMember.update({
      where: {
        id: organisationMemberId,
        organisationId,
        userId: {
          not: organisation.ownerUserId,
        },
      },
      data: {
        role: data.role,
      },
    });
  });
};
