import React, { useState, useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { formatAddress, formatBalance, formatChainAsNum } from "./utils";
import { Icon } from '@iconify/react';
import { ethers } from 'ethers';
import { abi } from './abi/abi'; // Import the smart contract ABI

import {
  FAUCET_CONTRACT_ADDRESS,
  REQUIRED_TO_IMPLEMENT_FAUCET_TOKEN_ADDRESSES,
  BSC_TESTNET_CHAIN_ID
} from './addresses';


const App = () => {

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: "", chainId: "" };
  const [wallet, setWallet] = useState(initialState);


  useEffect(() => {

    const refreshAccounts = async (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        // If length 0, user is disconnected
        setWallet(initialState);
      }
    };

    // 
    const refreshChain = async (chainId: any) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      await updateWallet(accounts);
    };

    //ติดตั้งผู้ให้บริการ memtamask
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        refreshAccounts(accounts);
        window.ethereum.on("accountsChanged", refreshAccounts);
        window.ethereum.on("chainChanged", refreshChain);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, []);

  //Update WalletBalance
  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    );
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    setWallet({ accounts, balance, chainId });
  };

  // Connect Metamask
  const handleConnect = async () => {
    // Add Binance Smart Chain Testnet to Metamask
    try {
      
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${BSC_TESTNET_CHAIN_ID.toString(16)}`,
            chainName: "Binance Smart Chain Testnet",
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
            blockExplorerUrls: ["https://testnet.bscscan.com/"],
          },
        ],
      });

      // Check if the user has connected to BSC Testnet
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId === `0x${BSC_TESTNET_CHAIN_ID.toString(16)}`) {
        // User is connected to BSC Testnet, request accounts
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        updateWallet(accounts);
      } else {
        // User did not connect to the expected network
        console.log("Please connect to Binance Smart Chain Testnet.");
      }
    } catch (error) {
      // Handle errors
      console.error("Error connecting to Binance Smart Chain Testnet:", error);
    }
  };

  //Token Amount
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      setTokenAmount(value);
    }
  };
  

  return (

    <div className='bg-black grid place-content-center min-h-screen'>
      <div className="bg-white grid gap-5 w-[600px] rounded-md p-7">

        <div className='flex justify-between'>
          <h1 className="text-4xl font-bold text-black text-center">
            FWX Faucet
          </h1>

          {!hasProvider && (
            <a href="https://metamask.io" target="_blank" className="flex ring-1 rounded-full ring-slate-200 p-2 px-5 gap-2 w-fit">
              <Icon className='self-center text-lg' icon="logos:metamask-icon" />Install MetaMask
            </a>
          )}
          {window.ethereum?.isMetaMask &&
            wallet.accounts.length < 1 && (
              <button className='flex ring-1 rounded-full ring-slate-200 p-2 px-5 gap-2 w-fit' onClick={handleConnect}>
                <Icon className='self-center text-lg' icon="logos:metamask-icon" /> Connect MetaMask
              </button>
            )}
          {hasProvider && wallet.accounts.length > 0 && (
            <a
              className="text_link tooltip-bottom flex ring-1 rounded-full ring-slate-200 p-2 px-5 gap-2 w-fit"
              href={`https://testnet.bscscan.com/address/${wallet.accounts[0]}`}
              target="_blank"
              data-tooltip="Open in Block Explorer"
            >
              <Icon className='self-center text-lg' icon="logos:metamask-icon" />{formatAddress(wallet.accounts[0])}
            </a>
          )}
        </div>

        <div>
          <p className='font-semibold mb-2'>Network</p>
          <div className=" outline-none ring-1 rounded-sm w-full p-2">
            BSC Testnet
          </div>
        </div>

        <div>
          <p className='font-semibold mb-2'>Wallet Address</p>
          <input
            type="text"
            value={wallet.accounts.length > 0 ? wallet.accounts[0] : ''}
            placeholder='Enter your wallet address (0x...)'
            className="block outline-none ring-1 rounded-sm w-full p-2"
          />
        </div>

        <div className='grid grid-cols-3 gap-5'>

          <div>
            <p className='font-semibold mb-2'>Select Token</p>
            <select className="select select-bordered outline-none ring-1 rounded-sm w-full p-2">
              <option value="BNB">BNB</option>
              <option value="BTC">BTC</option>
              <option value="USDT">USDT</option>
              <option value="ETH">ETH</option>
            </select>
          </div>

          <div>
            <p className='font-semibold mb-2'>Wallet Balance</p>
            <div className='flex text-justify gap-5'>
              <input type="number" value={wallet.balance} className="block outline-none ring-1 rounded-sm w-full cursor-default  p-2" readOnly />
            </div>
          </div>

          <div>
            <p className='font-semibold mb-2'>Add Token</p>
            <input type="number" value={tokenAmount} onChange={handleChange} className="block w-full outline-none ring-1 rounded-sm  p-2" />
          </div>
        </div>

        {wallet.accounts.length > 0 && wallet.chainId !== `0x${BSC_TESTNET_CHAIN_ID.toString(16)}` && (
          <button className=' bg-violet-600 rounded-md text-nowrap text-white w-full p-2 my-5 '
            onClick={handleConnect}>
            <>SWITCH TO BSC TESTNET</>
          </button>
        ) || (
            <button className=' bg-violet-600 rounded-md text-nowrap text-white w-full p-2 my-5 '
            >
              <>SEND {tokenAmount} TOKENS</>
            </button>
          )}


        <div className="">
          {wallet.accounts.length > 0 && (
            <>
              <div>Wallet Accounts: {wallet.accounts[0]}</div>
              <div>Wallet Balance: {wallet.balance}</div>
              <div>Hex ChainId: {wallet.chainId}</div>
              <div>
                Numeric ChainId: {formatChainAsNum(wallet.chainId)}
              </div>
            </>
          )}
        </div>

      </div>
    </div>

  )
}

export default App
