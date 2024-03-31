import React from 'react';

import { RedirectType, redirect } from 'next/navigation';

import { LimitsProvider } from '@documenso/ee/server-only/limits/provider/server';
import { getServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { getOrganisationByUrl } from '@documenso/lib/server-only/organisation/get-organisation';
import { getTeams } from '@documenso/lib/server-only/team/get-teams';

import { Header } from '~/components/(dashboard)/layout/header';
import { RefreshOnFocus } from '~/components/(dashboard)/refresh-on-focus/refresh-on-focus';
import { NextAuthProvider } from '~/providers/next-auth';
import { OrganisationProvider } from '~/providers/organisation';

export type AuthenticatedOrganisationLayoutProps = {
  children: React.ReactNode;
  params: {
    orgUrl: string;
  };
};

export default async function AuthenticatedOrganisationLayout({
  children,
  params,
}: AuthenticatedOrganisationLayoutProps) {
  const { session, user } = await getServerComponentSession();

  if (!session || !user) {
    redirect('/signin');
  }

  const [getTeamsPromise, getOrganisationPromise] = await Promise.allSettled([
    getTeams({ userId: user.id }), // Todo: Orgs
    getOrganisationByUrl({ userId: user.id, organisationUrl: params.orgUrl }),
  ]);

  if (getOrganisationPromise.status === 'rejected') {
    redirect('/documents', RedirectType.replace);
  }

  const organisation = getOrganisationPromise.value;
  const teams = getTeamsPromise.status === 'fulfilled' ? getTeamsPromise.value : [];

  return (
    <NextAuthProvider session={session}>
      {/* Todo: Orgs don't need limits... right? */}
      <LimitsProvider>
        {/* {team.subscription && team.subscription.status !== SubscriptionStatus.ACTIVE && (
          <LayoutBillingBanner
            subscription={team.subscription}
            teamId={team.id}
            userRole={team.currentTeamMember.role}
          />
        )} */}

        {/* Todo: Orgs - Should we scope teams to orgs? */}
        <Header user={user} teams={teams} />

        <OrganisationProvider organisation={organisation}>
          <main className="mt-8 pb-8 md:mt-12 md:pb-12">{children}</main>
        </OrganisationProvider>

        <RefreshOnFocus />
      </LimitsProvider>
    </NextAuthProvider>
  );
}
