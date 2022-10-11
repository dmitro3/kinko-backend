import BigNumber from 'bignumber.js';

type IEnvProperties =
  | 'DB_PATH'
  | 'HOST'
  | 'PORT'
  | 'ETHEREUM_RPC_URL'
  | 'IMAGES_PATH'
  | 'LAUNCHPAD_SETTINGS_ADDRESS'
  | 'EARLY_ACCESS_TOKEN_ADDRESS'
  | 'EARLY_ACCESS_TOKEN_AMOUNT'
  | 'WBNB_ADDRESS'
  |  'SUB_GRAPH_URL';

const exitWithErrorMessage = (errorMessage: string) => {
  console.error(errorMessage);
  process.exit(1);
};

const getEnvString = (property: IEnvProperties): string => {
  const value = process.env[property];
  if (value === undefined) {
    return exitWithErrorMessage(`Environment variable ${property} is undefined`);
  }
  return value;
};

const getEnvNumber = (property: IEnvProperties): number => {
  const value = process.env[property];
  if (value === undefined) {
    return exitWithErrorMessage(`Environment variable ${property} is undefined`);
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return exitWithErrorMessage(`Environment variable ${property} is not a number`);
  }
  return numberValue;
};

const getEnvBigNumber = (property: IEnvProperties): BigNumber => {
  const value = process.env[property];
  if (value === undefined) {
    return exitWithErrorMessage(`Environment variable ${property} is undefined`);
  }
  const bigNumberValue = new BigNumber(value);
  if (!bigNumberValue.isFinite()) {
    return exitWithErrorMessage(`Environment variable ${property} is not a number`);
  }
  return bigNumberValue;
};

export const DB_PATH = getEnvString('DB_PATH');
export const HOST = getEnvString('HOST');
export const PORT = getEnvNumber('PORT');
export const ETHEREUM_RPC_URL = getEnvString('ETHEREUM_RPC_URL');
export const IMAGES_PATH = getEnvString('IMAGES_PATH');
export const LAUNCHPAD_SETTINGS_ADDRESS = getEnvString('LAUNCHPAD_SETTINGS_ADDRESS');
export const EARLY_ACCESS_TOKEN_ADDRESS = getEnvString('EARLY_ACCESS_TOKEN_ADDRESS');
export const EARLY_ACCESS_TOKEN_AMOUNT = getEnvBigNumber('EARLY_ACCESS_TOKEN_AMOUNT');
export const WBNB_ADDRESS = getEnvString('WBNB_ADDRESS');
export const SUB_GRAPH_URL = getEnvString('SUB_GRAPH_URL');
