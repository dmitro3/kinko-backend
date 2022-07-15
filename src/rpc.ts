import BigNumber from 'bignumber.js';
import {ETHEREUM_RPC_URL, LAUNCHPAD_SETTINGS_ADDRESS} from 'constants/env';
<<<<<<< HEAD
import erc20Abi from 'constants/erc20Abi.json';
import launchpadAbi from 'constants/launchpadAbi.json';
import launchpadSettingsAbi from 'constants/launchpadSettingsAbi.json';
=======
import erc20Abi from 'constants/ERC20.json';
import launchpadAbi from 'constants/Launchpad.json';
import launchpadSettingsAbi from 'constants/LaunchpadSettings.json';
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
import {ILaunchpadFeeInfo, ILaunchpadInfo, ILaunchpadStatus} from 'types';
import {logError, sleep} from 'utils';
import Web3 from 'web3';
import {BlockTransactionString, Transaction, TransactionReceipt} from 'web3-eth';
import {Contract} from 'web3-eth-contract/types';
import {AbiItem} from 'web3-utils/types';

interface ILaunchpadInfoResponse {
  launchpadOwner: string;
  sToken: string;
  bToken: string;
  amount: string;
  tokensPerBaseToken: string;
  maxSpendPerBuyer: string;
  softCap: string;
  hardcap: string;
  liquidityPercentage: string;
  listingRate: string;
  lockPeriod: string;
  startTime: string;
  endTime: string;
<<<<<<< HEAD
  isGLMR: boolean;
=======
  is_BNB: boolean;
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
}

interface ILaunchpadFeeInfoResponse {
  energyFiTokenFee: string;
  referralFee: string;
  baseFeeAddress: string;
  tokenFeeAddress: string;
  referralFeeAddress: string;
}

export interface ILaunchpadStatusResponse {
  forceFailed: boolean;
  lpGenerationComplete: boolean;
  whitelistOnly: boolean;
  lpGenerationTimestamp: string;
  totalBaseCollected: string;
  totalBaseWithdrawn: string;
  totalTokensSold: string;
  totalTokensWithdrawn: string;
  numBuyers: string;
  round1Length: string;
}

class Rpc {
  readonly web3 = new Web3(ETHEREUM_RPC_URL);

  readonly delayTime = 1000 * 10;

  delayFactor = 0;

  downRateRpcAndWait = async () => {
    this.delayFactor += 1;
    await sleep(this.delayTime * this.delayFactor);
  };

  upRateRpc = () => {
    if (this.delayFactor > 0) {
      this.delayFactor -= 1;
    }
  };

  call = async <T>(
    f: () => Promise<T>,
    where: string,
    options: {retryNumber?: number; nullable?: boolean; noDownRateSleep?: number} = {},
  ) => {
    const {nullable = false, noDownRateSleep} = options;
    let {retryNumber} = options;
    while (retryNumber === undefined || retryNumber > 0) {
      if (retryNumber !== undefined) {
        retryNumber -= 1;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await f();
        if (!nullable && (result === null || result === undefined)) {
          throw new Error('Result is null while null is not expected');
        }
        this.upRateRpc();
        return result;
      } catch (e) {
        logError(where, e);
        if (noDownRateSleep === undefined) {
          // eslint-disable-next-line no-await-in-loop
          await this.downRateRpcAndWait();
        } else {
          // eslint-disable-next-line no-await-in-loop
          await sleep(noDownRateSleep);
        }
      }
    }
    throw new Error('Maximum retries');
  };

  getBlockNumber = async (): Promise<number> =>
    this.call(async () => this.web3.eth.getBlockNumber(), 'getBlockNumber()', undefined);

  getBlock = async (blockNum: number): Promise<BlockTransactionString> =>
    this.call(async () => this.web3.eth.getBlock(blockNum), 'getBlock()', undefined);

  getTransaction = async (
    transactionHash: string,
    options: {retryNumber?: number; noDownRateSleep?: number} = {},
  ): Promise<Transaction> =>
    this.call(async () => this.web3.eth.getTransaction(transactionHash), 'getTransaction()', {
      retryNumber: options.retryNumber,
      noDownRateSleep: options.noDownRateSleep,
    });

  getTransactionReceipt = async (
    transactionHash: string,
    options: {retryNumber?: number; noDownRateSleep?: number} = {},
  ): Promise<TransactionReceipt> =>
    this.call(async () => this.web3.eth.getTransactionReceipt(transactionHash), 'getTransactionReceipt()', {
      retryNumber: options.retryNumber,
      noDownRateSleep: options.noDownRateSleep,
    });

  getERC20Decimals = async (tokenAddress: string): Promise<BigNumber> => {
<<<<<<< HEAD
    const token = new this.web3.eth.Contract(erc20Abi as Array<AbiItem>, tokenAddress);
=======
    const token = new this.web3.eth.Contract(erc20Abi.abi as Array<AbiItem>, tokenAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    return this.call(async () => {
      const decimals: string = await token.methods.decimals().call();
      return new BigNumber(decimals);
    }, 'getERC20Decimals()');
  };

  getERC20Name = async (tokenAddress: string): Promise<string> => {
<<<<<<< HEAD
    const token = new this.web3.eth.Contract(erc20Abi as Array<AbiItem>, tokenAddress);
=======
    const token = new this.web3.eth.Contract(erc20Abi.abi as Array<AbiItem>, tokenAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    return this.call(async () => token.methods.name().call(), 'getERC20Name()');
  };

  getERC20Symbol = async (tokenAddress: string): Promise<string> => {
<<<<<<< HEAD
    const token = new this.web3.eth.Contract(erc20Abi as Array<AbiItem>, tokenAddress);
=======
    const token = new this.web3.eth.Contract(erc20Abi.abi as Array<AbiItem>, tokenAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    return this.call(async () => token.methods.symbol().call(), 'getERC20Symbol()');
  };

  getERC20TotalSupply = async (tokenAddress: string, decimals: BigNumber): Promise<BigNumber> => {
<<<<<<< HEAD
    const token = new this.web3.eth.Contract(erc20Abi as Array<AbiItem>, tokenAddress);
=======
    const token = new this.web3.eth.Contract(erc20Abi.abi as Array<AbiItem>, tokenAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    return this.call(async () => {
      const totalSupply: string = await token.methods.totalSupply().call();
      return new BigNumber(totalSupply).div(new BigNumber(10).pow(decimals));
    }, 'getERC20TotalSupply()');
  };

  getLaunchpadInfo = async (
    launchpadAddress: string,
    saleTokenDecimals: BigNumber | null,
    baseTokenDecimals: BigNumber | null,
  ): Promise<ILaunchpadInfo> => {
<<<<<<< HEAD
    const launchpad = new this.web3.eth.Contract(launchpadAbi as Array<AbiItem>, launchpadAddress);
=======
    const launchpad = new this.web3.eth.Contract(launchpadAbi.abi as Array<AbiItem>, launchpadAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    const launchpadInfoResponse = await this.call<ILaunchpadInfoResponse>(
      () => launchpad.methods.launchpadInfo().call(),
      'getLaunchpadInfo()',
    );
    const {
      launchpadOwner,
      sToken,
      bToken,
      amount,
      tokensPerBaseToken,
      maxSpendPerBuyer,
      softCap,
      hardcap,
      liquidityPercentage,
      listingRate,
      lockPeriod,
      startTime,
      endTime,
<<<<<<< HEAD
      isGLMR,
=======
      is_BNB,
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    } = launchpadInfoResponse;
    if (!saleTokenDecimals) {
      // eslint-disable-next-line no-param-reassign
      saleTokenDecimals = await this.getERC20Decimals(sToken);
    }
    if (!baseTokenDecimals) {
      // eslint-disable-next-line no-param-reassign
      baseTokenDecimals = await this.getERC20Decimals(bToken);
    }
    return {
      launchpadOwner,
      sToken,
      bToken,
      amount: new BigNumber(amount).div(new BigNumber(10).pow(saleTokenDecimals)),
      tokensPerBaseToken: new BigNumber(tokensPerBaseToken).div(new BigNumber(10).pow(baseTokenDecimals)),
      maxSpendPerBuyer: new BigNumber(maxSpendPerBuyer).div(new BigNumber(10).pow(baseTokenDecimals)),
      softcap: new BigNumber(softCap).div(new BigNumber(10).pow(baseTokenDecimals)),
      hardcap: new BigNumber(hardcap).div(new BigNumber(10).pow(baseTokenDecimals)),
      liquidityPercent: Number(liquidityPercentage) / 10,
      listingRatePercent: Number(listingRate),
      lockPeriod: BigInt(lockPeriod),
      startBlockDate: new Date(Number(startTime) * 1000),
      endBlockDate: new Date(Number(endTime) * 1000),
<<<<<<< HEAD
      isGLMR,
=======
      is_BNB,
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    };
  };

  getLaunchpadFeeInfo = async (launchpadAddress: string): Promise<ILaunchpadFeeInfo> => {
<<<<<<< HEAD
    const launchpad = new this.web3.eth.Contract(launchpadAbi as Array<AbiItem>, launchpadAddress);
=======
    const launchpad = new this.web3.eth.Contract(launchpadAbi.abi as Array<AbiItem>, launchpadAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    const launchpadFeeInfoResponse = await this.call<ILaunchpadFeeInfoResponse>(
      () => launchpad.methods.launchpadFeeInfo().call(),
      'getLaunchpadFeeInfo()',
    );
    const {energyFiTokenFee, referralFee, baseFeeAddress, tokenFeeAddress, referralFeeAddress} =
      launchpadFeeInfoResponse;
    return {
      energyfiTokenFeePercent: Number(energyFiTokenFee) / 10,
      referralFeePercent: Number(referralFee) / 10,
      baseFeeAddress,
      tokenFeeAddress,
      referralFeeAddress,
    };
  };

  getLaunchpadStatus = async (
    launchpadAddress: string,
    saleTokenDecimals: BigNumber,
    baseTokenDecimals: BigNumber,
  ): Promise<ILaunchpadStatus> => {
<<<<<<< HEAD
    const launchpad = new this.web3.eth.Contract(launchpadAbi as Array<AbiItem>, launchpadAddress);
=======
    const launchpad = new this.web3.eth.Contract(launchpadAbi.abi as Array<AbiItem>, launchpadAddress);
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
    const launchpadStatusResponse = await this.call<ILaunchpadStatusResponse>(
      () => launchpad.methods.launchpadStatus().call(),
      'getLaunchpadStatus()',
    );
    const {
      forceFailed,
      lpGenerationComplete,
      whitelistOnly,
      lpGenerationTimestamp,
      totalBaseCollected,
      totalBaseWithdrawn,
      totalTokensSold,
      totalTokensWithdrawn,
      numBuyers,
      round1Length,
    } = launchpadStatusResponse;
    return {
      forceFailed,
      lpGenerationComplete,
      whitelistOnly,
      lpGenerationTimestamp: BigInt(lpGenerationTimestamp),
      totalBaseCollected: new BigNumber(totalBaseCollected).div(new BigNumber(10).pow(baseTokenDecimals)),
      totalBaseWithdrawn: new BigNumber(totalBaseWithdrawn).div(new BigNumber(10).pow(baseTokenDecimals)),
      totalTokensSold: new BigNumber(totalTokensSold).div(new BigNumber(10).pow(saleTokenDecimals)),
      totalTokensWithdrawn: new BigNumber(totalTokensWithdrawn).div(new BigNumber(10).pow(saleTokenDecimals)),
      numBuyers: BigInt(numBuyers),
      round1Length: BigInt(round1Length),
    };
  };

  getEarlyAccessTokensLength = async (launchpadSettings: Contract): Promise<number> =>
    this.call<number>(
      async () => Number(await launchpadSettings.methods.earlyAccessTokensLength().call()),
      'getEarlyAccessTokensLength()',
    );

  getEarlyAccessTokenAtIndex = (launchpadSettings: Contract, index: string): Promise<string> =>
    this.call<string>(
      () => launchpadSettings.methods.getEarlyAccessTokenAtIndex(index).call(),
      'getEarlyAccessTokenAtIndex()',
    );

  getEARLY_ACCESS_AMOUNTS = (
    launchpadSettings: Contract,
    earlyAccessTokenAddress: string,
    earlyAccessTokenDecimals: BigNumber,
  ): Promise<BigNumber> =>
    this.call<BigNumber>(async () => {
      const earlyAccessAmount = await launchpadSettings.methods.EARLY_ACCESS_AMOUNTS(earlyAccessTokenAddress).call();
      return new BigNumber(earlyAccessAmount).div(new BigNumber(10).pow(earlyAccessTokenDecimals));
    }, 'getEARLY_ACCESS_AMOUNTS()');

  getEarlyAccessToken = async (): Promise<{earlyAccessTokenAddress: string; earlyAccessTokenAmount: BigNumber}> => {
    const launchpadSettings = new this.web3.eth.Contract(
<<<<<<< HEAD
      launchpadSettingsAbi as Array<AbiItem>,
=======
      launchpadSettingsAbi.abi as Array<AbiItem>,
>>>>>>> a131d401ae03cb1fc7023f86de394f2895aab30a
      LAUNCHPAD_SETTINGS_ADDRESS,
    );
    const earlyAccessTokensLength = await this.getEarlyAccessTokensLength(launchpadSettings);
    if (earlyAccessTokensLength > 0) {
      const earlyAccessTokenAddress = await this.getEarlyAccessTokenAtIndex(launchpadSettings, '0x0');
      const earlyAccessTokenDecimals = await this.getERC20Decimals(earlyAccessTokenAddress);
      const earlyAccessTokenAmount = await this.getEARLY_ACCESS_AMOUNTS(
        launchpadSettings,
        earlyAccessTokenAddress,
        earlyAccessTokenDecimals,
      );
      return {
        earlyAccessTokenAddress,
        earlyAccessTokenAmount,
      };
    }
    return {earlyAccessTokenAddress: '', earlyAccessTokenAmount: new BigNumber(0)};
  };
}

export const rpc = new Rpc();
