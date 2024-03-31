'use client';

import { useState } from 'react';

import { ORGANISATION_MEMBER_ROLE_MAP } from '@documenso/lib/constants/organisations';
import { AppError } from '@documenso/lib/errors/app-error';
import type { OrganisationMemberRole } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { Alert } from '@documenso/ui/primitives/alert';
import { AvatarWithText } from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type LeaveOrganisationDialogProps = {
  organisationId: string;
  organisationName: string;
  role: OrganisationMemberRole;
  trigger?: React.ReactNode;
};

export const LeaveOrganisationDialog = ({
  trigger,
  organisationId,
  organisationName,
  role,
}: LeaveOrganisationDialogProps) => {
  const [open, setOpen] = useState(false);

  const { toast } = useToast();

  const [errorCode, setErrorCode] = useState<string | null>(null);

  const { mutateAsync: leaveOrg, isLoading: isLeavingOrg } =
    trpc.organisation.leaveOrganisation.useMutation({
      onMutate: () => {
        setErrorCode(null);
      },
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'You have successfully left this organisation.',
          duration: 5000,
        });

        setOpen(false);
      },
      onError: (err) => {
        const error = AppError.parseError(err);

        setErrorCode(error.code);
      },
    });

  return (
    <Dialog open={open} onOpenChange={(value) => !isLeavingOrg && setOpen(value)}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="destructive">Leave organisation</Button>}
      </DialogTrigger>

      <DialogContent position="center">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>

          <DialogDescription className="mt-4">
            You are about to leave the following organisation.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="neutral" padding="tight">
          <AvatarWithText
            avatarClass="h-12 w-12"
            avatarFallback={organisationName.slice(0, 1).toUpperCase()}
            primaryText={organisationName}
            secondaryText={ORGANISATION_MEMBER_ROLE_MAP[role]}
          />
        </Alert>

        {errorCode && (
          <Alert variant="destructive">
            {errorCode === 'USER_HAS_TEAMS'
              ? 'You cannot leave an organisation if you are the owner of a team in it.'
              : 'We encountered an unknown error while attempting to leave this organisation. Please try again later.'}
          </Alert>
        )}

        <fieldset disabled={isLeavingOrg}>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="destructive"
              loading={isLeavingOrg}
              onClick={async () => leaveOrg({ organisationId })}
            >
              Leave
            </Button>
          </DialogFooter>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
};
