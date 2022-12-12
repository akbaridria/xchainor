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
            <div class="flex gap-x-2 text-base items-center">{{ fromChain.name }} <img :src="fromChain.image" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 flex justify-between">
            <input type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
            <div @click="getListModal('fromToken')" class="flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
              <img class="rounded-full" width="18px" :src="fromToken.image" alt="">
              <div>
                {{ fromToken.symbol}}
              </div>
              <ion-icon name="chevron-down"></ion-icon>
            </div>
          </div>
        </div>
        <div class="mx-auto">
          <ion-icon name="caret-down-circle-sharp" />
        </div>
        <div class="bg-slate-800 rounded-xl p-2 grid gap-y-2">
          <button class="group text-sm flex items-center gap-x-2" @click="getListModal('toChain')">
            <div class="text-white/50">To</div> 
            <div class="flex gap-x-2 text-base items-center">{{ toChain.name }} <img :src="toChain.image" alt="avalanche" width="18" /></div>
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          <div class="p-2 border-slate-400 flex justify-between">
            <input type="number" pattern="[0-9]+([,\.][0-9]+)?" class="bg-slate-800 text-lg rounded-lg text-white focus:outline-0" placeholder="0.0">
            <button @click="getListModal('toToken')" class="group flex items-center bg-slate-600 p-2 rounded-full gap-x-1 text-sm cursor-pointer hover:outline outline-offset-1 outline-1 outline-blue-600 transition-all">
              <img class="rounded-full" width="18px" :src="toToken.image" alt="">
              <div>
                {{ toToken.symbol}}
              </div>
              <ion-icon name="chevron-down"></ion-icon>
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <button @click="connectWallet()" class="px-3 w-full py-2 text-sm bg-blue-600 rounded-full font-semibold hover:bg-blue-600/50 transition-colors">
          Connect Wallet
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
  </div>
</template>

<script>
import { getBalance, getChain, sendTx, checkApprove, approveToken } from "../utils";
const { ethers, BigNumber } = require("ethers");
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
    return {
      openModal: false,
      listChains,
      listModal: [],
      fromChain: listChains.find((elem) => elem.name === 'Binance'),
      toChain: listChains.find((elem) => elem.name === 'Polygon'),
      identifierModal: {},
      listTokens,
      fromToken: {
        "name": "PancakeSwap Token",
        "symbol": "CAKE",
        "address": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        "chainId": 56,
        "decimals": 18,
        "image": "https://tokens.pancakeswap.finance/images/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82.png"
      },
      toToken: {
            "name": "Aave",
            "address": "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
            "symbol": "AAVE",
            "decimals": 18,
            "chainId": 137,
            "image": "https://etherscan.io/token/images/aave_32.png"
        },
      chainId: 56,
      wrongNetwork: false,
      isConnect: false,
      walletAddress: '',
      balance: 0,
      isApprove: false
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
          } else {
            this.walletAddress = data[0]
            this.isConnect = true
          }
        })
        ethereum.on('chainChanged', (data) => {
          setChainId(Number(data))
          connectWallet()

        })
      }
  },
  methods: {
    getListModal(data){
      this.listModal = []
      if(data === 'fromChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'from'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {image: element.image, name: element.name, symbol: element.tokenSymbol, address: '', decimals: 0}]
        });
      }
      if(data === 'toChain') {
        this.identifierModal = {postfix: 'chain', prefix: 'to'}
        this.listChains.forEach(element => {
            this.listModal = [...this.listModal, {image: element.image, name: element.name, symbol: element.tokenSymbol, address: '', decimals: 0}]
        });
      }
      if(data === 'fromToken') {
        this.identifierModal = {postfix: 'token', prefix: 'from'}
        this.listTokens[this.fromChain.name].forEach((element) => {
          this.listModal = [...this.listModal, {image: element.logoURI, name: element.name, symbol: element.symbol, address: element.address, decimals: element.decimals}]
        })
      }
      if(data === 'toToken') {
        this.identifierModal = {postfix: 'token', prefix: 'to'}
        this.listTokens[this.toChain.name].forEach((element) => {
          this.listModal = [...this.listModal, {image: element.logoURI, name: element.name, symbol: element.symbol, address: element.address, decimals: element.decimals}]
        })
      }
      this.openModal = true
    },

    async connectWallet(){
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const wallet = await signer.getAddress();
        const chainId = await signer.getChainId();
        this.chainId = chainId
        if (getChain(fromChain.name).chainId === chainId) {
          this.wrongNetwork = false
        } else {
          this.wrongNetwork = true
        }
        this.walletAddress = wallet;
        this.isConnect = true
        this.balance = await getBalance(fromToken, signer, wallet, provider)
        this.isApprove = await checkApprove(fromToken, walletAddress, fromChain);
        return signer
      } catch (error) {
        console.log('oops something went wrong');
      }
    }
  }
}
</script>
