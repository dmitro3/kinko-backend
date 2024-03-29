/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import {startCron} from  './cron/cron'
import {HOST, PORT} from 'constants/env';
import cors from 'cors';
import cron from 'node-cron';
import express, {NextFunction, Request, Response} from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';
import {routes} from 'restApi';
import {errorToString, logError} from 'utils';
const path = require('path');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });
const main = async () => {
  const app = express();
  app.use(morgan('tiny'));
  app.use(helmet());
  app.use('/static', express.static(path.join(__dirname, '../images')));

  app.use(Sentry.Handlers.requestHandler());
  // const whitelist = ['http://localhost:3000', 'http://localhost:3001', 'https://cosmic-mousse-dc75c6.netlify.app'];
  // const corsOptions = {
  //   origin: function (origin: any, callback: any) {
  //     if (whitelist.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  // };
  app.use(cors()); // for adding cors headers
  app.use(express.json({limit: '10mb'})); // for parsing application/json
  app.use(express.urlencoded({extended: true, limit: '10mb'})); // for parsing application/x-www-form-urlencoded
  app.use('/api/v1', routes);

  app.get('/', (req, res) => {
    res.status(200).json({message: 'Kinko access url working properly'});
  });

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    logError(req.path, error);
    const message = errorToString(error);
    console.log('connected');
    return res.status(400).send({message});
  });

  app.use(Sentry.Handlers.errorHandler());
  cron.schedule('*/10 * * * * *', () => {
    startCron()
  });
  app.listen(PORT, HOST);
};

main();
