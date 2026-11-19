import { RouteKind } from "../routes.js";
/**
 * The assets Hyperion carries, per chain.
 *
 * The same dollar has a different address, a different precision and a different way of being held
 * on every chain it exists on, and a bridge that treats those as interchangeable is a bridge that
 * eventually sends six decimals of something into a seven decimal slot. So each side is described
 * on its own terms and the two are tied together by a symbol rather than by an assumption.
 *
 * Provenance works the same way it does for the rail contracts: `confirmed` means a primary source
 * was read for that exact entry during this build. The deploy script reads `symbol()` and
 * `decimals()` on chain before registering anything regardless, because an address that is correct
 * today and a token that behaves as expected are two different claims.
 * Registry entries describe local planning only; signed execution and payout proof are separate.
 */
import type { ChainKey } from "../chains.js";
import type { Hex } from "../bytes.js";

/** What every asset entry says about itself, whichever chain it lives on. */
interface AssetBase {
  readonly chain: ChainKey;
  /** The ticker, and the key that ties the two sides of a hop together. */
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  /** Which rails can carry this asset out of this chain. */
  readonly routes: readonly RouteKind[];
  readonly source: string;
  readonly confirmed: boolean;
}

export interface EvmAsset extends AssetBase {
  readonly family: "evm";
  readonly address: Hex;
}

export interface StellarAsset extends AssetBase {
  readonly family: "stellar";
  /** The classic asset code, four or twelve characters. */
  readonly code: string;
  /** The issuing account. Half of what makes a Stellar asset unique; the code is the other half. */
  readonly issuer: string;
  /**
   * The Stellar Asset Contract id, which Soroban actually calls into.
   *
   * Null here on purpose. It is derived from the code, the issuer and the network passphrase, so
   * the deploy script computes it with `stellar contract id asset` and writes it into the
   * deployment record rather than anybody typing it.
   */
  readonly sacId: string | null;
  readonly decimals: 7;
}

export type Asset = EvmAsset | StellarAsset;

/**
 * A caller-supplied reader for asset metadata.
 *
 * The registry below is a static snapshot, and a snapshot is a claim about a moment. Anything that
 * needs to act on an asset at the present moment — a planner quoting a route, an inspector checking
 * a payout — should read the live values through a client the caller owns. Keeping the client
 * injected is what lets the SDK stay free of runtime dependencies and free of credentials: the
 * caller decides how the read happens, and the SDK only decides what the answer must look like.
 */
export interface AssetMetadataReader {
  /** Reads `symbol()` and `decimals()` for an EVM asset address. */
  readEvmAsset(address: Hex): Promise<{ readonly symbol: string; readonly decimals: number }>;
  /** Reads the code, issuer and decimals for a Stellar asset. */
  readStellarAsset(
    code: string,
    issuer: string,
  ): Promise<{ readonly code: string; readonly issuer: string; readonly decimals: number }>;
}

const STELLAR_DOCS = "developers.stellar.org, read during this build";
const ARC_DOCS = "docs.arc.io, read during this build";
const CIRCLE_PUBLISHED =
  "Circle's published USDC deployment for this chain. The deploy script reads symbol and decimals on chain before registering it.";

/** Everything Hyperion can move. USDC first, because USDC is why CCTP exists. */
export const ASSETS: readonly Asset[] = [
  {
    family: "stellar",
    chain: "stellar",
    symbol: "USDC",
    name: "USD Coin",
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    sacId: null,
    decimals: 7,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts, RouteKind.Allbridge],
    source: STELLAR_DOCS,
    confirmed: true,
  },
  {
    family: "stellar",
    chain: "stellar-testnet",
    symbol: "USDC",
    name: "USD Coin",
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    sacId: null,
    decimals: 7,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts],
    source: STELLAR_DOCS,
    confirmed: true,
  },
  {
    family: "evm",
    chain: "arc",
    symbol: "USDC",
    name: "USD Coin",
    // Arc's USDC lives at a fixed system address rather than a deployed contract, and it is also
    // the gas token. Six decimals on the ERC-20 even though the chain accounts for gas in
    // eighteen, which is the single most expensive detail on this chain to get wrong.
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    routes: [RouteKind.Cctp],
    source: ARC_DOCS,
    confirmed: true,
  },
  {
    family: "evm",
    chain: "arc-testnet",
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    routes: [RouteKind.Cctp],
    source: ARC_DOCS,
    confirmed: true,
  },
  {
    family: "evm",
    chain: "arc",
    symbol: "EURC",
    name: "Euro Coin",
    address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
    decimals: 6,
    routes: [RouteKind.AxelarIts],
    source: ARC_DOCS,
    confirmed: true,
  },
  {
    family: "evm",
    chain: "arc-testnet",
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    routes: [RouteKind.AxelarIts],
    source: ARC_DOCS,
    confirmed: true,
  },
  {
    family: "evm",
    chain: "ethereum",
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts, RouteKind.Allbridge],
    source: CIRCLE_PUBLISHED,
    confirmed: false,
  },
  {
    family: "evm",
    chain: "sepolia",
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts],
    source: CIRCLE_PUBLISHED,
    confirmed: false,
  },
  {
    family: "evm",
    chain: "base",
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts, RouteKind.Allbridge],
    source: CIRCLE_PUBLISHED,
    confirmed: false,
  },
  {
    family: "evm",
    chain: "base-sepolia",
    symbol: "USDC",
    name: "USD Coin",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    routes: [RouteKind.Cctp, RouteKind.AxelarIts],
    source: CIRCLE_PUBLISHED,
    confirmed: false,
  },
];

export function assetsOn(chainKey: ChainKey): readonly Asset[] {
  return ASSETS.filter((asset) => asset.chain === chainKey);
}

export function assetOn(chainKey: ChainKey, symbol: string): Asset | null {
  return ASSETS.find((asset) => asset.chain === chainKey && asset.symbol === symbol) ?? null;
}

export function isEvmAsset(asset: Asset): asset is EvmAsset {
  return asset.family === "evm";
}

export function isStellarAsset(asset: Asset): asset is StellarAsset {
  return asset.family === "stellar";
}

/**
 * Whether a symbol exists on both ends of a hop, which is the first thing a route planner needs to
 * know and the cheapest check it can do.
 */
export function pairExists(from: ChainKey, to: ChainKey, symbol: string): boolean {
  return assetOn(from, symbol) !== null && assetOn(to, symbol) !== null;
}

/** Every rail that can carry a symbol from one chain to another, in no particular order. */
export function routesForPair(from: ChainKey, to: ChainKey, symbol: string): readonly RouteKind[] {
  const source = assetOn(from, symbol);
  const destination = assetOn(to, symbol);
  if (source === null || destination === null) return [];
  return source.routes.filter((route) => destination.routes.includes(route));
}

/**
 * The result of checking a registry entry against a live read.
 *
 * `matches` is the only field a caller should branch on. The rest exist so a mismatch can be
 * reported without the caller having to re-derive what was expected.
 */
export interface AssetVerification {
  readonly asset: Asset;
  readonly matches: boolean;
  readonly expected: { readonly symbol: string; readonly decimals: number };
  readonly observed: { readonly symbol: string; readonly decimals: number } | null;
  /** Why the read failed or disagreed, when it did. Null when `matches` is true. */
  readonly reason: string | null;
}

/**
 * Verifies a single registry entry against a caller-supplied reader.
 *
 * This never throws for a malformed or unreachable read: a verification that cannot be performed is
 * a failed verification, and a planner that crashes on a flaky RPC is worse than one that refuses
 * to quote. The caller decides what to do with `matches === false`.
 */
export async function verifyAsset(
  asset: Asset,
  reader: AssetMetadataReader,
): Promise<AssetVerification> {
  const expected = { symbol: asset.symbol, decimals: asset.decimals };
  try {
    const observed =
      asset.family === "evm"
        ? await reader.readEvmAsset(asset.address)
        : await reader.readStellarAsset(asset.code, asset.issuer);
    if (observed.symbol !== asset.symbol) {
      return {
        asset,
        matches: false,
        expected,
        observed: { symbol: observed.symbol, decimals: observed.decimals },
        reason: `symbol mismatch: registry says ${asset.symbol}, chain says ${observed.symbol}`,
      };
    }
    if (observed.decimals !== asset.decimals) {
      return {
        asset,
        matches: false,
        expected,
        observed: { symbol: observed.symbol, decimals: observed.decimals },
        reason: `decimals mismatch: registry says ${asset.decimals}, chain says ${observed.decimals}`,
      };
    }
    return {
      asset,
      matches: true,
      expected,
      observed: { symbol: observed.symbol, decimals: observed.decimals },
      reason: null,
    };
  } catch (error) {
    return {
      asset,
      matches: false,
      expected,
      observed: null,
      reason: error instanceof Error ? error.message : "asset read failed",
    };
  }
}

/**
 * Verifies every asset on a chain, in registry order.
 *
 * The result is returned rather than thrown so a caller can inspect partial evidence: one
 * unreadable asset should not hide the state of the others.
 */
export async function verifyAssetsOn(
  chainKey: ChainKey,
  reader: AssetMetadataReader,
): Promise<readonly AssetVerification[]> {
  const assets = assetsOn(chainKey);
  const results: AssetVerification[] = [];
  for (const asset of assets) {
    results.push(await verifyAsset(asset, reader));
  }
  return results;
}

/**
 * Whether a pair can be planned at all, given only the registry.
 *
 * This is the local planning answer and nothing more. It says the two sides exist and share a
 * rail; it says nothing about liquidity, signed execution or payout proof.
 */
export function planPair(
  from: ChainKey,
  to: ChainKey,
  symbol: string,
): { readonly from: Asset; readonly to: Asset; readonly routes: readonly RouteKind[] } | null {
  const source = assetOn(from, symbol);
  const destination = assetOn(to, symbol);
  if (source === null || destination === null) return null;
  const routes = routesForPair(from, to, symbol);
  if (routes.length === 0) return null;
  return { from: source, to: destination, routes };
}

/**
 * A deterministic, in-memory `AssetMetadataReader` for examples and tests.
 *
 * This is a fixture, not a network client. It answers from a caller-supplied table so that
 * examples can demonstrate the planning and inspection flow without credentials, without a live
 * RPC and without inventing contract support that has not been validated. Callers that want real
 * reads supply their own reader; this one exists so the SDK's example code is executable.
 */
export function createMockAssetReader(
  table: Readonly<
    Record<
      string,
      | { readonly family: "evm"; readonly symbol: string; readonly decimals: number }
      | {
          readonly family: "stellar";
          readonly code: string;
          readonly issuer: string;
          readonly decimals: number;
        }
    >
  >,
): AssetMetadataReader {
  return {
    async readEvmAsset(address: Hex) {
      const entry = table[address.toLowerCase()];
      if (entry === undefined || entry.family !== "evm") {
        throw new Error(`no mock EVM asset for ${address}`);
      }
      return { symbol: entry.symbol, decimals: entry.decimals };
    },
    async readStellarAsset(code: string, issuer: string) {
      const entry = table[`${code}:${issuer}`];
      if (entry === undefined || entry.family !== "stellar") {
        throw new Error(`no mock Stellar asset for ${code}:${issuer}`);
      }
      return { code: entry.code, issuer: entry.issuer, decimals: entry.decimals };
    },
  };
}

/**
 * Builds a mock reader whose answers agree with the static registry.
 *
 * Useful as the "happy path" fixture in examples: every entry verifies, and `planPair` returns the
 * same routes the registry advertises. This is local planning evidence only — it is not signed
 * execution and it is not payout proof.
 */
export function createRegistryMockReader(): AssetMetadataReader {
  const table: Record<
    string,
    | { readonly family: "evm"; readonly symbol: string; readonly decimals: number }
    | {
        readonly family: "stellar";
        readonly code: string;
        readonly issuer: string;
        readonly decimals: number;
      }
  > = {};
  for (const asset of ASSETS) {
    if (asset.family === "evm") {
      table[asset.address.toLowerCase()] = {
        family: "evm",
        symbol: asset.symbol,
        decimals: asset.decimals,
      };
    } else {
      table[`${asset.code}:${asset.issuer}`] = {
        family: "stellar",
        code: asset.code,
        issuer: asset.issuer,
        decimals: asset.decimals,
      };
    }
  }
  return createMockAssetReader(table);
}

/**
 * Example: plan a hop and inspect the evidence, using only caller-supplied clients.
 *
 * Demonstrates the two capabilities the SDK exposes without runtime dependencies:
 *   1. Local planning — `planPair` answers from the static registry.
 *   2. Evidence inspection — `verifyAssetsOn` reads through the injected reader.
 *
 * The returned object separates the two so callers cannot mistake planning for proof. Signed
 * execution and payout proof are out of scope here and must be obtained elsewhere.
 */
export async function examplePlanAndInspect(
  from: ChainKey,
  to: ChainKey,
  symbol: string,
  reader: AssetMetadataReader,
): Promise<{
  readonly plan: ReturnType<typeof planPair>;
  readonly sourceEvidence: readonly AssetVerification[];
  readonly destinationEvidence: readonly AssetVerification[];
}> {
  const plan = planPair(from, to, symbol);
  const sourceEvidence = await verifyAssetsOn(from, reader);
  const destinationEvidence = await verifyAssetsOn(to, reader);
  return { plan, sourceEvidence, destinationEvidence };
}
