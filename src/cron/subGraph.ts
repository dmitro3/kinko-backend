import axios from 'axios';
import {openDb} from 'db';
import {SUB_GRAPH_URL} from '../constants/env';

export const getDataFromSubgraphUrl = async () => {
  try {
    const db = await openDb();
    let limit:number = 0;
    // const stmt = await db.prepare(` SELECT COUNT(id) as count FROM charityData;`)
    // const count = await stmt.get();
    // await stmt.finalize();
    // if(count?.count){
    //   limit = count.count
    // }
    const url = SUB_GRAPH_URL;
    const query = {
      query: ` {\n  createCharities(\n   skip: ${limit}, first: 1000\n ) {
        charityIndex
        charityReward
        distributionTime
        endingTime
        startingTime
        charityAddress {
          id
          creator
          rewardToken
          sourceToken
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
      const charityData = await db.prepare(`
    	INSERT INTO charityData ("charityIndex",
      "charityReward" ,
      "distributionTime" ,
      "endingTime" ,
      "startingTime",
      "charityAddressId",
      "charityAddressCreator",
      "charityAddressRewardToken",
      "charityAddressSourceToken",
      "Timestamp") 
        VALUES ("${charity.charityIndex}",
        "${charity.charityReward}",
        "${charity.distributionTime}",
        "${charity.endingTime}",
        "${charity.startingTime}",
        "${charity.charityAddress.id}",
        "${charity.charityAddress.creator}",
        "${charity.charityAddress.rewardToken}",
        "${charity.charityAddress.sourceToken}",
        "${charity.Timestamp}");`);
      try {
       await charityData.run();
      } finally {
        await charityData.finalize();
      }
    }
    console.log('task done from cron');
  } catch (error:any) {
    console.log('error', error.message);
  }
};
