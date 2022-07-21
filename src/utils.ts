import BigNumber from 'bignumber.js';
import {IMAGES_PATH} from 'constants/env';
import {sha256} from 'ethereumjs-util';
import {promises as fsPromises} from 'fs';

import {join} from 'path';
import sharp from 'sharp';
import {IIloStatus} from 'types';

const hasOwnProperty = <X, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export const sleep = async (ms: number): Promise<void> => {
  await new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
};

export const errorToString = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'number' || typeof error === 'bigint' || typeof error === 'boolean') {
    return error.toString();
  }
  if (typeof error === 'object' && error && error.toString() !== '[object Object]') {
    return error.toString();
  }
  if (typeof error === 'object' && error && hasOwnProperty(error, 'message') && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof error === 'object') {
    return JSON.stringify(error);
  }
  return `${error}`;
};

export const logError = (where: string, error: unknown): void => {
  console.error(`ERROR ${new Date().toISOString()} ${where}: ${errorToString(error)}`);
};

export const getFileExt = (mimeType: string): string => {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpeg';
    case 'image/svg+xml':
      return 'svg';
    default:
      return '';
  }
};

export const saveImage = async (data: string): Promise<string> => {
  const regex = /base64,(.*)/gm;
  const matches = regex.exec(data);
  if (!matches) {
    throw new Error('Invalid image');
  }
  const buffer = Buffer.from(matches[1], 'base64');
  const resizedBuffer = await sharp(buffer).resize(500, 500, {fit: 'outside'}).jpeg().toBuffer();
  const fileName = `${sha256(resizedBuffer).toString('hex')}.jpg`;
  fsPromises.writeFile(join(IMAGES_PATH, fileName), resizedBuffer);
  return fileName;
};

export const getIloStatus = async (params: {
  startBlockDate: Date;
  endBlockDate: Date;
  forceFailed: boolean;
  totalBaseCollected: BigNumber;
  hardcap: BigNumber;
  softcap: BigNumber;
  round1Length: bigint;
  lpGenerationComplete: boolean;
}): Promise<IIloStatus> => {
  const {
    startBlockDate,
    endBlockDate,
    forceFailed,
    totalBaseCollected,
    hardcap,
    softcap,
    round1Length,
    lpGenerationComplete,
  } = params;
  // const blockNumber = await rpc.getBlockNumber();
  const startBlockTimestamp = BigInt(Math.round(startBlockDate.getTime() / 1000));
  const endBlockTimestamp = BigInt(Math.round(endBlockDate.getTime() / 1000));
  const now = BigInt(Math.round(Date.now() / 1000));
  if (forceFailed || (endBlockTimestamp < now && totalBaseCollected.isLessThan(softcap))) {
    return 'failed';
  }
  if (startBlockTimestamp > now) {
    return 'upcoming';
  }
  if (lpGenerationComplete) {
    return 'success';
  }
  if (totalBaseCollected.gte(hardcap) || (endBlockTimestamp < now && totalBaseCollected.gte(softcap))) {
    return 'saleDone';
  }
  if (startBlockTimestamp + round1Length > now) {
    return 'round1';
  }
  return 'round2';
};
