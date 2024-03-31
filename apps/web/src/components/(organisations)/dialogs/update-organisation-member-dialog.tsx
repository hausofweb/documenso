'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  ORGANISATION_MEMBER_ROLE_HIERARCHY,
  ORGANISATION_MEMBER_ROLE_MAP,
} from '@documenso/lib/constants/organisations';
import { isOrganisationRoleWithinUserHierarchy } from '@documenso/lib/utils/organisations';
import { OrganisationMemberRole } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type UpdateOrganisationMemberDialogProps = {
  currentUserRole: OrganisationMemberRole;
  trigger?: React.ReactNode;
  organisationId: string;
  organisationMemberId: string;
  organisationMemberName: string;
  organisationMemberRole: OrganisationMemberRole;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

const ZUpdateOrganisationMemberFormSchema = z.object({
  role: z.nativeEnum(OrganisationMemberRole),
});

type ZUpdateOrganisationMemberSchema = z.infer<typeof ZUpdateOrganisationMemberFormSchema>;

export const UpdateOrganisationMemberDialog = ({
  currentUserRole,
  trigger,
  organisationId,
  organisationMemberId,
  organisationMemberName,
  organisationMemberRole,
  ...props
}: UpdateOrganisationMemberDialogProps) => {
  const [open, setOpen] = useState(false);

  const { toast } = useToast();

  const form = useForm<ZUpdateOrganisationMemberSchema>({
    resolver: zodResolver(ZUpdateOrganisationMemberFormSchema),
    defaultValues: {
      role: organisationMemberRole,
    },
  });

  const { mutateAsync: updateOrganisationMember } =
    trpc.organisation.updateOrganisationMember.useMutation();

  const onFormSubmit = async ({ role }: ZUpdateOrganisationMemberSchema) => {
    try {
      await updateOrganisationMember({
        organisationId,
        organisationMemberId,
        data: {
          role,
        },
      });

      toast({
        title: 'Success',
        description: `You have updated ${organisationMemberName}.`,
        duration: 5000,
      });

      setOpen(false);
    } catch {
      toast({
        title: 'An unknown error occurred',
        variant: 'destructive',
        description:
          'We encountered an unknown error while attempting to update this organisation member. Please try again later.',
      });
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset();

    if (!isOrganisationRoleWithinUserHierarchy(currentUserRole, organisationMemberRole)) {
      setOpen(false);

      toast({
        title: 'You cannot modify a organisation member who has a higher role than you.',
        variant: 'destructive',
      });
    }
  }, [open, currentUserRole, organisationMemberRole, form, toast]);

  return (
    <Dialog
      {...props}
      open={open}
      onOpenChange={(value) => !form.formState.isSubmitting && setOpen(value)}
    >
      <DialogTrigger onClick={(e) => e.stopPropagation()} asChild>
        {trigger ?? <Button variant="secondary">Update organisation member</Button>}
      </DialogTrigger>

      <DialogContent position="center">
        <DialogHeader>
          <DialogTitle>Update organisation member</DialogTitle>

          <DialogDescription className="mt-4">
            You are currently updating <span className="font-bold">{organisationMemberName}.</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)}>
            <fieldset className="flex h-full flex-col" disabled={form.formState.isSubmitting}>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel required>Role</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="text-muted-foreground">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent className="w-full" position="popper">
                          {ORGANISATION_MEMBER_ROLE_HIERARCHY[currentUserRole].map((role) => (
                            <SelectItem key={role} value={role}>
                              {ORGANISATION_MEMBER_ROLE_MAP[role] ?? role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-4">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>

                <Button type="submit" loading={form.formState.isSubmitting}>
                  Update
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
