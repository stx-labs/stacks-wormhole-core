;; title: wormhole-trait-core-v2-trait-checker
;; version: v2
;; summary: Checks that `core` trait passed is valid and is active core contract
;; description:
;;
;; =============================
;; Trait Checker Summary
;; =============================
;;
;; We can't do a proper proxy in Clarity, as dynamic dispatch is limited in order to preserve decidability
;; The best we can do is have users of a third-party app query the state contract for the current active contract,
;; and pass it through this contract to validate it.
;;
;; This puts a burden on third-party developers to query the state contract and supply a value to users,
;; but allows them to avoid updating and re-deploying their contracts every time `wormhole-core` updates
;;
;; =============================
;; Trait Checker Dataflow
;; =============================
;;
;; -----------------------------
;; 1. Transaction Initiation
;; -----------------------------
;;   When a transaction is initiated, it must include the principal of the current active `wormhole-core` contract as an argument to the function call.
;;   This can be queried from the `wormhole-core-state` by the application and supplied to the user
;;
;; -----------------------------
;; 2. Third-party contract using Wormhole
;; -----------------------------
;;   The third-party contract must accept the trait as a function argument and pass it through to this contract (`wormhole-trait-core-v2-trait-checker`)
;;   It is not necessary to check the trait argument here
;;
;; -----------------------------
;; 3. Trait Checker (THIS CONTRACT)
;; -----------------------------
;;   This will take the trait argument and check it against the currently active `wormhole-core` contract in `wormhole-core-state`.
;;   If it matches, it will call the the corresponding function in `wormhole-core`.
;;   If not, an error is returned
;;
;; -----------------------------
;; 4. Wormhole Core Contract
;; -----------------------------
;;   The last step is to call the currently active version of `wormhole-core` implementing `core-trait`

;;;; traits

(use-trait core-trait .wormhole-trait-core-v2.core-trait)

;;;; constants

;; Trait does not match active contract
(define-constant ERR_TRAIT_CHECK_CONTRACT_MISMATCH (err u20001))

;;;; public functions

(define-public (parse-and-verify-vaa (core-contract <core-trait>) (vaa-bytes (buff 8192)))
  (begin
    (try! (check-active-wormhole-core-contract core-contract))
    (contract-call? core-contract parse-and-verify-vaa vaa-bytes)))

(define-public (post-message (core-contract <core-trait>) (payload (buff 8192)) (nonce uint) (consistency-level-opt (optional uint)))
  (begin
    (try! (check-active-wormhole-core-contract core-contract))
    (contract-call? core-contract post-message-via-proxy payload nonce consistency-level-opt contract-caller)))

(define-read-only (check-active-wormhole-core-contract (expected-core-contract <core-trait>))
  (let ((active-core-contract (contract-call? .wormhole-core-state get-active-wormhole-core-contract)))
    (asserts! (is-eq (contract-of expected-core-contract) active-core-contract) ERR_TRAIT_CHECK_CONTRACT_MISMATCH)
    (ok expected-core-contract)))