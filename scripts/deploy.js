const fs = require('fs/promises');
const {getDefaultProvider} = require('ethers');
const {Wallet} = require('ethers');
require('dotenv').config();

function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  return new Wallet(privateKey);
}
const wallet = getWallet();

const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

let chains = require("../config/list-chains.json");

// get chains
const binanceChain = chains.find((chain) => chain.name === "Binance");
const polygonChain = chains.find((chain) => chain.name === "Polygon");

// deploy script
async function main() {
  /**
   * DEPLOY ON BSC
   */
  const binanceProvider = getDefaultProvider(binanceChain.rpc);
  const binanceConnectedWallet = wallet.connect(binanceProvider);
  const binanceSender = await deployContract(
    binanceConnectedWallet,
    MessageSenderContract,
    [
      binanceChain.gateway,
      binanceChain.gasReceiver,
      binanceChain.curvePools,
      binanceChain.router,
      binanceChain.weth,
      binanceChain.usdc,
    ],
    {
      gasLimit: 1800000,
      gasPrice: 5000000000,
    }
  );
  console.log("MessageSender deployed on polygon:", binanceSender.address);

  binanceChain.messageSender = binanceSender.address;

  const binanceReceiver = await deployContract(
    binanceConnectedWallet,
    MessageReceiverContract,
    [
      binanceChain.gateway,
      binanceChain.gasReceiver,
      binanceChain.curvePools,
      binanceChain.router,
      binanceChain.weth,
      binanceChain.usdc,
    ],
    {
      gasLimit: 1800000,
      gasPrice: 5000000000,
    }
  );
  console.log("MessageReceiver deployed on polygon:", binanceReceiver.address);

  binanceChain.messageReceiver = binanceReceiver.address;

  /**
   * DEPLOY ON POLYGON
   */
  const polygonProvider = getDefaultProvider(polygonChain.rpc);
  const polygonConnectedWallet = wallet.connect(polygonProvider);
  const polygonSender = await deployContract(
    polygonConnectedWallet,
    MessageSenderContract,
    [
      polygonChain.gateway,
      polygonChain.gasReceiver,
      polygonChain.curvePools,
      polygonChain.router,
      polygonChain.weth,
      polygonChain.usdc,
    ],
    {
      gasPrice: 50000000000,
    }
  );
  console.log("MessageSender deployed on Avalanche:", polygonSender.address);
  polygonChain.messageSender = polygonSender.address;

  const polygonReceiver = await deployContract(
    polygonConnectedWallet,
    MessageReceiverContract,
    [
      polygonChain.gateway,
      polygonChain.gasReceiver,
      polygonChain.curvePools,
      polygonChain.router,
      polygonChain.weth,
      polygonChain.usdc,
    ],
    {
      gasPrice: 50000000000,
    }
  );
  console.log(
    "MessageReceiver deployed on Avalanche:",
    polygonReceiver.address
  );
  polygonChain.messageReceiver = polygonReceiver.address;

  // update chains
  const updatedChains = [binanceChain, polygonChain];

  await fs.writeFile(
    "config/list-chains.json",
    JSON.stringify(updatedChains, null, 2)
  );
}

main();