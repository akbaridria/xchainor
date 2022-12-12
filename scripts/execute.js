const { Contract, ethers, getDefaultProvider, providers } = require('ethers');
const {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} = require("@axelar-network/axelarjs-sdk");

const AxelarGatewayContract = require("../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json");
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require( "../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");
const IERC20 = require("../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json");
const {Wallet} = require('ethers');
require('dotenv').config();

function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  return new Wallet(privateKey);
}
const wallet = getWallet();

let chains = require("../config/list-chains.json");

const bnbChain = chains.find(
  (chain) => chain.name === "Binance"
) ;
const polygonChain = chains.find(
  (chain) => chain.name === "Polygon"
) ;

if (!bnbChain || !polygonChain) process.exit(0);

const bnbProvider = getDefaultProvider(bnbChain.rpc);
const bnbConnectedWallet = wallet.connect(bnbProvider);
const polygonProvider = getDefaultProvider(polygonChain.rpc);
const polygonConnectedWallet = wallet.connect(polygonProvider);

const srcGatewayContract = new Contract(
  bnbChain.gateway,
  AxelarGatewayContract.abi,
  bnbConnectedWallet
);

const destGatewayContract = new Contract(
  polygonChain.gateway,
  AxelarGatewayContract.abi,
  polygonConnectedWallet
);

const sourceContract = new Contract(
  bnbChain.messageSender,
  MessageSenderContract.abi,
  bnbConnectedWallet
);

const destContract = new Contract(
  polygonChain.messageReceiver,
  MessageReceiverContract.abi,
  polygonConnectedWallet
);

const sendTx = async () => {
  // const erc20 = new Contract(
  //   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  //   IERC20.abi,
  //   polygonConnectedWallet
  // );

  // Approve the token for the amount to be sent
  // await erc20
  //   .approve(sourceContract.address, ethers.utils.parseUnits("5", 6), {
  //     gasLimit: 750000,
  //     gasPrice: 50000000000,
  //   })
  //   .then((tx: any) => tx.wait());

  const api = new AxelarQueryAPI({ environment: Environment.MAINNET });

  const gasFee = await api.estimateGasFee(
    EvmChain.BINANCE,
    EvmChain.POLYGON,
    GasToken.BINANCE,
    700000
  );
  console.log("getting gas fees", gasFee); 
  const receipt = await sourceContract
    .requestTransfersOut(
      "Polygon",
      destContract.address,
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
      ethers.utils.parseUnits("0.01", 18),
      gasFee,
      ethers.utils.parseUnits("1", 18),
      {
        value: ethers.utils.parseUnits("0.01", 18),
        gasPrice: await bnbProvider.getGasPrice(),
      }
    )
    .then((tx) => tx.wait());

  console.log({
    txHash: receipt.transactionHash,
  });
};

sendTx();