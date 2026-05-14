import type {
  EIP6963AnnounceProviderEvent,
  MetaMaskInpageProvider,
} from '@metamask/providers'

import { SNAP_ORIGIN } from './snap'

/**
 * Provider detection for the Sui MetaMask Snap.
 *
 * EIP-6963 is the primary discovery channel: wallets announce themselves
 * with a stable rdns, which means we can identify MetaMask reliably even
 * when other EVM wallets (Phantom, Coinbase, etc.) have won the
 * `window.ethereum` injection race.
 *
 * A single, lazily-installed listener accumulates announcements for the
 * lifetime of the page so late-arriving wallets (slow extension boot) are
 * picked up automatically. `subscribeMetaMaskProvider` lets callers react
 * to availability changes; `getMetaMaskProvider` is a thin one-shot
 * wrapper for code paths that just need an answer.
 */

export interface MetaMaskStatus {
  available: boolean
  supportsSnaps: boolean
  suiSnapInstalled: boolean
}

export type MetaMaskProviderInfo =
  | {
      available: true
      supportsSnaps: true
      suiSnapInstalled: boolean
      provider: MetaMaskInpageProvider
    }
  | {
      available: false
      supportsSnaps: false
      suiSnapInstalled: false
      provider: null
    }

const UNAVAILABLE: MetaMaskProviderInfo = {
  available: false,
  supportsSnaps: false,
  suiSnapInstalled: false,
  provider: null,
}

// rdns values MetaMask uses for its EIP-6963 announcements. Exact match
// only — `includes('io.metamask')` would also match arbitrary spoofers.
const METAMASK_RDNS = new Set<string>([
  'io.metamask',
  'io.metamask.flask',
  'io.metamask.mmi',
])

// rdns preference order. Flask first so developer setups pick the canary
// build when both are installed.
const METAMASK_RDNS_ORDER = ['io.metamask.flask', 'io.metamask', 'io.metamask.mmi']

interface AnnouncedDetail {
  info: { uuid: string; rdns: string; name?: string; icon?: string }
  provider: MetaMaskInpageProvider
}

const announced: AnnouncedDetail[] = []
const listeners = new Set<() => void>()
let listenerInstalled = false

function installAnnouncementListener() {
  if (listenerInstalled || typeof window === 'undefined') {
    return
  }
  listenerInstalled = true

  const handler = (event: EIP6963AnnounceProviderEvent) => {
    const detail = event.detail
    if (!detail || !METAMASK_RDNS.has(detail.info.rdns)) {
      return
    }
    if (announced.some(a => a.info.uuid === detail.info.uuid)) {
      return
    }
    announced.push(detail)
    for (const fn of listeners) {
      fn()
    }
  }

  window.addEventListener('eip6963:announceProvider', handler as EventListener)
  // Ask any wallets that are already loaded to announce themselves. Wallets
  // that load later (slow extension boot) will still fire the event on
  // their own, which is why the listener is permanent.
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

function findAnnouncedMetaMask(): MetaMaskInpageProvider | null {
  for (const rdns of METAMASK_RDNS_ORDER) {
    const hit = announced.find(a => a.info.rdns === rdns)
    if (hit) {
      return hit.provider
    }
  }
  return null
}

async function probeProvider(
  provider: MetaMaskInpageProvider
): Promise<MetaMaskProviderInfo> {
  try {
    const snaps = await provider.request<Record<string, unknown>>({
      method: 'wallet_getSnaps',
    })
    const suiSnapInstalled = !!snaps && SNAP_ORIGIN in snaps
    return { available: true, supportsSnaps: true, suiSnapInstalled, provider }
  } catch {
    return UNAVAILABLE
  }
}

/**
 * Resolve the current MetaMask provider, if any. Returns the same result
 * shape as the prior implementation. The optional `timeoutMs` controls how
 * long we wait for an EIP-6963 announcement before falling back to
 * `window.ethereum` (default 1500ms).
 */
export async function getMetaMaskProvider(
  options: { timeoutMs?: number } = {}
): Promise<MetaMaskProviderInfo> {
  if (typeof window === 'undefined') {
    return UNAVAILABLE
  }

  installAnnouncementListener()

  const provider = await waitForMetaMask(options.timeoutMs ?? 1500)
  if (!provider) {
    return UNAVAILABLE
  }
  return probeProvider(provider)
}

async function waitForMetaMask(
  timeoutMs: number
): Promise<MetaMaskInpageProvider | null> {
  const immediate = findAnnouncedMetaMask()
  if (immediate) {
    return immediate
  }

  const announceWait = new Promise<MetaMaskInpageProvider | null>(resolve => {
    let settled = false
    const onAnnounce = () => {
      const provider = findAnnouncedMetaMask()
      if (!provider || settled) {
        return
      }
      settled = true
      listeners.delete(onAnnounce)
      clearTimeout(timer)
      resolve(provider)
    }
    const timer = setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      listeners.delete(onAnnounce)
      resolve(null)
    }, timeoutMs)
    listeners.add(onAnnounce)
  })

  const announceResult = await announceWait
  if (announceResult) {
    return announceResult
  }

  // Last-resort: legacy `window.ethereum`. We only accept it if it claims
  // to be MetaMask, since some wallets (Phantom) inject themselves there
  // without snap support.
  const legacy = window.ethereum
  if (legacy?.isMetaMask) {
    return legacy
  }
  return null
}

// How long to wait for an EIP-6963 announcement after subscribing before
// emitting an initial UNAVAILABLE. Without this, the synchronous initial
// emit fires before any wallet has had a chance to respond to our
// `eip6963:requestProvider`, so consumers see a brief UNAVAILABLE flash
// before the real announcement lands a tick later.
const INITIAL_DETECT_WINDOW_MS = 250

/**
 * Subscribe to MetaMask provider availability. The callback fires when an
 * EIP-6963 announcement is processed (which may be on the next tick after
 * subscribe) and again whenever a new MetaMask variant announces itself.
 * Returns an unsubscribe function.
 *
 * The initial emit is deferred by `INITIAL_DETECT_WINDOW_MS` so wallets
 * have a moment to respond to our `eip6963:requestProvider` before we
 * report UNAVAILABLE. A real announcement during the window pre-empts the
 * timer and emits the actual provider info instead.
 *
 * Useful in long-lived UI (e.g. the wallet-dapp shell) where the user
 * might install or finish booting MetaMask after the page has mounted.
 */
export function subscribeMetaMaskProvider(
  cb: (info: MetaMaskProviderInfo) => void
): () => void {
  if (typeof window === 'undefined') {
    cb(UNAVAILABLE)
    return () => {}
  }

  installAnnouncementListener()

  let active = true
  // `undefined` until the first emit, then the most recently emitted
  // provider (null = UNAVAILABLE). The dedup check uses `!==` so the
  // initial undefined sentinel never matches either null or a provider.
  let lastProvider: MetaMaskInpageProvider | null | undefined = undefined

  const emit = async () => {
    if (!active) {
      return
    }
    const provider = findAnnouncedMetaMask()
    if (provider === lastProvider) {
      return
    }
    lastProvider = provider
    if (!provider) {
      cb(UNAVAILABLE)
      return
    }
    const info = await probeProvider(provider)
    if (active) {
      cb(info)
    }
  }

  listeners.add(emit)

  // Defer the initial emit. If an EIP-6963 announcement lands during the
  // window, the listener-driven `emit` fires first and sets `lastProvider`
  // to the real provider; this timer's eventual `emit` then dedupes.
  const initialEmitTimer = setTimeout(() => {
    void emit()
  }, INITIAL_DETECT_WINDOW_MS)

  return () => {
    active = false
    clearTimeout(initialEmitTimer)
    listeners.delete(emit)
  }
}
