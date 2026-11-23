"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { config } from "@/lib/config";
import {
  connectWallet,
  DEFAULT_WALLET_ID,
  detectWallet,
  disconnectWallet,
  getWalletOption,
  setActiveWallet,
  storeWallet,
  subscribeWalletChanges,
  walletErrorMessage,
  clearStoredWallet,
  readStoredWallet,
  type Unsubscribe,
  type WalletId,
} from "@/lib/wallet";
import { WalletPicker } from "./WalletPicker";

type WalletContextValue = {
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  walletId: WalletId;
  walletName: string;
  installed: boolean;
  connecting: boolean;
  pickerOpen: boolean;
  wrongNetwork: boolean;
  error: string | null;
  clearError: () => void;
  connect: (id?: WalletId) => Promise<boolean>;
  disconnect: () => Promise<void>;
  openWalletPicker: () => void;
  closeWalletPicker: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<WalletId>(DEFAULT_WALLET_ID);
  const [installed, setInstalled] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate the last chosen adapter. detect() is read-only: users still
  // confirm a connection when the wallet needs a fresh permission grant.
  useEffect(() => {
    let active = true;
    const stored = readStoredWallet();
    const id = stored?.id ?? DEFAULT_WALLET_ID;
    setActiveWallet(id);
    setWalletId(id);

    void (async () => {
      const state = await detectWallet(id);
      if (!active) return;

      // Kit keeps its connected address in memory only, so a page reload needs
      // to use the address we persisted. Freighter can be verified read-only.
      const isKitWallet = id !== "freighter";
      const detectedAddress = state.address;
      const restoredAddress = detectedAddress ?? (isKitWallet ? stored?.address ?? null : null);

      setInstalled(state.installed || isKitWallet);
      if (!restoredAddress) return;
      // If a wallet reports a different account than the one saved, ask the
      // user to reconnect rather than showing a stale address.
      if (stored?.address && detectedAddress && stored.address !== detectedAddress) {
        storeWallet(id, null);
        return;
      }
      setAddress(restoredAddress);
      setNetwork(state.network ?? config.network);
      setNetworkPassphrase(state.networkPassphrase ?? config.networkPassphrase);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Keep the UI in sync when the wallet changes account/network/disconnect.
  useEffect(() => {
    let active = true;
    let unsubscribe: Unsubscribe | undefined;

    void (async () => {
      const stop = await subscribeWalletChanges(walletId, (change) => {
        if (change.disconnected) {
          setAddress(null);
          setNetwork(null);
          setNetworkPassphrase(null);
          clearStoredWallet();
          return;
        }
        if (change.address !== undefined) {
          setAddress(change.address || null);
          if (change.address) storeWallet(walletId, change.address);
          else clearStoredWallet();
        }
        if (change.network !== undefined) setNetwork(change.network || null);
        if (change.networkPassphrase !== undefined) {
          setNetworkPassphrase(change.networkPassphrase || null);
        }
      });
      if (!active) stop();
      else unsubscribe = stop;
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [walletId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connect = useCallback(
    async (id?: WalletId): Promise<boolean> => {
      const target = id ?? walletId;
      setConnecting(true);
      setError(null);
      try {
        const connectedAddress = await connectWallet(target);
        const state = await detectWallet(target);
        setActiveWallet(target);
        setWalletId(target);
        setInstalled(true);
        setAddress(connectedAddress);
        setNetwork(state.network ?? config.network);
        setNetworkPassphrase(state.networkPassphrase ?? config.networkPassphrase);
        storeWallet(target, connectedAddress);
        return true;
      } catch (cause) {
        setError(walletErrorMessage(cause, "connect"));
        return false;
      } finally {
        setConnecting(false);
      }
    },
    [walletId]
  );

  const disconnect = useCallback(async () => {
    await disconnectWallet(walletId);
    setAddress(null);
    setNetwork(null);
    setNetworkPassphrase(null);
    setError(null);
    clearStoredWallet();
  }, [walletId]);

  const openWalletPicker = useCallback(() => {
    setError(null);
    setPickerOpen(true);
  }, []);

  const closeWalletPicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const wrongNetwork = Boolean(
    address && networkPassphrase && networkPassphrase !== config.networkPassphrase
  );

  const value = useMemo(
    () => ({
      address,
      network,
      networkPassphrase,
      walletId,
      walletName: getWalletOption(walletId).name,
      installed,
      connecting,
      pickerOpen,
      wrongNetwork,
      error,
      clearError,
      connect,
      disconnect,
      openWalletPicker,
      closeWalletPicker,
    }),
    [
      address,
      network,
      networkPassphrase,
      walletId,
      installed,
      connecting,
      pickerOpen,
      wrongNetwork,
      error,
      clearError,
      connect,
      disconnect,
      openWalletPicker,
      closeWalletPicker,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletPicker />
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
