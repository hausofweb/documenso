import Link from 'next/link';

import { DateTime } from 'luxon';

import { getServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { encryptSecondaryData } from '@documenso/lib/server-only/crypto/encrypt';
import { acceptOrganisationInvitation } from '@documenso/lib/server-only/organisation/accept-organisation-invitation';
import { getOrganisationById } from '@documenso/lib/server-only/organisation/get-organisation';
import { prisma } from '@documenso/prisma';
import { InviteStatus } from '@documenso/prisma/client';
import { Button } from '@documenso/ui/primitives/button';

type AcceptInvitationPageProps = {
  params: {
    token: string;
  };
};

export default async function AcceptOrganisationInvitationPage({
  params: { token },
}: AcceptInvitationPageProps) {
  const session = await getServerComponentSession();

  const organisationMemberInvite = await prisma.organisationMemberInvite.findUnique({
    where: {
      token,
    },
  });

  if (!organisationMemberInvite) {
    return (
      <div className="w-screen max-w-lg px-4">
        <div className="w-full">
          <h1 className="text-4xl font-semibold">Invalid token</h1>

          <p className="text-muted-foreground mb-4 mt-2 text-sm">
            This token is invalid or has expired. Please contact your organisation for a new
            invitation.
          </p>

          <Button asChild>
            <Link href="/">Return</Link>
          </Button>
        </div>
      </div>
    );
  }

  const organisation = await getOrganisationById({
    organisationId: organisationMemberInvite.organisationId,
  });

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: organisationMemberInvite.email,
        mode: 'insensitive',
      },
    },
  });

  // Directly convert the organisation member invite to a organisation member if they already have an account.
  if (user) {
    await acceptOrganisationInvitation({ userId: user.id, organisationId: organisation.id });
  }

  // For users who do not exist yet, set the organisation invite status to accepted, which is checked during
  // user creation to determine if we should add the user to the organisation at that time.
  if (!user && organisationMemberInvite.status !== InviteStatus.ACCEPTED) {
    await prisma.organisationMemberInvite.update({
      where: {
        id: organisationMemberInvite.id,
      },
      data: {
        status: InviteStatus.ACCEPTED,
      },
    });
  }

  const email = encryptSecondaryData({
    data: organisationMemberInvite.email,
    expiresAt: DateTime.now().plus({ days: 1 }).toMillis(),
  });

  if (!user) {
    return (
      <div>
        <h1 className="text-4xl font-semibold">Organisation invitation</h1>

        <p className="text-muted-foreground mt-2 text-sm">
          You have been invited by <strong>{organisation.name}</strong> to join their organisation.
        </p>

        <p className="text-muted-foreground mb-4 mt-1 text-sm">
          To accept this invitation you must create an account.
        </p>

        <Button asChild>
          <Link href={`/signup?email=${encodeURIComponent(email)}`}>Create account</Link>
        </Button>
      </div>
    );
  }

  const isSessionUserTheInvitedUser = user.id === session.user?.id;

  return (
    <div>
      <h1 className="text-4xl font-semibold">Invitation accepted!</h1>

      <p className="text-muted-foreground mb-4 mt-2 text-sm">
        You have accepted an invitation from <strong>{organisation.name}</strong> to join their
        organisation.
      </p>

      {isSessionUserTheInvitedUser ? (
        <Button asChild>
          <Link href="/">Continue</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href={`/signin?email=${encodeURIComponent(email)}`}>Continue to login</Link>
        </Button>
      )}
    </div>
  );
}
