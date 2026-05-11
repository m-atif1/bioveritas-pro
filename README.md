# BioVeritas Pro 🛡️

A decentralized, Zero-Knowledge Proof (ZKP) enabled clinical trial management platform ensuring HIPAA-compliant patient identity verification and immutable vital tracking.

## 🔬 System Architecture
BioVeritas bridges a Next.js frontend with a Truffle-deployed Solidity backend:
* **Smart Contracts:** Deployed on local Ganache environments, managing RBAC (Role-Based Access Control) for Admins, Investigators, and Patients.
* **Frontend:** React-based dashboard utilizing Ethers.js/Web3.js for blockchain interaction.
* **Data Visualization:** Real-time IoT vitals simulation (Heart Rate, Systolic BP) visualized using Chart.js.

## 🚀 Quick Start Local Environment

### Prerequisites
* Node.js (v18+)
* Ganache (running on `127.0.0.1:7545`)
* MetaMask Browser Extension

### 1. Deploy Smart Contracts
```bash
cd blockchain
npm install
truffle migrate --network development
