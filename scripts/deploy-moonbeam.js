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
const MessageSenderContract = require("../artifacts/contracts/MessageSenderMoonbeam.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiverMoonbeam.sol/MessageReceiver.json");

let chains = require("../config/list-chains.json");

// get chains
const moonbeamChain = chains.find((chain) => chain.name === "Moonbeam");

// deploy script
async function main() {
  /**
   * DEPLOY ON MOONBEAM
   */
  const moonbeamProvider = getDefaultProvider(moonbeamChain.rpc);
  const moonbeamConnectedWallet = wallet.connect(moonbeamProvider);
  const gasPrice = await moonbeamProvider.getGasPrice();

  const moonbeamSender = await deployContract(
    moonbeamConnectedWallet,
    MessageSenderContract,
    [
      moonbeamChain.gateway,
      moonbeamChain.gasReceiver,
      moonbeamChain.curvePools,
      moonbeamChain.router,
      moonbeamChain.weth,
      moonbeamChain.usdc,
    ],
    {
      // gasLimit: 18000000,
      gasPrice: gasPrice,
    }
  );
  console.log("MessageSender deployed on polygon:", moonbeamSender.address);

  moonbeamChain.messageSender = moonbeamSender.address;

  const moonbeamReceiver = await deployContract(
    moonbeamConnectedWallet,
    MessageReceiverContract,
    [
      moonbeamChain.gateway,
      moonbeamChain.gasReceiver,
      moonbeamChain.curvePools,
      moonbeamChain.router,
      moonbeamChain.weth,
      moonbeamChain.usdc,
    ],
    {
      gasPrice: gasPrice,
    }
  );
  console.log("MessageReceiver deployed on polygon:", moonbeamReceiver.address);

  // moonbeamChain.messageReceiver = moonbeamReceiver.address;
  // const updatedChains = [moonbeamChain];

  // await fs.writeFile(
  //   "config/list-chains.json",
  //   JSON.stringify(updatedChains, null, 2)
  // );
}

main();