import React, { useState, useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider"
import { formatAddress, formatBalance, formatChainAsNum } from "./utils";
import { Icon } from '@iconify/react';
import { ethers } from "ethers";
import faucetContract from './abi/abi'
import {
  REQUIRED_TO_IMPLEMENT_FAUCET_TOKEN_ADDRESSES,
  BSC_TESTNET_CHAIN_ID
} from './addresses';


const Faucet = () => {

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: "", chainId: "" };
  const [wallet, setWallet] = useState(initialState);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [signer, setSigner] = useState<any>();
  const [fcContract, setFcContract] = useState<any>();


  useEffect(() => {

    //refreshAccounts
    const refreshAccounts = async (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        // If length 0, user is disconnected
        setWallet(initialState);

        const chainId = await window.ethereum!.request({
          method: "eth_chainId",
        });
        refreshChain(chainId);
      }
    };

    // refreshChain
    const refreshChain = async (chainId: any) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      await updateWallet(accounts);
    };

    //detectEthereumProvider
    const getProvider = async () => {

      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setSigner(provider.getSigner());
        setFcContract(faucetContract(provider));

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        const chainId = await window.ethereum!.request({
          method: "eth_chainId",
        });

        refreshAccounts(accounts);
        refreshChain(chainId);
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

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setSigner(provider.getSigner());
        setFcContract(faucetContract(provider));

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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      setTokenAmount(value);
    }
  };

  //Add token to metamask
  const handleAddTokenToMetamask = async () => {
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
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: selectedToken,
            },
          },
        });
      }
    } catch (error) {
      // Handle errors
      console.error("Error connecting to Binance Smart Chain Testnet:", error);
    }
  };

  //SELECT TOKEN
  const handleTokenSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(event.target.value);
    console.log(event.target.value);
  };

  //SEND TOKEN
  const HandlerSendToken = async () => {
    try {
      const fcContractWithSigner = fcContract.connect(signer);
      const resp = await fcContractWithSigner.requestToken(selectedToken);
      console.log(resp);
    } catch (err) {
      //console.error(err);
    }
  };

  //GET TEST ABI
  const TestABI = async () => {
    try {
      const fcContractWithSigner = fcContract.connect(signer);
      const resp = await fcContractWithSigner.getTokenBalance(selectedToken);
      console.log(resp);


    } catch (err) {
      //console.error(err);
    }
  };

  //-----------------------------------------------------------------------------------------------------------------------

  return (

    <div className='bg-slate-800 grid place-content-center min-h-screen'>
      <div className="bg-white grid gap-5 max-w-[600px] rounded-lg p-7">

        <div className='flex xl:flex-row flex-col xl:justify-between items-center gap-5'>
          <h1 className="text-4xl font-bold bg-clip-text text-center text-transparent bg-gradient-to-r from-blue-600 to-teal-500 ">
            BSC Testnet Faucet
          </h1>

          {/* CONNECT METAMASK BUTTON */}

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

        {/* WALLET ADDRESS */}

        <div>

          {wallet.accounts.length > 0 && (
            <div>
              <p className='font-semibold mb-2 text-neutral-500'>Wallet Address</p>
              <input
                type="text"
                defaultValue={wallet.accounts[0]}
                placeholder='Enter your wallet address (0x...)'
                className="block outline-none ring-1 rounded-sm w-full p-2"
                readOnly
              />
            </div>
          ) || (
              <></>
            )}
        </div>

        <div className='grid grid-cols-3 gap-5'>

          {/* SELECT TOKEN OPTION */}

          <div className=" col-span-2">
            <p className='font-semibold mb-2 text-neutral-500'>Select Token</p>
            <select id="tokenSelect"
              className="select select-bordered outline-none ring-1 rounded-sm w-full p-2"
              onChange={handleTokenSelectChange}
              value={selectedToken} >
              <option value="" selected disabled hidden>Choose here</option>
              {REQUIRED_TO_IMPLEMENT_FAUCET_TOKEN_ADDRESSES.map(address => (
                <option key={address} value={address} >
                  {address === "0xf0dEDda1ecbEf742AA3DaE9c8D35E7fCb7fC3Ef6" ? "MKFRD" :
                    address === "0x4c30FBf082BaD0938e33802651058Ee6aab8bC9e" ? "PKLT" :
                      address === "0x1d75aa0A3BCe3feC08FF30d68CeeC0112DF066E4" ? "ETH" :
                        address === "0x665aE6c8B332cCE9B1B50d9B2c79d1731516d2fB" ? "BUSD" :
                          address === "0x2F02f77c2bA5A7cE4924f2a1E5Ecc85580fDD096" ? "USDT" : address}</option>

              ))}

            </select>
          </div>

          {/* BUTTON IMPORT TOKEN TO METAMASK */}

          <div className=" col-span-1 flex justify-center self-end">
            <button className=" ring-1 rounded-full ring-slate-200 p-2 gap-2 w-full text-blue-700 font-medium "
              onClick={handleAddTokenToMetamask}>Import Token</button>
          </div>

        </div>

        {/* WALLET BALANCE */}


        <div className=" grid grid-cols-2 gap-5">

          {wallet.accounts.length > 0 && (
            <div className=" col-span-2">
              <p className='font-semibold mb-2 text-neutral-500'>Wallet Balance</p>
              <div className='flex text-justify gap-5 '>
                <input type="number" value={wallet.balance} className="block bg-neutral-100 ring-neutral-300 outline-none ring-1 rounded-sm w-full cursor-default  p-2" readOnly />
              </div>
            </div>
          ) || (
              <></>
            )}


          {/* AMOUNT SEND TOKEN TO METAMASK */}

          <div className="hidden">
            <p className='font-semibold mb-2 text-neutral-500'>Amount</p>
            <input type="number" value={tokenAmount} onChange={handleChange} className="block w-full outline-none ring-1 rounded-sm  p-2" />
          </div>
        </div>

        {/* SEND TOKEN BUTTON */}

        {window.ethereum?.isMetaMask && wallet.chainId !== `0x${BSC_TESTNET_CHAIN_ID.toString(16)}` && (
          <button className=' bg-red-600 rounded-md text-nowrap text-white w-full p-2 my-5 font-medium '
            onClick={handleConnect}>
            <>SWITCH TO BSC TESTNET</>
          </button>
        ) || wallet.accounts.length > 0 && (
          <button className=' bg-blue-600 rounded-md text-nowrap text-white w-full p-2 my-5 font-medium '
            onClick={HandlerSendToken}>
            {/* <>SEND {tokenAmount} TOKENS</> */}
            <>SEND TOKENS</>
          </button>
        ) || (
            <button className=' bg-blue-300 rounded-md text-nowrap text-white w-full p-2 my-5 font-medium '
              onClick={HandlerSendToken} disabled>
              {/* <>SEND {tokenAmount} TOKENS</> */}
              <>SEND TOKENS</>
            </button>
          )}

        {/* Wallet Address Detail */}
        <div className="hidden">
          {wallet.accounts.length > 0 && (
            <div>
              <div>Wallet Accounts: {wallet.accounts[0]}</div>
              <div>Wallet Balance: {wallet.balance}</div>
              <div>Hex ChainId: {wallet.chainId}</div>
              <div>
                Numeric ChainId: {formatChainAsNum(wallet.chainId)}
              </div>
            </div>
          )}
        </div>

        {/* ___________________________ */}

        <button className="hidden" onClick={TestABI}>click</button>
      </div>
    </div>
  )
}

export default Faucet
