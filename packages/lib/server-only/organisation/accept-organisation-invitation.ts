import { prisma } from '@documenso/prisma';
import { OrganisationMemberStatus } from '@documenso/prisma/client';

export type AcceptOrganisationInvitationOptions = {
  userId: number;
  organisationId: string;
};

export const acceptOrganisationInvitation = async ({
  userId,
  organisationId,
}: AcceptOrganisationInvitationOptions) => {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirstOrThrow({
      where: {
        id: userId,
      },
    });

    const organisationMemberInvite = await tx.organisationMemberInvite.findFirstOrThrow({
      where: {
        organisationId,
        email: user.email,
      },
    });

    await tx.organisationMember.create({
      data: {
        name: user.name ?? '',
        status: OrganisationMemberStatus.ACTIVE,
        organisationId: organisationMemberInvite.organisationId,
        userId: user.id,
        role: organisationMemberInvite.role,
      },
    });

    await tx.organisationMemberInvite.delete({
      where: {
        id: organisationMemberInvite.id,
      },
    });
  });
};
