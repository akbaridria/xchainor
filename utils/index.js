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
  import AbiUni from "../artifacts/contracts/interface/uniswap/USwap.sol/USwap.json";
  import AbiCrv from "../artifacts/contracts/interface/curve/CSwap.sol/CSwap.json";
  import AbiStl from "../artifacts/contracts/interface/stellarswap/STwap.sol/STwap.json";

  let chains = require("../config/list-chains.json");

  export const approveToken = async (token, fromChain) => {
    const provider = new providers.Web3Provider(window.ethereum);
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
  export const checkApprove = async (token, walletAddress, fromChain) => {
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const erc20 = new Contract(token.address, IERC20.abi, signer);
    const sourceContracts = new Contract(
      getChain(fromChain.name).messageSender,
      MessageSenderContract.abi,
      signer
    );
    const data = await erc20.allowance(walletAddress, sourceContracts.address);
    if (data.gt(ethers.utils.parseUnits("1000", 18))) {
      return true;
    } else {
      return false;
    }
  };
  export const axelarGasFee = async (fromChain, toChain) => {
    const api = new AxelarQueryAPI({ environment: Environment.MAINNET });
    const from = fromChain.name === 'Binance' ? EvmChain.BINANCE : EvmChain.POLYGON
    const to = toChain.name === 'Binance' ? EvmChain.BINANCE : EvmChain.POLYGON
    const gas = fromChain.name === 'Binance' ? GasToken.BINANCE : GasToken.MATIC
    console.log(from, to, gas);
    const gasFee = await api.estimateGasFee(
      from,
      to,
      gas,
      70000
    );
    const gasF = BigNumber.from(gasFee).add(BigNumber.from(gasFee).mul(100).div(100))
    return gasF;
  };

  export const getChain = (chainName) => {
    return chains.find((chain) => chain.name === chainName);
  };

  export async function sendTx(tokenIn, tokenOut, fromChain, toChain, amount, minAmount) {
    console.log(tokenIn)
    console.log(tokenOut)
    const provider = new providers.Web3Provider(window.ethereum);
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
    const gasFee = await axelarGasFee(fromChain, toChain);
    console.log( toChain.name,
      destContract.address,
      tokenIn.address === '0x' ? fromChain.weth : tokenIn.address,
      tokenOut.address === '0x' ? toChain.weth : tokenOut.address,
      tokenIn.address === '0x'
        ? ethers.utils
            .parseUnits(amount, tokenIn.decimals)
            .add(BigNumber.from(gasFee))
        : ethers.utils.parseUnits(amount, tokenIn.decimals),
      BigNumber.from(gasFee),
      BigNumber.from(ethers.utils.parseUnits(minAmount, tokenOut.decimals)),
      {
        value: tokenIn.address === '0x'
          ? ethers.utils
              .parseUnits(amount, tokenIn.decimals)
              .add(BigNumber.from(gasFee))
          : BigNumber.from(gasFee),
        gasLimit: 750000,
        gasPrice: gasPrice,
      });
    try {
      const receipt = await sourceContracts
        .requestTransfersOut(
          toChain.name,
          destContract.address,
          tokenIn.address === '0x' ? fromChain.weth : tokenIn.address,
          tokenOut.address === '0x' ? toChain.weth : tokenOut.address,
          tokenIn.address === '0x'
            ? ethers.utils
                .parseUnits(amount, tokenIn.decimals)
                .add(BigNumber.from(gasFee))
            : ethers.utils.parseUnits(amount, tokenIn.decimals),
          BigNumber.from(gasFee),
          BigNumber.from(ethers.utils.parseUnits(minAmount, tokenOut.decimals)),
          {
            value: tokenIn.address === '0x'
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
      console.log(error)
      return "gagal";
    }
  }
  export async function getBalance(token, signer, walletAddress, providers) {
    const erc20 = new Contract(token.address, IERC20.abi, signer);
    const balance = await erc20.balanceOf(walletAddress);
    return balance;
  }

  export async function getNativeBalance(walletAddress, providers) {
    const balance = await providers.getBalance(walletAddress);
    return balance;
  }

  export async function getQuote(
    fromChain,
    toChain,
    fromToken,
    toToken,
    amount
  ) {
    try {
      const fromChainConnectedWallet = providers.getDefaultProvider(
        getChain(fromChain.name).rpc
      );
      const toChainConnectedWallet = providers.getDefaultProvider(
        getChain(toChain.name).rpc
      );

      const from_univ2 = new Contract(
        getChain(fromChain.name).router,
        AbiUni.abi,
        fromChainConnectedWallet
      );
      const from_crv = new Contract(
        getChain(fromChain.name).curvePools,
        AbiCrv.abi,
        fromChainConnectedWallet
      );
      const to_univ2 = new Contract(
        getChain(toChain.name).router,
        AbiUni.abi,
        toChainConnectedWallet
      );
      const to_crv = new Contract(
        getChain(toChain.name).curvePools,
        AbiCrv.abi,
        toChainConnectedWallet
      );

      // axlUSDC
      if (fromToken.address === fromChain.axlUSDC) {
        if (toToken.address === toChain.axlUSDC) {
          return amount;
        } else if (toToken.address === toChain.usdc) {
          const result = await to_crv.get_dy(0, 1, amount);
          return result;
        } else if (toToken.address === "0x") {
          const r = await to_crv.get_dy(0, 1, amount);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
          ]);
          return r1[1];
        } else {
          const r = await to_crv.get_dy(0, 1, amount);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
            toToken.address,
          ]);
          return r1[2];
        }

        // usdc
      } else if (fromToken.address === fromChain.usdc) {
        if (toToken.address === toChain.axlUSDC) {
          const r = await from_crv.get_dy(1, 0, amount);
          return r;
        } else if (toToken.address === toChain.usdc) {
          const r = await from_crv.get_dy(1, 0, amount);
          const result = await to_crv.get_dy(0, 1, r);
          return result;
        } else if (toToken.address === "0x") {
          const rr = await from_crv.get_dy(1, 0, amount);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
          ]);
          return r1[1];
        } else {
          const rr = await from_crv.get_dy(1, 0, amount);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
            toToken.address,
          ]);
          return r1[2];
        }
      } else if (fromToken.address === "0x") {
        if (toToken.address === toChain.axlUSDC) {
          const r1 = await from_univ2.getAmountsOut(amount, [
            fromChain.weth,
            fromChain.usdc,
          ]);
          const r = await from_crv.get_dy(1, 0, r1[1]);
          return r;
        } else if (toToken.address === toChain.usdc) {
          const r1 = await from_univ2.getAmountsOut(amount, [
            fromChain.weth,
            fromChain.usdc,
          ]);
          const r = await from_crv.get_dy(1, 0, r1[1]);
          const result = await to_crv.get_dy(0, 1, r);
          return result;
        } else if (toToken.address === "0x") {
          const r2 = await from_univ2.getAmountsOut(amount, [
            fromChain.weth,
            fromChain.usdc,
          ]);
          const rr = await from_crv.get_dy(1, 0, r2[1]);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
          ]);
          return r1[1];
        } else {
          const r2 = await from_univ2.getAmountsOut(amount, [
            fromChain.weth,
            fromChain.usdc,
          ]);
          const rr = await from_crv.get_dy(1, 0, r2[1]);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
            toToken.address,
          ]);
          return r1[2];
        }
      } else {
        if (toToken.address === toChain.axlUSDC) {
          const r1 = await from_univ2.getAmountsOut(amount, [
            fromToken.address,
            fromChain.weth,
            fromChain.usdc,
          ]);
          const r = await from_crv.get_dy(1, 0, r1[2]);
          return r;
        } else if (toToken.address === toChain.usdc) {
          const r1 = await from_univ2.getAmountsOut(amount, [
            fromToken.address,
            fromChain.weth,
            fromChain.usdc,
          ]);
          const r = await from_crv.get_dy(1, 0, r1[2]);
          const result = await to_crv.get_dy(0, 1, r);
          return result;
        } else if (toToken.address === "0x") {
          const r2 = await from_univ2.getAmountsOut(amount, [
            fromToken.address,
            fromChain.weth,
            fromChain.usdc,
          ]);
          const rr = await from_crv.get_dy(1, 0, r2[2]);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
          ]);
          return r1[1];
        } else {
          const r2 = await from_univ2.getAmountsOut(amount, [
            fromToken.address,
            fromChain.weth,
            fromChain.usdc,
          ]);
          const rr = await from_crv.get_dy(1, 0, r2[2]);
          const r = await to_crv.get_dy(0, 1, rr);
          const r1 = await to_univ2.getAmountsOut(r, [
            toChain.usdc,
            toChain.weth,
            toToken.address,
          ]);
          return r1[2];
        }
      }
    } catch {
      return 0;
    }
  }

  function getQuoteFromMoonbeam(fromChain, toChain, fromToken, toToken){
    const fromChainConnectedWallet = providers.getDefaultProvider(
      getChain(fromChain.name).rpc
    );
    const toChainConnectedWallet = providers.getDefaultProvider(
      getChain(toChain.name).rpc
    );

    const from_univ2 = new Contract(
      getChain(fromChain.name).router,
      AbiUni.abi,
      fromChainConnectedWallet
    );
    const from_crv = new Contract(
      getChain(fromChain.name).curvePools,
      AbiCrv.abi,
      fromChainConnectedWallet
    );
    const to_univ2 = new Contract(
      getChain(toChain.name).router,
      AbiUni.abi,
      toChainConnectedWallet
    );
    const to_crv = new Contract(
      getChain(toChain.name).curvePools,
      AbiCrv.abi,
      toChainConnectedWallet
    );
  }