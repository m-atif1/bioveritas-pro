import React, { useState, useEffect, useCallback } from 'react';
import web3 from '../lib/web3';
import TrialABI from '../abis/ClinicalTrial.json';
import TokenABI from '../abis/BioToken.json';

export default function InvestigatorTab({ blockchain }: { blockchain: any }) {
  const { account, balance, fetchData, setStatus, availableAccounts } = blockchain;
  const [isStaking, setIsStaking] = useState(false);
  const [hasDoctorRole, setHasDoctorRole] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Strictly define Investigator group (Ganache Accounts 7-10)
  const accountIdx = availableAccounts.findIndex((a: string) => a.toLowerCase() === account.toLowerCase());
  const isCorrectRole = accountIdx >= 7 && accountIdx <= 10;

  const syncRole = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const networkId = await web3.eth.net.getId();
      const trialNet = (TrialABI as any).networks[Number(networkId)];
      if (trialNet) {
        const trial = new web3.eth.Contract(TrialABI.abi as any, trialNet.address);
        const DOCTOR_ROLE = web3.utils.keccak256("DOCTOR_ROLE");
        
        // Direct on-chain check to ensure we have the absolute latest state
        const isDoc = await trial.methods.hasRole(DOCTOR_ROLE, account).call();
        setHasDoctorRole(isDoc as any);

        if (isDoc) {
          const events = await trial.getPastEvents('VitalsLogged' as any, { fromBlock: 0 });
          setLogs(events.map((e: any) => ({
            id: e.transactionHash,
            patient: e.returnValues.patient,
            heartRate: e.returnValues.heartRate,
            timestamp: new Date(Number(e.returnValues.timestamp) * 1000).toLocaleTimeString()
          })).reverse());
        }
      }
    } catch (e) { 
      console.error("Investigator Sync Error:", e); 
    } finally {
      setIsDataLoading(false);
    }
  }, [account]);

  useEffect(() => { 
    if (isCorrectRole) syncRole(); 
  }, [account, syncRole, isCorrectRole]);

  const handleStaking = async () => {
    if (parseFloat(balance) < 1000) {
      return alert(`Insufficient BVT. You have ${balance} BVT, but 1,000 is required for the security stake.`);
    }

    setIsStaking(true);
    setStatus('Authorizing Investigator Node...');
    try {
      const networkId = await web3.eth.net.getId();
      const trialNet = (TrialABI as any).networks[Number(networkId)];
      const tokenNet = (TokenABI as any).networks[Number(networkId)];
      
      if (!trialNet || !tokenNet) throw new Error("Contracts not found on this network");

      const trialAddr = trialNet.address;
      const tokenAddr = tokenNet.address;
      const token = new web3.eth.Contract(TokenABI.abi as any, tokenAddr);
      const trial = new web3.eth.Contract(TrialABI.abi as any, trialAddr);

      const stakeAmount = web3.utils.toWei('1000', 'ether');

      setStatus('Approving BVT Stake Transfer...');
      const gasApprove = await token.methods.approve(trialAddr, stakeAmount).estimateGas({ from: account });
      await token.methods.approve(trialAddr, stakeAmount).send({ 
        from: account, 
        gas: Math.floor(Number(gasApprove) * 1.2).toString() 
      });
      
      setStatus('Locking Stake in Protocol...');
      const gasStake = await trial.methods.applyForDoctorRole().estimateGas({ from: account });
      await trial.methods.applyForDoctorRole().send({ 
        from: account, 
        gas: Math.floor(Number(gasStake) * 1.2).toString() 
      });
      
      setStatus('Authorization Confirmed. Syncing...');
      
      // Delay to allow block propagation
      await new Promise(r => setTimeout(r, 2000));
      
      await fetchData(account); 
      await syncRole(); 
    } catch (e) { 
      console.error("Staking Transaction Failed:", e);
      setStatus('Authorization Failed'); 
    } finally {
      setIsStaking(false);
    }
  };

  const toggleVerify = (id: string) => {
    setVerifiedIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    setStatus(verifiedIds.includes(id) ? "Verification Removed" : "Block Signed & Verified");
  };

  if (!isCorrectRole) return (
    <div className="p-20 text-center bg-slate-900/50 rounded-[3rem] border border-slate-800 italic text-slate-500">
      Account index {accountIdx} is not assigned to the Investigator Role Group.
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {!hasDoctorRole ? (
        <div className="p-12 bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] text-center backdrop-blur-xl shadow-2xl">
          <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/30">
            <span className="text-4xl animate-pulse">🔐</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">Security Stake Required</h2>
          <p className="text-slate-400 mb-6 font-medium">Node Balance: <span className="text-indigo-400">{balance} BVT</span></p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed">
            Investigator nodes must stake 1,000 BVT to initialize clinical audit permissions.
          </p>
          <button 
            onClick={handleStaking} 
            disabled={isStaking} 
            className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl shadow-xl transition-all uppercase tracking-widest disabled:opacity-50"
          >
            {isStaking ? 'VERIFYING NODE...' : 'Stake 1,000 BVT & Unlock Audit'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Clinical Audit Suite</h2>
            <div className="flex gap-4">
              <button 
                onClick={syncRole}
                disabled={isDataLoading}
                className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
              >
                {isDataLoading ? 'Scanning...' : 'Refresh Feed'}
              </button>
              <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase">Verified Blocks</p>
                <p className="text-xl font-mono text-emerald-500">{verifiedIds.length} / {logs.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {logs.map((l, i) => (
              <div key={i} className={`p-8 rounded-[2rem] border transition-all flex justify-between items-center ${verifiedIds.includes(l.id) ? 'bg-emerald-600/5 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-mono">HASH: {l.patient.slice(0,30)}...</p>
                  <div className="flex gap-6 items-baseline">
                    <p className="text-3xl font-black text-white">{l.heartRate} <span className="text-xs text-slate-500">BPM</span></p>
                    <p className="text-xs text-slate-500 font-mono">{l.timestamp}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleVerify(l.id)}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${verifiedIds.includes(l.id) ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-blue-500/50'}`}
                >
                  {verifiedIds.includes(l.id) ? 'Verified ✓' : 'Verify & Sign'}
                </button>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center py-20 text-slate-600 italic">Listening for clinical telemetry...</div>}
          </div>
        </>
      )}
    </div>
  );
}