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

;;;; Public functions

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

;;;; Read-only functions

;; @desc Check that the calling contract is the currently active `wormhole-core` contract
;;       This must be called in any function that modifies state
(define-read-only (check-caller)
  (let ((allowed-caller (unwrap! (var-get active-wormhole-core-contract) ERR_STATE_UNINITIALIZED)))
    (asserts! (is-eq contract-caller allowed-caller) ERR_STATE_UNAUTHORIZED)
    (ok true)))

(define-read-only (get-emitter-sequence (emitter principal))
  (map-get? emitter-sequence emitter))

;;;; Private functions