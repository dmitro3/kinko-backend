import cron from 'node-cron';
import { getCharityDataFromSubgraphUrl , getDonorListDataFromSubgraphUrl } from './subGraph';

cron.schedule('*/10 * * * *', async () => {
  await getCharityDataFromSubgraphUrl();
  await getDonorListDataFromSubgraphUrl();
});

