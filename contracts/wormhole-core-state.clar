;; Title: wormhole-core-state-01
;; Version: final
;; Check for latest version: https://github.com/hirosystems/stacks-wormhole-core#latest-version
;; Report an issue: https://github.com/hirosystems/stacks-wormhole-core/issues

;; Store the state for `wormhole-core`
;;
;; THIS CONTRACT IS NOT UPGRADEABLE, so it should contain as little logic as possible
;;
;; This contract is *specifically* meant for state that can grow unbounded, and eventually too big to export
;; State with a finite size is stored in `wormhole-core`, and transfered via import/export functions during an update
;;
;; This contract does not have a version in its name because there cannot be different versions of it
;; If you need additional state in the future, use `kv-store` or deploy a `wormhole-core-state-2` contract

;;;; Constants

;; State contract not initialized (no active core contract set)
(define-constant ERR_STATE_UNINITIALIZED (err u10001))
;; Caller is not active core contract
(define-constant ERR_STATE_UNAUTHORIZED (err u10002))
;; Attempted to initialize already initialized contract
(define-constant ERR_STATE_ALREADY_INITIALIZED (err u10003))
;; Value not allowed
(define-constant ERR_STATE_INVALID_VALUE (err u10004))
;; VAA has already been used
(define-constant ERR_STATE_VAA_REPLAYED (err u10005))
;; No state transfer in progress
(define-constant ERR_STATE_XFER_NOT_IN_PROGRESS (err u10006))

;;;; Data vars

;; Only the owner of this contract can make changes to its state
;; This defines what the currently active `wormhole-core` contract is
;; Should never be `none` once contract is initialized
(define-data-var owner (optional principal) none)

;; New owner we are transferring this contract to during `wormhole-core` update
;; Should always be `none` except during update process
(define-data-var transferring-to (optional principal) none)

;;;; Data maps

;; Map tracking sequence numbers for all contracts which have sent a Wormhole message
(define-map emitter-sequence
    principal  ;; Contract emitting message
    uint       ;; Sequence number of *next* message
)
;; Map tracking consumed governance VAA hashes to prevent replay attacks
(define-map consumed-governance-vaa-hashes (buff 32) bool)
;; Map tracking guardian sets
(define-map guardian-sets uint (list 30 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) }))

;; Since this contract can't be updated, provide a dynamically-typed key/value store,
;; which can be used if additional state is required by future core contract updates.
;;
;; If additional state is necessary, it may be preferable to deploy another state contract instead of using this map,
;; depending on the size, complexity, and the performance needs of the additional state
;;
;; This option is here to provide options and flexibility for future core contract updates
(define-map kv-store (string-ascii 32) (buff 4096))

;;;; Public functions

;; ALL PUBLIC FUNCTIONS WHICH MODIFY STATE MUST CALL `check-caller-is-owner`

;; @desc Initialize newly deployed contract with owner (active core contract)
;;
;; Returns:
;;   - (ok true): If state contract initialized
;;   - (err ...): If already initialized or invalid argument
(define-public (initialize (core-contract principal))
  (let ((contract-parts (unwrap! (principal-destruct? core-contract) ERR_STATE_INVALID_VALUE)))
    ;; Can't call this function more than once
    (asserts! (is-none (get-owner)) ERR_STATE_ALREADY_INITIALIZED)
    ;; Check we have a contract principal and not a standard principal
    (asserts! (is-some (get name contract-parts)) ERR_STATE_INVALID_VALUE)
    ;; Checks passed! Contract is initialized
    (var-set owner (some core-contract))
    (ok true)))

;; @desc: Start ownership transfer: Set successor contract which will be allowed to claim ownership of this contract
;;        If successor fails to claim ownership, the transfer can be cancelled
;;        The 2-step process prevents transferring ownership to a broken deployment and permanently losing access to the state contract
(define-public (start-ownership-transfer (new-owner principal))
  (let ((current-owner (try! (check-caller-is-owner)))
        (new-owner-parts (unwrap! (principal-destruct? new-owner) ERR_STATE_INVALID_VALUE)))
    ;; Can't transfer to current owner
    (asserts! (not (is-eq new-owner current-owner)) ERR_STATE_INVALID_VALUE)
    ;; Check we have a contract principal and not a standard principal
    (asserts! (is-some (get name new-owner-parts)) ERR_STATE_INVALID_VALUE)
    ;; Checks passed! Ownership transfer in progress
    (var-set transferring-to (some new-owner))
    (ok true)))

;; @desc Cancel ownership tranfer
;;       Returns principal of contract to which ownership was being transferred
(define-public (cancel-ownership-transfer)
  (let ((cancelled-transfer (unwrap! (var-get transferring-to) ERR_STATE_XFER_NOT_IN_PROGRESS)))
    (try! (check-caller-is-owner))
    ;; Checks passed! Ownership transfer cancelled
    (var-set transferring-to none)
    (ok cancelled-transfer)))

;; @desc: Finalize ownership transfer: Set successor contract as owner
;;        Called by the contract we are transferring ownership to, NOT the current owner
;;        This is the only public function that does NOT call `check-caller-is-owner`
(define-public (finalize-ownership-transfer)
  (let ((new-owner (unwrap! (var-get transferring-to) ERR_STATE_XFER_NOT_IN_PROGRESS)))
    ;; Check that the contract caller is who we are transferring to
    (asserts! (is-eq contract-caller new-owner) ERR_STATE_UNAUTHORIZED)
    ;; Checks passed! Ownership transfer complete
    (var-set owner (some new-owner))
    (var-set transferring-to none)
    (ok true)))

;; @desc Get next sequence # for emitter and mark it as used
;;       On success, returns `(ok sequence)` and increments emitter's sequence
;;       On failure, returns `(err ...)` does not increment sequence
(define-public (consume-emitter-sequence (emitter principal))
  (begin
    (try! (check-caller-is-owner))
    (let ((sequence (default-to u0 (get-emitter-sequence emitter))))
      (map-set emitter-sequence emitter (+ sequence u1))
      (ok sequence))))

;; @desc Track hashes of processed governance VAAs so we don't replay them
;;       Returns `(ok true)` if the VAA is marked as "consumed"
;;       On failure, returns `(err ...)` does not consume the VAA
;;
;; @param hash: Governance VAA hash, computed by `(keccak256 (keccak256 vaa-body))`
(define-public (consume-governance-vaa (hash (buff 32)))
  (begin
    (try! (check-caller-is-owner))
    (asserts! (map-insert consumed-governance-vaa-hashes hash true) ERR_STATE_VAA_REPLAYED)
    (ok true)))

;; @desc Set raw buffer in key/value store using `map-insert` (fails if entry exists)
;;       Caller is responsible for serializing data with `to-consensus-buff?`
;;       If no error, returns `(ok bool)` with the result of `map-insert`
(define-public (kv-store-insert (key (string-ascii 32)) (value (buff 4096)))
  (begin
    (try! (check-caller-is-owner))
    (ok (map-insert kv-store key value))))

;; @desc Set raw buffer in key/value store using `map-set` (overwrites existing entries)
;;       Caller is responsible for serializing data with `to-consensus-buff?`
;;       If no error, returns `(ok bool)` with the result of `map-set`
(define-public (kv-store-set (key (string-ascii 32)) (value (buff 4096)))
  (begin
    (try! (check-caller-is-owner))
    (ok (map-set kv-store key value))))

;; @desc Set guardian set
;;       Does not check if index already exists, that is responsibility of core contract
;;       If no error, returns `(ok bool)` with the result of `map-set`
;; @param set-id: Guardian set ID
;; @param guardian-set: List of 19 Guardian pubkeys
(define-public (guardian-sets-set (set-id uint) (guardian-set (list 19 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) })))
  (begin
    (try! (check-caller-is-owner))
    (ok (map-set guardian-sets set-id guardian-set))))

;;;; Read-only functions

;; These functions do not modify state and can be called by anyone

;; @desc Check that the calling contract is the owner (currently active `wormhole-core` contract)
;;       This must be called in any function that modifies state
(define-read-only (check-caller-is-owner)
  (let ((current-owner (unwrap! (get-owner) ERR_STATE_UNINITIALIZED)))
    (asserts! (is-eq contract-caller current-owner) ERR_STATE_UNAUTHORIZED)
    (ok current-owner)))

;; @desc Read next sequence number for `emitter`
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

;; @desc Check if governance message has been used
;; @param hash: keccak256(keccak256(vaa-body-hash))
(define-read-only (consumed-governance-vaa-hashes-get (hash (buff 32)))
  (map-get? consumed-governance-vaa-hashes hash))

;; @desc Returns contract owner, which is allowed to modify state
(define-read-only (get-owner)
  (var-get owner))

;; @desc Returns currently active wormhole-core contract (defined by `owner`)
(define-read-only (get-active-wormhole-core-contract)
  (get-owner))