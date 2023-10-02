'use client';

import { HTMLAttributes, useState } from 'react';

import { Copy, Share, Twitter } from 'lucide-react';

import { useCopyShareLink } from '@documenso/lib/client-only/hooks/use-copy-share-link';
import { generateTwitterIntent } from '@documenso/lib/universal/generate-twitter-intent';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';

export type ShareButtonProps = HTMLAttributes<HTMLButtonElement> & {
  token: string;
  documentId: number;
};

export const ShareButton = ({ token, documentId }: ShareButtonProps) => {
  const { copyShareLink, isCopyingShareLink } = useCopyShareLink();

  const [isOpen, setIsOpen] = useState(false);

  const {
    mutateAsync: createOrGetShareLink,
    data: shareLink,
    isLoading,
  } = trpc.shareLink.createOrGetShareLink.useMutation();

  const onOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      void createOrGetShareLink({
        token,
        documentId,
      });
    }

    setIsOpen(nextOpen);
  };

  const onCopyClick = async () => {
    const copyToClipboardValue = shareLink
      ? `${window.location.origin}/share/${shareLink.slug}`
      : {
          token,
          documentId,
        };

    await copyShareLink(copyToClipboardValue);

    setIsOpen(false);
  };

  const onTweetClick = async () => {
    let { slug = '' } = shareLink || {};

    if (!slug) {
      const result = await createOrGetShareLink({
        token,
        documentId,
      });

      slug = result.slug;
    }

    window.open(
      generateTwitterIntent(
        `I just ${token ? 'signed' : 'sent'} a document with @documenso. Check it out!`,
        `${window.location.origin}/share/${slug}`,
      ),
      '_blank',
    );

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!token || !documentId}
          className="flex-1"
          loading={isLoading || isCopyingShareLink}
        >
          {!isLoading && !isCopyingShareLink && <Share className="mr-2 h-5 w-5" />}
          Share
        </Button>
      </DialogTrigger>

      <DialogContent position="end">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>

          <DialogDescription className="mt-4">Share your signing experience!</DialogDescription>
        </DialogHeader>

        <div className="flex w-full flex-col">
          <div className="rounded-md border p-4">
            I just {token ? 'signed' : 'sent'} a document with{' '}
            <span className="font-medium text-blue-400">@documenso</span>
            . Check it out!
            <span className="mt-2 block" />
            <span className="break-all font-medium text-blue-400">
              {window.location.origin}/share/{shareLink?.slug || '...'}
            </span>
          </div>

          <Button variant="outline" className="mt-4" onClick={onTweetClick}>
            <Twitter className="mr-2 h-4 w-4" />
            Tweet
          </Button>

          <div className="relative flex items-center justify-center gap-x-4 py-4 text-xs uppercase">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground bg-transparent">Or</span>
            <div className="bg-border h-px flex-1" />
          </div>

          <Button variant="outline" onClick={onCopyClick}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
