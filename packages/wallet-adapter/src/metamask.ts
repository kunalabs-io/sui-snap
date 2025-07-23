import type {
  EIP6963AnnounceProviderEvent,
  MetaMaskInpageProvider,
} from '@metamask/providers';

export interface MetaMaskStatus {
  available: boolean
  supportsSnaps: boolean
  suiSnapInstalled: boolean
}

export type MetaMaskProviderInfo = {
  available: true,
  supportsSnaps: boolean,
  suiSnapInstalled: boolean,
  provider: MetaMaskInpageProvider,
} | {
  available: false,
  supportsSnaps: false,
  suiSnapInstalled: false,
  provider: null,
}

/**
 * Check if the current provider supports snaps by calling `wallet_getSnaps`.
 *
 * @param provider - The provider to use to check for snaps support. Defaults to
 * `window.ethereum`.
 * @returns True if the provider supports snaps, false otherwise.
 */
export async function hasSnapsSupport(
  provider: MetaMaskInpageProvider = window.ethereum,
) {
  try {
    await provider.request({
      method: 'wallet_getSnaps',
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Get a MetaMask provider using EIP6963. This will return the first provider
 * reporting as MetaMask. If no provider is found after 500ms, this will
 * return null instead.
 *
 * @returns A MetaMask provider if found, otherwise null.
 */
export async function getMetaMaskEIP6963Provider() {
  return new Promise<MetaMaskInpageProvider | null>((resolve) => {
    // Timeout looking for providers after 500ms
    const timeout = setTimeout(() => {
      resolveWithCleanup(null);
    }, 500);

    /**
     * Resolve the promise with a MetaMask provider and clean up.
     *
     * @param provider - A MetaMask provider if found, otherwise null.
     */
    function resolveWithCleanup(provider: MetaMaskInpageProvider | null) {
      window.removeEventListener(
        'eip6963:announceProvider',
        onAnnounceProvider,
      );

      clearTimeout(timeout);
      resolve(provider);
    }

    /**
     * Listener for the EIP6963 announceProvider event.
     *
     * Resolves the promise if a MetaMask provider is found.
     *
     * @param event - The EIP6963 announceProvider event.
     * @param event.detail - The details of the EIP6963 announceProvider event.
     */
    function onAnnounceProvider({ detail }: EIP6963AnnounceProviderEvent) {
      if (!detail) {
        return;
      }

      const { info, provider } = detail;

      if (info.rdns.includes('io.metamask')) {
        resolveWithCleanup(provider);
      }
    }

    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);

    window.dispatchEvent(new Event('eip6963:requestProvider'));
  });
}



/**
 * Get a provider that supports snaps. This will loop through all the detected
 * providers and return the first one that supports snaps.
 *
 * @returns The provider, or `null` if no provider supports snaps.
 */
export async function getSnapsProvider(): Promise<MetaMaskInpageProvider | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (await hasSnapsSupport()) {
    return window.ethereum;
  }

  if (window.ethereum?.detected) {
    for (const provider of window.ethereum.detected) {
      if (await hasSnapsSupport(provider)) {
        return provider;
      }
    }
  }

  if (window.ethereum?.providers) {
    for (const provider of window.ethereum.providers) {
      if (await hasSnapsSupport(provider)) {
        return provider;
      }
    }
  }

  const eip6963Provider = await getMetaMaskEIP6963Provider();

  if (eip6963Provider && (await hasSnapsSupport(eip6963Provider))) {
    return eip6963Provider;
  }

  return null;
}

/**
 * Checks the availability and capabilities of the MetaMask provider in the current environment.
 *
 * This function attempts to detect an Ethereum provider (MetaMask) and determines:
 * - If MetaMask is available and installed.
 * - The version of MetaMask (if available).
 * - Whether the provider supports MetaMask Snaps.
 * - Whether the Sui MetaMask Snap is installed.
 *
 * @returns {Promise<MetaMaskStatus>} An object describing the MetaMask provider's availability,
 *          version, snaps support, and Sui Snap installation status.
 */
export async function getMetaMaskProvider(): Promise<MetaMaskProviderInfo> {
  const provider = await getSnapsProvider()
  if (!provider) {
    return {
      available: false,
      supportsSnaps: false,
      suiSnapInstalled: false,
      provider: null,
    }
  }
  if (!provider.isMetaMask) {
    return {
      available: false,
      supportsSnaps: false,
      suiSnapInstalled: false,
      provider: null,
    }
  }
  try {
    const snaps = await provider.request<Record<string, unknown>>({ method: 'wallet_getSnaps' })
    const suiSnapInstalled = !!snaps && 'npm:@kunalabs-io/sui-metamask-snap' in snaps

    return {
      available: true,
      provider,
      supportsSnaps: true,
      suiSnapInstalled,
    }
  } catch (e) {
    throw e
  }
}

export async function metaMaskAvailable(): Promise<MetaMaskStatus> {
  const info = await getMetaMaskProvider()
  return {
    available: info.available,
    supportsSnaps: info.supportsSnaps,
    suiSnapInstalled: info.suiSnapInstalled,
  }
}
