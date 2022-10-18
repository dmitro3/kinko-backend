/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import {openDb} from 'db';

// Creates the sqlite database
const initDB = async () => {
  try {
    const db = await openDb();
    try {
      await db.exec(
        `CREATE TABLE "ilos" (
				"id" INTEGER NOT NULL UNIQUE,
				"ilo_name" TEXT NOT NULL,
				"creator_address" TEXT NOT NULL,
				"launchpad_address" TEXT NOT NULL UNIQUE,
				"sale_token_address" TEXT NOT NULL UNIQUE,
				"sale_token_name" TEXT NOT NULL,
				"sale_token_symbol" TEXT NOT NULL,
				"base_token_address" TEXT NOT NULL,
				"base_token_name" TEXT NOT NULL,
				"base_token_symbol" TEXT NOT NULL,
				"hardcap" TEXT NOT NULL,
				"softcap" TEXT NOT NULL,
				"start_block_date" INTEGER NOT NULL,
				"end_block_date" INTEGER NOT NULL,
				"logo_file_name" TEXT NOT NULL,
				"header_image_file_name" TEXT NOT NULL,
				"telegram_url" TEXT NOT NULL,
				"twitter_url" TEXT NOT NULL,
				"website_url" TEXT NOT NULL,
				"whitepaper_url" TEXT NOT NULL,
				"description" TEXT NOT NULL,
				"liquidity_rate_percent" TEXT NOT NULL,
				"lock_period" INTEGER NOT NULL,
				"max_spend_per_buyer" TEXT NOT NULL,
				"presale_amount" TEXT NOT NULL,
				"energyfi_token_fee_percent" TEXT NOT NULL,
				"referral_fee_percent" TEXT NOT NULL,
				"base_fee_address" TEXT NOT NULL,
				"token_fee_address" TEXT NOT NULL,
				"referral_fee_address" TEXT NOT NULL,
				"listing_rate_percent" TEXT NOT NULL,
				"is_bnb" INTEGER NOT NULL,
				"add_liquidity_transaction_hash" TEXT,
				"category" TEXT NULL,
				PRIMARY KEY("id" AUTOINCREMENT)
			);`,
      );
      await db.exec(
        `CREATE TABLE "ilos_referral" (
				"id" INTEGER NOT NULL UNIQUE,
				"ilos_id" INTEGER NOT NULL,
				"referral_address" TEXT NOT NULL,
				"referral_sign" TEXT NOT NULL,
				"referral_id" TEXT NULL,
				"status" BOOLEAN DEFAULT true,
				PRIMARY KEY("id" AUTOINCREMENT)
      		);`,
      );
    } finally {
      await db.close();
    }
    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.log('db error', e);
    process.exit(1);
  }
};

const charity = async () => {
  try {
    const db = await openDb();
    try {
      await db.exec(
        `CREATE TABLE "charityData" (
				  "id" INTEGER NOT NULL UNIQUE,
				  "charityIndex" TEXT NOT NULL,
				  "charityReward" TEXT NOT NULL,
				  "distributionTime" DATE NOT NULL,
				  "endingTime" DATE ,
				  "startingTime" DATE ,
				  "charityAddress" TEXT,
				  "charityAddressId" TEXT,
				  "charityAddressCreator" TEXT,
				  "RewardTokenAddress" TEXT,
				  "RewardTokenName" TEXT,
                  "RewardTokenSymbol" TEXT,
				  "SourceTokenAddress" TEXT,
                  "SourceTokenName" TEXT,
                  "SourceTokenSymbol" TEXT,
				  "totalDonation" INTEGER DEFAULT 0,
				  "secondDistributionTime" TEXT,
				  "secondEndingTime" TEXT ,
				  "secondStartingTime" TEXT ,
				  "Timestamp" TIMESTAMP,
				  PRIMARY KEY("id" AUTOINCREMENT)
				);`,
      );
    } finally {
      await db.close();
    }

    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.log('db error', e);
    process.exit(1);
  }
};

const donorList = async () => {
  try {
    const db = await openDb();
    try {
      await db.exec(
        `CREATE TABLE "donorList" (
				  "id" INTEGER NOT NULL UNIQUE,
				  "charityIndex" TEXT NOT NULL,
				  "charityAddress" TEXT,
				  "donorAddress" TEXT,
				  "donorId" TEXT,
				  "donatedAmount" INTEGER,
				  "donorList" TEXT NOT NULL,
				  PRIMARY KEY("id" AUTOINCREMENT)
				);`,
      );
    } finally {
      await db.close();
    }
    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.log('db error', e);
    process.exit(1);
  }
};

donorList();
charity();
initDB();
