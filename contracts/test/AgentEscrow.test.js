const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentEscrow Smart Contract Unit Tests", function () {
  let agentEscrow;
  let owner, recruiter, seller, verifier, stranger;
  const AGREEMENT_ID = 101;
  const FUNDING_AMOUNT = ethers.parseEther("1.0"); // 1 MSTC

  beforeEach(async function () {
    [owner, recruiter, seller, verifier, stranger] = await ethers.getSigners();

    const AgentEscrowFactory = await ethers.getContractFactory("AgentEscrow");
    agentEscrow = await AgentEscrowFactory.deploy(verifier.address);
    await agentEscrow.waitForDeployment();
  });

  describe("1. Deployment & Initialization", function () {
    it("Should correctly set owner and verifier addresses", async function () {
      expect(await agentEscrow.owner()).to.equal(owner.address);
      expect(await agentEscrow.verifier()).to.equal(verifier.address);
    });

    it("Should fail deployment if verifier is zero address", async function () {
      const AgentEscrowFactory = await ethers.getContractFactory("AgentEscrow");
      await expect(
        AgentEscrowFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid verifier address");
    });
  });

  describe("2. Create and Fund Agreement", function () {
    it("Should successfully create and fund an agreement and emit AgreementCreated event", async function () {
      await expect(
        agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
          value: FUNDING_AMOUNT,
        })
      )
        .to.emit(agentEscrow, "AgreementCreated")
        .withArgs(AGREEMENT_ID, recruiter.address, seller.address, FUNDING_AMOUNT);

      const agreement = await agentEscrow.getAgreement(AGREEMENT_ID);
      expect(agreement.recruiter).to.equal(recruiter.address);
      expect(agreement.seller).to.equal(seller.address);
      expect(agreement.amount).to.equal(FUNDING_AMOUNT);
      expect(agreement.status).to.equal(1); // Status.Funded

      expect(await agentEscrow.isFunded(AGREEMENT_ID)).to.be.true;
    });

    it("Should revert if funding amount is zero", async function () {
      await expect(
        agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
          value: 0,
        })
      ).to.be.revertedWith("Funding amount must be greater than zero");
    });

    it("Should revert if seller address is zero address", async function () {
      await expect(
        agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, ethers.ZeroAddress, {
          value: FUNDING_AMOUNT,
        })
      ).to.be.revertedWith("Seller address cannot be zero address");
    });

    it("Should revert if recruiter and seller are the same address", async function () {
      await expect(
        agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, recruiter.address, {
          value: FUNDING_AMOUNT,
        })
      ).to.be.revertedWith("Recruiter and seller cannot be the same address");
    });

    it("Should revert if agreement ID is reused (duplicate ID)", async function () {
      await agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
        value: FUNDING_AMOUNT,
      });

      await expect(
        agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
          value: FUNDING_AMOUNT,
        })
      ).to.be.revertedWith("Agreement ID already exists");
    });
  });

  describe("3. Payment Release", function () {
    beforeEach(async function () {
      await agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
        value: FUNDING_AMOUNT,
      });
    });

    it("Should revert unauthorized release attempt by a stranger", async function () {
      await expect(
        agentEscrow.connect(stranger).releasePayment(AGREEMENT_ID)
      ).to.be.revertedWith(
        "Unauthorized: Only recruiter, verifier, or owner can release payment"
      );
    });

    it("Should allow recruiter to release payment to seller", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);

      await expect(agentEscrow.connect(recruiter).releasePayment(AGREEMENT_ID))
        .to.emit(agentEscrow, "PaymentReleased")
        .withArgs(AGREEMENT_ID, seller.address, FUNDING_AMOUNT);

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance - initialSellerBalance).to.equal(FUNDING_AMOUNT);

      expect(await agentEscrow.isReleased(AGREEMENT_ID)).to.be.true;
      expect(await agentEscrow.isFunded(AGREEMENT_ID)).to.be.false;
    });

    it("Should allow authorized verifier to release payment to seller", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);

      await expect(agentEscrow.connect(verifier).releasePayment(AGREEMENT_ID))
        .to.emit(agentEscrow, "PaymentReleased")
        .withArgs(AGREEMENT_ID, seller.address, FUNDING_AMOUNT);

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance - initialSellerBalance).to.equal(FUNDING_AMOUNT);
    });

    it("Should revert release attempt if agreement does not exist", async function () {
      await expect(
        agentEscrow.connect(recruiter).releasePayment(9999)
      ).to.be.revertedWith("Agreement does not exist");
    });

    it("Should revert release twice attempt (double release)", async function () {
      await agentEscrow.connect(recruiter).releasePayment(AGREEMENT_ID);

      await expect(
        agentEscrow.connect(recruiter).releasePayment(AGREEMENT_ID)
      ).to.be.revertedWith("Agreement is not in Funded state");
    });
  });

  describe("4. Refund Agreement", function () {
    beforeEach(async function () {
      await agentEscrow.connect(recruiter).createAndFundAgreement(AGREEMENT_ID, seller.address, {
        value: FUNDING_AMOUNT,
      });
    });

    it("Should revert unauthorized refund attempt by a stranger", async function () {
      await expect(
        agentEscrow.connect(stranger).refundAgreement(AGREEMENT_ID)
      ).to.be.revertedWith(
        "Unauthorized: Only recruiter, verifier, or owner can refund agreement"
      );
    });

    it("Should allow recruiter to refund agreement", async function () {
      const initialBalance = await ethers.provider.getBalance(recruiter.address);

      const tx = await agentEscrow.connect(recruiter).refundAgreement(AGREEMENT_ID);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(recruiter.address);
      expect(finalBalance + gasUsed - initialBalance).to.equal(FUNDING_AMOUNT);

      expect(await agentEscrow.isRefunded(AGREEMENT_ID)).to.be.true;
    });

    it("Should allow authorized verifier to refund agreement", async function () {
      const initialBalance = await ethers.provider.getBalance(recruiter.address);

      await expect(agentEscrow.connect(verifier).refundAgreement(AGREEMENT_ID))
        .to.emit(agentEscrow, "AgreementRefunded")
        .withArgs(AGREEMENT_ID, recruiter.address, FUNDING_AMOUNT);

      const finalBalance = await ethers.provider.getBalance(recruiter.address);
      expect(finalBalance - initialBalance).to.equal(FUNDING_AMOUNT);
    });

    it("Should revert refund twice attempt (double refund)", async function () {
      await agentEscrow.connect(recruiter).refundAgreement(AGREEMENT_ID);

      await expect(
        agentEscrow.connect(recruiter).refundAgreement(AGREEMENT_ID)
      ).to.be.revertedWith("Agreement is not in Funded state");
    });

    it("Should revert release after refund", async function () {
      await agentEscrow.connect(recruiter).refundAgreement(AGREEMENT_ID);

      await expect(
        agentEscrow.connect(recruiter).releasePayment(AGREEMENT_ID)
      ).to.be.revertedWith("Agreement is not in Funded state");
    });

    it("Should revert refund after release", async function () {
      await agentEscrow.connect(recruiter).releasePayment(AGREEMENT_ID);

      await expect(
        agentEscrow.connect(recruiter).refundAgreement(AGREEMENT_ID)
      ).to.be.revertedWith("Agreement is not in Funded state");
    });
  });
});
