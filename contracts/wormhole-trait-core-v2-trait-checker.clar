;; title: wormhole-trait-core-v2-proxy-checker
;; version: v2
;; summary: Checks contract proxied is valid `core` trait
;; description: This is the backend for` wormhole-trait-core-v2-proxy`
;;
;; ==========================
;; Proxy Architecture
;; ==========================
;;
;; --------------------------
;; 1. Proxy Contract
;; --------------------------
;;   Contracts using Wormhole hard-code the principal of this proxy contract (`SPXXXXXX.wormhole-trait-core-vXXX-proxy`) into thier contract's `contract-call?` functions.
;;   Users will never have to update thier contracts unless a new core contract is released with a different interface (ideally this won't happen)
;;   The proxy contract will look up the current active version of `wormhole-core` from `wormhole-core-state` and call the proxy contract checker to validate the trait
;;   If there is no active core contract in the state contract, an error will be returned
;;
;; --------------------------
;; 2. Trait Checker (THIS CONTRACT)
;; --------------------------
;;   This takes a trait argument and validates that the current version of `wormhole-core` we are proxying to actually implements `core-trait`
;;   If so, it will call the active `wormhole-core` contract. If not `contract-call?` will return an error
;;   It can also be used without the proxy in front, if the user prefers to pass the contract address themselves
;;
;; --------------------------
;; 3. Wormhole Core Contract
;; --------------------------
;;   The last step is to call the currently active version of `wormhole-core` implementing `core-trait`

;;;; traits

(use-trait core-trait .wormhole-trait-core-v2.core-trait)

;;;; public functions

(define-public (parse-and-verify-vaa (core-contract <core-trait>) (vaa-bytes (buff 8192)))
  (contract-call? core-contract parse-and-verify-vaa vaa-bytes))

(define-public (post-message (core-contract <core-trait>) (payload (buff 8192)) (nonce uint) (consistency-level-opt (optional uint)))
  (contract-call? core-contract post-message payload nonce consistency-level-opt))
