import cron from 'node-cron';
import {getDataFromSubgraphUrl} from './subGraph';

cron.schedule('*/10 * * * *', async () => {
  await getDataFromSubgraphUrl();
});
