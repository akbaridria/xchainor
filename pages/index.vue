<template>
  <div class="h-full container mx-auto flex items-center justify-center py-10">
    <div class="bg-slate-900 p-5 rounded-xl min-w-[350px] grid gap-y-6 shadow-2xl shadow-blue-600/40">
      <div class="flex justify-end">
        Powered By Axelar
      </div>
      <div class="grid gap-y-1">
        <div class="relative bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center gap-x-2" @click="getListModal('fromChain')">
            <div class="text-white/50">From</div> 
            <div class="flex gap-x-2 text-base items-center">{{ fromChain.name }} <img :src="fromChain.logoURI" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 grid gap-y-1">
            <div class="flex items-center justify-between">
              <input v-model="amount" type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
              <div @click="getListModal('fromToken')" class="flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
                <img class="rounded-full" width="18px" :src="fromToken.logoURI" alt="">
                <div>
                  {{ fromToken.symbol}}
                </div>
                <ion-icon name="chevron-down"></ion-icon>
              </div>
            </div>
            <div class="text-white/50 text-sm">
              Balance : {{ formatBalance(balance, fromToken.decimals) }} 
            </div>
            
          </div>
        </div>
        <div class="mx-auto">
          <ion-icon name="caret-down-circle-sharp" />
        </div>
        <div class="bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center gap-x-2" @click="getListModal('toChain')">
            <div class="text-white/50">To</div> 
            <div class="flex gap-x-2 text-base items-center">{{ toChain.name }} <img :src="toChain.logoURI" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 grid gap-y-2">
            <div class="flex items-center justify-between">
              <input disabled v-model="amountOut" type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
              <button @click="getListModal('toToken')" class="group flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
                <img class="rounded-full" width="18px" :src="toToken.logoURI" alt="">
                <div>
                  {{ toToken.symbol}}
                </div>
                <ion-icon name="chevron-down"></ion-icon>
              </button>
            </div>
            <div class="text-white/50 text-sm">
              <div>Minimum Received <ion-icon name="alert-circle-outline" /></div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <button @click="connectWallet()" :class="wrongNetwork ? 'px-3 w-full py-2 text-sm bg-red-600 rounded-full font-semibold hover:bg-red-600/50 transition-colors' : 'px-3 w-full py-2 text-sm bg-blue-600 rounded-full font-semibold hover:bg-blue-600/50 transition-colors'">
          {{ isConnect ? wrongNetwork ? 'Wrong Network' : isApprove ? 'Bridge' : 'Approve' : 'Connect Wallet' }}
        </button>
      </div>

      <div class="bg-slate-800 rounded-lg p-2 text-sm grid gap-y-2">
        <div class="flex justify-between">
          <div>Relayer Gas Fee <ion-icon name="alert-circle-outline" /></div>
          <div>3 axlUSDC</div>
        </div>
        <div class="flex justify-between">
          <div>Estimated Wait Time <ion-icon name="alert-circle-outline" /></div>
          <div>~ 3minutes</div>
        </div>
      </div>
    </div>

    <Modal v-if="openModal" :listModal="listModal" :identifier="identifierModal" @closeModal="selectList($event)" />
    <!-- <ModalError /> -->
    <Loader />
  </div>
</template>

<script>
import { getBalance, getChain, sendTx, checkApprove, approveToken, getNativeBalance, getQuote } from "../utils";
const { ethers, BigNumber, utils } = require("ethers");
const listChains  = require('../config/list-chains.json');

export default {
  name: 'IndexPage',
  data(){
    const polygonTokens = require('../config/polygon-token-list.json');
    const bscTokens = require('../config/bsc-token-list.json');
    const listTokens = {
      'Binance' : bscTokens.tokens,
      'Polygon' : polygonTokens.tokens
    }
    const fromChain = listChains.find((elem) => elem.name === 'Binance')
    const toChain = listChains.find((elem) => elem.name === 'Polygon')
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
      amountOut: 0
    }
  },
  mounted(){
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
    },
    toChain(){
      this.toToken = this.listTokens[this.toChain.name][0]
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
      const d = await getQuote(this.fromChain, this.toChain, this.fromToken, this.toToken, utils.parseUnits(parseFloat(this.amount === '' ? '0' : this.amount).toString(), this.fromToken.decimals));
      this.amountOut = utils.formatUnits(d, this.toToken.decimals)
    }

  },
  methods: {
    formatBalance(balance, decimals){
      return utils.formatUnits(balance, decimals)
    },
    getListModal(data){
      this.listModal = []
      if(data === 'fromChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'from'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.tokenSymbol, address: element.weth, axlUSDC: element.axlUSDC, usdc: element.usdc, weth: element.weth, decimals: 0}]
        });
      }
      if(data === 'toChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'to'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {logoURI: element.logoURI, name: element.name, symbol: element.tokenSymbol, address: element.weth, axlUSDC: element.axlUSDC, usdc: element.usdc, weth: element.weth, decimals: 0}]
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
          if(this.amount > 0) {
            if(this.fromChain.name !== this.toChain.name) {
              if(this.isApprove) {

              }
            }
          }
        }
      } else {
        this.connectWallet()
      }
      
    }
  }
}
</script>
