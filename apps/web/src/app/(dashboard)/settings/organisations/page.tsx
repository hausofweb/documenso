'use client';

import { SettingsHeader } from '~/components/(dashboard)/settings/layout/header';
import { CreateOrganisationDialog } from '~/components/(organisations)/dialogs/create-organisation-dialog';
import { CurrentUserOrganisationsDataTable } from '~/components/(organisations)/tables/current-user-organisations-data-table';

import { TeamInvitations } from './team-invitations';

export default function OrganisationsSettingsPage() {
  return (
    <div>
      <SettingsHeader
        title="Organisations"
        subtitle="Manage all organisations you are currently associated with."
      >
        {/* Todo: Org - only display when no org created & user can create org */}
        <CreateOrganisationDialog />
      </SettingsHeader>

      <CurrentUserOrganisationsDataTable />

      <div className="mt-8">
        {/* Todo: Orgs */}
        <TeamInvitations />
      </div>
    </div>
  );
}
