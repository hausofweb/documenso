'use client';

import { useSearchParams } from 'next/navigation';

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ORGANISATION_MEMBER_ROLE_MAP } from '@documenso/lib/constants/organisations';
import { ZBaseTableSearchParamsSchema } from '@documenso/lib/types/search-params';
import { isOrganisationRoleWithinUserHierarchy } from '@documenso/lib/utils/organisations';
import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import type { OrganisationMemberRole } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { AvatarWithText } from '@documenso/ui/primitives/avatar';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

import { LocaleDate } from '~/components/formatter/locale-date';

import { DeleteOrganisationMemberDialog } from '../dialogs/delete-organisation-member-dialog';
import { UpdateOrganisationMemberDialog } from '../dialogs/update-organisation-member-dialog';

export type OrganisationMembersDataTableProps = {
  currentUserRole: OrganisationMemberRole;
  organisationOwnerUserId: number;
  organisationId: string;
  organisationName: string;
};

export const OrganisationMembersDataTable = ({
  currentUserRole,
  organisationOwnerUserId,
  organisationId,
  organisationName,
}: OrganisationMembersDataTableProps) => {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZBaseTableSearchParamsSchema.parse(
    Object.fromEntries(searchParams ?? []),
  );

  const { data, isLoading, isInitialLoading, isLoadingError } =
    trpc.organisation.findOrganisationMembers.useQuery(
      {
        organisationId,
        query: parsedSearchParams.query,
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
          header: 'Organisation Member',
          cell: ({ row }) => {
            const avatarFallbackText = row.original.user.name
              ? extractInitials(row.original.user.name)
              : row.original.user.email.slice(0, 1).toUpperCase();

            return (
              <AvatarWithText
                avatarClass="h-12 w-12"
                avatarFallback={avatarFallbackText}
                primaryText={
                  <span className="text-foreground/80 font-semibold">{row.original.user.name}</span>
                }
                secondaryText={row.original.user.email}
              />
            );
          },
        },
        {
          header: 'Role',
          accessorKey: 'role',
          cell: ({ row }) =>
            organisationOwnerUserId === row.original.userId
              ? 'Owner'
              : ORGANISATION_MEMBER_ROLE_MAP[row.original.role],
        },
        {
          header: 'Member Since',
          accessorKey: 'createdAt',
          cell: ({ row }) => <LocaleDate date={row.original.createdAt} />,
        },
        {
          header: 'Actions',
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreHorizontal className="text-muted-foreground h-5 w-5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-52" align="start" forceMount>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <UpdateOrganisationMemberDialog
                  currentUserRole={currentUserRole}
                  organisationId={row.original.organisationId}
                  organisationMemberId={row.original.id}
                  organisationMemberName={row.original.user.name ?? ''}
                  organisationMemberRole={row.original.role}
                  trigger={
                    <DropdownMenuItem
                      disabled={
                        organisationOwnerUserId === row.original.userId ||
                        !isOrganisationRoleWithinUserHierarchy(currentUserRole, row.original.role)
                      }
                      onSelect={(e) => e.preventDefault()}
                      title="Update organisation member role"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Update role
                    </DropdownMenuItem>
                  }
                />

                <DeleteOrganisationMemberDialog
                  organisationId={organisationId}
                  organisationName={organisationName}
                  organisationMemberId={row.original.id}
                  organisationMemberName={row.original.user.name ?? ''}
                  organisationMemberEmail={row.original.user.email}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      disabled={
                        organisationOwnerUserId === row.original.userId ||
                        !isOrganisationRoleWithinUserHierarchy(currentUserRole, row.original.role)
                      }
                      title="Remove organisation member"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
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
            <TableCell className="w-1/2 py-4 pr-4">
              <div className="flex w-full flex-row items-center">
                <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />

                <div className="ml-2 flex flex-grow flex-col">
                  <Skeleton className="h-4 w-1/3 max-w-[8rem]" />
                  <Skeleton className="mt-1 h-4 w-1/2 max-w-[12rem]" />
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
              <Skeleton className="h-4 w-6 rounded-full" />
            </TableCell>
          </>
        ),
      }}
    >
      {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
    </DataTable>
  );
};
