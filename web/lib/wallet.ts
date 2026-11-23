// Wallet facade used by the app. Only this module imports concrete adapters,
// so contract.ts and the UI never import a wallet SDK directly.

import { config } from "./config";
import { WRONG_NETWORK_MESSAGE } from "./wallet/errors";
import { createFreighterAdapter } from "./wallet/freighter";
import { isExpectedNetwork } from "./wallet/networks";
import { DEFAULT_WALLET_ID } from "./wallet/registry";
import { readStoredWallet } from "./wallet/storage";
import type {
  Unsubscribe,
  WalletAdapter,
  WalletChange,
  WalletId,
  WalletNetwork,
  WalletState,
} from "./wallet/types";
import { createWalletKitAdapter } from "./wallet/wallet-kit";

export type {
  Unsubscribe,
  WalletAdapter,
  WalletChange,
  WalletId,
  WalletNetwork,
  WalletOption,
  WalletState,
} from "./wallet/types";
export {
  DEFAULT_WALLET_ID,
  WALLET_OPTIONS,
  getWalletOption,
  isWalletId,
} from "./wallet/registry";
export {
  WALLET_CONNECT_MESSAGE,
  WALLET_DECLINED_MESSAGE,
  WALLET_GENERIC_MESSAGE,
  WALLET_NOT_FOUND_MESSAGE,
  WALLET_SIGN_MESSAGE,
  WRONG_NETWORK_MESSAGE,
  walletErrorMessage,
} from "./wallet/errors";
export {
  clearStoredWallet,
  readStoredWallet,
  storeWallet,
} from "./wallet/storage";

const adapters = new Map<WalletId, WalletAdapter>();

export function getWalletAdapter(id: WalletId): WalletAdapter {
  let adapter = adapters.get(id);
  if (!adapter) {
    adapter =
      id === "freighter" ? createFreighterAdapter() : createWalletKitAdapter(id);
    adapters.set(id, adapter);
  }
  return adapter;
}

let activeWalletId: WalletId | null = null;

export function setActiveWallet(id: WalletId): void {
  activeWalletId = id;
}

export function getActiveWalletId(): WalletId {
  return activeWalletId ?? readStoredWallet()?.id ?? DEFAULT_WALLET_ID;
}

function emptyState(): WalletState {
  return { installed: false, address: null, network: null, networkPassphrase: null };
}

export async function detectWallet(
  id: WalletId = getActiveWalletId()
): Promise<WalletState> {
  try {
    return await getWalletAdapter(id).detect();
  } catch {
    return emptyState();
  }
}

export async function connectWallet(
  id: WalletId = getActiveWalletId()
): Promise<string> {
  const address = await getWalletAdapter(id).connect();
  setActiveWallet(id);
  return address;
}

export async function getWalletNetwork(
  id: WalletId = getActiveWalletId()
): Promise<WalletNetwork> {
  return getWalletAdapter(id).getNetwork();
}

export async function disconnectWallet(
  id: WalletId = getActiveWalletId()
): Promise<void> {
  try {
    await getWalletAdapter(id).disconnect?.();
  } catch {
    // Clearing local state still disconnects PayLoop from the user's view.
  }
}

export async function subscribeWalletChanges(
  id: WalletId,
  listener: (change: WalletChange) => void
): Promise<Unsubscribe> {
  const adapter = getWalletAdapter(id);
  if (!adapter.subscribe) return () => {};
  try {
    return await adapter.subscribe(listener);
  } catch {
    return () => {};
  }
}

// contract.ts calls this unchanged. Guard against a wallet that reports a
// different network before asking for a signature, so users get one clear,
// wallet-agnostic message instead of a failed transaction.
export async function signXdr(xdr: string): Promise<string> {
  const adapter = getWalletAdapter(getActiveWalletId());
  const network = await adapter.getNetwork().catch(() => null);
  if (
    network &&
    !isExpectedNetwork(network.networkPassphrase, config.networkPassphrase)
  ) {
    throw new Error(WRONG_NETWORK_MESSAGE);
  }
  return adapter.signXdr(xdr);
}
