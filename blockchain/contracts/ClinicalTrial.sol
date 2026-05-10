// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BioToken.sol";

contract ClinicalTrial is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    uint256 public constant DOCTOR_STAKE_AMOUNT = 1000 * 10**18;
    uint256 public constant REWARD_PER_LOG = 1 * 10**18;

    BioToken public immutable bvtToken;

    struct Patient {
        bytes32 identityHash; // GDPR/HIPAA Compliance
        uint8 group; // 1 = Drug, 2 = Placebo
        uint256 lastLogTime;
        bool isRegistered;
    }

    mapping(address => Patient) public patients;
    mapping(address => uint256) public stakedAmount;

    event DoctorStaked(address indexed doctor);
    event VitalsLogged(address indexed patient, uint256 heartRate, uint256 timestamp);
    event StakeSlashed(address indexed doctor, uint256 amount);

    constructor(address _tokenAddress) {
        bvtToken = BioToken(_tokenAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Doctors stake BVT to gain DOCTOR_ROLE.
     */
    function applyForDoctorRole() external nonReentrant {
        require(bvtToken.balanceOf(msg.sender) >= DOCTOR_STAKE_AMOUNT, "Insufficient BVT");
        bvtToken.transferFrom(msg.sender, address(this), DOCTOR_STAKE_AMOUNT);
        
        stakedAmount[msg.sender] = DOCTOR_STAKE_AMOUNT;
        _grantRole(DOCTOR_ROLE, msg.sender);
        
        emit DoctorStaked(msg.sender);
    }

    /**
     * @dev Admin can slash malicious doctors.
     */
    function slashDoctor(address doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = stakedAmount[doctor];
        stakedAmount[doctor] = 0;
        _revokeRole(DOCTOR_ROLE, doctor);
        emit StakeSlashed(doctor, amount);
    }

    /**
     * @dev Register patient using a hash (off-chain IPFS link).
     */
    function registerPatient(bytes32 _idHash) external {
        require(!patients[msg.sender].isRegistered, "Already registered");
        
        // Pseudo-random group assignment (Note: Use VRF in Prod)
        uint8 assignedGroup = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 2) + 1;

        patients[msg.sender] = Patient({
            identityHash: _idHash,
            group: assignedGroup,
            lastLogTime: 0,
            isRegistered: true
        });
    }

    /**
     * @dev IoT stream receiver with rate limiting and automated rewards.
     */
    function logVitals(uint256 _heartRate) external whenNotPaused {
        Patient storage patient = patients[msg.sender];
        require(patient.isRegistered, "Not a registered patient");
        require(block.timestamp >= patient.lastLogTime + 1 minutes, "Rate limit: 1 log/min");

        patient.lastLogTime = block.timestamp;
        
        // Logic: Trigger reward minting
        bvtToken.mint(msg.sender, REWARD_PER_LOG);

        emit VitalsLogged(msg.sender, _heartRate, block.timestamp);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}