;; This is for transferring the state of `wormhole-core` during updates
;; This does not cover `wormhole-core-state`, which cannot be updated
(define-trait export-trait
  (
    ;; Returns current state of `wormhole-core` and deactivates contract
    ;; Fails if caller is not successor contract
    (export-state () (response {
      guardian-set-initialized: bool,
      active-guardian-set-id: uint,
      previous-guardian-set: {
        set-id: uint,
        expires-at: uint
      },
      post-message-fee: uint,
    } uint))
  )
)
