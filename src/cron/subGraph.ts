import axios from 'axios';
import {openDb} from 'db';
import {SUB_GRAPH_URL} from '../constants/env';
import moment from 'moment';

export const getCharityDataFromSubgraphUrl = async () => {
  try {
    const db = await openDb();
    let limit: number = 0;
    // const stmt = await db.prepare(` SELECT COUNT(id) as count FROM charityData;`)
    // const count = await stmt.get();
    // await stmt.finalize();
    // if(count?.count){
    //   limit = count.count
    // }
    const url = SUB_GRAPH_URL;
    const query = {
      query: ` {\n  createCharities(\n   skip: ${limit}, first: 1000\n ) {
        
          charityReward
          charityIndex
          id
          endingTime
          startingTime
          distributionTime
          charityAddress {
            charityAddress
            creator
            id
            rewardToken {
              Address
              Name
              Symbol
            }
            sourceToken {
              Address
              Name
              Symbol
            }
          }
          Timestamp
       }\n}`,
      variables: null,
      operationName: 'MyQuery',
      extensions: {
        headers: null,
      },
    };
    let config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const result = await axios.post(url, query, config);
    let createCharities = result.status == 200 ? (result.data ? result.data.data.createCharities : 0) : 0;
    for (const charity of createCharities) {
      let stmt = await db.prepare(`SELECT COUNT(*) as recode FROM charityData
       WHERE charityIndex = "${charity.charityIndex}" AND charityAddress = "${charity.charityAddress.charityAddress}";`);
      const findRecode = await stmt.get();
      await stmt.finalize();
      if (findRecode?.recode === 0) {
        // new Date(new Date(Date.now()).getTime() + 12*6000000)
        
        const startingTime = moment.unix(parseInt(charity.startingTime)).format('YYYY-MM-DD HH:mm:ss');
        const endingTime = moment.unix(parseInt(charity.endingTime)).format('YYYY-MM-DD HH:mm:ss');
        const distributionTime = moment.unix(parseInt(charity.distributionTime)).format('YYYY-MM-DD HH:mm:ss');
        const charityData = await db.prepare(`
          INSERT INTO charityData ("charityIndex",
          "charityReward" ,
          "distributionTime" ,
          "endingTime" ,
          "startingTime",
          "charityAddress",
          "charityAddressId",
          "charityAddressCreator",
          "RewardTokenAddress",
				  "RewardTokenName",
          "RewardTokenSymbol",
				  "SourceTokenAddress",
          "SourceTokenName",
          "SourceTokenSymbol",
          "totalDonation",
          "secondDistributionTime",
				  "secondEndingTime",
				  "secondStartingTime",
          "Timestamp") 
          VALUES ("${charity.charityIndex}",
          "${charity.charityReward}",
          "${distributionTime}",
          "${endingTime}",
          "${startingTime}",
          "${charity.charityAddress.charityAddress}",
          "${charity.charityAddress.id}",
          "${charity.charityAddress.creator}",
          "${charity.charityAddress.rewardToken.Address}",
          "${charity.charityAddress.rewardToken.Name}",
          "${charity.charityAddress.rewardToken.Symbol}",
          "${charity.charityAddress.sourceToken.Address}",
          "${charity.charityAddress.sourceToken.Name}",
          "${charity.charityAddress.sourceToken.Symbol}",
          "${0}",
          "${charity.distributionTime}",
          "${charity.startingTime}",
          "${charity.endingTime}",
          "${charity.Timestamp}");
        `);
        try {
          await charityData.run();
        } finally {
          await charityData.finalize();
        }
      }
    }
    // console.log('cron is running');
  } catch (error: any) {
    console.log('error', error.message);
  }
};

export const getDonorListDataFromSubgraphUrl = async () => {
  try {
    const db = await openDb();
    let limit: number = 0;
    // const stmt = await db.prepare(` SELECT COUNT(id) as count FROM donorList;`)
    // const count = await stmt.get();
    // await stmt.finalize();
    // if(count?.count){
    //   limit = count.count
    // }
    const url = SUB_GRAPH_URL;
    const query = {
      query: ` {\n  donorLists(\n   skip: ${limit}, first: 1000\n ) {
        DonationAmount
        DonerAddress
        charityAddress
        charityIndex
        donorList
        id
      }\n}`,
      variables: null,
      operationName: 'MyQuery',
      extensions: {
        headers: null,
      },
    };
    let config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const result = await axios.post(url, query, config);
    let createDonorList =
      result.status == 200
        ? result.data
          ? result.data.data.donorLists === null
            ? 0
            : result.data.data.donorLists
          : 0
        : 0;
    for (const donor of createDonorList) {
      let stmt = await db.prepare(`SELECT COUNT(*) as recode FROM donorList
       WHERE charityIndex = "${donor.charityIndex}" AND donorAddress = "${donor.DonerAddress}";`);
      const findRecode = await stmt.get();
      await stmt.finalize();
      if (findRecode?.recode === 0) {
        const donorList = await db.prepare(`
          INSERT INTO donorList ("charityIndex", "charityAddress" ,"donorAddress", 
          donorId,"donatedAmount" ,"donorList") 
          VALUES ("${donor.charityIndex}",
          "${donor.charityAddress}",
          "${donor.DonerAddress}",
          "${donor.id}",
          "${donor.DonationAmount}",
          "${donor.donorList}");
          `);
        try {
          await donorList.run();
        } finally {
          await donorList.finalize();
        }
      }
    }
    // console.log('cron is running');
  } catch (error: any) {
    console.log('error', error.message);
  }
};
