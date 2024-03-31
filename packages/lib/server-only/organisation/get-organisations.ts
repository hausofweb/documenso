import { prisma } from '@documenso/prisma';

export type GetOrganisationsOptions = {
  userId: number;
};
export type GetOrganisationsResponse = Awaited<ReturnType<typeof getOrganisations>>;

export const getOrganisations = async ({ userId }: GetOrganisationsOptions) => {
  const organisations = await prisma.organisation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
  });

  return organisations.map(({ members, ...organisation }) => ({
    ...organisation,
    currentMember: members[0],
  }));
};
