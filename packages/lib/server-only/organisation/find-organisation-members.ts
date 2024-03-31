import { P, match } from 'ts-pattern';

import { prisma } from '@documenso/prisma';
import type { OrganisationMember } from '@documenso/prisma/client';
import { Prisma } from '@documenso/prisma/client';

import type { FindResultSet } from '../../types/find-result-set';

export interface FindOrganisationMembersOptions {
  userId: number;
  organisationId: string;
  term?: string;
  page?: number;
  perPage?: number;
  orderBy?: {
    column: keyof OrganisationMember | 'name';
    direction: 'asc' | 'desc';
  };
}

export const findOrganisationMembers = async ({
  userId,
  organisationId,
  term,
  page = 1,
  perPage = 10,
  orderBy,
}: FindOrganisationMembersOptions) => {
  const orderByColumn = orderBy?.column ?? 'name';
  const orderByDirection = orderBy?.direction ?? 'desc';

  // Check that the user belongs to the organisation they are trying to find members in.
  const userOrganisation = await prisma.organisation.findUniqueOrThrow({
    where: {
      id: organisationId,
      members: {
        some: {
          userId,
        },
      },
    },
  });

  console.log(term);

  const termFilters: Prisma.OrganisationMemberWhereInput | undefined = match(term)
    .with(P.string.minLength(1), () => ({
      user: {
        name: {
          contains: term,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    }))
    .otherwise(() => undefined);

  const whereClause: Prisma.OrganisationMemberWhereInput = {
    ...termFilters,
    organisationId: userOrganisation.id,
  };

  let orderByClause: Prisma.OrganisationMemberOrderByWithRelationInput = {
    [orderByColumn]: orderByDirection,
  };

  // Name field is nested in the user so we have to handle it differently.
  if (orderByColumn === 'name') {
    orderByClause = {
      user: {
        name: orderByDirection,
      },
    };
  }

  const [data, count] = await Promise.all([
    prisma.organisationMember.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: orderByClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.organisationMember.count({
      where: whereClause,
    }),
  ]);

  return {
    data,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultSet<typeof data>;
};
