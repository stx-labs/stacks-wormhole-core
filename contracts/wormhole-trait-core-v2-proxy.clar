
;; title: wormhole-trait-core-v2-proxy
;; version: v2
;; summary: Proxy for functions defined in `wormhold-core-trait-v1`
;; description: Proxy so that users always call core trait functions in the latest active core contract
;;
;; ==========================
;; Proxy Architecture
;; ==========================
;;
;; --------------------------
;; 1. Proxy Contract (THIS CONTRACT)
;; --------------------------
;;   Contracts using Wormhole hard-code the principal of this proxy contract (`SPXXXXXX.wormhole-trait-core-vXXX-proxy`) into thier contract's `contract-call?` functions.
;;   Users will never have to update thier contracts unless a new core contract is released with a different interface (ideally this won't happen)
;;   The proxy contract will look up the current active version of `wormhole-core` from `wormhole-core-state` and call the proxy contract checker to validate the trait
;;   If there is no active core contract in the state contract, an error will be returned
;;
;; --------------------------
;; 2. Trait Checker
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

(impl-trait .wormhole-trait-core-v2.core-trait)

;;;; constants

;; No active wormhole-core contract found
(define-constant ERR_PROXY_NO_CONTRACT (err u20001))

;;;; public functions

(define-public (parse-and-verify-vaa (vaa-bytes (buff 8192)))
  (let ((core-contract (try! (get-active-wormhole-core-contract))))
    (contract-call? .wormhole-trait-core-v2-trait-checker parse-and-verify-vaa core-contract vaa-bytes)))

(define-public (post-message (payload (buff 8192)) (nonce uint) (consistency-level-opt (optional uint)))
  (let ((core-contract (try! (get-active-wormhole-core-contract))))
    (contract-call? .wormhole-trait-core-v2-trait-checker post-message core-contract payload nonce consistency-level-opt)))

;;;; read only functions

(define-read-only (get-active-wormhole-core-contract)
  (let ((core-contract (unwrap! (contract-call? .wormhole-core-state-v1 get-active-wormhole-core-contract) ERR_PROXY_NO_CONTRACT)))
    (ok core-contract)))

