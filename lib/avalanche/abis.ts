export const CAMPAIGN_FACTORY_ABI = [
  "event CampaignCreated(uint256 indexed campaignId,address indexed campaign,address indexed sponsor,address rewardToken,uint256 totalBudget)",
  "function nextCampaignId() view returns (uint256)",
  "function campaignOf(uint256) view returns (address)",
  "function createCampaign((address rewardToken,uint256 totalBudget,uint256 fixedRewardAmount,uint64 startAt,uint64 endAt,uint32 maxWinners,uint8 verificationMode,uint8 payoutMode,bytes32 rulesHash,bytes32 eligibilityRoot,bytes32 verifierGroupId,bool proofNonTransferable) params) returns (uint256 campaignId,address campaign)",
];

export const CAMPAIGN_ABI = [
  "function campaignId() view returns (uint256)",
  "function status() view returns (uint8)",
  "function sponsor() view returns (address)",
  "function config() view returns (tuple(address sponsor,address rewardToken,uint256 totalBudget,uint256 fixedRewardAmount,uint64 startAt,uint64 endAt,uint32 maxWinners,uint16 protocolFeeBps,uint8 verificationMode,uint8 payoutMode,bytes32 rulesHash,bytes32 eligibilityRoot,bytes32 verifierGroupId,bool proofNonTransferable))",
  "function fundCampaign()",
  "function approveWinner(address claimant,uint256 amount)",
  "function claimDirect()",
  "function finalizeDirectClaims()",
];

export const ESCROW_VAULT_ABI = [
  "function availableBalance(uint256 campaignId) view returns (uint256)",
  "function balanceOf(uint256 campaignId) view returns (tuple(address token,uint256 funded,uint256 reserved,uint256 paid,uint256 refunded,uint256 feesTaken))",
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];
