import { z } from 'zod';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';
import { Prisma } from '@documenso/prisma/client';

import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/organisations';

export type UpdateOrganisationOptions = {
  userId: number;
  organisationId: string;
  data: {
    name?: string;
    url?: string;
  };
};

export const updateOrganisation = async ({
  userId,
  organisationId,
  data,
}: UpdateOrganisationOptions) => {
  try {
    return await prisma.organisation.update({
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
      data: {
        url: data.url,
        name: data.name,
      },
    });
  } catch (err) {
    console.error(err);

    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
      throw err;
    }

    const target = z.array(z.string()).safeParse(err.meta?.target);

    if (err.code === 'P2002' && target.success && target.data.includes('url')) {
      throw new AppError(AppErrorCode.ALREADY_EXISTS, 'Organisation URL already exists.');
    }

    throw err;
  }
};
