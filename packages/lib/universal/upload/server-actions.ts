'use server';

import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import slugify from '@sindresorhus/slugify';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { type JWT, getToken } from 'next-auth/jwt';
import { env } from 'next-runtime-env';
import path from 'node:path';

import { APP_BASE_URL } from '../../constants/app';
import { ONE_HOUR, ONE_SECOND } from '../../constants/time';
import { alphaid } from '../id';

export const getPresignPostUrl = async (fileName: string, contentType: string) => {
  const client = getS3Client();

  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  let token: JWT | null = null;

  try {
    const baseUrl = APP_BASE_URL() ?? 'http://localhost:3000';

    token = await getToken({
      req: new NextRequest(baseUrl, {
        headers: headers(),
      }),
    });
  } catch (err) {
    // Non server-component environment
  }

  // Get the basename and extension for the file
  const { name, ext } = path.parse(fileName);

  let key = `${alphaid(12)}/${slugify(name)}${ext}`;

  if (token) {
    key = `${token.id}/${key}`;
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, putObjectCommand, {
    expiresIn: ONE_HOUR / ONE_SECOND,
  });

  return { key, url };
};

export const getAbsolutePresignPostUrl = async (key: string) => {
  const client = getS3Client();

  const { getSignedUrl: getS3SignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
    Key: key,
  });

  const url = await getS3SignedUrl(client, putObjectCommand, {
    expiresIn: ONE_HOUR / ONE_SECOND,
  });

  return { key, url };
};

export const getPresignGetUrl = async (key: string) => {
  if (process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN) {
    const distributionUrl = new URL(key, `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN}`);

    const { getSignedUrl: getCloudfrontSignedUrl } = await import('@aws-sdk/cloudfront-signer');

    const url = getCloudfrontSignedUrl({
      url: distributionUrl.toString(),
      keyPairId: `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID}`,
      privateKey: `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS}`,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    });

    return { key, url };
  }

  const client = getS3Client();

  const { getSignedUrl: getS3SignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
    Key: key,
  });

  const url = await getS3SignedUrl(client, getObjectCommand, {
    expiresIn: ONE_HOUR / ONE_SECOND,
  });

  return { key, url };
};

export const deleteS3File = async (key: string) => {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Key: key,
    }),
  );
};

const getS3Client = () => {
  const NEXT_PUBLIC_UPLOAD_TRANSPORT = env('NEXT_PUBLIC_UPLOAD_TRANSPORT');

  if (NEXT_PUBLIC_UPLOAD_TRANSPORT !== 's3') {
    throw new Error('Invalid upload transport');
  }

  const hasCredentials =
    process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID &&
    process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY;

  console.info('NEXT_PRIVATE_AWS_ROLE_ARN', process.env.NEXT_PRIVATE_UPLOAD_AWS_ROLE_ARN);
  console.info('VERCEL', process.env.VERCEL);

  const vercelCredentials =
    process.env.NEXT_PRIVATE_UPLOAD_AWS_ROLE_ARN && process.env.VERCEL
      ? awsCredentialsProvider({
          roleArn: process.env.NEXT_PRIVATE_UPLOAD_AWS_ROLE_ARN,
        })
      : undefined;

  console.info('VERCEL_OIDC_TOKEN', process.env.VERCEL_OIDC_TOKEN);

  console.info('Vercel Credentials', vercelCredentials);
  console.info(
    'Vercel credentials',
    vercelCredentials &&
      JSON.stringify(
        vercelCredentials().then(
          (credentials) => credentials,
          (error) => error,
        ),
        null,
        2,
      ),
  );

  const credentials =
    vercelCredentials ??
    (hasCredentials
      ? {
          accessKeyId: String(process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID),
          secretAccessKey: String(process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY),
        }
      : undefined);

  console.info('S3 credentials', JSON.stringify(credentials, null, 2));

  return new S3Client({
    endpoint: process.env.NEXT_PRIVATE_UPLOAD_ENDPOINT || undefined,
    forcePathStyle: process.env.NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE === 'true',
    region: process.env.NEXT_PRIVATE_UPLOAD_REGION || 'us-east-1',
    credentials,
  });
};
