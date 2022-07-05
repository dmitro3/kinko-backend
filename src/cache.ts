import BigNumber from 'bignumber.js';
import {rpc} from 'rpc';
import {ILaunchpadInfo, ILaunchpadStatus} from 'types';
import {sleep} from 'utils';
import {BlockTransactionString} from 'web3-eth';

let blockCache: {
  timestamp: number;
  block: BlockTransactionString | undefined;
} = {
  timestamp: 0,
  block: undefined,
};

export const getCachedBlock = async (): Promise<BlockTransactionString> => {
  if (blockCache.block && blockCache.timestamp > Date.now() - 1000 * 10) {
    return blockCache.block;
  }
  const blockNumber = await rpc.getBlockNumber();
  const block = await rpc.getBlock(blockNumber);
  blockCache = {
    timestamp: Date.now(),
    block,
  };
  return block;
};

let earlyAccessTokenCache: {
  timestamp: number;
  earlyAccessToken:
    | {
        earlyAccessTokenAddress: string;
        earlyAccessTokenAmount: BigNumber;
      }
    | undefined;
} = {timestamp: 0, earlyAccessToken: undefined};

export const getCachedEarlyAccessToken = async (): Promise<{
  earlyAccessTokenAddress: string;
  earlyAccessTokenAmount: BigNumber;
}> => {
  if (earlyAccessTokenCache.earlyAccessToken && earlyAccessTokenCache.timestamp > Date.now() - 1000 * 60) {
    return earlyAccessTokenCache.earlyAccessToken;
  }
  const earlyAccessToken = await rpc.getEarlyAccessToken();
  earlyAccessTokenCache = {
    timestamp: Date.now(),
    earlyAccessToken,
  };
  return earlyAccessToken;
};

const launchpadInfoCache: {[key: string]: {timestamp: number; launchpadInfo: ILaunchpadInfo}} = {};
const launchpadInfoCacheLocks: {[key: string]: boolean} = {};

export const getCachedLaunchpadInfo = async (
  launchpadAddress: string,
  saleTokenDecimals: BigNumber | null,
  baseTokenDecimals: BigNumber | null,
): Promise<ILaunchpadInfo> => {
  while (launchpadInfoCacheLocks[launchpadAddress]) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(0);
  }
  try {
    launchpadInfoCacheLocks[launchpadAddress] = true;
    const cacheObject = launchpadInfoCache[launchpadAddress];
    if (cacheObject && cacheObject.timestamp > Date.now() - 1000 * 60) {
      return cacheObject.launchpadInfo;
    }
    const launchpadInfo = await rpc.getLaunchpadInfo(launchpadAddress, saleTokenDecimals, baseTokenDecimals);
    launchpadInfoCache[launchpadAddress] = {timestamp: Date.now(), launchpadInfo};
    return launchpadInfo;
  } finally {
    launchpadInfoCacheLocks[launchpadAddress] = false;
  }
};

const launchpadStatusCache: {[key: string]: {timestamp: number; launchpadStatus: ILaunchpadStatus}} = {};
const launchpadStatusCacheLocks: {[key: string]: boolean} = {};

export const getCachedLaunchpadStatus = async (
  launchpadAddress: string,
  saleTokenDecimals: BigNumber,
  baseTokenDecimals: BigNumber,
): Promise<ILaunchpadStatus> => {
  while (launchpadStatusCacheLocks[launchpadAddress]) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(0);
  }
  try {
    launchpadStatusCacheLocks[launchpadAddress] = true;
    const cacheObject = launchpadStatusCache[launchpadAddress];
    if (cacheObject && cacheObject.timestamp > Date.now() - 1000 * 10) {
      return cacheObject.launchpadStatus;
    }
    const launchpadStatus = await rpc.getLaunchpadStatus(launchpadAddress, saleTokenDecimals, baseTokenDecimals);
    launchpadStatusCache[launchpadAddress] = {timestamp: Date.now(), launchpadStatus};
    return launchpadStatus;
  } finally {
    launchpadStatusCacheLocks[launchpadAddress] = false;
  }
};
