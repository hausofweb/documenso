import { createElement } from 'react';

import { nanoid } from 'nanoid';

import { mailer } from '@documenso/email/mailer';
import { render } from '@documenso/email/render';
import type { OrganisationInviteEmailProps } from '@documenso/email/templates/organisation-invite';
import { OrganisationInviteEmailTemplate } from '@documenso/email/templates/organisation-invite';
import { WEBAPP_BASE_URL } from '@documenso/lib/constants/app';
import { FROM_ADDRESS, FROM_NAME } from '@documenso/lib/constants/email';
import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '@documenso/lib/constants/organisations';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isOrganisationRoleWithinUserHierarchy } from '@documenso/lib/utils/organisations';
import { prisma } from '@documenso/prisma';
import { InviteStatus } from '@documenso/prisma/client';
import type { TCreateOrganisationMemberInvitesMutationSchema } from '@documenso/trpc/server/organisation-router/schema';

export type CreateOrganisationMemberInvitesOptions = {
  userId: number;
  userName: string;
  organisationId: string;
  invitations: TCreateOrganisationMemberInvitesMutationSchema['invitations'];
};

/**
 * Invite organisation members via email to join a organisation.
 */
export const createOrganisationMemberInvites = async ({
  userId,
  userName,
  organisationId,
  invitations,
}: CreateOrganisationMemberInvitesOptions) => {
  const organisation = await prisma.organisation.findFirstOrThrow({
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
          role: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      invites: true,
    },
  });

  const organisationMemberEmails = organisation.members.map((member) => member.user.email);
  const organisationMemberInviteEmails = organisation.invites.map((invite) => invite.email);
  const currentOrganisationMember = organisation.members.find(
    (member) => member.user.id === userId,
  );

  if (!currentOrganisationMember) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, 'User not part of organisation.');
  }

  const usersToInvite = invitations.filter((invitation) => {
    // Filter out users that are already members of the organisation.
    if (organisationMemberEmails.includes(invitation.email)) {
      return false;
    }

    // Filter out users that have already been invited to the organisation.
    if (organisationMemberInviteEmails.includes(invitation.email)) {
      return false;
    }

    return true;
  });

  const unauthorizedRoleAccess = usersToInvite.some(
    ({ role }) => !isOrganisationRoleWithinUserHierarchy(currentOrganisationMember.role, role),
  );

  if (unauthorizedRoleAccess) {
    throw new AppError(
      AppErrorCode.UNAUTHORIZED,
      'User does not have permission to set high level roles',
    );
  }

  const organisationMemberInvites = usersToInvite.map(({ email, role }) => ({
    email,
    organisationId,
    role,
    status: InviteStatus.PENDING,
    token: nanoid(32),
  }));

  await prisma.organisationMemberInvite.createMany({
    data: organisationMemberInvites,
  });

  const sendEmailResult = await Promise.allSettled(
    organisationMemberInvites.map(async ({ email, token }) =>
      sendOrganisationMemberInviteEmail({
        email,
        token,
        organisationName: organisation.name,
        organisationUrl: organisation.url,
        senderName: userName,
      }),
    ),
  );

  const sendEmailResultErrorList = sendEmailResult.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (sendEmailResultErrorList.length > 0) {
    console.error(JSON.stringify(sendEmailResultErrorList));

    throw new AppError(
      'EmailDeliveryFailed',
      'Failed to send invite emails to one or more users.',
      `Failed to send invites to ${sendEmailResultErrorList.length}/${organisationMemberInvites.length} users.`,
    );
  }
};

type SendOrganisationMemberInviteEmailOptions = Omit<
  OrganisationInviteEmailProps,
  'baseUrl' | 'assetBaseUrl'
> & {
  email: string;
};

/**
 * Send an email to a user inviting them to join a organisation.
 */
export const sendOrganisationMemberInviteEmail = async ({
  email,
  ...emailTemplateOptions
}: SendOrganisationMemberInviteEmailOptions) => {
  const template = createElement(OrganisationInviteEmailTemplate, {
    assetBaseUrl: WEBAPP_BASE_URL,
    baseUrl: WEBAPP_BASE_URL,
    ...emailTemplateOptions,
  });

  await mailer.sendMail({
    to: email,
    from: {
      name: FROM_NAME,
      address: FROM_ADDRESS,
    },
    subject: `You have been invited to join ${emailTemplateOptions.organisationName} on Documenso`,
    html: render(template),
    text: render(template, { plainText: true }),
  });
};
