// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentEscrow
 * @dev Programmable escrow contract for Recruiter Agent & Screening Agent commerce on MST Blockchain.
 * Holds native MSTC tokens in escrow until screening results are verified off-chain.
 */
contract AgentEscrow {
    enum Status { None, Funded, Released, Refunded }

    struct Agreement {
        address recruiter;  // Buyer (Recruiter Agent / Human owner)
        address seller;     // Seller (Screening Agent receiving public address)
        uint256 amount;     // Escrow amount in MSTC wei
        Status status;      // Current lifecycle status
    }

    // Address authorized as automated verification relayer (can release or refund on-chain after off-chain validation)
    address public verifier;
    
    // Contract deployer / owner
    address public owner;

    // Mapping from unique Agreement ID to Agreement struct
    mapping(uint256 => Agreement) public agreements;

    // Events
    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed recruiter,
        address indexed seller,
        uint256 amount
    );

    event PaymentReleased(
        uint256 indexed agreementId,
        address indexed seller,
        uint256 amount
    );

    event AgreementRefunded(
        uint256 indexed agreementId,
        address indexed recruiter,
        uint256 amount
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // Reentrancy guard state variable
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "ReentrancyGuard: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only contract owner");
        _;
    }

    /**
     * @dev Constructor sets the deployer as owner and initial verifier relayer address.
     * @param _verifier Address authorized to act as off-chain verification relayer.
     */
    constructor(address _verifier) {
        require(_verifier != address(0), "Invalid verifier address");
        owner = msg.sender;
        verifier = _verifier;
        _reentrancyStatus = _NOT_ENTERED;
    }

    /**
     * @dev Allows owner to update the verifier relayer address.
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier address");
        emit VerifierUpdated(verifier, _newVerifier);
        verifier = _newVerifier;
    }

    /**
     * @notice Creates and funds a new escrow agreement with MSTC native currency.
     * @param agreementId Unique identifier for the agreement.
     * @param sellerAddress Public wallet address of the Screening Agent.
     */
    function createAndFundAgreement(uint256 agreementId, address sellerAddress) external payable nonReentrant {
        require(msg.value > 0, "Funding amount must be greater than zero");
        require(sellerAddress != address(0), "Seller address cannot be zero address");
        require(agreements[agreementId].status == Status.None, "Agreement ID already exists");
        require(sellerAddress != msg.sender, "Recruiter and seller cannot be the same address");

        agreements[agreementId] = Agreement({
            recruiter: msg.sender,
            seller: sellerAddress,
            amount: msg.value,
            status: Status.Funded
        });

        emit AgreementCreated(agreementId, msg.sender, sellerAddress, msg.value);
    }

    /**
     * @notice Releases escrowed payment to the Screening Agent upon successful result verification.
     * @dev Can be called by either the recruiter directly or the authorized verifier relayer.
     * @param agreementId Unique identifier of the agreement to release.
     */
    function releasePayment(uint256 agreementId) external nonReentrant {
        Agreement storage agreement = agreements[agreementId];

        require(agreement.status != Status.None, "Agreement does not exist");
        require(agreement.status == Status.Funded, "Agreement is not in Funded state");
        require(
            msg.sender == agreement.recruiter || msg.sender == verifier || msg.sender == owner,
            "Unauthorized: Only recruiter, verifier, or owner can release payment"
        );

        address seller = agreement.seller;
        uint256 amount = agreement.amount;

        // State change before external call (CEI Pattern)
        agreement.status = Status.Released;

        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "MSTC transfer to seller failed");

        emit PaymentReleased(agreementId, seller, amount);
    }

    /**
     * @notice Refunds locked payment back to the Recruiter Agent if screening fails or is rejected.
     * @dev Can be called by either the recruiter directly or the authorized verifier relayer.
     * @param agreementId Unique identifier of the agreement to refund.
     */
    function refundAgreement(uint256 agreementId) external nonReentrant {
        Agreement storage agreement = agreements[agreementId];

        require(agreement.status != Status.None, "Agreement does not exist");
        require(agreement.status == Status.Funded, "Agreement is not in Funded state");
        require(
            msg.sender == agreement.recruiter || msg.sender == verifier || msg.sender == owner,
            "Unauthorized: Only recruiter, verifier, or owner can refund agreement"
        );

        address recruiter = agreement.recruiter;
        uint256 amount = agreement.amount;

        // State change before external call (CEI Pattern)
        agreement.status = Status.Refunded;

        (bool success, ) = payable(recruiter).call{value: amount}("");
        require(success, "MSTC refund to recruiter failed");

        emit AgreementRefunded(agreementId, recruiter, amount);
    }

    /**
     * @notice Fetches details of an escrow agreement.
     */
    function getAgreement(uint256 agreementId)
        external
        view
        returns (
            address recruiter,
            address seller,
            uint256 amount,
            Status status
        )
    {
        Agreement memory agreement = agreements[agreementId];
        return (agreement.recruiter, agreement.seller, agreement.amount, agreement.status);
    }

    /**
     * @notice Helper view functions for status checks.
     */
    function isFunded(uint256 agreementId) external view returns (bool) {
        return agreements[agreementId].status == Status.Funded;
    }

    function isReleased(uint256 agreementId) external view returns (bool) {
        return agreements[agreementId].status == Status.Released;
    }

    function isRefunded(uint256 agreementId) external view returns (bool) {
        return agreements[agreementId].status == Status.Refunded;
    }
}
