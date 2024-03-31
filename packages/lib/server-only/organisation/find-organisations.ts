import type { FindResultSet } from '@documenso/lib/types/find-result-set';
import { prisma } from '@documenso/prisma';
import type { Organisation } from '@documenso/prisma/client';
import { Prisma } from '@documenso/prisma/client';

export interface FindOrganisationsOptions {
  userId: number;
  term?: string;
  page?: number;
  perPage?: number;
  orderBy?: {
    column: keyof Organisation;
    direction: 'asc' | 'desc';
  };
}

export const findOrganisations = async ({
  userId,
  term,
  page = 1,
  perPage = 10,
  orderBy,
}: FindOrganisationsOptions) => {
  const orderByColumn = orderBy?.column ?? 'name';
  const orderByDirection = orderBy?.direction ?? 'desc';

  const whereClause: Prisma.OrganisationWhereInput = {
    members: {
      some: {
        userId,
      },
    },
  };

  if (term && term.length > 0) {
    whereClause.name = {
      contains: term,
      mode: Prisma.QueryMode.insensitive,
    };
  }

  const [data, count] = await Promise.all([
    prisma.organisation.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    }),
    prisma.organisation.count({
      where: whereClause,
    }),
  ]);

  const maskedData = data.map((organisation) => ({
    ...organisation,
    currentMember: organisation.members[0],
    members: undefined,
  }));

  return {
    data: maskedData,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultSet<typeof maskedData>;
};
