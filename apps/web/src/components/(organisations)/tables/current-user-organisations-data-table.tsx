'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { WEBAPP_BASE_URL } from '@documenso/lib/constants/app';
import { ORGANISATION_MEMBER_ROLE_MAP } from '@documenso/lib/constants/organisations';
import { ZBaseTableSearchParamsSchema } from '@documenso/lib/types/search-params';
import { canExecuteOrganisationAction } from '@documenso/lib/utils/organisations';
import { trpc } from '@documenso/trpc/react';
import { AvatarWithText } from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

import { LocaleDate } from '~/components/formatter/locale-date';

import { LeaveOrganisationDialog } from '../dialogs/leave-organisation-dialog';

export const CurrentUserOrganisationsDataTable = () => {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZBaseTableSearchParamsSchema.parse(
    Object.fromEntries(searchParams ?? []),
  );

  const { data, isLoading, isInitialLoading, isLoadingError } =
    trpc.organisation.findOrganisations.useQuery(
      {
        page: parsedSearchParams.page,
        perPage: parsedSearchParams.perPage,
      },
      {
        keepPreviousData: true,
      },
    );

  const onPaginationChange = (page: number, perPage: number) => {
    updateSearchParams({
      page,
      perPage,
    });
  };

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <DataTable
      columns={[
        {
          header: 'Organisation',
          accessorKey: 'name',
          cell: ({ row }) => (
            <Link href={`/orgs/${row.original.url}`} scroll={false}>
              <AvatarWithText
                avatarClass="h-12 w-12"
                avatarFallback={row.original.name.slice(0, 1).toUpperCase()}
                primaryText={
                  <span className="text-foreground/80 font-semibold">{row.original.name}</span>
                }
                secondaryText={`${WEBAPP_BASE_URL}/orgs/${row.original.url}`}
              />
            </Link>
          ),
        },
        {
          header: 'Role',
          accessorKey: 'role',
          cell: ({ row }) =>
            row.original.ownerUserId === row.original.currentMember.userId
              ? 'Owner'
              : ORGANISATION_MEMBER_ROLE_MAP[row.original.currentMember.role],
        },
        {
          header: 'Member Since',
          accessorKey: 'createdAt',
          cell: ({ row }) => <LocaleDate date={row.original.createdAt} />,
        },
        {
          id: 'actions',
          cell: ({ row }) => (
            <div className="flex justify-end space-x-2">
              {canExecuteOrganisationAction(
                'MANAGE_ORGANISATION',
                row.original.currentMember.role,
              ) && (
                <Button variant="outline" asChild>
                  <Link href={`/orgs/${row.original.url}/settings`}>Manage</Link>
                </Button>
              )}

              <LeaveOrganisationDialog
                organisationId={row.original.id}
                organisationName={row.original.name}
                role={row.original.currentMember.role}
                trigger={
                  <Button
                    variant="destructive"
                    disabled={row.original.ownerUserId === row.original.currentMember.userId}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Leave
                  </Button>
                }
              />
            </div>
          ),
        },
      ]}
      data={results.data}
      perPage={results.perPage}
      currentPage={results.currentPage}
      totalPages={results.totalPages}
      onPaginationChange={onPaginationChange}
      error={{
        enable: isLoadingError,
      }}
      skeleton={{
        enable: isLoading && isInitialLoading,
        rows: 3,
        component: (
          <>
            <TableCell className="w-1/3 py-4 pr-4">
              <div className="flex w-full flex-row items-center">
                <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />

                <div className="ml-2 flex flex-grow flex-col">
                  <Skeleton className="h-4 w-1/2 max-w-[8rem]" />
                  <Skeleton className="mt-1 h-4 w-2/3 max-w-[12rem]" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="flex flex-row justify-end space-x-2">
                <Skeleton className="h-10 w-20 rounded" />
                <Skeleton className="h-10 w-16 rounded" />
              </div>
            </TableCell>
          </>
        ),
      }}
    >
      {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
    </DataTable>
  );
};
