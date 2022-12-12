import {
    Contract,
    ethers,
    getDefaultProvider,
    providers,
    BigNumber,
  } from "ethers";
  import {
    AxelarQueryAPI,
    Environment,
    EvmChain,
    GasToken,
  } from "@axelar-network/axelarjs-sdk";
  
  import MessageSenderContract from "../artifacts/contracts/MessageSender.sol/MessageSender.json";
  import MessageReceiverContract from "../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json";
  import IERC20 from "../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json";
  
  let chains = require("../config/list-chains.json");
  
  export const approveToken = async (token, fromChain) => {
    const provider = new providers.Web3Provider((window).ethereum);
    const signer = provider.getSigner();
    const erc20 = new Contract(token.address, IERC20.abi, signer);
    const gasPrice = await provider.getGasPrice();
    const sourceContract = new Contract(
      getChain(fromChain.name).messageSender,
      MessageSenderContract.abi,
      signer
    );
    try {
      const receipt = await erc20
        .approve(
          sourceContract.address,
          BigNumber.from(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          ),
          {
            gasLimit: 100000,
            gasPrice: gasPrice,
          }
        )
        .then((tx) => tx.wait());
      return receipt.transactionHash;
    } catch (error) {
      return "gagal";
    }
  };
  export const checkApprove = async (
    token,
    walletAddress,
    fromChain
  ) => {
    const provider = new providers.Web3Provider((window).ethereum);
    const signer = provider.getSigner();
    const erc20 = new Contract(token.address, IERC20.abi, signer);
    const sourceContracts = new Contract(
      getChain(fromChain.name).messageSender,
      MessageSenderContract.abi,
      signer
    );
    const data = await erc20.allowance(walletAddress, sourceContracts.address);
    if (
      data.gt(ethers.utils.parseUnits("1000", 18)) ||
      ["AVAX", "BNB"].includes(token.symbol)
    ) {
      return true;
    } else {
      return false;
    }
  };
  export const axelarGasFee = async (fromChain) => {
    const api = new AxelarQueryAPI({ environment: Environment.MAINNET });
  
    if (fromChain.name === "Avalanche") {
      const gasFee = await api.estimateGasFee(
        EvmChain.AVALANCHE,
        EvmChain.BINANCE,
        GasToken.AVAX,
        70000
      );
      return gasFee;
    } else {
      const gasFee = await api.estimateGasFee(
        EvmChain.BINANCE,
        EvmChain.AVALANCHE,
        GasToken.BINANCE,
        700000
      );
      return gasFee;
    }
  };
  
  export const getChain = (chainName) => {
    return chains.find((chain) => chain.name === chainName);
  };
  
  export async function sendTx(
    tokenIn,
    tokenOut,
    fromChain,
    toChain,
    amount
  ) {
    const provider = new providers.Web3Provider((window).ethereum);
    const signer = provider.getSigner();
    const toChainConnectedWallet = providers.getDefaultProvider(
      getChain(toChain.name).rpc
    );
    const gasPrice = await signer.getGasPrice();
  
    const sourceContracts = new Contract(
      getChain(fromChain.name).messageSender,
      MessageSenderContract.abi,
      signer
    );
    const destContract = new Contract(
      getChain(toChain.name).messageReceiver,
      MessageReceiverContract.abi,
      toChainConnectedWallet
    );
    const gasFee = await axelarGasFee(fromChain);
    console.log(
      ethers.utils
        .parseUnits(amount, tokenIn.decimals)
        .add(BigNumber.from(gasFee))
    );
    try {
      const receipt = await sourceContracts
        .SwapAndPort(
          toChain.name,
          destContract.address,
          tokenIn.address,
          tokenOut.address,
          ["AVAX", "BNB"].includes(tokenIn.symbol)
            ? ethers.utils
                .parseUnits(amount, tokenIn.decimals)
                .add(BigNumber.from(gasFee))
            : ethers.utils.parseUnits(amount, tokenIn.decimals),
          BigNumber.from(gasFee),
          {
            value: ["AVAX", "BNB"].includes(tokenIn.symbol)
              ? ethers.utils
                  .parseUnits(amount, tokenIn.decimals)
                  .add(BigNumber.from(gasFee))
              : BigNumber.from(gasFee),
            gasLimit: 750000,
            gasPrice: gasPrice,
          }
        )
        .then((tx) => tx.wait());
  
      return receipt.transactionHash;
    } catch (error) {
      return "gagal";
    }
  }
  export async function getBalance(
    token,
    signer,
    walletAddress,
    providers
  ) {
    if (["AVAX", "BNB"].includes(token.symbol)) {
      const balance = await providers.getBalance(walletAddress);
      return balance;
    }
    const erc20 = new Contract(token.address, IERC20.abi, signer);
    const balance = await erc20.balanceOf(walletAddress);
    return balance;
  }