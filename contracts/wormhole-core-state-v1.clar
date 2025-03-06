;; Title: wormhole-core-state
;; Version: v1
;; Check for latest version: https://github.com/hirosystems/stacks-wormhole-core#latest-version
;; Report an issue: https://github.com/hirosystems/stacks-wormhole-core/issues

;; Store the state for `wormhole-core`
;; `wormhole-core` in intended to be upgradeable, but this contract is not.
;; This contract is *specifically* meant for state that can grow unbounded.
;; State with a finite size can be stored in `wormhole-core`,
;; and we can use an import/export function to move that state when we get a ContractUpgrade VAA
;; This contract should contain as little logic as possible, because it is not upgradeable

;;;; Constants

;; State contract not initialized (no active core contract set)
(define-constant ERR_STATE_UNINITIALIZED (err u10001))
;; Caller is not active core contract
(define-constant ERR_STATE_UNAUTHORIZED (err u10002))
;; VAA has already been used
(define-constant ERR_STATE_VAA_REPLAYED (err u10003))

;;;; Data vars

;; The currently active `wormhole-core` contract. This is the only contract allowed to modify the state in this contract
(define-data-var active-wormhole-core-contract (optional principal) none)

;;;; Data maps

;; Keep track of sequence state for message emitters
(define-map emitter-sequence
    principal  ;; Contract emitting message
    uint       ;; Incremented each time emitter emits a message
)
;; Wormhole Governance: Keep track of consumed governance VAAs by hash to prevent replay attacks
(define-map consumed-governance-vaa-hashes (buff 32) bool)
;; Map tracking guardians set
(define-map guardian-sets uint (list 19 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) }))

;; Since this contract can't be updated, provide a dynamically-typed key/value store,
;; which can be used if additional state is required by future core contract updates.
;;
;; If additional state is necessary, it may be preferable to deploy another state contract instead of using this map,
;; depending on the size, complexity, and the performance needs of the additional state
;;
;; This option is here to provide options and flexibility for future core contract updates
(define-map kv-store (string-ascii 32) (buff 4096))

;;;; Public functions

;; ALL PUBLIC FUNCTIONS WHICH MODIFY STATE MUST CALL `check-caller`

;; @desc Set which `wormhole-core` contract which is allowed to modify state in this contract
;;
;; Returns:
;;   - (ok true):  If active core contract was changed
;;   - (ok false): If new core contract was the same as current active core contract
;;   - (err ...):  If caller does not have permission to set active core contract
(define-public (set-active-wormhole-core-contract (core-contract principal))
  (let ((check (check-caller)))
    ;; Assert that current active contract is uninitialized or matches caller
    (asserts! (or (is-eq check (ok true)) (is-eq check ERR_STATE_UNINITIALIZED)) check)
    (if (is-eq (var-get active-wormhole-core-contract) (some core-contract))
      ;; New contract is same as current active contract
      (ok false)
      ;; New contract different from current active contract
      (begin
        (var-set active-wormhole-core-contract (some core-contract))
        (ok true)))))

;; @desc Get next sequence # for emitter and mark it as used
;;       On success, returns `(ok sequence)` and increments emitter's sequence
;;       On failure, returns (err ...)` does not increment sequence
(define-public (consume-emitter-sequence (emitter principal))
  (begin
    (try! (check-caller))
    (let ((sequence (default-to u0 (get-emitter-sequence emitter))))
      (map-set emitter-sequence emitter (+ sequence u1))
      (ok sequence))))

;; @desc Track hashes of processed governance VAAs so we don't replay them
;;       Returns `(ok true)` if the VAA is marked as "consumed"
;;       On failure, returns (err ...)` does not consume the VAA
;;
;; @param hash: Governance VAA hash, computed by `(keccak256 (keccak256 vaa-body))`
(define-public (consume-governance-vaa (hash (buff 32)))
  (begin
    (try! (check-caller))
    (asserts! (map-insert consumed-governance-vaa-hashes hash true) ERR_STATE_VAA_REPLAYED)
    (ok true)))

;; @desc Set raw buffer in key/value store using `map-insert` (fails if entry exists)
;;       Caller is responsible for serializing data with `to-consensus-buff?`
;;       If no error, returns `(ok bool)` with the result of `map-insert`
(define-public (kv-store-insert (key (string-ascii 32)) (value (buff 4096)))
  (begin
    (try! (check-caller))
    (ok (map-insert kv-store key value))))

;; @desc Set raw buffer in key/value store using `map-set` (overwrites existing entries)
;;       Caller is responsible for serializing data with `to-consensus-buff?`
;;       If no error, returns `(ok bool)` with the result of `map-set`
(define-public (kv-store-set (key (string-ascii 32)) (value (buff 4096)))
  (begin
    (try! (check-caller))
    (ok (map-set kv-store key value))))

;; @desc Set guardian set
;;       Does not check if index already exists, that is responsibility of core contract
;;       If no error, returns `(ok bool)` with the result of `map-set`
;; @param set-id: Guardian set ID
;; @param guardian-set: List of 19 Guardian pubkeys
(define-public (guardian-sets-set (set-id uint) (guardian-set (list 19 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) })))
  (begin
    (try! (check-caller))
    (ok (map-set guardian-sets set-id guardian-set))))

;;;; Read-only functions

;; These functions do not modify state and can be called by anyone

;; @desc Check that the calling contract is the currently active `wormhole-core` contract
;;       This must be called in any function that modifies state
(define-read-only (check-caller)
  (let ((allowed-caller (unwrap! (var-get active-wormhole-core-contract) ERR_STATE_UNINITIALIZED)))
    (asserts! (is-eq contract-caller allowed-caller) ERR_STATE_UNAUTHORIZED)
    (ok true)))

(define-read-only (get-emitter-sequence (emitter principal))
  (map-get? emitter-sequence emitter))

;; @desc Return raw buffer from key/value store
;;       Caller is responsible for deserializing data with `from-consensus-buff?`
(define-read-only (kv-store-get (key (string-ascii 32)))
  (map-get? kv-store key))

;; @desc Return guardian set
;; @param set-id: Guardian set ID
(define-read-only (guardian-sets-get (set-id uint))
  (map-get? guardian-sets set-id))
