# BioVeritas Pro 🛡️

A decentralized, Zero-Knowledge Proof (ZKP) enabled clinical trial management platform ensuring HIPAA-compliant patient identity verification and immutable vital tracking.

## 🎥 Application Demo

https://github.com/user-attachments/assets/d5443501-fd86-44d9-8661-d46c3b334a07

## 🔬 System Architecture & Features

BioVeritas bridges a Next.js frontend with a Truffle-deployed Solidity backend, engineered to simulate a trustless clinical environment:

* **Strict Role-Based Access Control (RBAC):** The platform strictly segments users based on their Ganache account index:
  * **Admin (Index 0):** Manages global trial phases and investigator assignments.
  * **Investigator (Index 1):** Oversees clinical data and trial progression.
  * **Patients (Indices 2-6):** Restricted to the Patient Portal for onboarding and data submission.
* **Zero-Knowledge Proof (ZKP) Gating:** Patients must generate a cryptographic proof to verify their medical eligibility without revealing their underlying identity on-chain.
* **Real-Time IoT Vitals Streaming:** Once registered, patients can initialize a sensor session that streams simulated Heart Rate and Blood Pressure data, visualized dynamically via Chart.js and logged periodically to the smart contract.
* **Double-Blind Protocol:** Patient clinical assignment (Experimental vs. Control group) remains cryptographically hashed and locked until the global trial phase is marked as completed.

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
