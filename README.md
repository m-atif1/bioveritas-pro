# BioVeritas Pro 🛡️

A decentralized, Zero-Knowledge Proof (ZKP) enabled clinical trial management platform ensuring HIPAA-compliant patient identity verification and immutable vital tracking.

## 🎥 Application Demo

https://github.com/user-attachments/assets/d5443501-fd86-44d9-8661-d46c3b334a07

## 🔬 System Architecture & Features

BioVeritas bridges a Next.js frontend with a Truffle-deployed Solidity backend, engineered to simulate a trustless clinical environment:

* **Strict Role-Based Access Control (RBAC):** The platform strictly segments users based on their Ganache account index:
  * **Admins (Indices 0-1):** Master and Secondary nodes that manage global trial phases, emergency pauses, and BVT treasury dispensing.
  * **Patients (Indices 2-6):** Restricted to the Patient Portal for onboarding, verification, and data submission.
  * **Investigators (Indices 7-10):** Clinical auditors who must cryptographically stake 1,000 BVT into the smart contract to unlock verification dashboards.
* **On-Chain Randomization:** During registration, patients are assigned to clinical groups (Drug vs. Placebo) using a pseudo-random hash of the block timestamp and their wallet address, mimicking VRF functionality for unbiased distribution.
* **Double-Blind Protocol:** Patient clinical assignment remains cryptographically hashed and locked until the Master Admin finalizes the trial phase, ensuring zero bias during the active testing window.
* **Zero-Knowledge Proof (ZKP) Gating:** Patients must generate a cryptographic proof to verify their medical eligibility without revealing their underlying identity on-chain.
* **Real-Time IoT Vitals Streaming:** Once registered, patients initialize a sensor session that streams simulated Heart Rate and Blood Pressure data, visualized dynamically via Chart.js and logged directly to the smart contract via automated transactions.

## 💻 Tech Stack
* **Frontend:** Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Chart.js.
* **Blockchain:** Truffle, Solidity (0.8.19), Web3.js.
* **Network:** Localhost direct HTTP connection (MetaMask not required).

## 🚀 Quick Start Local Environment

### Prerequisites
* Node.js (v18+)
* Ganache Desktop (must be running on `http://127.0.0.1:7545`)

### 1. Deploy Smart Contracts
```bash
cd blockchain
npm install
truffle migrate --network development
