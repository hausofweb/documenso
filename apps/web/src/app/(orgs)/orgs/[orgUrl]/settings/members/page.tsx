import { getRequiredServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { getOrganisationByUrl } from '@documenso/lib/server-only/organisation/get-organisation';

import { SettingsHeader } from '~/components/(dashboard)/settings/layout/header';
import { InviteOrganisationMembersDialog } from '~/components/(organisations)/dialogs/invite-organisation-member-dialog';
import { OrganisationMemberPageDataTable } from '~/components/(organisations)/tables/organisation-member-page-data-table';

export type OrganisationSettingsMembersPageProps = {
  params: {
    orgUrl: string;
  };
};

export default async function OrganisationSettingsMembersPage({
  params,
}: OrganisationSettingsMembersPageProps) {
  const { orgUrl } = params;

  const session = await getRequiredServerComponentSession();

  const organisation = await getOrganisationByUrl({
    userId: session.user.id,
    organisationUrl: orgUrl,
  });

  return (
    <div>
      <SettingsHeader title="Members" subtitle="Manage organisation members or invite new members.">
        <InviteOrganisationMembersDialog
          organisationId={organisation.id}
          currentUserRole={organisation.currentMember.role}
        />
      </SettingsHeader>

      <OrganisationMemberPageDataTable
        currentUserRole={organisation.currentMember.role}
        organisationId={organisation.id}
        organisationName={organisation.name}
        organisationOwnerUserId={organisation.ownerUserId}
      />
    </div>
  );
}
