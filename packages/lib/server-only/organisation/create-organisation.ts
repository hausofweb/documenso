import { z } from 'zod';

import { IS_BILLING_ENABLED } from '@documenso/lib/constants/app';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';
import { OrganisationMemberRole, OrganisationMemberStatus, Prisma } from '@documenso/prisma/client';

export type CreateOrganisationOptions = {
  /**
   * ID of the user creating the Team.
   */
  userId: number;

  /**
   * Name of the organisation to display.
   */
  organisationName: string;

  /**
   * Unique URL of the organisation.
   *
   * Used as the URL path, example: https://documenso.com/orgs/{orgUrl}/settings
   */
  organisationUrl: string;
};

/**
 * Create an organisation.
 */
export const createOrganisation = async ({
  userId,
  organisationName,
  organisationUrl,
}: CreateOrganisationOptions): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      Subscription: true,
    },
  });

  // Todo: Orgs - max 1 org per enterprise user & billing must be enabled, active, etc
  if (!IS_BILLING_ENABLED()) {
    throw new AppError('TODO');
  }

  try {
    await prisma.organisation.create({
      data: {
        name: organisationName,
        url: organisationUrl,
        ownerUserId: user.id,
        members: {
          create: [
            {
              name: user.name ?? '',
              userId,
              status: OrganisationMemberStatus.ACTIVE,
              role: OrganisationMemberRole.ADMIN,
            },
          ],
        },
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
