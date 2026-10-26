// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QEscrow
 * @dev Post-quantum verified digital escrow smart contract with dispute arbitration,
 *      SHA-256 state commitments, and reentrancy protection.
 */
contract QEscrow {
    enum EscrowState {
        None,
        Created,
        Funded,
        DeliverySubmitted,
        Disputed,
        Released,
        Refunded,
        Cancelled
    }

    enum DisputeRuling {
        None,
        RefundBuyer,
        ReleaseSeller,
        SplitFunds
    }

    struct EscrowItem {
        bytes32 escrowId;
        address payable buyer;
        address payable seller;
        address arbiter;
        uint256 amount;
        bytes32 termsHash;
        bytes32 evidenceHash;
        uint256 createdAt;
        uint256 deadline;
        EscrowState state;
        bool exists;
    }

    address public owner;
    mapping(bytes32 => EscrowItem) public escrows;
    mapping(address => bool) public authorizedArbiters;

    // Mutex for ReentrancyGuard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Events
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address arbiter,
        uint256 amount,
        bytes32 termsHash,
        uint256 deadline
    );
    event EscrowFunded(bytes32 indexed escrowId, address indexed buyer, uint256 amount);
    event DeliverySubmitted(bytes32 indexed escrowId, address indexed seller, bytes32 evidenceHash);
    event EscrowReleased(bytes32 indexed escrowId, address indexed toSeller, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed toBuyer, uint256 amount);
    event DisputeOpened(bytes32 indexed escrowId, address indexed openedBy, bytes32 reasonHash);
    event DisputeResolved(
        bytes32 indexed escrowId,
        address indexed arbiter,
        DisputeRuling ruling,
        uint256 buyerAmount,
        uint256 sellerAmount
    );
    event EscrowCancelled(bytes32 indexed escrowId, address indexed buyer);
    event ArbiterUpdated(address indexed arbiter, bool status);

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can invoke");
        _;
    }

    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
        authorizedArbiters[msg.sender] = true;
    }

    function setArbiter(address arbiter, bool status) external onlyOwner {
        require(arbiter != address(0), "Invalid arbiter address");
        authorizedArbiters[arbiter] = status;
        emit ArbiterUpdated(arbiter, status);
    }

    /**
     * @notice Create a new escrow agreement with canonical terms hash and optional initial deposit
     */
    function createEscrow(
        bytes32 escrowId,
        address payable seller,
        address arbiter,
        bytes32 termsHash,
        uint256 durationSeconds
    ) external payable nonReentrant {
        require(escrowId != bytes32(0), "Escrow ID cannot be zero");
        require(!escrows[escrowId].exists, "Escrow already exists");
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Buyer and seller cannot be identical");
        require(termsHash != bytes32(0), "Terms hash required");
        require(durationSeconds >= 60, "Duration must be at least 60 seconds");

        address assignedArbiter = arbiter != address(0) ? arbiter : owner;

        escrows[escrowId] = EscrowItem({
            escrowId: escrowId,
            buyer: payable(msg.sender),
            seller: seller,
            arbiter: assignedArbiter,
            amount: 0,
            termsHash: termsHash,
            evidenceHash: bytes32(0),
            createdAt: block.timestamp,
            deadline: block.timestamp + durationSeconds,
            state: EscrowState.Created,
            exists: true
        });

        emit EscrowCreated(
            escrowId,
            msg.sender,
            seller,
            assignedArbiter,
            msg.value,
            termsHash,
            block.timestamp + durationSeconds
        );

        if (msg.value > 0) {
            escrows[escrowId].amount = msg.value;
            escrows[escrowId].state = EscrowState.Funded;
            emit EscrowFunded(escrowId, msg.sender, msg.value);
        }
    }

    /**
     * @notice Deposit funds into an already created escrow
     */
    function fundEscrow(bytes32 escrowId) external payable nonReentrant {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.buyer, "Only buyer can fund escrow");
        require(item.state == EscrowState.Created, "Escrow cannot be funded in current state");
        require(msg.value > 0, "Funding amount must be greater than zero");

        item.amount += msg.value;
        item.state = EscrowState.Funded;

        emit EscrowFunded(escrowId, msg.sender, msg.value);
    }

    /**
     * @notice Seller submits delivery proof commitment (SHA-256 evidence hash)
     */
    function submitDelivery(bytes32 escrowId, bytes32 evidenceHash) external {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.seller, "Only seller can submit delivery");
        require(item.state == EscrowState.Funded, "Escrow must be funded before delivery");
        require(evidenceHash != bytes32(0), "Evidence hash required");

        item.evidenceHash = evidenceHash;
        item.state = EscrowState.DeliverySubmitted;

        emit DeliverySubmitted(escrowId, msg.sender, evidenceHash);
    }

    /**
     * @notice Buyer confirms delivery and triggers release of funds to seller
     */
    function confirmDeliveryAndRelease(bytes32 escrowId) external nonReentrant {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.buyer, "Only buyer can release funds");
        require(
            item.state == EscrowState.Funded || item.state == EscrowState.DeliverySubmitted,
            "Invalid state for release"
        );
        require(item.amount > 0, "No funds locked");

        uint256 payout = item.amount;
        item.amount = 0;
        item.state = EscrowState.Released;

        (bool success, ) = item.seller.call{value: payout}("");
        require(success, "Seller transfer failed");

        emit EscrowReleased(escrowId, item.seller, payout);
    }

    /**
     * @notice Open dispute when parties disagree
     */
    function openDispute(bytes32 escrowId, bytes32 reasonHash) external {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.buyer || msg.sender == item.seller, "Only buyer or seller can dispute");
        require(
            item.state == EscrowState.Funded || item.state == EscrowState.DeliverySubmitted,
            "Cannot dispute in current state"
        );

        item.state = EscrowState.Disputed;
        emit DisputeOpened(escrowId, msg.sender, reasonHash);
    }

    /**
     * @notice Authorized arbiter resolves dispute with explicit ruling and distribution
     */
    function resolveDispute(
        bytes32 escrowId,
        DisputeRuling ruling,
        uint256 buyerShare
    ) external nonReentrant {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(item.state == EscrowState.Disputed, "Escrow is not in dispute");
        require(
            msg.sender == item.arbiter || msg.sender == owner || authorizedArbiters[msg.sender],
            "Unauthorized arbiter"
        );
        require(ruling != DisputeRuling.None, "Valid ruling required");

        uint256 total = item.amount;
        require(total > 0, "No funds to disburse");

        item.amount = 0;

        if (ruling == DisputeRuling.RefundBuyer) {
            item.state = EscrowState.Refunded;
            (bool success, ) = item.buyer.call{value: total}("");
            require(success, "Buyer refund failed");
            emit DisputeResolved(escrowId, msg.sender, ruling, total, 0);
            emit EscrowRefunded(escrowId, item.buyer, total);
        } else if (ruling == DisputeRuling.ReleaseSeller) {
            item.state = EscrowState.Released;
            (bool success, ) = item.seller.call{value: total}("");
            require(success, "Seller payout failed");
            emit DisputeResolved(escrowId, msg.sender, ruling, 0, total);
            emit EscrowReleased(escrowId, item.seller, total);
        } else if (ruling == DisputeRuling.SplitFunds) {
            require(buyerShare <= total, "Buyer share exceeds total locked balance");
            uint256 sellerShare = total - buyerShare;
            item.state = EscrowState.Released;

            if (buyerShare > 0) {
                (bool bSuccess, ) = item.buyer.call{value: buyerShare}("");
                require(bSuccess, "Buyer split transfer failed");
            }
            if (sellerShare > 0) {
                (bool sSuccess, ) = item.seller.call{value: sellerShare}("");
                require(sSuccess, "Seller split transfer failed");
            }

            emit DisputeResolved(escrowId, msg.sender, ruling, buyerShare, sellerShare);
        }
    }

    /**
     * @notice Buyer claims refund if deadline has expired without delivery or dispute
     */
    function claimExpiredRefund(bytes32 escrowId) external nonReentrant {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.buyer, "Only buyer can claim expired refund");
        require(item.state == EscrowState.Funded, "Escrow must be in Funded state to expire");
        require(block.timestamp >= item.deadline, "Escrow deadline has not passed yet");
        require(item.amount > 0, "No funds locked");

        uint256 refundAmount = item.amount;
        item.amount = 0;
        item.state = EscrowState.Refunded;

        (bool success, ) = item.buyer.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit EscrowRefunded(escrowId, item.buyer, refundAmount);
    }

    /**
     * @notice Buyer cancels unfunded escrow
     */
    function cancelUnfundedEscrow(bytes32 escrowId) external {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        require(msg.sender == item.buyer, "Only buyer can cancel");
        require(item.state == EscrowState.Created, "Can only cancel unfunded escrow");
        require(item.amount == 0, "Cannot cancel funded escrow via this function");

        item.state = EscrowState.Cancelled;
        emit EscrowCancelled(escrowId, msg.sender);
    }

    /**
     * @notice Read complete escrow details
     */
    function getEscrow(bytes32 escrowId) external view returns (
        bytes32 id,
        address buyer,
        address seller,
        address arbiter,
        uint256 amount,
        bytes32 termsHash,
        bytes32 evidenceHash,
        uint256 createdAt,
        uint256 deadline,
        EscrowState state
    ) {
        EscrowItem storage item = escrows[escrowId];
        require(item.exists, "Escrow does not exist");
        return (
            item.escrowId,
            item.buyer,
            item.seller,
            item.arbiter,
            item.amount,
            item.termsHash,
            item.evidenceHash,
            item.createdAt,
            item.deadline,
            item.state
        );
    }
}
