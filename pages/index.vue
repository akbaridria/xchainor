<template>
  <div class="h-full container mx-auto flex items-center justify-center py-10">
    <div class="bg-white dark:bg-slate-900 p-5 rounded-xl min-w-[350px] grid gap-y-6 shadow-2xl shadow-blue-600/40">
      <div class="flex justify-end">
        Powered By Axelar
      </div>
      <div class="grid gap-y-1">
        <div class="relative bg-gray-200 dark:bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center px-2 gap-x-2" @click="getListModal('fromChain')">
            <div class="text-gray dark:text-white/50">From</div> 
            <div class="flex gap-x-2 text-base items-center">{{ fromChain.name }} <img :src="fromChain.logoURI" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 grid gap-y-1">
            <div class="flex items-center justify-between">
              <input v-model="amount" type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-gray-200 dark:bg-slate-800 text-lg rounded-lg text-black dark:text-white focus:outline-0" placeholder="0.0">
              <div @click="getListModal('fromToken')" class="flex items-center bg-gray-400 dark:bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
                <img class="rounded-full" width="18px" :src="fromToken.logoURI" alt="">
                <div>
                  {{ fromToken.symbol}}
                </div>
                <ion-icon name="chevron-down"></ion-icon>
              </div>
            </div>
            <div class="text-gray dark:text-white/50 text-sm">
              Balance : {{ formatBalance(balance, fromToken.decimals) }} 
            </div>
            
          </div>
        </div>
        <div class="mx-auto">
          <ion-icon name="caret-down-circle-sharp" />
        </div>
        <div class="bg-gray-200 dark:bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center px-2 gap-x-2" @click="getListModal('toChain')">
            <div class="text-black dark:text-white/50">To</div> 
            <div class="flex gap-x-2 text-base items-center">{{ toChain.name }} <img :src="toChain.logoURI" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 grid gap-y-2">
            <div class="flex items-center justify-between">
              <input disabled v-model="amountOut" type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-gray-200 dark:bg-slate-800 text-lg rounded-lg text-black dark:text-white focus:outline-0" placeholder="0.0">
              <button @click="getListModal('toToken')" class="group flex items-center bg-gray-400 dark:bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
                <img class="rounded-full" width="18px" :src="toToken.logoURI" alt="">
                <div>
                  {{ toToken.symbol}}
                </div>
                <ion-icon name="chevron-down"></ion-icon>
              </button>
            </div>
            <div class="flex items-center justify-between text-gray dark:text-white/50 text-sm">
              <div>Minimum Received 
                <div class="group relative inline-block">
                <ion-icon name="alert-circle-outline" />
                  <span
                    class="absolute hidden group-hover:flex -top-8 -right-3 translate-x-full w-64 p-3 bg-gray-700 rounded-lg text-center text-white text-sm before:content-[''] before:absolute before:top-1/2  before:right-[100%] before:-translate-y-1/2 before:border-8 before:border-y-transparent before:border-l-transparent before:border-r-gray-700">
                    if you received less than this number. You will get axlUSDC instead.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <button @click="send()" :class="wrongNetwork ? 'px-3 w-full py-2 text-sm text-white bg-red-600 rounded-full font-semibold hover:bg-red-600/50 transition-colors' : 'px-3 w-full py-2 text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-600/50 transition-colors'">
          {{ isConnect ? wrongNetwork ? 'Wrong Network' : isApprove ? 'Bridge' : 'Approve' : 'Connect Wallet' }}
        </button>
      </div>

      <div class="bg-gray-200 dark:bg-slate-800 rounded-lg p-2 text-sm grid gap-y-2">
        <div class="flex justify-between">
          <div>Relayer Gas Fee 
            <div class="group relative inline-block">
            <ion-icon name="alert-circle-outline" />
              <span
                class="absolute hidden group-hover:flex -top-8 -right-3 translate-x-full w-64 p-3 bg-gray-700 rounded-lg text-center text-white text-sm before:content-[''] before:absolute before:top-1/2  before:right-[100%] before:-translate-y-1/2 before:border-8 before:border-y-transparent before:border-l-transparent before:border-r-gray-700">This
                Relay fee will be refunded, if gas fee that used on destination chain is less than this number
              </span>
            </div>
          </div>
          <div class="text-sm">{{ relayFee }}</div>
        </div>
        <!-- <div class="flex justify-between">
          <div>Estimated Wait Time <ion-icon name="alert-circle-outline" /></div>
          <div>~ 3minutes</div>
        </div> -->
      </div>
    </div>

    <Modal v-if="openModal" :listModal="listModal" :identifier="identifierModal" @closeModal="selectList($event)" />
    <ModalError v-if="openAlert" :title="titleAlert" :description="descAlert" @closeModal="(openAlert = false, connectWallet())" />
    <Loader v-if="isLoading" />
    <ModalTx v-if="openTx" :link="linkExplorer" @closeModal="(openTx = false, amount = 0, connectWallet())" />
  </div>
</template>

<script>
import { getBalance, getChain, sendTx, checkApprove, approveToken, getNativeBalance, getQuote, getQuoteFromMoonbeam, getQuoteToMoonbeam, axelarGasFee } from "../utils";
const { ethers, BigNumber, utils } = require("ethers");
const listChains  = require('../config/list-chains.json');

export default {
  name: 'IndexPage',
  data(){
    const polygonTokens = require('../config/polygon-token-list.json');
    const bscTokens = require('../config/bsc-token-list.json');
    const moonBeamTokens = require('../config/moonbeam-token-list.json');
    const arbitrumTokens = require('../config/arbitrum-token-list.json');
    const fantomTokens = require('../config/fantom-token-list.json');
    const listTokens = {
      'Binance' : bscTokens.tokens,
      'Polygon' : polygonTokens.tokens,
      'Moonbeam' : moonBeamTokens.tokens,
      'Arbitrum' : arbitrumTokens.tokens,
      'Fantom' : fantomTokens.tokens
    }
    const fromChain = listChains.find((elem) => elem.name === 'Binance')
    const toChain = listChains.find((elem) => elem.name === 'Moonbeam')
    const fromToken  = listTokens[fromChain.name][0]
    const toToken = listTokens[toChain.name][0]
    return {
      openModal: false,
      listChains,
      listModal: [],
      fromChain,
      toChain,
      identifierModal: {},
      listTokens,
      fromToken,
      toToken,
      chainId: 56,
      wrongNetwork: false,
      isConnect: false,
      walletAddress: '',
      balance: 0,
      isApprove: false,
      amount: 0,
      amountOut: 0,
      openAlert: false,
      isLoading: false,
      titleAlert: '',
      descAlert: '',
      openTx: false,
      linkExplorer: '',
      relayFee: '0'
    }
  },
  mounted(){
      this.getRelayFee()
     const ethereum = (window).ethereum
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        if (provider) {
          this.connectWallet();
        }
        ethereum.on('accountsChanged', (data) => {
          if (data.length === 0) {
            this.walletAddress = ''
            this.isConnect = false
            this.balance = 0
            this.amount = 0
            this.amountOut = 0
          } else {
            this.walletAddress = data[0]
            this.isConnect = true
          }
        })
        ethereum.on('chainChanged', (data) => {
          this.connectWallet()
        })
      }
  },
  watch: {
    fromChain(){
      this.fromToken = this.listTokens[this.fromChain.name][0]
      this.getRelayFee()
      if(this.fromChain.name === this.toChain.name) {
        for(let i in this.listChains) {
          if(this.listChains[i].name !== this.fromChain.name) {
            this.toChain = {
              logoURI: this.listChains[i].logoURI, 
              name: this.listChains[i].name, 
              symbol: this.listChains[i].tokenSymbol, 
              address: this.listChains[i].weth, 
              axlUSDC: this.listChains[i].axlUSDC, 
              usdc: this.listChains[i].usdc,
              weth: this.listChains[i].weth, 
              decimals: 18,
              explorer: this.listChains[i].explorer
            }
          }
        }
      }
    },
    toChain(){
      this.toToken = this.listTokens[this.toChain.name][0]
      this.getRelayFee()
       if(this.fromChain.name === this.toChain.name) {
        for(let i in this.listChains) {
          if(this.listChains[i].name !== this.fromChain.name) {
            this.fromChain = {
              logoURI: this.listChains[i].logoURI, 
              name: this.listChains[i].name, 
              symbol: this.listChains[i].tokenSymbol, 
              address: this.listChains[i].weth, 
              axlUSDC: this.listChains[i].axlUSDC, 
              usdc: this.listChains[i].usdc,
              weth: this.listChains[i].weth, 
              decimals: 18,
              explorer: this.listChains[i].explorer
            }
          }
        }
      }
    },
    fromToken(){
      this.connectWallet()
      this.amount = 0
      this.amountOut = 0
    },
    toToken() {
      this.connectWallet()
      this.amount = 0
      this.amountOut = 0
    },
    async amount(){
      let d;
      console.log('running here');
      console.log(this.amount);
      if(this.fromChain.name === 'Moonbeam') {
        d = await getQuoteFromMoonbeam(this.fromChain, this.toChain, this.fromToken, this.toToken, utils.parseUnits(parseFloat(this.amount === '' ? '0' : this.amount).toString(), this.fromToken.decimals));
        this.amountOut = utils.formatUnits(BigNumber.from(d).sub(BigNumber.from(d).mul(5).div(100)), this.toToken.decimals)
      } else if(this.toChain.name === 'Moonbeam') {
        d = await getQuoteToMoonbeam(this.fromChain, this.toChain, this.fromToken, this.toToken, utils.parseUnits(parseFloat(this.amount === '' ? '0' : this.amount).toString(), this.fromToken.decimals));
        this.amountOut = utils.formatUnits(BigNumber.from(d).sub(BigNumber.from(d).mul(5).div(100)), this.toToken.decimals)
      } else {
        d = await getQuote(this.fromChain, this.toChain, this.fromToken, this.toToken, utils.parseUnits(parseFloat(this.amount === '' ? '0' : this.amount).toString(), this.fromToken.decimals));
        this.amountOut = utils.formatUnits(BigNumber.from(d).sub(BigNumber.from(d).mul(5).div(100)), this.toToken.decimals)
      }
      
    }

  },
  methods: {
    async getRelayFee(){
      const fee = await axelarGasFee(this.fromChain, this.toChain)
      this.relayFee = `~${parseFloat(utils.formatEther(BigNumber.from(fee))).toFixed(6)} ${getChain(this.fromChain.name).tokenSymbol}`
    },
    formatBalance(balance, decimals){
      return utils.formatUnits(balance, decimals)
    },
    getListModal(data){
      this.listModal = []
      if(data === 'fromChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'from'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.tokenSymbol, address: element.weth, axlUSDC: element.axlUSDC, usdc: element.usdc, weth: element.weth, decimals: 0, explorer: element.explorer}]
        });
      }
      if(data === 'toChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'to'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.tokenSymbol, address: element.weth, axlUSDC: element.axlUSDC, usdc: element.usdc, weth: element.weth, decimals: 0, explorer: element.explorer}]
        });
      }
      if(data === 'fromToken') {
        this.identifierModal = {postfix: 'token', prefix: 'from'}
        this.listTokens[this.fromChain.name].forEach((element) => {
          this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.symbol, address: element.address, decimals: element.decimals}]
        })
      }
      if(data === 'toToken') {
        this.identifierModal = {postfix: 'token', prefix: 'to'}
        this.listTokens[this.toChain.name].forEach((element) => {
          this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.symbol, address: element.address, decimals: element.decimals}]
        })
      }
      this.openModal = true
    },
    selectList(data) {
      if(data) {
        if(data.identifier.postfix === 'chain') {
          if(data.identifier.prefix === 'from') {
            this.fromChain = data.item
          } else {
            this.toChain = data.item
          }
        }

        if(data.identifier.postfix === 'token') {
          if(data.identifier.prefix === 'from') {
            this.fromToken = data.item
          } else {
            this.toToken = data.item
          }
        }
      }
      this.openModal = false
    },
    async connectWallet(){
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const wallet = await signer.getAddress();
        const chainId = await signer.getChainId();
        this.chainId = chainId
        console.log(chainId);
        if (getChain(this.fromChain.name).chainId === chainId) {
          this.wrongNetwork = false
          this.balance = this.fromToken.address === '0x' ? await getNativeBalance(wallet, provider) : await getBalance(this.fromToken, signer, wallet, provider)
          this.isApprove =this.fromToken.address === '0x' ? true : await checkApprove(this.fromToken, wallet, this.fromChain);
        } else {
          this.wrongNetwork = true
        }
        this.walletAddress = wallet;
        this.isConnect = true
        return signer
      } catch (error) {
        console.log(error);
        console.log('oops something went wrong');
      }
    },
    async send(){
      if(this.isConnect) {
        if(!this.wrongNetwork) {
            if(!this.isApprove) {
              this.isLoading = true
              await approveToken(this.fromToken, this.fromChain)
              this.connectWallet()
              this.isLoading = false
            } else {
              if(this.amount > 0) {
                this.isLoading = true
                const r = await sendTx(this.fromToken, this.toToken, this.fromChain, this.toChain, this.amount, this.amountOut, this.amountOut)
                this.isLoading = false
                if(r !== 'gagal') {
                  this.openTx = true
                  this.linkExplorer = r
                } else {
                  this.openAlert = true
                  this.titleAlert = 'Error'
                  this.descAlert = 'Oops something went wrong!'
                }
              } else {
                this.titleAlert = "Zero Amount!"
                this.descAlert = "Please fill the amount of token that you want to send!"
                this.openAlert = true
              }
            }
        } else {
          this.titleAlert = "Wrong Network"
          this.descAlert = "Please choose the right network on Metamask!"
          this.openAlert = true
        }
      } else {
        this.connectWallet()
      }
      
    }
  }
}
</script>
