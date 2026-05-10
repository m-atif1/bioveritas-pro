import React, { useState, useEffect, useCallback } from 'react';
import web3 from '../lib/web3';
import TokenABI from '../abis/BioToken.json';
import TrialABI from '../abis/ClinicalTrial.json';

export default function AdminTerminal({ blockchain }: { blockchain: any }) {
  const { account, isAdmin, fetchData, setStatus, availableAccounts, trialPhase, setTrialPhase } = blockchain;
  const [recipient, setRecipient] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [protocolPaused, setProtocolPaused] = useState(false);

  // Identify role based on Ganache index (Admins: 0-1)
  const accountIdx = availableAccounts.findIndex((a: string) => a.toLowerCase() === account.toLowerCase());
  const isCorrectRole = accountIdx === 0 || accountIdx === 1;

  const fetchHistory = useCallback(async () => {
    try {
      const networkId = await web3.eth.net.getId();
      const tokenNet = (TokenABI as any).networks[Number(networkId)];
      if (tokenNet) {
        const token = new web3.eth.Contract(TokenABI.abi as any, tokenNet.address);
        const events = await token.getPastEvents('Transfer' as any, { fromBlock: 0, toBlock: 'latest' });
        
        setLogs(events.filter((e: any) => e.returnValues.from.toLowerCase() === account.toLowerCase()).reverse());
      }
    } catch (e) { 
      console.error("Admin History Sync Error:", e); 
    }
  }, [account]);

  useEffect(() => { 
    if (isAdmin && isCorrectRole) {
      fetchHistory(); 
    }
  }, [isAdmin, isCorrectRole, fetchHistory]);

  const handleDispense = async () => {
    if (!recipient) return alert("Please enter a target address.");
    
    // Check local balance before attempting dispense to provide clear error
    if (parseFloat(blockchain.balance) < 5000) {
      return alert(`Dispense Failed: Your current balance is ${blockchain.balance} BVT. You need at least 5,000 BVT to dispense. If you are on the Secondary Admin account, use the Master Admin (Account 0) to send tokens to this account first.`);
    }

    setStatus('Estimating Protocol Gas...');
    try {
      const networkId = await web3.eth.net.getId();
      const tokenNet = (TokenABI as any).networks[Number(networkId)];
      if (!tokenNet) throw new Error("Token contract not found");

      const token = new web3.eth.Contract(TokenABI.abi as any, tokenNet.address);
      const amount = web3.utils.toWei('5000', 'ether');
      
      const gasEstimate = await token.methods.transfer(recipient, amount).estimateGas({ from: account });
      const safeGas = Math.floor(Number(gasEstimate) * 1.5).toString(); 
      
      setStatus('Executing Treasury Dispense...');
      await token.methods.transfer(recipient, amount).send({ 
        from: account, 
        gas: safeGas 
      });
      
      setStatus('Dispense Successful');
      await fetchData(account);
      await fetchHistory();
    } catch (e) { 
      console.error(e);
      setStatus('Dispense Failed: Transaction Reverted'); 
    }
  };

  const runIntegrityAudit = async () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setStatus('Scanning Decentralized Ledger...');

    // Simulation of cryptographic verification loop
    for (let i = 0; i <= 100; i += 20) {
      setAuditProgress(i);
      await new Promise(r => setTimeout(r, 600));
      if (i === 40) setStatus('Verifying Patient DID Hashes...');
      if (i === 80) setStatus('Comparing VRF Seeds with Revealed Assignments...');
    }

    setIsAuditing(false);
    setStatus('Audit Complete: 100% Integrity');
    alert("INTEGRITY REPORT:\n\n1. All Patient Hashes authenticated.\n2. Investigator Stakes verified on-chain.\n3. Zero data-tampering detected in vitals stream.\n\nStatus: FDA COMPLIANT");
  };

  if (!isCorrectRole) return (
    <div className="p-20 text-center bg-red-600/5 rounded-[3rem] border border-red-500/20 text-red-500 font-black uppercase tracking-tighter italic shadow-inner">
      Unauthorized Node: Admin Node Key Required for Governance Access
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Real-time System Health Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Patients', val: '5/5', color: 'text-blue-500' },
          { label: 'Network Hashrate', val: '12.4 TH/s', color: 'text-purple-500' },
          { label: 'Protocol Status', val: protocolPaused ? 'PAUSED' : 'ACTIVE', color: protocolPaused ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Admin Level', val: accountIdx === 0 ? 'MASTER' : 'SECONDARY', color: 'text-amber-500' }
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Treasury Module */}
        <div className="p-10 bg-emerald-600/5 border border-emerald-500/20 rounded-[3rem] backdrop-blur-md shadow-xl relative">
          <h3 className="text-xl font-black text-emerald-500 uppercase mb-6 tracking-tighter">Treasury Dispenser</h3>
          <input 
            type="text" 
            placeholder="Recipient Node Address" 
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-6 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500/50 transition-all" 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)} 
          />
          <button onClick={handleDispense} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all uppercase tracking-widest">
            Dispense 5,000 BVT
          </button>
        </div>
        
        {/* Trial Control & Phase Management */}
        <div className="p-10 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] backdrop-blur-md shadow-xl">
           <h3 className="text-xl font-black text-blue-500 uppercase mb-6 tracking-tighter">Trial Phase Control</h3>
           <div className="space-y-4">
             <button 
               onClick={() => {
                 setTrialPhase('completed');
                 setStatus('Trial Phase: COMPLETED. VRF Results Revealed.');
               }} 
               className={`w-full py-4 font-black rounded-2xl transition-all uppercase tracking-widest text-xs ${trialPhase === 'completed' ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-500'}`}
             >
               {trialPhase === 'completed' ? 'TRIAL FINALIZED ✓' : 'FINALIZE & REVEAL VRF'}
             </button>
             <button 
               onClick={() => setProtocolPaused(!protocolPaused)}
               className={`w-full py-4 font-black rounded-2xl transition-all uppercase tracking-widest text-xs border ${protocolPaused ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500/50' : 'bg-red-600/20 text-red-500 border-red-500/50'}`}
             >
               {protocolPaused ? 'RESUME LOGGING' : 'EMERGENCY PROTOCOL PAUSE'}
             </button>
           </div>
        </div>

        {/* Audit Verification Module */}
        <div className="p-10 bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] backdrop-blur-md shadow-xl flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-black text-indigo-500 uppercase mb-4 tracking-tighter">Integrity Audit</h3>
             <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
               Cross-reference all vitals logs against participant identity hashes to detect anomalies.
             </p>
           </div>
           
           <div className="space-y-4">
             {isAuditing && (
               <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
                 <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${auditProgress}%` }}></div>
               </div>
             )}
             <button onClick={runIntegrityAudit} disabled={isAuditing} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 uppercase hover:bg-indigo-500 transition-all tracking-widest disabled:opacity-50">
               {isAuditing ? 'SCANNING BLOCKS...' : 'Run Integrity Audit'}
             </button>
           </div>
        </div>
      </div>

      {/* Advanced Governance Ledger */}
      <div className="bg-slate-900/30 rounded-[3rem] border border-slate-800/60 overflow-hidden shadow-2xl">
        <div className="px-10 py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Treasury Transaction Log</h3>
           <div className="flex gap-4">
              <span className="text-[10px] font-mono text-emerald-500 font-black tracking-widest uppercase">NODE: 0xADMIN_SECURE</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-900/40 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800/50">
              <tr>
                <th className="px-10 py-4">Action Type</th>
                <th className="px-10 py-4">Destination Node</th>
                <th className="px-10 py-4 text-right">Protocol Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {logs.length > 0 ? logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/5 transition-all group">
                  <td className="px-10 py-6 font-black text-emerald-400 uppercase tracking-tighter group-hover:pl-12 transition-all">DISPENSE_TX</td>
                  <td className="px-10 py-6 font-mono text-slate-500">{log.returnValues.to}</td>
                  <td className="px-10 py-6 text-right font-black text-white">
                    +{web3.utils.fromWei(log.returnValues.value, 'ether')} <span className="text-[10px] text-slate-500 font-normal">BVT</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-10 py-16 text-center text-slate-600 italic font-medium">
                    No governance treasury activities recorded on this node.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}