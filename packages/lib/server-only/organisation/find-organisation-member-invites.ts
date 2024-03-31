import { P, match } from 'ts-pattern';

import { prisma } from '@documenso/prisma';
import type { OrganisationMemberInvite } from '@documenso/prisma/client';
import { Prisma } from '@documenso/prisma/client';

import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/organisations';
import type { FindResultSet } from '../../types/find-result-set';

export interface FindOrganisationMemberInvitesOptions {
  userId: number;
  organisationId: string;
  term?: string;
  page?: number;
  perPage?: number;
  orderBy?: {
    column: keyof OrganisationMemberInvite;
    direction: 'asc' | 'desc';
  };
}

export const findOrganisationMemberInvites = async ({
  userId,
  organisationId,
  term,
  page = 1,
  perPage = 10,
  orderBy,
}: FindOrganisationMemberInvitesOptions) => {
  const orderByColumn = orderBy?.column ?? 'email';
  const orderByDirection = orderBy?.direction ?? 'desc';

  // Check that the user belongs to the organisation they are trying to find invites in.
  const userOrganisation = await prisma.organisation.findUniqueOrThrow({
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

  const termFilters: Prisma.OrganisationMemberInviteWhereInput | undefined = match(term)
    .with(P.string.minLength(1), () => ({
      email: {
        contains: term,
        mode: Prisma.QueryMode.insensitive,
      },
    }))
    .otherwise(() => undefined);

  const whereClause: Prisma.OrganisationMemberInviteWhereInput = {
    ...termFilters,
    organisationId: userOrganisation.id,
  };

  const [data, count] = await Promise.all([
    prisma.organisationMemberInvite.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
      // Exclude token attribute.
      select: {
        id: true,
        organisationId: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.organisationMemberInvite.count({
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
