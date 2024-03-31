'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { WEBAPP_BASE_URL } from '@documenso/lib/constants/app';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { trpc } from '@documenso/trpc/react';
import { ZUpdateOrganisationMutationSchema } from '@documenso/trpc/server/organisation-router/schema';
import { Button } from '@documenso/ui/primitives/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type UpdateOrganisationDialogProps = {
  organisationId: string;
  organisationName: string;
  organisationUrl: string;
};

const ZUpdateOrganisationFormSchema = ZUpdateOrganisationMutationSchema.shape.data.pick({
  name: true,
  url: true,
});

type TUpdateOrganisationFormSchema = z.infer<typeof ZUpdateOrganisationFormSchema>;

export const UpdateOrganisationForm = ({
  organisationId,
  organisationName,
  organisationUrl,
}: UpdateOrganisationDialogProps) => {
  const router = useRouter();

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(ZUpdateOrganisationFormSchema),
    defaultValues: {
      name: organisationName,
      url: organisationUrl,
    },
  });

  const { mutateAsync: updateOrganisation } = trpc.organisation.updateOrganisation.useMutation();

  const onFormSubmit = async ({ name, url }: TUpdateOrganisationFormSchema) => {
    try {
      await updateOrganisation({
        data: {
          name,
          url,
        },
        organisationId,
      });

      toast({
        title: 'Success',
        description: 'Your organisation has been successfully updated.',
        duration: 5000,
      });

      form.reset({
        name,
        url,
      });

      if (url !== organisationUrl) {
        router.push(`${WEBAPP_BASE_URL}/orgs/${url}/settings`);
      }
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.ALREADY_EXISTS) {
        form.setError('url', {
          type: 'manual',
          message: 'This URL is already in use.',
        });

        return;
      }

      toast({
        title: 'An unknown error occurred',
        variant: 'destructive',
        description:
          'We encountered an unknown error while attempting to update your organisation. Please try again later.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)}>
        <fieldset className="flex h-full flex-col" disabled={form.formState.isSubmitting}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Organisation Name</FormLabel>
                <FormControl>
                  <Input className="bg-background" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel required>Organisation URL</FormLabel>
                <FormControl>
                  <Input className="bg-background" {...field} />
                </FormControl>
                {!form.formState.errors.url && (
                  <span className="text-foreground/50 text-xs font-normal">
                    {field.value
                      ? `${WEBAPP_BASE_URL}/orgs/${field.value}`
                      : 'A unique URL to identify your organisation'}
                  </span>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row justify-end space-x-4">
            <AnimatePresence>
              {form.formState.isDirty && (
                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                >
                  <Button type="button" variant="secondary" onClick={() => form.reset()}>
                    Reset
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="transition-opacity"
              disabled={!form.formState.isDirty}
              loading={form.formState.isSubmitting}
            >
              Update organisation
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
};
