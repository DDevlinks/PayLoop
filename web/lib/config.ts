// Central place for all network + contract configuration, sourced from env.
// Everything here is public (NEXT_PUBLIC_*) and safe to ship to the browser.
//
// The defaults below are the live PayLoop testnet deployment, so a fresh clone
// (or a Vercel deploy without env overrides) runs against the real contract out
// of the box. Set NEXT_PUBLIC_* to point at a different deployment.

const DEFAULT_CONTRACT_ID =
  "CAQVSBNVL7OI66IDTYCR7XL4VJKMSOYGBW5D6SWLTWTINTCQO2OGCSXS";
const DEFAULT_TOKEN_ID =
  "CA3DMMHKAEV555MKWZB5AFXWB6LVZRETYNUO5ZCFGSENQOC7A2FL5HNU";
// The USDC SAC wraps this classic asset. The issuer is needed to build the
// changeTrust op that lets a wallet hold/send USDC (Freighter's asset UI is
// unreliable across versions, so we establish the trustline in-app).
const DEFAULT_TOKEN_ISSUER =
  "GDYPHJ7H2DO6OUWD5ZJRLFT57QNUZYOWBBYEHEQBAGJDFBAAFJWMXSNU";
// Legacy default for the account used as the simulation source on read calls.
// It never signs anything, so deployments can point at any funded account.
export const DEFAULT_READ_SOURCE =
  "GBTDIHYJA4OPTDBDRKH5A5PHBSH7QVAEY46V27DCB24SXNRXIQNHSNUM";

export function resolveReadSource(value?: string): string {
  return value?.trim() || DEFAULT_READ_SOURCE;
}

export type TokenConfig = {
  id: string;
  issuer: string;
  symbol: string;
  decimals: number;
};

const DEFAULT_TOKEN: TokenConfig = {
  id: DEFAULT_TOKEN_ID,
  issuer: DEFAULT_TOKEN_ISSUER,
  symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "USDC",
  decimals: Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? "7"),
};

// Additional invoice tokens are configured as JSON so no code change is needed
// when the contract allowlist grows. Symbol/decimals are only fallbacks: the
// app reads the authoritative values from each token contract at runtime.
function parseTokens(): TokenConfig[] {
  const raw = process.env.NEXT_PUBLIC_TOKENS;
  if (!raw) return [DEFAULT_TOKEN];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEFAULT_TOKEN];
    const extra = parsed
      .filter((t): t is Record<string, unknown> =>
        Boolean(t && typeof t === "object" && t.id && t.issuer),
      )
      .map((t) => ({
        id: String(t.id),
        issuer: String(t.issuer),
        symbol: String(t.symbol ?? "TOKEN"),
        decimals: Number(t.decimals ?? 7),
      }))
      .filter((t) => t.id !== DEFAULT_TOKEN.id);
    return [DEFAULT_TOKEN, ...extra];
  } catch {
    return [DEFAULT_TOKEN];
  }
}

export const tokens: TokenConfig[] = parseTokens();

export function getTokenConfig(id?: string): TokenConfig {
  return tokens.find((t) => t.id === id) ?? DEFAULT_TOKEN;
}

export const config = {
  network: process.env.NEXT_PUBLIC_NETWORK ?? "TESTNET",
  networkPassphrase:
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015",
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org",
  horizonUrl:
    process.env.NEXT_PUBLIC_HORIZON_URL ??
    "https://horizon-testnet.stellar.org",
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? DEFAULT_CONTRACT_ID,
  readSource: resolveReadSource(process.env.NEXT_PUBLIC_READ_SOURCE),
  tokenId: DEFAULT_TOKEN.id,
  tokenIssuer: DEFAULT_TOKEN.issuer,
  tokenDecimals: DEFAULT_TOKEN.decimals,
  tokenSymbol: DEFAULT_TOKEN.symbol,
  tokens,
} as const;

export function isConfigured(): boolean {
  return Boolean(config.contractId && config.tokenId);
}

// Mock exchange rate used for demonstration off-ramp conversions
export const NGN_PER_USDC = 1560;

// stellar.expert explorer helpers for building clickable proof links.
const explorerBase =
  config.network === "PUBLIC"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

export const explorer = {
  tx: (hash: string) => `${explorerBase}/tx/${hash}`,
  account: (addr: string) => `${explorerBase}/account/${addr}`,
  contract: (id: string) => `${explorerBase}/contract/${id}`,
};
