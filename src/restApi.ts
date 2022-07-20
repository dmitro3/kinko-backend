import BigNumber from 'bignumber.js';
import {getCachedLaunchpadInfo, getCachedLaunchpadStatus} from 'cache';
import {EARLY_ACCESS_TOKEN_ADDRESS, EARLY_ACCESS_TOKEN_AMOUNT, WBNB_ADDRESS} from 'constants/env';
import {openDb} from 'db';
import {bufferToHex, ecrecover, hashPersonalMessage, pubToAddress} from 'ethereumjs-util';
import {Request, Response} from 'express';
import {AsyncRouter} from 'express-async-router';
import {rpc} from 'rpc';
import {IIlo} from 'types';
import {getIloStatus, saveImage} from 'utils';

export const routes = AsyncRouter();

interface CreateIloRequestBody {
  iloName: string;
  launchpadAddress: string;
  r: string;
  s: string;
  v: string;
  logo: string;
  headerImage: string;
  telegramURL: string;
  twitterURL: string;
  websiteURL: string;
  whitepaperURL: string;
  description: string;
}

interface CreateIloReferallRequest {
  launchpadAddress: string;
  referralAddress: string;
  referralSign: string;
  referralId: string;
}

interface IloReferallRequest {
  id: number;
  user_id: string;
  referral_id?: string;
  referral_address: string;
  referral_sign: string;
  status: boolean;
}

interface GetIlosData {
  id: number;
  ilo_name: string;
  creator_address: string;
  launchpad_address: string;
  sale_token_address: string;
  sale_token_name: string;
  sale_token_symbol: string;
  base_token_address: string;
  base_token_name: string;
  base_token_symbol: string;
  hardcap: string;
  softcap: string;
  start_block_date: number;
  end_block_date: number;
  logo_file_name: string;
  header_image_file_name: string;
  telegram_url: string;
  twitter_url: string;
  website_url: string;
  whitepaper_url: string;
  description: string;
  liquidity_rate_percent: string;
  lock_period: string;
  max_spend_per_buyer: string;
  presale_amount: string;
  energyfi_token_fee_percent: number;
  referral_fee_percent: number;
  base_fee_address: string;
  token_fee_address: string;
  referral_fee_address: string;
  listing_rate_percent: string;
  is_bnb: string;
  add_liquidity_transaction_hash: string;
  referral: IloDataReferallRequest[];
}
interface IloDataReferallRequest {
  id: number;
  user_id: string;
  referral_id?: string;
}

routes.post('/create_ilo', async (req: Request, res: Response) => {
  const {
    iloName,
    launchpadAddress,
    r,
    s,
    v,
    logo,
    headerImage,
    telegramURL,
    twitterURL,
    websiteURL,
    whitepaperURL,
    description,
  }: CreateIloRequestBody = req.body;
  if (typeof iloName !== 'string') {
    throw new Error('iloName is invalid');
  }
  if (typeof launchpadAddress !== 'string') {
    throw new Error('launchpadAddress is invalid');
  }
  if (typeof r !== 'string') {
    throw new Error('r is invalid');
  }
  if (typeof s !== 'string') {
    throw new Error('s is invalid');
  }
  if (typeof v !== 'string') {
    throw new Error('v is invalid');
  }
  if (typeof logo !== 'string') {
    throw new Error('logo is invalid');
  }
  if (typeof headerImage !== 'string') {
    throw new Error('headerImage is invalid');
  }
  if (typeof telegramURL !== 'string') {
    throw new Error('telegramURL is invalid');
  }
  if (typeof twitterURL !== 'string') {
    throw new Error('twitterURL is invalid');
  }
  if (typeof websiteURL !== 'string') {
    throw new Error('websiteURL is invalid');
  }
  if (typeof whitepaperURL !== 'string') {
    throw new Error('whitepaperURL is invalid');
  }
  if (typeof description !== 'string') {
    throw new Error('description is invalid');
  }

  // Check for valid URLs
  const httpsRegex = /^https:\/\//gm;
  if (telegramURL && !telegramURL.match(httpsRegex)) {
    throw new Error('Telegram URL must be https');
  }
  if (twitterURL && !twitterURL.match(httpsRegex)) {
    throw new Error('Twitter URL must be https');
  }
  if (websiteURL && !websiteURL.match(httpsRegex)) {
    throw new Error('Website URL must be https');
  }
  if (whitepaperURL && !whitepaperURL.match(httpsRegex)) {
    throw new Error('Whitepaper URL must be https');
  }

  // Check max length of description
  if (description.length > 300) {
    throw new Error('Max length of description is 300');
  }

  // Check signature
  const signAddress = bufferToHex(
    pubToAddress(
      ecrecover(
        hashPersonalMessage(Buffer.from('kinko')),
        Buffer.from(v, 'hex'),
        Buffer.from(r, 'hex'),
        Buffer.from(s, 'hex'),
      ),
    ),
  );
  const launchpadInfo = await rpc.getLaunchpadInfo(launchpadAddress, null, null);
  if (signAddress.toLowerCase() !== launchpadInfo.launchpadOwner.toLowerCase()) {
    throw new Error('Invalid siganature');
  }
  const {
    hardcap,
    softcap,
    liquidityPercent,
    maxSpendPerBuyer,
    amount: presaleAmount,
    listingRatePercent,
    lockPeriod,
    startBlockDate,
    endBlockDate,
    is_BNB,
  } = launchpadInfo;

  const launchpadFeeInfo = await rpc.getLaunchpadFeeInfo(launchpadAddress);
  const {energyfiTokenFeePercent, referralFeePercent, baseFeeAddress, tokenFeeAddress, referralFeeAddress} =
    launchpadFeeInfo;

  // Check if ilo is already in use
  const db = await openDb();
  try {
    let stmt = await db.prepare(`
			SELECT COUNT(*) as count
			FROM ilos
			WHERE LOWER(ilos.ilo_name) = LOWER($ilo_name)`);
    try {
      await stmt.bind({$ilo_name: iloName.trim()});
      const result = await stmt.get<{count: number}>();
      if (result?.count !== 0) {
        throw new Error('Ilo name is already in use');
      }
    } finally {
      await stmt.finalize();
    }

    // Save images
    const logoFileName = await saveImage(logo);
    const headerImageFileName = await saveImage(headerImage);

    // Get token names and symbols
    const saleTokenName = await rpc.getERC20Name(launchpadInfo.sToken);
    const saleTokenSymbol = await rpc.getERC20Symbol(launchpadInfo.sToken);
    const baseTokenName = await rpc.getERC20Name(launchpadInfo.bToken);
    const baseTokenSymbol = await rpc.getERC20Symbol(launchpadInfo.bToken);

    const adaptedBaseTokenName =
      launchpadInfo.bToken.toLowerCase() === WBNB_ADDRESS.toLowerCase() ? 'BNB' : baseTokenName;
    const adaptedBaseTokenSymbol =
      launchpadInfo.bToken.toLowerCase() === WBNB_ADDRESS.toLowerCase() ? 'BNB' : baseTokenSymbol;

    stmt = await db.prepare(`
			INSERT INTO "ilos" (
				"ilo_name",
				"creator_address",
				"launchpad_address",
				"sale_token_address",
				"sale_token_name",
				"sale_token_symbol",
				"base_token_address",
				"base_token_name",
				"base_token_symbol",
				"hardcap",
				"softcap",
				"start_block_date",
				"end_block_date",
				"logo_file_name",
				"header_image_file_name",
				"telegram_url",
				"twitter_url",
				"website_url",
				"whitepaper_url",
				"description",
				"liquidity_rate_percent",
				"lock_period",
				"max_spend_per_buyer",
				"presale_amount",
				"energyfi_token_fee_percent",
				"referral_fee_percent",
				"base_fee_address",
				"token_fee_address",
				"referral_fee_address",
				"listing_rate_percent",
				"is_bnb"
			) VALUES (
				$ilo_name,
				$creator_address,
				$launchpad_address,
				$sale_token_address,
				$sale_token_name,
				$sale_token_symbol,
				$base_token_address,
				$base_token_name,
				$base_token_symbol,
				$hardcap,
				$softcap,
				$start_block_date,
				$end_block_date,
				$logo_file_name,
				$header_image_file_name,
				$telegram_url,
				$twitter_url,
				$website_url,
				$whitepaper_url,
				$description,
				$liquidity_rate_percent,
				$lock_period,
				$max_spend_per_buyer,
				$presale_amount,
				$energyfi_token_fee_percent,
				$referral_fee_percent,
				$base_fee_address,
				$token_fee_address,
				$referral_fee_address,
				$listing_rate_percent,
				$is_bnb
			);`);
    try {
      await stmt.bind({
        $ilo_name: iloName.trim(),
        $creator_address: launchpadInfo.launchpadOwner.toLowerCase(),
        $launchpad_address: launchpadAddress.toLowerCase(),
        $sale_token_address: launchpadInfo.sToken.toLowerCase(),
        $sale_token_name: saleTokenName,
        $sale_token_symbol: saleTokenSymbol,
        $base_token_address: launchpadInfo.bToken.toLowerCase(),
        $base_token_name: adaptedBaseTokenName,
        $base_token_symbol: adaptedBaseTokenSymbol,
        $hardcap: hardcap.toString(),
        $softcap: softcap.toString(),
        $start_block_date: Math.round(startBlockDate.getTime() / 1000),
        $end_block_date: Math.round(endBlockDate.getTime() / 1000),
        $logo_file_name: logoFileName,
        $header_image_file_name: headerImageFileName,
        $telegram_url: telegramURL,
        $twitter_url: twitterURL,
        $website_url: websiteURL,
        $whitepaper_url: whitepaperURL,
        $description: description,
        $liquidity_rate_percent: liquidityPercent.toString(),
        $lock_period: lockPeriod.toString(),
        $max_spend_per_buyer: maxSpendPerBuyer.toString(),
        $presale_amount: presaleAmount.toString(),
        $energyfi_token_fee_percent: energyfiTokenFeePercent.toString(),
        $referral_fee_percent: referralFeePercent.toString(),
        $base_fee_address: baseFeeAddress,
        $token_fee_address: tokenFeeAddress,
        $referral_fee_address: referralFeeAddress,
        $listing_rate_percent: listingRatePercent.toString(),
        $is_bnb: is_BNB ? 1 : 0,
      });
      await stmt.run();
    } finally {
      await stmt.finalize();
    }

    return res.send();
  } finally {
    await db.close();
  }
});

routes.post('/get_ilo', async (req: Request, res: Response<{ilo: IIlo}>) => {
  const {launchpadAddress} = req.body;
  if (typeof launchpadAddress !== 'string') {
    throw new Error('launchpadAddress is invalid');
  }

  const db = await openDb();
  try {
    const stmt = await db.prepare(`
			SELECT
				"ilo_name",
				"creator_address",
				"launchpad_address",
				"sale_token_address",
				"sale_token_name",
				"sale_token_symbol",
				"base_token_address",
				"base_token_name",
				"base_token_symbol",
				"hardcap",
				"softcap",
				"logo_file_name",
				"header_image_file_name",
				"telegram_url",
				"twitter_url",
				"website_url",
				"whitepaper_url",
				"description",
				"liquidity_rate_percent",
				"lock_period",
				"presale_amount",
				"energyfi_token_fee_percent",
				"listing_rate_percent",
				"is_bnb",
				"add_liquidity_transaction_hash"
			FROM "ilos"
			WHERE LOWER("launchpad_address") = LOWER($launchpad_address)`);
    try {
      await stmt.bind({$launchpad_address: launchpadAddress});
      const result = await stmt.get<{
        ilo_name: string;
        creator_address: string;
        launchpad_address: string;
        sale_token_address: string;
        sale_token_name: string;
        sale_token_symbol: string;
        base_token_address: string;
        base_token_name: string;
        base_token_symbol: string;
        hardcap: string;
        softcap: string;
        logo_file_name: string;
        header_image_file_name: string;
        telegram_url: string;
        twitter_url: string;
        website_url: string;
        whitepaper_url: string;
        description: string;
        liquidity_rate_percent: string;
        lock_period: number;
        presale_amount: string;
        energyfi_token_fee_percent: string;
        listing_rate_percent: string;
        is_bnb: number;
        add_liquidity_transaction_hash: string | null;
      }>();
      if (!result) {
        throw new Error('Ilo not found');
      }
      const {
        ilo_name,
        creator_address,
        launchpad_address,
        sale_token_address,
        sale_token_name,
        sale_token_symbol,
        base_token_address,
        base_token_name,
        base_token_symbol,
        hardcap,
        softcap,
        logo_file_name,
        header_image_file_name,
        telegram_url,
        twitter_url,
        website_url,
        whitepaper_url,
        description,
        liquidity_rate_percent,
        lock_period,
        presale_amount,
        energyfi_token_fee_percent,
        listing_rate_percent,
        is_bnb,
        add_liquidity_transaction_hash,
      } = result;
      const saleTokenDecimals = await rpc.getERC20Decimals(sale_token_address);
      const baseTokenDecimals = await rpc.getERC20Decimals(base_token_address);
      const launchpadInfo = await getCachedLaunchpadInfo(launchpadAddress, saleTokenDecimals, baseTokenDecimals);
      const {startBlockDate, endBlockDate, maxSpendPerBuyer} = launchpadInfo;
      const launchpadStatus = await rpc.getLaunchpadStatus(launchpadAddress, saleTokenDecimals, baseTokenDecimals);
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
      } = launchpadStatus;

      const iloStatus = await getIloStatus({
        startBlockDate,
        endBlockDate,
        forceFailed,
        totalBaseCollected,
        hardcap: new BigNumber(hardcap),
        softcap: new BigNumber(softcap),
        round1Length,
        lpGenerationComplete,
      });

      const saleTokenTotalSupply = await rpc.getERC20TotalSupply(sale_token_address, saleTokenDecimals);
      const round1EndDate = new Date(
        Math.min(startBlockDate.getTime() + Number(round1Length) * 1000, endBlockDate.getTime()),
      );
      const ilo: IIlo = {
        iloName: ilo_name,
        creatorAddress: creator_address,
        launchpadAddress: launchpad_address,
        saleTokenAddress: sale_token_address,
        saleTokenName: sale_token_name,
        saleTokenSymbol: sale_token_symbol,
        baseTokenAddress: base_token_address,
        baseTokenName: base_token_name,
        baseTokenSymbol: base_token_symbol,
        hardcap,
        softcap,
        startBlockDate: startBlockDate.toISOString(),
        endBlockDate: endBlockDate.toISOString(),
        logoFileName: logo_file_name,
        headerImageFileName: header_image_file_name,
        telegramURL: telegram_url,
        twitterURL: twitter_url,
        websiteURL: website_url,
        whitepaperURL: whitepaper_url,
        description,
        forceFailed,
        lpGenerationComplete,
        whitelistOnly,
        totalBaseCollected: totalBaseCollected.toString(),
        totalBaseWithdrawn: totalBaseWithdrawn.toString(),
        totalTokensSold: totalTokensSold.toString(),
        totalTokensWithdrawn: totalTokensWithdrawn.toString(),
        numBuyers: Number(numBuyers),
        round1Length: Number(round1Length),
        status: iloStatus,
        earlyAccessTokenAddress: EARLY_ACCESS_TOKEN_ADDRESS,
        earlyAccessTokenAmount: EARLY_ACCESS_TOKEN_AMOUNT.toString(),
        liquidityRatePercent: Number(liquidity_rate_percent),
        round1EndDate: round1EndDate.toISOString(),
        lockPeriod: lock_period.toString(),
        maxSpendPerBuyer: maxSpendPerBuyer.toString(),
        presaleAmount: presale_amount,
        energyfiTokenFeePercent: Number(energyfi_token_fee_percent),
        saleTokenTotalSupply: saleTokenTotalSupply.toString(),
        listingRatePercent: Number(listing_rate_percent),
        is_Bnb: !!is_bnb,
        lpGenerationTimestamp: lpGenerationTimestamp.toString(),
        addLiquidityTransactionHash: add_liquidity_transaction_hash ?? '',
      };
      return res.send({ilo});
    } finally {
      await stmt.finalize();
    }
  } finally {
    await db.close();
  }
});

routes.post('/get_ilos', async (req: Request, res: Response<{ilos: Array<IIlo>}>) => {
  const db = await openDb();
  try {
    const results = await db.all<
      Array<{
        ilo_name: string;
        creator_address: string;
        launchpad_address: string;
        sale_token_address: string;
        sale_token_name: string;
        sale_token_symbol: string;
        base_token_address: string;
        base_token_name: string;
        base_token_symbol: string;
        hardcap: string;
        softcap: string;
        logo_file_name: string;
        header_image_file_name: string;
        telegram_url: string;
        twitter_url: string;
        website_url: string;
        whitepaper_url: string;
        description: string;
        liquidity_rate_percent: string;
        lock_period: number;
        presale_amount: string;
        energyfi_token_fee_percent: string;
        listing_rate_percent: string;
        is_bnb: number;
        add_liquidity_transaction_hash: string | null;
      }>
    >(
      `SELECT
			"ilo_name",
			"creator_address",
			"launchpad_address",
			"sale_token_address",
			"sale_token_name",
			"sale_token_symbol",
			"base_token_address",
			"base_token_name",
			"base_token_symbol",
			"hardcap",
			"softcap",
			"logo_file_name",
			"header_image_file_name",
			"telegram_url",
			"twitter_url",
			"website_url",
			"whitepaper_url",
			"description",
			"liquidity_rate_percent",
			"lock_period",
			"presale_amount",
			"energyfi_token_fee_percent",
			"listing_rate_percent",
			"is_bnb"
		FROM "ilos"`,
    );
    const ilos: Array<IIlo> = await Promise.allSettled(
      results.map<Promise<IIlo>>(async result => {
        const {
          ilo_name,
          creator_address,
          launchpad_address,
          sale_token_address,
          sale_token_name,
          sale_token_symbol,
          base_token_address,
          base_token_name,
          base_token_symbol,
          hardcap,
          softcap,
          logo_file_name,
          header_image_file_name,
          telegram_url,
          twitter_url,
          website_url,
          whitepaper_url,
          description,
          liquidity_rate_percent,
          lock_period,
          presale_amount,
          energyfi_token_fee_percent,
          listing_rate_percent,
          is_bnb,
          add_liquidity_transaction_hash,
        } = result;
        const saleTokenDecimals = await rpc.getERC20Decimals(sale_token_address);
        const baseTokenDecimals = await rpc.getERC20Decimals(base_token_address);
        const launchpadInfo = await getCachedLaunchpadInfo(launchpad_address, saleTokenDecimals, baseTokenDecimals);
        const {startBlockDate, endBlockDate, maxSpendPerBuyer} = launchpadInfo;
        const launchpadStatus = await getCachedLaunchpadStatus(launchpad_address, saleTokenDecimals, baseTokenDecimals);
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
        } = launchpadStatus;

        const iloStatus = await getIloStatus({
          startBlockDate,
          endBlockDate,
          forceFailed,
          totalBaseCollected,
          hardcap: new BigNumber(hardcap),
          softcap: new BigNumber(softcap),
          round1Length,
          lpGenerationComplete,
        });
        const saleTokenTotalSupply = await rpc.getERC20TotalSupply(sale_token_address, saleTokenDecimals);
        const round1EndDate = new Date(
          Math.min(startBlockDate.getTime() + Number(round1Length) * 1000, endBlockDate.getTime()),
        );
        return {
          iloName: ilo_name,
          creatorAddress: creator_address,
          launchpadAddress: launchpad_address,
          saleTokenAddress: sale_token_address,
          saleTokenName: sale_token_name,
          saleTokenSymbol: sale_token_symbol,
          baseTokenAddress: base_token_address,
          baseTokenName: base_token_name,
          baseTokenSymbol: base_token_symbol,
          hardcap,
          softcap,
          startBlockDate: startBlockDate.toISOString(),
          endBlockDate: endBlockDate.toISOString(),
          logoFileName: logo_file_name,
          headerImageFileName: header_image_file_name,
          telegramURL: telegram_url,
          twitterURL: twitter_url,
          websiteURL: website_url,
          whitepaperURL: whitepaper_url,
          description,
          forceFailed,
          lpGenerationComplete,
          whitelistOnly,
          totalBaseCollected: totalBaseCollected.toString(),
          totalBaseWithdrawn: totalBaseWithdrawn.toString(),
          totalTokensSold: totalTokensSold.toString(),
          totalTokensWithdrawn: totalTokensWithdrawn.toString(),
          numBuyers: Number(numBuyers),
          round1Length: Number(round1Length),
          status: iloStatus,
          earlyAccessTokenAddress: EARLY_ACCESS_TOKEN_ADDRESS,
          earlyAccessTokenAmount: EARLY_ACCESS_TOKEN_AMOUNT.toString(),
          liquidityRatePercent: Number(liquidity_rate_percent),
          round1EndDate: round1EndDate.toISOString(),
          lockPeriod: lock_period.toString(),
          maxSpendPerBuyer: maxSpendPerBuyer.toString(),
          presaleAmount: presale_amount,
          energyfiTokenFeePercent: Number(energyfi_token_fee_percent),
          saleTokenTotalSupply: saleTokenTotalSupply.toString(),
          listingRatePercent: Number(listing_rate_percent),
          is_Bnb: !!is_bnb,
          lpGenerationTimestamp: lpGenerationTimestamp.toString(),
          addLiquidityTransactionHash: add_liquidity_transaction_hash ?? '',
        };
      }),
    ).then(results =>
      results
        .filter((result): result is PromiseFulfilledResult<IIlo> => result.status === 'fulfilled')
        .map(({value}) => value),
    );

    return res.send({ilos});
  } finally {
    await db.close();
  }
});

routes.post('/is_ilo_name_available', async (req: Request, res: Response<{isAvailable: boolean}>) => {
  const {iloName} = req.body;
  if (typeof iloName !== 'string') {
    throw new Error('iloName is invalid');
  }
  const db = await openDb();
  try {
    const stmt = await db.prepare(`
			SELECT COUNT(*) as "count"
			FROM "ilos"
			WHERE LOWER("ilo_name") = LOWER($ilo_name)`);
    try {
      await stmt.bind({
        $ilo_name: iloName.trim(),
      });
      const result = await stmt.get<{count: number}>();
      const isAvailable = result?.count === 0;
      return res.send({isAvailable});
    } finally {
      await stmt.finalize();
    }
  } finally {
    await db.close();
  }
});

routes.post('/is_sale_token_available', async (req: Request, res: Response<{isAvailable: boolean}>) => {
  const {saleTokenAddress} = req.body;
  if (typeof saleTokenAddress !== 'string') {
    throw new Error('saleTokenAddress is invalid');
  }
  const db = await openDb();
  try {
    const stmt = await db.prepare(`
			SELECT COUNT(*) as "count"
			FROM "ilos"
			WHERE LOWER("sale_token_address") = LOWER($sale_token_address)`);
    try {
      await stmt.bind({
        $sale_token_address: saleTokenAddress.trim(),
      });
      const result = await stmt.get<{count: number}>();
      const isAvailable = result?.count === 0;
      return res.send({isAvailable});
    } finally {
      await stmt.finalize();
    }
  } finally {
    await db.close();
  }
});

routes.post('/add_liquidity_transaction', async (req: Request, res: Response) => {
  const {transactionHash} = req.body;
  if (typeof transactionHash !== 'string') {
    throw new Error('transactionHash is invalid');
  }
  const transaction = await rpc.getTransaction(transactionHash, {retryNumber: 60, noDownRateSleep: 1000});
  if (transaction.input.toLowerCase() === '0xe8078d94') {
    const transactionReceipt = await rpc.getTransactionReceipt(transactionHash, {
      retryNumber: 60,
      noDownRateSleep: 1000,
    });
    if (transactionReceipt.status) {
      const db = await openDb();
      try {
        const stmt = await db.prepare(`
					UPDATE "ilos"
					SET "add_liquidity_transaction_hash" = $add_liquidity_transaction_hash
					WHERE LOWER("launchpad_address") = LOWER($launchpad_address)`);
        try {
          await stmt.bind({
            $add_liquidity_transaction_hash: transaction.hash,
            $launchpad_address: transaction.to,
          });
          await stmt.run();

          return res.send();
        } finally {
          await stmt.finalize();
        }
      } finally {
        await db.close();
      }
    }
  }
  throw new Error('Transaction not found');
});

routes.post('/create-referral', async (req: Request, res: Response) => {
  const {launchpadAddress, referralAddress, referralSign}: CreateIloReferallRequest = req.body;
  if (typeof launchpadAddress !== 'string') {
    throw new Error('Launchpad Address is invalid');
  }
  // if (typeof referralId !== 'string') {
  //   throw new Error('referralId is invalid');
  // }
  // if (typeof userId !== 'string') {
  //   throw new Error('userId is invalid');
  // }
  if (typeof referralAddress !== 'string') {
    throw new Error('referralAddress is invalid');
  }
  if (typeof referralSign !== 'string') {
    throw new Error('referralSign is invalid');
  }
  const referralId = `r-${Math.floor(Math.random() * 999999 + 1)}`;
  const db = await openDb();
  try {
    let ilosData = [];
    let ilos: any = {};
    let response: any = {};
    /** Check if ilo id is exist or not */
    let stmt = await db.prepare(`
    SELECT i.*
    FROM ilos i
    WHERE i.launchpad_address = $launchpadAddress`);
    try {
      await stmt.bind({$launchpadAddress: launchpadAddress});
      ilos = await stmt.get();
      if (!ilos) {
        throw new Error('Ilo id is invalid!');
      }
    } finally {
      await stmt.finalize();
    }
    /** get if ilo referal data */
    stmt = await db.prepare(`
			SELECT ir.*
			FROM ilos i
      INNER JOIN ilos_referral ir ON ir.ilos_id = i.id
			WHERE i.launchpad_address = $launchpadAddress and referral_address = $referralAddress and ir.status = true order by ir.id ASC`);
    try {
      await stmt.bind({$launchpadAddress: launchpadAddress, $referralAddress: referralAddress});
      ilosData = await stmt.all();
    } finally {
      await stmt.finalize();
    }

    /** delete referal first row when data is more than or equal 3*/
    if (ilosData.length >= 1) {
      stmt = await db.prepare(`update ilos_referral set status = false where id = ${ilosData[0].id}`);
      try {
        await stmt.run();
      } finally {
        await stmt.finalize();
      }
    }

    /** Insert ilos referral data */
    stmt = await db.prepare(`
    	INSERT INTO "ilos_referral" ("ilos_id", "referral_id", "referral_address", "referral_sign") 
      VALUES ($ilosId,$referral_id,$referral_address,$referral_sign);`);
    try {
      await stmt.bind({
        $ilosId: ilos.id,
        $referral_id: referralId,
        $referral_address: referralAddress,
        $referral_sign: referralSign,
      });
      await stmt.run();
    } finally {
      await stmt.finalize();
    }

    stmt = await db.prepare(
      `select * from (SELECT *, i.id as ilosId
        FROM ilos_referral ir
        LEFT JOIN ilos i ON ir.ilos_id = i.id and ir.referral_address = $referralAddress 
      order by ir.id ASC) as tmp where status = true`,
    );
    try {
      await stmt.bind({$referralAddress: referralAddress});
      const result = await stmt.all();
      response = result[0];
      response.referral = [];
      const iloLength = result.length;
      for (let i = 0; i < iloLength; i += 1) {
        const referral: IloReferallRequest = {
          id: result[i].id,
          user_id: result[i].user_id,
          referral_id: result[i].referral_id,
          referral_address: result[i].referral_address,
          referral_sign: result[i].referral_sign,
          status: result[i].status,
        };
        response.referral.push(referral);
      }
    } finally {
      await stmt.finalize();
    }

    const link = {frontend: `ilo/${launchpadAddress}/${referralId}`, backend: `api/v1/get-referral-by-id`};
    return res.json({link, result: response});
  } finally {
    await db.close();
  }
});

routes.post('/get-referral-by-id', async (req: Request, res: Response) => {
  const {referralId}: CreateIloReferallRequest = req.body;
  if (typeof referralId !== 'string') {
    throw new Error('referralId is invalid');
  }

  const db = await openDb();
  try {
    let results = [];
    let stmt = await db.prepare(`
    SELECT *, i.id as ilosId
			FROM ilos_referral ir
      INNER JOIN ilos i ON ir.ilos_id = i.id
      WHERE ir.referral_id = $referralId  
		order by ir.id ASC`);
    try {
      await stmt.bind({$referralId: referralId});
      results = await stmt.get();
      if (!results) {
        throw new Error('referralId not found');
      }
    } finally {
      await stmt.finalize();
    }

    const {
      ilo_name,
      creator_address,
      launchpad_address,
      sale_token_address,
      sale_token_name,
      sale_token_symbol,
      base_token_address,
      base_token_name,
      base_token_symbol,
      hardcap,
      softcap,
      logo_file_name,
      header_image_file_name,
      telegram_url,
      twitter_url,
      website_url,
      whitepaper_url,
      description,
      liquidity_rate_percent,
      lock_period,
      presale_amount,
      energyfi_token_fee_percent,
      listing_rate_percent,
      is_bnb,
      add_liquidity_transaction_hash,
    } = results;
    const saleTokenDecimals = await rpc.getERC20Decimals(sale_token_address);
    const baseTokenDecimals = await rpc.getERC20Decimals(base_token_address);
    const launchpadInfo = await getCachedLaunchpadInfo(launchpad_address, saleTokenDecimals, baseTokenDecimals);
    const {startBlockDate, endBlockDate, maxSpendPerBuyer} = launchpadInfo;
    const launchpadStatus = await rpc.getLaunchpadStatus(launchpad_address, saleTokenDecimals, baseTokenDecimals);
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
    } = launchpadStatus;

    const iloStatus = await getIloStatus({
      startBlockDate,
      endBlockDate,
      forceFailed,
      totalBaseCollected,
      hardcap: new BigNumber(hardcap),
      softcap: new BigNumber(softcap),
      round1Length,
      lpGenerationComplete,
    });

    const saleTokenTotalSupply = await rpc.getERC20TotalSupply(sale_token_address, saleTokenDecimals);
    const round1EndDate = new Date(
      Math.min(startBlockDate.getTime() + Number(round1Length) * 1000, endBlockDate.getTime()),
    );
    const ilo: IIlo = {
      iloName: ilo_name,
      creatorAddress: creator_address,
      launchpadAddress: launchpad_address,
      saleTokenAddress: sale_token_address,
      saleTokenName: sale_token_name,
      saleTokenSymbol: sale_token_symbol,
      baseTokenAddress: base_token_address,
      baseTokenName: base_token_name,
      baseTokenSymbol: base_token_symbol,
      hardcap,
      softcap,
      startBlockDate: startBlockDate.toISOString(),
      endBlockDate: endBlockDate.toISOString(),
      logoFileName: logo_file_name,
      headerImageFileName: header_image_file_name,
      telegramURL: telegram_url,
      twitterURL: twitter_url,
      websiteURL: website_url,
      whitepaperURL: whitepaper_url,
      description,
      forceFailed,
      lpGenerationComplete,
      whitelistOnly,
      totalBaseCollected: totalBaseCollected.toString(),
      totalBaseWithdrawn: totalBaseWithdrawn.toString(),
      totalTokensSold: totalTokensSold.toString(),
      totalTokensWithdrawn: totalTokensWithdrawn.toString(),
      numBuyers: Number(numBuyers),
      round1Length: Number(round1Length),
      status: iloStatus,
      earlyAccessTokenAddress: EARLY_ACCESS_TOKEN_ADDRESS,
      earlyAccessTokenAmount: EARLY_ACCESS_TOKEN_AMOUNT.toString(),
      liquidityRatePercent: Number(liquidity_rate_percent),
      round1EndDate: round1EndDate.toISOString(),
      lockPeriod: lock_period.toString(),
      maxSpendPerBuyer: maxSpendPerBuyer.toString(),
      presaleAmount: presale_amount,
      energyfiTokenFeePercent: Number(energyfi_token_fee_percent),
      saleTokenTotalSupply: saleTokenTotalSupply.toString(),
      listingRatePercent: Number(listing_rate_percent),
      is_Bnb: !!is_bnb,
      lpGenerationTimestamp: lpGenerationTimestamp.toString(),
      addLiquidityTransactionHash: add_liquidity_transaction_hash ?? '',
      referral: [],
    };

    const referral: IloReferallRequest = {
      id: results.id,
      user_id: results.user_id,
      referral_id: results.referral_id,
      referral_address: results.referral_address,
      referral_sign: results.referral_sign,
      status: results.status,
    };
    ilo.referral.push(referral);

    /** get if ilo referal data */
    if (results.status) {
      stmt = await db.prepare(`
    select * from (SELECT *, i.id as ilosId
			FROM ilos_referral ir
      LEFT JOIN ilos i ON ir.ilos_id = i.id and ir.referral_id = $referralId 
		order by ir.id DESC limit 3) as tmp where status = true`);
      try {
        await stmt.bind({$referralId: referralId});
        const result = await stmt.all();

        if (result.length === 0) {
          throw new Error('referralId not found');
        }
        ilo.referral = [];
        const iloLength = result.length;
        for (let i = 0; i < iloLength; i += 1) {
          const referral: IloReferallRequest = {
            id: result[i].id,
            user_id: result[i].user_id,
            referral_id: result[i].referral_id,
            referral_address: result[i].referral_address,
            referral_sign: result[i].referral_sign,
            status: result[i].status,
          };
          ilo.referral.push(referral);
        }
      } finally {
        await stmt.finalize();
      }
    }
    return res.json({result: ilo});
  } finally {
    await db.close();
  }
});

routes.get('/get-all-referral', async (req: Request, res: Response) => {
  const db = await openDb();
  try {
    const ilosData: GetIlosData[] = [];
    /** get if ilo referal data */
    let stmt = await db.prepare(`
			SELECT *, i.id as ilosId
			FROM ilos i
      INNER JOIN ilos_referral ir ON ir.ilos_id = i.id
		`);
    try {
      // ilosData = await stmt.all();
      const result = await stmt.all();
      let id;
      const iloLength = result.length;
      for (let i = 0; i < iloLength; i += 1) {
        if (id !== result[i].ilosId) {
          ilosData.push({
            id: result[i].ilosId,
            ilo_name: result[i].ilo_name,
            creator_address: result[i].creator_address,
            launchpad_address: result[i].launchpad_address,
            sale_token_address: result[i].sale_token_address,
            sale_token_name: result[i].sale_token_name,
            sale_token_symbol: result[i].sale_token_symbol,
            base_token_address: result[i].base_token_address,
            base_token_name: result[i].base_token_name,
            base_token_symbol: result[i].base_token_symbol,
            hardcap: result[i].hardcap,
            softcap: result[i].softcap,
            start_block_date: result[i].start_block_date,
            end_block_date: result[i].end_block_date,
            logo_file_name: result[i].logo_file_name,
            header_image_file_name: result[i].header_image_file_name,
            telegram_url: result[i].telegram_url,
            twitter_url: result[i].twitter_url,
            website_url: result[i].website_url,
            whitepaper_url: result[i].whitepaper_url,
            description: result[i].description,
            liquidity_rate_percent: result[i].liquidity_rate_percent,
            lock_period: result[i].lock_period,
            max_spend_per_buyer: result[i].max_spend_per_buyer,
            presale_amount: result[i].presale_amount,
            energyfi_token_fee_percent: result[i].energyfi_token_fee_percent,
            referral_fee_percent: result[i].referral_fee_percent,
            base_fee_address: result[i].base_fee_address,
            token_fee_address: result[i].token_fee_address,
            referral_fee_address: result[i].referral_fee_address,
            listing_rate_percent: result[i].listing_rate_percent,
            is_bnb: result[i].is_bnb,
            add_liquidity_transaction_hash: result[i].add_liquidity_transaction_hash,
            referral: [],
          });
          // ilosData[ilosData.length - 1].referral = IloReferallRequest
          id = result[i].ilosId;
        }
        const referral: IloReferallRequest = {
          id: result[i].id,
          user_id: result[i].user_id,
          referral_id: result[i].referral_id,
          referral_address: result[i].referral_address,
          referral_sign: result[i].referral_sign,
          status: result[i].status,
        };
        ilosData[ilosData.length - 1].referral.push(referral);
      }
    } finally {
      await stmt.finalize();
    }
    return res.json({result: ilosData});
  } finally {
    await db.close();
  }
});
