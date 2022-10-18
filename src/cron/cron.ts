import cron from 'node-cron';
import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';
import { getCharityDataFromSubgraphUrl , getDonorListDataFromSubgraphUrl } from './subGraph';

// cron.schedule('*/2 * * * *', async () => {
//   await getCharityDataFromSubgraphUrl();
//   await getDonorListDataFromSubgraphUrl();
// });

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

function sleep(ms:number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

export const startCron = async () => {
    try{

        console.log("*** start cron ***")
        sleep(10000)
        try {
            // console.log("start collection")
            await getCharityDataFromSubgraphUrl();
        }
        catch (e) {
            Sentry.captureException(e)
            console.error("&&&&&&&&&&&&&&&&&&& createCharity ", e)
        } 
        try {
          // console.log("start collection")
          await getDonorListDataFromSubgraphUrl();
      }
      catch (e) {
          Sentry.captureException(e)
          console.error("&&&&&&&&&&&&&&&&&&& createCharity ", e)
      }       
    }catch(e) {
        Sentry.captureException(e)
        console.error("%%%%%%%%%%%%%% e ", e)
        await startCron()
    }
}