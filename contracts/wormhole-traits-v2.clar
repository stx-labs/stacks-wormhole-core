;; VAA parsing needed by some third party contracts like Pyth
(define-trait core-trait
  (
    ;; Parse and Verify cryptographic validity of a VAA
    (parse-and-verify-vaa ((buff 8192)) (response {
      vaa: {
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
      },
      vaa-body-hash: (buff 32)
    } uint))
  )
)

;; Required functions to send messages to Wormhole
;; This is what most third-party contracts will use
(define-trait emitter-trait
  (
    ;; Emit message for Guardians to observe
    (post-message ((buff 8192) uint (optional uint)) (response {
      emitter: principal,
      nonce: uint,                ;; Must fit into `u32`
      sequence: uint,             ;; Must fit into `u64`
      consistency-level: uint,    ;; Must fit into `u8`
      payload: (buff 8192)
    } uint))
  )
)

;; Interface for handling VAAs from governance contract
(define-trait governance-trait
  (
    ;; Handle governance action #1: ContractUpgrade
    (contract-upgrade ((buff 8192)) (response principal uint))
    ;; Handle governance action #2: GuardianSetUpgrade 
    (guardian-set-upgrade ((buff 2048) (list 19 (buff 64))) (response {
      vaa: {
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
      },
      result: {
        guardians-eth-addresses: (list 19 (buff 64)),
        guardians-public-keys: (list 19 (buff 64))
      }
    } uint))
    ;; Handle governance action #3: SetMessageFee
    (set-message-fee ((buff 8192)) (response uint uint))
    ;; Handle governance action #4: TransferFees
    (transfer-fees ((buff 8192)) (response {
      recipient: principal,
      amount: uint
    } uint))
  )
)