import { getRequiredServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { getOrganisationByUrl } from '@documenso/lib/server-only/organisation/get-organisation';
import { Alert, AlertDescription, AlertTitle } from '@documenso/ui/primitives/alert';

import { SettingsHeader } from '~/components/(dashboard)/settings/layout/header';
import { UpdateOrganisationForm } from '~/components/(organisations)/forms/update-organisation-form';

export type OrganisationSettingsPageProps = {
  params: {
    orgUrl: string;
  };
};

export default async function OrganisationSettingsPage({ params }: OrganisationSettingsPageProps) {
  const { orgUrl } = params;

  const session = await getRequiredServerComponentSession();

  const organisation = await getOrganisationByUrl({
    userId: session.user.id,
    organisationUrl: orgUrl,
  });

  return (
    <div>
      <SettingsHeader
        title="Organisation profile"
        subtitle="Here you can edit your organisation details."
      />

      <UpdateOrganisationForm
        organisationId={organisation.id}
        organisationName={organisation.name}
        organisationUrl={organisation.url}
      />

      <section className="mt-6 space-y-6">
        <Alert
          className="flex flex-col justify-between p-6 sm:flex-row sm:items-center"
          variant="neutral"
        >
          <div className="mb-4 sm:mb-0">
            <AlertTitle>Transfer or delete organisation</AlertTitle>

            <AlertDescription className="mr-2">
              Please contact us at{' '}
              <a target="_blank" className="font-bold" href="mailto:support@documenso.com">
                support@documenso.com
              </a>{' '}
              to transfer or delete your organisation
            </AlertDescription>
          </div>
        </Alert>
      </section>
    </div>
  );
}
