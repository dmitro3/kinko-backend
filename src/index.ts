/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import {HOST, PORT} from 'constants/env';
import cors from 'cors';
import express, {NextFunction, Request, Response} from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import {routes} from 'restApi';
import {errorToString, logError} from 'utils';

const main = async () => {
  const app = express();
  app.use(morgan('tiny'));
  app.use(helmet());
  app.use(cors({origin:'*'})); // for adding cors headers
  app.use(express.json({limit: '10mb'})); // for parsing application/json
  app.use(express.urlencoded({extended: true, limit: '10mb'})); // for parsing application/x-www-form-urlencoded
  app.use('/api/v1', routes);

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    logError(req.path, error);
    const message = errorToString(error);
    console.log("connected")
    return res.status(400).send({message});
  });

  app.listen(PORT, HOST);
};

main();
