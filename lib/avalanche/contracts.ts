import { BrowserProvider, Contract, Signer } from "ethers";
import { CAMPAIGN_ABI, CAMPAIGN_FACTORY_ABI, ERC20_ABI, ESCROW_VAULT_ABI } from "./abis";
import { CONTRACT_ADDRESSES } from "./config";

type SignerOrProvider = Signer | BrowserProvider;

export function getFactoryContract(signerOrProvider: SignerOrProvider) {
  return new Contract(CONTRACT_ADDRESSES.factory, CAMPAIGN_FACTORY_ABI, signerOrProvider);
}

export function getCampaignContract(address: string, signerOrProvider: SignerOrProvider) {
  return new Contract(address, CAMPAIGN_ABI, signerOrProvider);
}

export function getEscrowVaultContract(signerOrProvider: SignerOrProvider) {
  return new Contract(CONTRACT_ADDRESSES.escrowVault, ESCROW_VAULT_ABI, signerOrProvider);
}

export function getErc20Contract(address: string, signerOrProvider: SignerOrProvider) {
  return new Contract(address, ERC20_ABI, signerOrProvider);
}
