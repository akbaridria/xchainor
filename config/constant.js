import { Wallet } from "ethers";
// import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// dotenv.config()

function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  return new Wallet(privateKey);
}

export const wallet = getWallet();