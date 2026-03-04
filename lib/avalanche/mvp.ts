import { BrowserProvider, ContractRunner, ContractTransactionReceipt, ContractTransactionResponse, id, isAddress, isHexString, parseUnits, ZeroHash } from "ethers";
import { getCampaignContract, getErc20Contract, getEscrowVaultContract, getFactoryContract, getProofContract } from "./contracts";
import { CONTRACT_ADDRESSES } from "./config";

export const CAMPAIGN_STATUS = {
  Created: 0,
  Funded: 1,
  Active: 2,
  Finalized: 3,
  Cancelled: 4,
  Paused: 5,
} as const;

export const VERIFICATION_MODE = {
  DirectVerifierCall: 0,
  EIP712Voucher: 1,
  MerkleRoot: 2,
} as const;

export const PAYOUT_MODE = {
  FixedPerWinner: 0,
  VariableClaim: 1,
} as const;

export type CreateDirectCampaignInput = {
  rewardToken: string;
  totalBudget: string;
  fixedRewardAmount: string;
  startAt: number;
  endAt: number;
  maxWinners: number;
  rulesText?: string;
  rulesHash?: string;
  verifierGroupId?: string;
  proofNonTransferable?: boolean;
};

export type CreateDirectCampaignResult = {
  campaignId: string;
  campaignAddress: string;
  totalBudgetAtomic: string;
  fixedRewardAmountAtomic: string;
  tokenDecimals: number;
  txHash: string;
};

export type ClaimStatusResult = {
  campaignId: string;
  status: number;
  approvalAmount: bigint;
  approvalExists: boolean;
  hasClaimed: boolean;
  hasProof: boolean;
};

export type CampaignOverviewResult = {
  campaignId: string;
  status: number;
  sponsor: string;
  rewardToken: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalBudget: bigint;
  fixedRewardAmount: bigint;
  maxWinners: number;
  startAt: number;
  endAt: number;
  funded: bigint;
  reserved: bigint;
  paid: bigint;
  refunded: bigint;
  feesTaken: bigint;
  availableBalance: bigint;
};

function ensureBytes32(value?: string, fallback: string = ZeroHash) {
  const candidate = value?.trim();
  if (!candidate) {
    return fallback;
  }
  if (!isHexString(candidate, 32)) {
    throw new Error("Expected a bytes32 hex value.");
  }
  return candidate;
}

function requireReceipt(receipt: ContractTransactionReceipt | null): ContractTransactionReceipt {
  if (!receipt) {
    throw new Error("Transaction receipt is missing.");
  }
  return receipt;
}

function parseCampaignCreated(factory: ReturnType<typeof getFactoryContract>, receipt: ContractTransactionReceipt) {
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "CampaignCreated") {
        return {
          campaignId: parsed.args.campaignId.toString(),
          campaignAddress: parsed.args.campaign,
        };
      }
    } catch {
      // ignore unrelated logs
    }
  }

  throw new Error("CampaignCreated event was not found in the transaction receipt.");
}

async function waitForReceipt(tx: ContractTransactionResponse) {
  return requireReceipt(await tx.wait());
}

export async function createDirectVerifierCampaign(
  provider: BrowserProvider,
  input: CreateDirectCampaignInput
): Promise<CreateDirectCampaignResult> {
  if (!isAddress(input.rewardToken)) {
    throw new Error("Reward token address is invalid.");
  }
  if (!Number.isFinite(input.startAt) || !Number.isFinite(input.endAt) || input.startAt >= input.endAt) {
    throw new Error("Campaign start and end times are invalid.");
  }
  if (!Number.isFinite(input.maxWinners) || input.maxWinners <= 0) {
    throw new Error("Max winners must be greater than zero.");
  }

  const signer = await provider.getSigner();
  const token = getErc20Contract(input.rewardToken, signer);
  const decimals = Number(await token.decimals());
  const totalBudgetAtomic = parseUnits(input.totalBudget, decimals);
  const fixedRewardAmountAtomic = parseUnits(input.fixedRewardAmount, decimals);

  const factory = getFactoryContract(signer);
  const rulesHash = input.rulesHash?.trim()
    ? ensureBytes32(input.rulesHash)
    : input.rulesText?.trim()
      ? id(input.rulesText.trim())
      : ZeroHash;

  const tx = await factory.createCampaign({
    rewardToken: input.rewardToken,
    totalBudget: totalBudgetAtomic,
    fixedRewardAmount: fixedRewardAmountAtomic,
    startAt: BigInt(input.startAt),
    endAt: BigInt(input.endAt),
    maxWinners: input.maxWinners,
    verificationMode: VERIFICATION_MODE.DirectVerifierCall,
    payoutMode: PAYOUT_MODE.FixedPerWinner,
    rulesHash,
    eligibilityRoot: ZeroHash,
    verifierGroupId: ensureBytes32(input.verifierGroupId),
    proofNonTransferable: input.proofNonTransferable ?? true,
  });

  const receipt = await waitForReceipt(tx);
  const created = parseCampaignCreated(factory, receipt);

  return {
    campaignId: created.campaignId,
    campaignAddress: created.campaignAddress,
    totalBudgetAtomic: totalBudgetAtomic.toString(),
    fixedRewardAmountAtomic: fixedRewardAmountAtomic.toString(),
    tokenDecimals: decimals,
    txHash: tx.hash,
  };
}

export async function fundCampaign(
  provider: BrowserProvider,
  campaignAddress: string
): Promise<{ txHash: string; approvalTxHash?: string }> {
  if (!isAddress(campaignAddress)) {
    throw new Error("Campaign address is invalid.");
  }

  const signer = await provider.getSigner();
  const campaign = getCampaignContract(campaignAddress, signer);
  const config = await campaign.config();
  const sponsorAddress = await signer.getAddress();
  const token = getErc20Contract(config.rewardToken, signer);
  const allowance = await token.allowance(sponsorAddress, CONTRACT_ADDRESSES.escrowVault);

  let approvalTxHash: string | undefined;
  if (allowance < config.totalBudget) {
    const approvalTx = await token.approve(CONTRACT_ADDRESSES.escrowVault, config.totalBudget);
    approvalTxHash = approvalTx.hash;
    await waitForReceipt(approvalTx);
  }

  const fundTx = await campaign.fundCampaign();
  await waitForReceipt(fundTx);

  return {
    txHash: fundTx.hash,
    approvalTxHash,
  };
}

export async function activateCampaign(
  provider: BrowserProvider,
  campaignAddress: string
): Promise<{ txHash: string }> {
  if (!isAddress(campaignAddress)) {
    throw new Error("Campaign address is invalid.");
  }

  const signer = await provider.getSigner();
  const campaign = getCampaignContract(campaignAddress, signer);
  const tx = await campaign.activate();
  await waitForReceipt(tx);

  return { txHash: tx.hash };
}

export async function claimDirectReward(
  provider: BrowserProvider,
  campaignAddress: string
): Promise<{ txHash: string }> {
  if (!isAddress(campaignAddress)) {
    throw new Error("Campaign address is invalid.");
  }

  const signer = await provider.getSigner();
  const campaign = getCampaignContract(campaignAddress, signer);
  const tx = await campaign.claimDirect();
  await waitForReceipt(tx);

  return { txHash: tx.hash };
}

export async function readClaimStatus(
  provider: ContractRunner,
  campaignAddress: string,
  userAddress: string
): Promise<ClaimStatusResult> {
  if (!isAddress(campaignAddress) || !isAddress(userAddress)) {
    throw new Error("Campaign address or user address is invalid.");
  }

  const campaign = getCampaignContract(campaignAddress, provider);
  const proof = getProofContract(provider);

  const [campaignId, status, directApproval, claimed] = await Promise.all([
    campaign.campaignId(),
    campaign.status(),
    campaign.directApprovals(userAddress),
    campaign.hasClaimed(userAddress),
  ]);

  const hasProof = await proof.hasProof(userAddress, campaignId);

  return {
    campaignId: campaignId.toString(),
    status: Number(status),
    approvalAmount: directApproval.amount ?? directApproval[0],
    approvalExists: directApproval.exists ?? directApproval[1],
    hasClaimed: claimed,
    hasProof,
  };
}

export async function readCampaignOverview(
  provider: ContractRunner,
  campaignAddress: string
): Promise<CampaignOverviewResult> {
  if (!isAddress(campaignAddress)) {
    throw new Error("Campaign address is invalid.");
  }

  const campaign = getCampaignContract(campaignAddress, provider);

  const [campaignId, status, sponsor, config] = await Promise.all([
    campaign.campaignId(),
    campaign.status(),
    campaign.sponsor(),
    campaign.config(),
  ]);

  const vault = getEscrowVaultContract(provider);
  const token = getErc20Contract(config.rewardToken, provider);

  const [vaultBalance, availableBalance, tokenSymbol, tokenDecimals] = await Promise.all([
    vault.balanceOf(campaignId),
    vault.availableBalance(campaignId),
    token.symbol(),
    token.decimals(),
  ]);

  return {
    campaignId: campaignId.toString(),
    status: Number(status),
    sponsor,
    rewardToken: config.rewardToken,
    tokenSymbol,
    tokenDecimals: Number(tokenDecimals),
    totalBudget: config.totalBudget,
    fixedRewardAmount: config.fixedRewardAmount,
    maxWinners: Number(config.maxWinners),
    startAt: Number(config.startAt),
    endAt: Number(config.endAt),
    funded: vaultBalance.funded ?? vaultBalance[1],
    reserved: vaultBalance.reserved ?? vaultBalance[2],
    paid: vaultBalance.paid ?? vaultBalance[3],
    refunded: vaultBalance.refunded ?? vaultBalance[4],
    feesTaken: vaultBalance.feesTaken ?? vaultBalance[5],
    availableBalance,
  };
}
