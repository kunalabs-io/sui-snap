// Identity of the snap on the npm registry. When developing locally,
// change this to `local:http://localhost:8080` (or whatever port your
// snap watcher serves on) so the adapter installs the local bundle.
export const SNAP_ORIGIN = 'npm:@kunalabs-io/sui-metamask-snap'

// Semver range the adapter requires when calling `wallet_requestSnaps`.
export const SNAP_VERSION = '^2.0.0'
