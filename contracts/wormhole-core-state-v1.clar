;; Title: wormhole-core-state
;; Version: v1
;; Check for latest version: https://github.com/hirosystems/stacks-wormhole-core#latest-version
;; Report an issue: https://github.com/hirosystems/stacks-wormhole-core/issues

;; Store the state for `wormhole-core`
;; `wormhole-core` in intended to be upgradeable, but this contract is not
;; So this should only store state and have the minimal amount of code possible needed to securely manage state for `wormhole-core`

;;;; Constants

(define-constant ERR_STATE_UNINITIALIZED (err u10001))
(define-constant ERR_STATE_UNAUTHORIZED (err u10002))

;;;; Data vars

;; The currently active `wormhole-core` contract. This is the only contract allowed to modify the state in this contract
(define-data-var active-wormhole-core-contract (optional principal) none)

;;;; Data maps

;; Keep track of sequence state for message emitters
(define-map emitter-sequence
    principal  ;; Contract emitting message
    uint       ;; Incremented each time emitter emits a message
)

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
(define-public (set-active-wormhole-core-contract (core-contract principal))
  (let ((check (check-caller)))
    ;; Assert that current active contract is uninitialized or matches caller
    (asserts! (or (is-eq check (ok true)) (is-eq check ERR_STATE_UNINITIALIZED)) check)
    (var-set active-wormhole-core-contract (some core-contract))
    (ok true)))

;; @desc Get next sequence # for emitter and mark it as used
;;       On success, returns `(ok sequence)` and increments emitter's sequence
;;       On failure, returns (err ...)` does not increment sequence
(define-public (consume-emitter-sequence (emitter principal))
  (begin
    (try! (check-caller))
    (let ((sequence (default-to u0 (get-emitter-sequence emitter))))
      (map-set emitter-sequence emitter (+ sequence u1))
      (ok sequence))))

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
(define-read-only (kv-store-get? (key (string-ascii 32)))
  (map-get? kv-store key))

;;;; Private functions