const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QEscrow Smart Contract", function () {
  let QEscrow, escrow;
  let owner, buyer, seller, arbiter, attacker;
  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-escrow-terms-v1-sha256-digest"));
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("delivery-tracking-dhl-123456789"));
  const disputeReasonHash = ethers.keccak256(ethers.toUtf8Bytes("damaged-goods-delivered"));
  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner, buyer, seller, arbiter, attacker] = await ethers.getSigners();
    QEscrow = await ethers.getContractFactory("QEscrow");
    escrow = await QEscrow.deploy();
    await escrow.waitForDeployment();
    await escrow.setArbiter(arbiter.address, true);
  });

  describe("Deployment and Initialization", function () {
    it("Should set deployer as owner and arbiter", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
      expect(await escrow.authorizedArbiters(owner.address)).to.be.true;
      expect(await escrow.authorizedArbiters(arbiter.address)).to.be.true;
    });
  });

  describe("Escrow Creation & Funding", function () {
    it("Should create an escrow with initial funding", async function () {
      const escrowId = ethers.id("escrow-001");
      const deposit = ethers.parseEther("1.0");

      await expect(
        escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY, {
          value: deposit,
        })
      )
        .to.emit(escrow, "EscrowCreated")
        .and.to.emit(escrow, "EscrowFunded");

      const item = await escrow.getEscrow(escrowId);
      expect(item.buyer).to.equal(buyer.address);
      expect(item.seller).to.equal(seller.address);
      expect(item.arbiter).to.equal(arbiter.address);
      expect(item.amount).to.equal(deposit);
      expect(item.state).to.equal(2); // Funded
    });

    it("Should allow creation without initial deposit, then fund separately", async function () {
      const escrowId = ethers.id("escrow-002");
      const deposit = ethers.parseEther("0.5");

      await escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY);
      let item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(1); // Created

      await escrow.connect(buyer).fundEscrow(escrowId, { value: deposit });
      item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(2); // Funded
      expect(item.amount).to.equal(deposit);
    });

    it("Should reject duplicate escrow creation with same ID", async function () {
      const escrowId = ethers.id("escrow-duplicate");
      await escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY);

      await expect(
        escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY)
      ).to.be.revertedWith("Escrow already exists");
    });

    it("Should reject escrow where buyer and seller are identical", async function () {
      const escrowId = ethers.id("escrow-self");
      await expect(
        escrow.connect(buyer).createEscrow(escrowId, buyer.address, arbiter.address, termsHash, ONE_DAY)
      ).to.be.revertedWith("Buyer and seller cannot be identical");
    });
  });

  describe("Delivery & Release Flow", function () {
    const escrowId = ethers.id("escrow-delivery-test");
    const deposit = ethers.parseEther("2.0");

    beforeEach(async function () {
      await escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY, {
        value: deposit,
      });
    });

    it("Should allow seller to submit delivery evidence", async function () {
      await expect(escrow.connect(seller).submitDelivery(escrowId, evidenceHash))
        .to.emit(escrow, "DeliverySubmitted")
        .withArgs(escrowId, seller.address, evidenceHash);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(3); // DeliverySubmitted
      expect(item.evidenceHash).to.equal(evidenceHash);
    });

    it("Should reject non-seller submitting delivery", async function () {
      await expect(
        escrow.connect(attacker).submitDelivery(escrowId, evidenceHash)
      ).to.be.revertedWith("Only seller can submit delivery");
    });

    it("Should allow buyer to release funds and transfer to seller", async function () {
      await escrow.connect(seller).submitDelivery(escrowId, evidenceHash);

      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      await expect(escrow.connect(buyer).confirmDeliveryAndRelease(escrowId))
        .to.emit(escrow, "EscrowReleased")
        .withArgs(escrowId, seller.address, deposit);

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance - initialSellerBalance).to.equal(deposit);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(5); // Released
      expect(item.amount).to.equal(0);
    });

    it("Should prevent double release", async function () {
      await escrow.connect(seller).submitDelivery(escrowId, evidenceHash);
      await escrow.connect(buyer).confirmDeliveryAndRelease(escrowId);

      await expect(
        escrow.connect(buyer).confirmDeliveryAndRelease(escrowId)
      ).to.be.revertedWith("Invalid state for release");
    });

    it("Should prevent unauthorized attacker from releasing funds", async function () {
      await escrow.connect(seller).submitDelivery(escrowId, evidenceHash);
      await expect(
        escrow.connect(attacker).confirmDeliveryAndRelease(escrowId)
      ).to.be.revertedWith("Only buyer can release funds");
    });
  });

  describe("Dispute & Arbitration Flow", function () {
    const escrowId = ethers.id("escrow-dispute-test");
    const deposit = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY, {
        value: deposit,
      });
      await escrow.connect(seller).submitDelivery(escrowId, evidenceHash);
    });

    it("Should allow buyer to open a dispute", async function () {
      await expect(escrow.connect(buyer).openDispute(escrowId, disputeReasonHash))
        .to.emit(escrow, "DisputeOpened")
        .withArgs(escrowId, buyer.address, disputeReasonHash);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(4); // Disputed
    });

    it("Should allow arbiter to rule RefundBuyer", async function () {
      await escrow.connect(buyer).openDispute(escrowId, disputeReasonHash);

      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      await expect(escrow.connect(arbiter).resolveDispute(escrowId, 1, 0)) // 1 = RefundBuyer
        .to.emit(escrow, "DisputeResolved")
        .withArgs(escrowId, arbiter.address, 1, deposit, 0)
        .and.to.emit(escrow, "EscrowRefunded");

      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      expect(finalBuyerBalance).to.be.gt(initialBuyerBalance);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(6); // Refunded
      expect(item.amount).to.equal(0);
    });

    it("Should allow arbiter to rule ReleaseSeller", async function () {
      await escrow.connect(buyer).openDispute(escrowId, disputeReasonHash);

      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      await escrow.connect(arbiter).resolveDispute(escrowId, 2, 0); // 2 = ReleaseSeller

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance - initialSellerBalance).to.equal(deposit);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(5); // Released
    });

    it("Should allow arbiter to split funds between buyer and seller", async function () {
      await escrow.connect(buyer).openDispute(escrowId, disputeReasonHash);

      const buyerShare = ethers.parseEther("0.4");
      const sellerShare = ethers.parseEther("0.6");

      const initialBuyerBal = await ethers.provider.getBalance(buyer.address);
      const initialSellerBal = await ethers.provider.getBalance(seller.address);

      await escrow.connect(arbiter).resolveDispute(escrowId, 3, buyerShare); // 3 = SplitFunds

      const finalBuyerBal = await ethers.provider.getBalance(buyer.address);
      const finalSellerBal = await ethers.provider.getBalance(seller.address);

      expect(finalBuyerBal - initialBuyerBal).to.equal(buyerShare);
      expect(finalSellerBal - initialSellerBal).to.equal(sellerShare);
    });

    it("Should reject unauthorized party attempting to resolve dispute", async function () {
      await escrow.connect(buyer).openDispute(escrowId, disputeReasonHash);
      await expect(
        escrow.connect(attacker).resolveDispute(escrowId, 1, 0)
      ).to.be.revertedWith("Unauthorized arbiter");
    });
  });

  describe("Deadline Expiration Refund", function () {
    it("Should allow buyer to claim refund after deadline passes", async function () {
      const escrowId = ethers.id("escrow-expire-test");
      const deposit = ethers.parseEther("1.0");

      await escrow.connect(buyer).createEscrow(escrowId, seller.address, arbiter.address, termsHash, ONE_DAY, {
        value: deposit,
      });

      // Attempt refund before deadline -> must fail
      await expect(
        escrow.connect(buyer).claimExpiredRefund(escrowId)
      ).to.be.revertedWith("Escrow deadline has not passed yet");

      // Advance time by 25 hours
      await time.increase(25 * 60 * 60);

      // Now refund succeeds
      await expect(escrow.connect(buyer).claimExpiredRefund(escrowId))
        .to.emit(escrow, "EscrowRefunded")
        .withArgs(escrowId, buyer.address, deposit);

      const item = await escrow.getEscrow(escrowId);
      expect(item.state).to.equal(6); // Refunded
      expect(item.amount).to.equal(0);
    });
  });
});
