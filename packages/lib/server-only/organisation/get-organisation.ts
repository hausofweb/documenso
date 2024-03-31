import { prisma } from '@documenso/prisma';
import type { Prisma } from '@documenso/prisma/client';

export type GetOrganisationByIdOptions = {
  userId?: number;
  organisationId: string;
};

/**
 * Get an organisation given an organisationId.
 *
 * Provide an optional userId to check that the user is a member of the organisation.
 */
export const getOrganisationById = async ({
  userId,
  organisationId,
}: GetOrganisationByIdOptions) => {
  const whereFilter: Prisma.OrganisationWhereUniqueInput = {
    id: organisationId,
  };

  if (userId !== undefined) {
    whereFilter['members'] = {
      some: {
        userId,
      },
    };
  }

  const result = await prisma.organisation.findUniqueOrThrow({
    where: whereFilter,
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

  const { members, ...organisation } = result;

  return {
    ...organisation,
    currentMember: userId !== undefined ? members[0] : null,
  };
};

export type GetOrganisationByUrlOptions = {
  userId: number;
  organisationUrl: string;
};

/**
 * Get an organisation given an organisation URL.
 */
export const getOrganisationByUrl = async ({
  userId,
  organisationUrl,
}: GetOrganisationByUrlOptions) => {
  const whereFilter: Prisma.OrganisationWhereUniqueInput = {
    url: organisationUrl,
  };

  if (userId !== undefined) {
    whereFilter['members'] = {
      some: {
        userId,
      },
    };
  }

  const result = await prisma.organisation.findUniqueOrThrow({
    where: whereFilter,
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

  const { members, ...organisation } = result;

  return {
    ...organisation,
    currentMember: members[0],
  };
};
