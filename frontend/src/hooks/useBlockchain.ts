import { useState, useEffect, useCallback } from 'react';
import web3 from '../lib/web3';
import TrialABI from '../abis/ClinicalTrial.json';
import TokenABI from '../abis/BioToken.json';

export const useBlockchain = () => {
  const [account, setAccount] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [balance, setBalance] = useState('0');
  const [tvl, setTvl] = useState('0');
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState('System Initialized');
  const [trialPhase, setTrialPhase] = useState('active'); // 'active' or 'completed'

  const fetchData = useCallback(async (userAddress: string) => {
    if (!userAddress) return;
    try {
      const networkId = await web3.eth.net.getId();
      const tokenNet = (TokenABI as any).networks[Number(networkId)];
      const trialNet = (TrialABI as any).networks[Number(networkId)];

      if (tokenNet) {
        const token = new web3.eth.Contract(TokenABI.abi as any, tokenNet.address);
        const bal = await token.methods.balanceOf(userAddress).call();
        setBalance(web3.utils.fromWei(bal as any, 'ether'));
        
        if (trialNet) {
          const trialBal = await token.methods.balanceOf(trialNet.address).call();
          setTvl(web3.utils.fromWei(trialBal as any, 'ether'));
        }
      }

      if (trialNet) {
        const trial = new web3.eth.Contract(TrialABI.abi as any, trialNet.address);
        const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const isAcctAdmin = await trial.methods.hasRole(ADMIN_ROLE, userAddress).call();
        setIsAdmin(isAcctAdmin as any);
      }
    } catch (e) { console.error("Sync Error:", e); }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const accounts = await web3.eth.getAccounts();
        setAvailableAccounts(accounts);
        if (accounts.length > 0 && !account) setAccount(accounts[0]);
      } catch (e) { setStatus('Web3 Connection Failed'); }
    }
    init();
  }, [account]);

  useEffect(() => {
    if (account) fetchData(account);
  }, [account, fetchData]);

  return { 
    account, 
    setAccount, 
    availableAccounts, 
    balance, 
    tvl, 
    isAdmin, 
    status, 
    setStatus, 
    fetchData,
    trialPhase,
    setTrialPhase 
  };
};