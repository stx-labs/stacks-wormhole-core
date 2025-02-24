(define-trait core-trait
  (
    ;; Parse and Verify cryptographic validity of a VAA
    (parse-and-verify-vaa ((buff 8192)) (response {
      version: uint, 
      guardian-set-id: uint,
      signatures-len: uint ,
      signatures: (list 19 { guardian-id: uint, signature: (buff 65) }),
      timestamp: uint,
      nonce: uint,
      emitter-chain: uint,
      emitter-address: (buff 32),
      sequence: uint,
      consistency-level: uint,
      payload: (buff 8192),
    } uint))
    ;; Emit message for Guardians to observe
    (post-message ((buff 8192) uint (optional uint)) (response {
      emitter: principal,
      nonce: uint,                ;; Must fit into `u32`
      sequence: uint,             ;; Must fit into `u64`
      consistency-level: uint,
      payload: (buff 8192)
    } uint))
    ;; TODO: Handle governance message: ContractUpgrade
    ;; Handle governance message: GuardianSetUpgrade
    ;;(guardian-set-upgrade ((buff 2048)) ((list 19 (buff 64))))
    ;; Handle governance message: SetMessageFee
    (set-message-fee ((buff 8192)) (response uint uint))
    ;; Handle governance message: TransferFees
    (transfer-fees ((buff 8192)) (response {
      recipient: principal,
      amount: uint
    } uint))
  )
)