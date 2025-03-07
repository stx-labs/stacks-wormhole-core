;; Title: wormhole-core
;; Version: v4
;; Check for latest version: https://github.com/hirosystems/stacks-wormhole-core#latest-version
;; Report an issue: https://github.com/hirosystems/stacks-wormhole-core/issues

;;;; Traits

;; Implements trait specified in wormhole-core-trait contract
(impl-trait .wormhole-traits-v2.core-trait)
(impl-trait .wormhole-traits-v2.emitter-trait)
(impl-trait .wormhole-traits-v2.governance-trait)

;;;; Constants

;; VAA version not supported
(define-constant ERR_VAA_PARSING_VERSION (err u1001))
;; Unable to extract the guardian set-id from the VAA
(define-constant ERR_VAA_PARSING_GUARDIAN_SET (err u1002))
;; Unable to extract the number of signatures from the VAA
(define-constant ERR_VAA_PARSING_SIGNATURES_LEN (err u1003))
;; Unable to extract the signatures from the VAA
(define-constant ERR_VAA_PARSING_SIGNATURES (err u1004))
;; Unable to extract the timestamp from the VAA
(define-constant ERR_VAA_PARSING_TIMESTAMP (err u1005))
;; Unable to extract the nonce from the VAA
(define-constant ERR_VAA_PARSING_NONCE (err u1006))
;; Unable to extract the emitter chain from the VAA
(define-constant ERR_VAA_PARSING_EMITTER_CHAIN (err u1007))
;; Unable to extract the emitter address from the VAA
(define-constant ERR_VAA_PARSING_EMITTER_ADDRESS (err u1008))
;; Unable to extract the sequence from the VAA
(define-constant ERR_VAA_PARSING_SEQUENCE (err u1009))
;; Unable to extract the consistency level from the VAA
(define-constant ERR_VAA_PARSING_CONSISTENCY_LEVEL (err u1010))
;; Unable to extract the payload from the VAA
(define-constant ERR_VAA_PARSING_PAYLOAD (err u1011))
;; Unable to extract the hash the payload from the VAA
(define-constant ERR_VAA_HASHING_BODY (err u1012))

;; Number of valid signatures insufficient (min: 13/19)
(define-constant ERR_VAA_CHECKS_VERSION_UNSUPPORTED (err u1101))
;; Number of valid signatures insufficient (min: 13/19)
(define-constant ERR_VAA_CHECKS_THRESHOLD_SIGNATURE (err u1102))
;; Guardian signature not comprised in guardian set specified
(define-constant ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY (err u1103))

;; Guardian Set Upgrade: error parsing `module`
(define-constant ERR_GSU_PARSING_MODULE (err u1201))
;; Guardian Set Upgrade: error parsing `action`
(define-constant ERR_GSU_PARSING_ACTION (err u1202))
;; Guardian Set Upgrade: error parsing `chain`
(define-constant ERR_GSU_PARSING_CHAIN (err u1203))
;; Guardian Set Upgrade: error parsing `index`
(define-constant ERR_GSU_PARSING_INDEX (err u1204))
;; Guardian Set Upgrade: error parsing `length`
(define-constant ERR_GSU_PARSING_GUARDIAN_LEN (err u1205))
;; Guardian Set Upgrade: guardians payload is malformed
(define-constant ERR_GSU_PARSING_GUARDIANS_BYTES (err u1206))
;; Guardian Set Upgrade: error parsing pubkeys
(define-constant ERR_GSU_UNCOMPRESSED_PUBLIC_KEYS (err u1207))

;; Guardian Set Upgrade: initiated by an unauthorized module
(define-constant ERR_GSU_CHECK_MODULE (err u1301))
;; Guardian Set Upgrade: initiated from an unauthorized module
(define-constant ERR_GSU_CHECK_ACTION (err u1302))
;; Guardian Set Upgrade: initiated from an unauthorized module
(define-constant ERR_GSU_CHECK_CHAIN (err u1303))
;; Guardian Set Upgrade: new index invalid
(define-constant ERR_GSU_CHECK_INDEX (err u1304))
;; Overlay present in vaa bytes
(define-constant ERR_GSU_CHECK_OVERLAY (err u1307))
;; Empty guardian set
(define-constant ERR_EMPTY_GUARDIAN_SET (err u1308))
;; Guardian Set Upgrade: emission payload unauthorized
(define-constant ERR_DUPLICATED_GUARDIAN_ADDRESSES (err u1309))
;; Unable to get stacks timestamp
(define-constant ERR_STACKS_TIMESTAMP (err u1310))

;; Post Message: Consistency level is too large
(define-constant ERR_POST_OVERFLOW_CONSISTENCY_LEVEL (err u1401))
;; Post Message: Nonce is too large
(define-constant ERR_POST_OVERFLOW_NONCE (err u1402))
;; Post Message: Sequence is too large
(define-constant ERR_POST_OVERFLOW_SEQUENCE (err u1403))

;; Set Message Fee: error parsing `module`
(define-constant ERR_SMF_PARSING_MODULE (err u1501))
;; Set Message Fee: error parsing `action`
(define-constant ERR_SMF_PARSING_ACTION (err u1502))
;; Set Message Fee: error parsing `chain`
(define-constant ERR_SMF_PARSING_CHAIN (err u1503))
;; Set Message Fee: error parsing first 128 bits of `fee`
(define-constant ERR_SMF_PARSING_FEE_1 (err u1504))
;; Set Message Fee: error parsing second 128 bits of `fee`
(define-constant ERR_SMF_PARSING_FEE_2 (err u1505))
;; Set Message Fee: overlay present in vaa bytes
(define-constant ERR_SMF_CHECK_OVERLAY (err u1507))
;; Set Message Fee: `fee` value too high
(define-constant ERR_SMF_CHECK_FEE (err u1508))
;; Set Message Fee: `module` is not expected value
(define-constant ERR_SMF_CHECK_MODULE (err u1509))
;; Set Message Fee: `action` is not expected value for this message type
(define-constant ERR_SMF_CHECK_ACTION (err u1510))
;; Set Message Fee: `chain` does not match this blockchain
(define-constant ERR_SMF_CHECK_CHAIN (err u1511))

;; Transfer Fees: error parsing `module`
(define-constant ERR_TXF_PARSING_MODULE (err u1601))
;; Transfer Fees: error parsing `action`
(define-constant ERR_TXF_PARSING_ACTION (err u1602))
;; Transfer Fees: error parsing `chain`
(define-constant ERR_TXF_PARSING_CHAIN (err u1603))
;; Transfer Fees: error parsing first 128 bits of `fee`
(define-constant ERR_TXF_PARSING_AMOUNT_1 (err u1604))
;; Transfer Fees: error parsing second 128 bits of `fee`
(define-constant ERR_TXF_PARSING_AMOUNT_2 (err u1605))
;; Transfer Fees: error parsing `recipient`
(define-constant ERR_TXF_PARSING_RECIPIENT (err u1606))
;; Transfer Fees: overlay present in vaa bytes
(define-constant ERR_TXF_CHECK_OVERLAY (err u1607))
;; Transfer Fees: `amount` value too high
(define-constant ERR_TXF_CHECK_AMOUNT (err u1608))
;; Transfer Fees: `module` is not expected value
(define-constant ERR_TXF_CHECK_MODULE (err u1609))
;; Transfer Fees: `action` is not expected value for this message type
(define-constant ERR_TXF_CHECK_ACTION (err u1610))
;; Transfer Fees: `chain` does not match this blockchain
(define-constant ERR_TXF_CHECK_CHAIN (err u1611))

;; Contract Upgrade: error parsing `module`
(define-constant ERR_UPG_PARSING_MODULE (err u1701))
;; Contract Upgrade: error parsing `action`
(define-constant ERR_UPG_PARSING_ACTION (err u1702))
;; Contract Upgrade: error parsing `chain`
(define-constant ERR_UPG_PARSING_CHAIN (err u1703))
;; Contract Upgrade: error parsing `contract`
(define-constant ERR_UPG_PARSING_CONTRACT (err u1706))
;; Contract Upgrade: overlay present in vaa bytes
(define-constant ERR_UPG_CHECK_OVERLAY (err u1707))
;; Contract Upgrade: `module` is not expected value
(define-constant ERR_UPG_CHECK_MODULE (err u1709))
;; Contract Upgrade: `action` is not expected value for this message type
(define-constant ERR_UPG_CHECK_ACTION (err u1710))
;; Contract Upgrade: `chain` does not match this blockchain
(define-constant ERR_UPG_CHECK_CHAIN (err u1711))

;; Wormhole Governance: Message not from authorized chain/emitter
(define-constant ERR_GOV_CHECK_EMITTER (err u1801))

;; Deployment State: This deployment is not the active core contract
(define-constant ERR_DEPLOYMENT_STATE_NOT_ACTIVE (err u1702))

;; Wormhole Governance: emitting chain
(define-constant GOV_EMITTING_CHAIN u1)
;; Wormhole Governance: emitting address
(define-constant GOV_EMITTING_ADDRESS 0x0000000000000000000000000000000000000000000000000000000000000004)
;; Wormhole Governance: Message intended for all chains
(define-constant GOV_BROADCAST_CHAIN_ID u0)
;; Wormhole Governance: ContractUpgrade action
(define-constant GOV_ACTION_CONTRACT_UPGRADE u1)
;; Wormhole Governance: GuardianSetUpgrade action
(define-constant GOV_ACTION_GUARDIAN_SET_UPDATE u2)
;; Wormhole Governance: SetMessageFee action
(define-constant GOV_ACTION_SET_MESSAGE_FEE u3)
;; Wormhole Governance: SetMessageFee action
(define-constant GOV_ACTION_TRANSFER_FEES u4)
;; Stacks chain id attributed by Pyth
(define-constant EXPECTED_CHAIN_ID (if is-in-mainnet 0xea86 0xc377))
;; Core string module
(define-constant CORE_STRING_MODULE 0x00000000000000000000000000000000000000000000000000000000436f7265)
;; Guardian eth address size
(define-constant GUARDIAN_ETH_ADDRESS_SIZE u20)
;; 24 hours in seconds
(define-constant TWENTY_FOUR_HOURS u86400)
;; Default consistency level for emitted messages
(define-constant DEFAULT_CONSISTENCY_LEVEL u0)
;; Max value for unsigned 8-bit integer
(define-constant MAX_VALUE_U8 u255)
;; Max value for unsigned 32-bit integer
(define-constant MAX_VALUE_U32 u4294967295)
;; Max value for unsigned 64-bit integer
(define-constant MAX_VALUE_U64 u18446744073709551615)

;;;; Data vars

;; `deployment-state` can have one of the following values:
(define-constant DEPLOYMENT_STATE_UNITIALIZED u0) ;; This deployment has not been initialized and is not ready for use
(define-constant DEPLOYMENT_STATE_ACTIVE      u1) ;; This deployment has been initialized and is the active wormhole core contract
(define-constant DEPLOYMENT_STATE_DEPRECATED  u2) ;; This deployment has been upgraded and is no longer active
;; The state of this particular deployment of the core contract
(define-data-var deployment-state uint DEPLOYMENT_STATE_UNITIALIZED)

;; ----- DATA VARS BELOW THIS LINE MUST BE EXPORTED IN `export-state`! -----

;; Guardian Set Update uncompressed public keys invalid
(define-data-var guardian-set-initialized bool false)
;; Keep track of the active guardian set-id
(define-data-var active-guardian-set-id uint u0)
;; Keep track of exiting guardian set
(define-data-var previous-guardian-set {set-id: uint, expires-at: uint} {set-id: u0, expires-at: u0})
;; Fee to post message to Wormhole guardians
(define-data-var post-message-fee uint u0)

;;;; Data maps

;; WARNING: It's not a good idea to store maps in this contract!
;; There is no limit to how big they can get and this can make import/export during a ContractUpgrade operation impossible
;; Please use a separate state contract like `wormhold-core-state` for maps!

;;;; Public functions

;; @desc Initialize the state contract
;;       Only needs to be called once, when the state contract is first deployed
;;       It is safe to call repeatedly but will have no effect
;;       State contract must be initialized before calling any other functions in this contract
;;
;; Returns
;;  - (ok true):  State was initialized
;;  - (ok false): State was already initialized
;;  - (err ...):  Permissions or other error
(define-public (initialize-state-contract)
  ;; The only time this function will ever return `(ok true)` is on the first call from any version of `wormhole-core`
  (if (try! (set-state-contract-owner (get-contract-principal)))
    ;; This is the initial deployment of `wormhole-core` and the first time ever calling this
    (begin
      (var-set deployment-state DEPLOYMENT_STATE_ACTIVE)
      (ok true))
    ;; This is not the initial deployment, and `initialized` should be set when importing data
    (ok false)))

;; @desc Get current state of this contract deployment
(define-read-only (get-deployment-state)
  (var-get deployment-state))

;; @desc Returns true if this is the currently active core contract deployment (can only be one at any time)
(define-read-only (is-active-deployment)
  (is-eq (get-deployment-state) DEPLOYMENT_STATE_ACTIVE))

;; @desc Like `is-active-deployment` but returns error instead of bool
(define-read-only (check-active-deployment)
  (begin
    (asserts! (is-active-deployment) ERR_DEPLOYMENT_STATE_NOT_ACTIVE)
    (ok true)))

;; @desc Export state stored in *this* contract.
;;       THIS DOES NOT EXPORT STATE FROM `wormhole-core-state` CONTRACT!
;;
;; Steps to update `wormhole-core` contract:
;;   1. Make some changes to `wormhole-core`
;;   2. Governance contract publishes VAA with address of updated `wormhole-core` contract
;;   3. Have new contract call this contract's `export-state` to initialize it's own state
;;
;; TODO: This contract currently lacks a mechanism to import data.
;;       If this contract ever needs to be updated, that will need to be added
(define-read-only (export-state) {
    guardian-set-initialized: (var-get guardian-set-initialized),
    active-guardian-set-id: (var-get active-guardian-set-id),
    previous-guardian-set: (var-get previous-guardian-set),
    post-message-fee: (var-get post-message-fee)})

;; @desc Parse a Verified Action Approval (VAA)
;; 
;; VAA Header
;; byte        version             (VAA Version)
;; u32         guardian_set_index  (Indicates which guardian set is signing)
;; u8          len_signatures      (Number of signatures stored)
;; [][66]byte  signatures          (Collection of ecdsa signatures)
;;
;; VAA Body
;; u32         timestamp           (Timestamp of the block where the source transaction occurred)
;; u32         nonce               (A grouping number)
;; u16         emitter_chain       (Wormhole ChainId of emitter contract)
;; [32]byte    emitter_address     (Emitter contract address, in Wormhole format)
;; u64         sequence            (Strictly increasing sequence, tied to emitter address & chain)
;; u8          consistency_level   (What finality level was reached before emitting this message)
;; []byte      payload             (VAA message content)
;;
;; @param vaa-bytes: 
(define-read-only (parse-vaa (vaa-bytes (buff 8192)))
  (let ((cursor-version (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 { bytes: vaa-bytes, pos: u0 }) 
          ERR_VAA_PARSING_VERSION))
        (cursor-guardian-set-id (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-32 (get next cursor-version)) 
          ERR_VAA_PARSING_GUARDIAN_SET))
        (cursor-signatures-len (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-guardian-set-id)) 
          ERR_VAA_PARSING_SIGNATURES_LEN))
        (cursor-signatures (fold batch-read-signatures
          (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0)
          { 
              next: (get next cursor-signatures-len), 
              value: (list),
              iter: (get value cursor-signatures-len)
          }))
        (vaa-body-hash (keccak256 (keccak256 (get value (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-8192-max (get next cursor-signatures) none)
          ERR_VAA_HASHING_BODY)))))
        (cursor-timestamp (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-32 (get next cursor-signatures)) 
          ERR_VAA_PARSING_TIMESTAMP))
        (cursor-nonce (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-32 (get next cursor-timestamp)) 
          ERR_VAA_PARSING_NONCE))
        (cursor-emitter-chain (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-16 (get next cursor-nonce)) 
          ERR_VAA_PARSING_EMITTER_CHAIN))
        (cursor-emitter-address (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-32 (get next cursor-emitter-chain)) 
          ERR_VAA_PARSING_EMITTER_ADDRESS))
        (cursor-sequence (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-64 (get next cursor-emitter-address)) 
          ERR_VAA_PARSING_SEQUENCE))
        (cursor-consistency-level (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-sequence)) 
          ERR_VAA_PARSING_CONSISTENCY_LEVEL))
        (cursor-payload (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-8192-max (get next cursor-consistency-level) none)
          ERR_VAA_PARSING_PAYLOAD))
        (public-keys-results (fold batch-recover-public-keys
          (get value cursor-signatures)
          {
              message-hash: vaa-body-hash,
              value: (list)
          })))
    (asserts! (is-eq (get pos (get next cursor-payload)) (len vaa-bytes)) ERR_GSU_CHECK_OVERLAY)
    (print { payload: (get value cursor-payload) })
    (ok { 
        vaa: {
          version: (get value cursor-version), 
          guardian-set-id: (get value cursor-guardian-set-id),
          signatures-len: (get value cursor-signatures-len),
          signatures: (get value cursor-signatures),
          timestamp: (get value cursor-timestamp),
          nonce: (get value cursor-nonce),
          emitter-chain: (get value cursor-emitter-chain),
          emitter-address: (get value cursor-emitter-address),
          sequence: (get value cursor-sequence),
          consistency-level: (get value cursor-consistency-level),
          payload: (get value cursor-payload),
        },
        recovered-public-keys: (get value public-keys-results),
        vaa-body-hash: vaa-body-hash,
    })))

;; @desc Parse and check the validity of a Verified Action Approval (VAA)
;; @param vaa-bytes: 
(define-read-only (parse-and-verify-vaa (vaa-bytes (buff 8192)))
    (let (
        (message (try! (parse-vaa vaa-bytes)))
        (guardian-set-id (get guardian-set-id (get vaa message)))
      )
      ;; Ensure that the guardian-set-id is the active one or unexpired previous one
      (asserts! (try! (is-valid-guardian-set guardian-set-id)) ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY)
    (let ((active-guardians (unwrap! (contract-call? .wormhole-core-state-v1 guardian-sets-get guardian-set-id) ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY))
          (signatures-from-active-guardians (fold batch-check-active-public-keys (get recovered-public-keys message)
            {
                active-guardians: active-guardians,
                result: (list)
            })))
      ;; Ensure that version is supported (v1 only)
      (asserts! (is-eq (get version (get vaa message)) u1) 
        ERR_VAA_CHECKS_VERSION_UNSUPPORTED)
      ;; Ensure that the count of valid signatures is >= 13
      (asserts! (>= (len (get result signatures-from-active-guardians)) (get-quorum (len active-guardians)))
        ERR_VAA_CHECKS_THRESHOLD_SIGNATURE)
      ;; Good to go!
      (ok {
        vaa: (get vaa message),
        vaa-body-hash: (get vaa-body-hash message)
      }))))

;; @desc Update the active set of guardians 
;; @param guardian-set-vaa: VAA embedding the Guardian Set Update information
;; @param uncompressed-public-keys: uncompressed public keys, used for recomputing
;; the addresses embedded in the VAA. `secp256k1-verify` returns a compressed 
;; public key, and uncompressing the key in clarity would be inefficient and expensive. 
(define-public (guardian-set-upgrade (guardian-set-vaa (buff 2048)) (uncompressed-public-keys (list 19 (buff 64))))
  (let ((message (if (var-get guardian-set-initialized)
          (try! (parse-and-verify-vaa guardian-set-vaa))
          (try! (parse-vaa guardian-set-vaa))))
        (vaa (get vaa message))
        (vaa-body-hash (get vaa-body-hash message))
        (cursor-guardians-data (try! (parse-and-verify-guardians-set (get payload vaa))))
        (set-id (get new-index cursor-guardians-data))
        (eth-addresses (get guardians-eth-addresses cursor-guardians-data))
        (consolidated-public-keys (fold check-and-consolidate-public-keys 
          uncompressed-public-keys 
          { cursor: u0, eth-addresses: eth-addresses, result: (list) }))
        (result (get result consolidated-public-keys))
        )
    ;; Ensure that enough uncompressed-public-keys were provided
    (try! (fold is-valid-guardian-entry result (ok true)))
    (asserts! (is-eq (len uncompressed-public-keys) (len eth-addresses)) 
      ERR_GSU_UNCOMPRESSED_PUBLIC_KEYS)
    ;; Check emitting address
    (asserts! (is-eq (get emitter-address vaa) GOV_EMITTING_ADDRESS) ERR_GOV_CHECK_EMITTER)
    ;; Check emitting chain
    (asserts! (is-eq (get emitter-chain vaa) GOV_EMITTING_CHAIN) ERR_GOV_CHECK_EMITTER)
    ;; ensure guardian set has atleast one member
    (asserts! (>= (len result) u1) ERR_EMPTY_GUARDIAN_SET)
    ;; Skip this check to minimize state growth
    ;; We already check that `setId` is incrementing, and that is sufficient to prevent replay
    ;;(try! (contract-call? .wormhole-core-state-v1 consume-governance-vaa (get vaa-body-hash message)))
    ;; Update storage
    (try! (contract-call? .wormhole-core-state-v1 guardian-sets-set set-id result))
    (try! (set-new-guardian-set-id set-id))
    (var-set guardian-set-initialized true)
    ;; Emit Event
    (print { 
      type: "guardians-set", 
      action: "updated",
      id: set-id,
      data: { guardians-eth-addresses: eth-addresses, guardians-public-keys: uncompressed-public-keys }})
    (ok {
      vaa: vaa,
      result: { 
        guardians-eth-addresses: eth-addresses, 
        guardians-public-keys: uncompressed-public-keys 
      }
    })))

(define-read-only (get-active-guardian-set) 
  (let ((set-id (var-get active-guardian-set-id))
        (guardians (unwrap-panic (contract-call? .wormhole-core-state-v1 guardian-sets-get set-id))))
      (ok {
        set-id: set-id,
        guardians: guardians
      })))

;; Get this contrac's principla
(define-read-only (get-contract-principal)
  (as-contract tx-sender))

;; @desc Post message for Guardians to observe and package in to VAA
;; @param payload: Raw data to send, specific to the contract sending the message
;; @param nonce: 32-bit nonce set by emitter
;; @param consistency-level-opt: Optional, use custom level instead of default
(define-public (post-message (payload (buff 8192)) (nonce uint) (consistency-level-opt (optional uint)))
  (let ((emitter contract-caller)
        (consistency-level (default-to DEFAULT_CONSISTENCY_LEVEL consistency-level-opt))
        (fee (var-get post-message-fee)))
    ;; `consistency-level` must fit into `u8` type
    (asserts! (<= consistency-level MAX_VALUE_U8) ERR_POST_OVERFLOW_CONSISTENCY_LEVEL)
    ;; `nonce` must fit into `u32` type
    (asserts! (<= nonce MAX_VALUE_U32) ERR_POST_OVERFLOW_NONCE)
    ;; If a fee has been set, collect it
    (if (> fee u0)
      (try! (stx-transfer? fee tx-sender (get-contract-principal)))
      true
    )
    
    (let ((sequence-unchecked (try! (contract-call? .wormhole-core-state-v1 consume-emitter-sequence emitter)))
          ;; `sequence` must fit into `u64` type, otherwise saturate
          (sequence (if (<= sequence-unchecked MAX_VALUE_U64) sequence-unchecked MAX_VALUE_U64))
          (message {
            emitter: emitter,
            nonce: nonce,
            sequence: sequence,
            consistency-level: consistency-level,
            payload: payload
          }))
      ;; Message has passed checks, and we got a sequence number, so emit to watchers
      (print message)
      (ok message))))

;; @desc Set message fee for `post-message` using VAA
;;       Returns `ok(fee)` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (set-message-fee (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-set-message-fee vaa-bytes)))
        (vaa (get vaa message))
        (fee (get fee (get payload vaa))))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state-v1 consume-governance-vaa (get vaa-body-hash message)))

    ;; Commit state
    (var-set post-message-fee fee)

    ;; TODO: Emit event
    (ok fee)))

;; @desc Parse and validate VAA for updating `post-message` fee
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-set-message-fee (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address
    (asserts! (is-eq (get emitter-address vaa) GOV_EMITTING_ADDRESS) ERR_GOV_CHECK_EMITTER)
    ;; Check emitting chain
    (asserts! (is-eq (get emitter-chain vaa) GOV_EMITTING_CHAIN) ERR_GOV_CHECK_EMITTER)

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa { payload: (try! (parse-and-verify-set-message-fee-payload (get payload vaa))) }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Parse and validate VAA payload for `set-message-fee`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for VAA `payload`:
;;   [32]byte    module     Should be "Core"
;;   u8          action     Should be `3` for this message type
;;   u16         chain      Chain this action is intended for
;;   u256        fee        New fee to emit message (in uSTX)
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-read-only (parse-and-verify-set-message-fee-payload (vaa-payload (buff 8192)))
  (let ((cursor-module (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-32 { bytes: vaa-payload, pos: u0 })
          ERR_SMF_PARSING_MODULE))
        (cursor-action (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-module))
          ERR_SMF_PARSING_ACTION))
        (cursor-chain (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-16 (get next cursor-action))
          ERR_SMF_PARSING_CHAIN))
        (cursor-fee-first-128-bits (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-128 (get next cursor-chain))
          ERR_SMF_PARSING_FEE_1))
        (cursor-fee-second-128-bits (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-128 (get next cursor-fee-first-128-bits))
          ERR_SMF_PARSING_FEE_2))
        (module (get value cursor-module))
        (action (get value cursor-action))
        (chain (get value cursor-chain))
        (fee (get value cursor-fee-second-128-bits)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    (asserts! (is-eq (get pos (get next cursor-fee-second-128-bits)) (len vaa-payload))
      ERR_SMF_CHECK_OVERLAY)
    ;; Check fee fits into `u128`, because that's the max value clarity can represent
    (asserts! (is-eq (get value cursor-fee-first-128-bits) u0)
      ERR_SMF_CHECK_FEE)
    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq module CORE_STRING_MODULE)
      ERR_SMF_CHECK_MODULE)
    ;; Ensure that this message is matching the adequate action
    (asserts! (is-eq action GOV_ACTION_SET_MESSAGE_FEE)
      ERR_SMF_CHECK_ACTION)
    ;; Ensure that this message is addressed to this chain
    (asserts! (is-eq (get value cursor-chain) (buff-to-uint-be EXPECTED_CHAIN_ID))
      ERR_SMF_CHECK_CHAIN)

    ;; -- Checks Passed, Return Parsed Payload ---
    (ok {
      module: module,
      action: action,
      chain: chain,
      fee: fee,
    })))

;; @desc Transfer message fees accumulated from `post-message` using VAA
;;       Returns `ok({amount, recipient})` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (transfer-fees (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-transfer-fees vaa-bytes)))
        (vaa (get vaa message))
        (payload (get payload vaa))
        (amount (get amount payload))
        (recipient (get recipient payload)))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state-v1 consume-governance-vaa (get vaa-body-hash message)))

    ;; Execute action
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))

    ;; TODO: Emit event
    (ok {
      recipient: recipient,
      amount: amount
    })))

;; @desc Parse and validate VAA for transferring `post-message` fees
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-transfer-fees (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address
    (asserts! (is-eq (get emitter-address vaa) GOV_EMITTING_ADDRESS) ERR_GOV_CHECK_EMITTER)
    ;; Check emitting chain
    (asserts! (is-eq (get emitter-chain vaa) GOV_EMITTING_CHAIN) ERR_GOV_CHECK_EMITTER)

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa { payload: (try! (parse-and-verify-transfer-fees-payload (get payload vaa))) }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Parse and validate VAA payload for `transfer-fees`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for VAA `payload`:
;;   [32]byte    module     Should be "Core"
;;   u8          action     Should be `4` for this message type
;;   u16         chain      Chain this action is intended for
;;   u256        amount     Amount to send from collected message fees
;;   ???         recipient  Recipient of message fees
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-read-only (parse-and-verify-transfer-fees-payload (vaa-payload (buff 8192)))
  (let ((cursor-module (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-32 { bytes: vaa-payload, pos: u0 })
          ERR_TXF_PARSING_MODULE))
        (cursor-action (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-module))
          ERR_TXF_PARSING_ACTION))
        (cursor-chain (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-16 (get next cursor-action))
          ERR_TXF_PARSING_CHAIN))
        (cursor-amount-first-128-bits (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-128 (get next cursor-chain))
          ERR_TXF_PARSING_AMOUNT_1))
        (cursor-amount-second-128-bits (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-128 (get next cursor-amount-first-128-bits))
          ERR_TXF_PARSING_AMOUNT_2))
        (recipient-slice (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 slice (get next cursor-amount-second-128-bits) none))
        (module (get value cursor-module))
        (action (get value cursor-action))
        (chain (get value cursor-chain))
        (amount (get value cursor-amount-second-128-bits))
        (recipient (unwrap! (from-consensus-buff? principal recipient-slice)
          ERR_TXF_PARSING_RECIPIENT)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    ;;(asserts! (is-eq (get pos (get next cursor-amount-second-128-bits)) (len vaa-payload))
    ;;  ERR_TXF_CHECK_OVERLAY)
    ;; Check amount fits into `u128`, because that's the max value clarity can represent
    (asserts! (is-eq (get value cursor-amount-first-128-bits) u0)
      ERR_TXF_CHECK_AMOUNT)
    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq module CORE_STRING_MODULE)
      ERR_TXF_CHECK_MODULE)
    ;; Ensure that this message is matching the adequate action
    (asserts! (is-eq action GOV_ACTION_TRANSFER_FEES)
      ERR_TXF_CHECK_ACTION)
    ;; Ensure that this message is addressed to this chain
    (asserts! (is-eq (get value cursor-chain) (buff-to-uint-be EXPECTED_CHAIN_ID))
      ERR_TXF_CHECK_CHAIN)

    ;; -- Checks Passed, Return Parsed Payload ---
    (ok {
      module: module,
      action: action,
      chain: chain,
      amount: amount,
      recipient: recipient,
    })))

;; @desc Upgrade wormhole-core contract to new deployment
;;       Returns `ok(contract)` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (contract-upgrade (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-contract-upgrade vaa-bytes)))
        (vaa (get vaa message))
        (payload (get payload vaa))
        (contract (get contract payload)))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state-v1 consume-governance-vaa (get vaa-body-hash message)))

    ;; Execute action
    ;; TODO

    ;; TODO: Emit event
    (ok contract)))

;; @desc Parse and validate VAA for updating `wormhole-core` contract
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-contract-upgrade (vaa-bytes (buff 8192)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address
    (asserts! (is-eq (get emitter-address vaa) GOV_EMITTING_ADDRESS) ERR_GOV_CHECK_EMITTER)
    ;; Check emitting chain
    (asserts! (is-eq (get emitter-chain vaa) GOV_EMITTING_CHAIN) ERR_GOV_CHECK_EMITTER)

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa { payload: (try! (parse-and-verify-contract-upgrade-payload (get payload vaa))) }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Parse and validate VAA payload for `contract-upgrade`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for VAA `payload`:
;;   [32]byte    module     Should be "Core"
;;   u8          action     Should be `1` for this message type
;;   u16         chain      Chain this action is intended for
;;   ???         recipient  Recipient of message fees
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-read-only (parse-and-verify-contract-upgrade-payload (vaa-payload (buff 8192)))
  (let ((cursor-module (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-32 { bytes: vaa-payload, pos: u0 })
          ERR_UPG_PARSING_MODULE))
        (cursor-action (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-module))
          ERR_UPG_PARSING_ACTION))
        (cursor-chain (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-16 (get next cursor-action))
          ERR_UPG_PARSING_CHAIN))
        (contract-slice (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 slice (get next cursor-chain) none))
        (module (get value cursor-module))
        (action (get value cursor-action))
        (chain (get value cursor-chain))
        (contract (unwrap! (from-consensus-buff? principal contract-slice)
          ERR_UPG_PARSING_CONTRACT)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    ;;(asserts! (is-eq (get pos (get next cursor-amount-second-128-bits)) (len vaa-payload))
    ;;  ERR_TXF_CHECK_OVERLAY)
    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq module CORE_STRING_MODULE)
      ERR_UPG_CHECK_MODULE)
    ;; Ensure that this message is matching the adequate action
    (asserts! (is-eq action GOV_ACTION_CONTRACT_UPGRADE)
      ERR_UPG_CHECK_ACTION)
    ;; Ensure that this message is addressed to this chain
    (asserts! (is-eq (get value cursor-chain) (buff-to-uint-be EXPECTED_CHAIN_ID))
      ERR_UPG_CHECK_CHAIN)

    ;; -- Checks Passed, Return Parsed Payload ---
    (ok {
      module: module,
      action: action,
      chain: chain,
      contract: contract,
    })))

;;;; Private functions

;; @desc Foldable function admitting an uncompressed 64 bytes public key as an input, producing a record { uncompressed-public-key, compressed-public-key }
(define-private (check-and-consolidate-public-keys 
      (uncompressed-public-key (buff 64)) 
      (acc { 
        cursor: uint, 
        eth-addresses: (list 19 (buff 20)), 
        result: (list 19 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64)})
      }))
  (let ((eth-address (unwrap-panic (element-at? (get eth-addresses acc) (get cursor acc))))
        (compressed-public-key (compress-public-key uncompressed-public-key))
        (entry (if (is-eth-address-matching-public-key uncompressed-public-key eth-address)
            { compressed-public-key: compressed-public-key, uncompressed-public-key: uncompressed-public-key }
            { compressed-public-key: 0x, uncompressed-public-key: 0x })))
    {
      cursor: (+ u1 (get cursor acc)),
      eth-addresses: (get eth-addresses acc),
      result: (unwrap-panic (as-max-len? (append (get result acc) entry) u19)),
    }))

;; @desc Foldable function admitting an guardian input and their signature as an input, producing a record { recovered-compressed-public-key }
(define-private (batch-recover-public-keys 
      (entry { guardian-id: uint, signature: (buff 65) }) 
      (acc { message-hash: (buff 32), value: (list 19 { recovered-compressed-public-key: (buff 33), guardian-id: uint }) }))
  (let ((recovered-compressed-public-key (secp256k1-recover? (get message-hash acc) (get signature entry)))
        (updated-public-keys (match recovered-compressed-public-key 
            public-key (append (get value acc) { recovered-compressed-public-key: public-key, guardian-id: (get guardian-id entry) } )
            error (get value acc))))
    { 
      message-hash: (get message-hash acc), 
      value: (unwrap-panic (as-max-len? updated-public-keys u19)) 
    }))

;; @desc Foldable function evaluating signatures from a list of { guardian-id: u8, signature: (buff 65) }, returning a list of recovered public-keys
(define-private (batch-check-active-public-keys 
      (entry { recovered-compressed-public-key: (buff 33), guardian-id: uint }) 
      (acc { 
        active-guardians: (list 19 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) }), 
        result: (list 19 (buff 33))
      }))
   (let ((compressed-public-key (get compressed-public-key (unwrap-panic (element-at? (get active-guardians acc) (get guardian-id entry))))))
     (if (and 
            (is-eq (get recovered-compressed-public-key entry) compressed-public-key)
            (is-none (index-of? (get result acc) (get recovered-compressed-public-key entry))))
          { 
            result: (unwrap-panic (as-max-len? (append (get result acc) (get recovered-compressed-public-key entry)) u19)), 
            active-guardians: (get active-guardians acc)
          }
          acc)))

;; @desc Foldable function parsing a sequence of bytes into a list of { guardian-id: u8, signature: (buff 65) } 
(define-private (batch-read-signatures 
      (entry uint) 
      (acc { next: { bytes: (buff 8192), pos: uint }, iter: uint, value: (list 19 { guardian-id: uint, signature: (buff 65) })}))
  (if (is-eq (get iter acc) u0)
    { iter: u0, next: (get next acc), value: (get value acc) }
    (let ((cursor-guardian-id (unwrap-panic (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next acc))))
          (cursor-signature (unwrap-panic (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-65 (get next cursor-guardian-id)))))
      { 
        iter: (- (get iter acc) u1), 
        next: (get next cursor-signature), 
        value: 
          (unwrap-panic (as-max-len? (append (get value acc) { guardian-id: (get value cursor-guardian-id), signature: (get value cursor-signature) }) u19))
      })))

;; @desc Convert an uncompressed public key (64 bytes) into a compressed public key (33 bytes)
(define-private (compress-public-key (uncompressed-public-key (buff 64)))
  (if (is-eq 0x uncompressed-public-key) 
    0x 
    (let ((x-coordinate (unwrap-panic (slice? uncompressed-public-key u0 u32)))
          (y-coordinate-parity (buff-to-uint-be (unwrap-panic (element-at? uncompressed-public-key u63)))))
      (unwrap-panic (as-max-len? (concat (if (is-eq (mod y-coordinate-parity u2) u0) 0x02 0x03) x-coordinate) u33)))))

(define-private (is-eth-address-matching-public-key (uncompressed-public-key (buff 64)) (eth-address (buff 20)))
  (is-eq (unwrap-panic (slice? (keccak256 uncompressed-public-key) u12 u32)) eth-address))

(define-private (parse-guardian (cue-position uint) (acc { bytes: (buff 8192), result: (list 19 (buff 20))}))
  (let (
    (cursor-address-bytes (unwrap-panic (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-20 { bytes: (get bytes acc), pos: cue-position })))
  )
  (if (is-none (index-of? (get result acc) (get value cursor-address-bytes)))
    {
      bytes: (get bytes acc),
      result: (unwrap-panic (as-max-len? (append (get result acc) (get value cursor-address-bytes)) u19))
    }
    acc
  )))

;; @desc Parse and verify payload's VAA  
(define-private (parse-and-verify-guardians-set (bytes (buff 8192)))
  (let 
      ((cursor-module (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-32 { bytes: bytes, pos: u0 }) 
          ERR_GSU_PARSING_MODULE))
      (cursor-action (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-module)) 
          ERR_GSU_PARSING_ACTION))
      (cursor-chain (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-16 (get next cursor-action)) 
          ERR_GSU_PARSING_CHAIN))
      (cursor-new-index (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-32 (get next cursor-chain)) 
          ERR_GSU_PARSING_INDEX))
      (cursor-guardians-count (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-uint-8 (get next cursor-new-index)) 
          ERR_GSU_PARSING_GUARDIAN_LEN))
      (guardians-bytes (unwrap! (contract-call? 'SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2 read-buff-8192-max (get next cursor-guardians-count) (some (* (get value cursor-guardians-count) GUARDIAN_ETH_ADDRESS_SIZE))) 
          ERR_GSU_PARSING_GUARDIANS_BYTES))
      (guardians-cues (get result (fold is-guardian-cue (get value guardians-bytes) { cursor: u0, result: (list) })))
      (eth-addresses (get result (fold parse-guardian guardians-cues { bytes: (get value guardians-bytes), result: (list) }))))
    (asserts! (is-eq (get pos (get next guardians-bytes)) (len bytes)) ERR_GSU_CHECK_OVERLAY)
    ;; Ensure there are no duplicated addresses
    (asserts! (is-eq (len eth-addresses) (get value cursor-guardians-count)) ERR_DUPLICATED_GUARDIAN_ADDRESSES)
    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq (get value cursor-module) CORE_STRING_MODULE) 
      ERR_GSU_CHECK_MODULE)
    ;; Ensure that this message is matching the adequate action
    (asserts! (is-eq (get value cursor-action) GOV_ACTION_GUARDIAN_SET_UPDATE)
      ERR_GSU_CHECK_ACTION)
    ;; Ensure that this message is matching the expected chain
    (asserts! (or (is-eq (get value cursor-chain) (buff-to-uint-be EXPECTED_CHAIN_ID)) (is-eq (get value cursor-chain) GOV_BROADCAST_CHAIN_ID) ) ERR_GSU_CHECK_CHAIN)
    (if (var-get guardian-set-initialized)
      ;; Ensure that next index = current index + 1
      (asserts! (is-eq (get value cursor-new-index) (+ u1 (var-get active-guardian-set-id))) ERR_GSU_CHECK_INDEX)
      ;; Ensure that next index > current index
      (asserts! (> (get value cursor-new-index) (var-get active-guardian-set-id)) ERR_GSU_CHECK_INDEX)
    )
    
    ;; Good to go!
    (ok {
        guardians-eth-addresses: eth-addresses,
        module: (get value cursor-module),
        action: (get value cursor-action),
        chain: (get value cursor-chain),
        new-index: (get value cursor-new-index)
      })))

(define-private (get-quorum (guardian-set-size uint))
  (+ (/ (* guardian-set-size u2) u3) u1))

(define-private (is-guardian-cue (byte (buff 1)) (acc { cursor: uint, result: (list 19 uint) }))
  (if (is-eq u0 (mod (get cursor acc) GUARDIAN_ETH_ADDRESS_SIZE))
    { 
      cursor: (+ u1 (get cursor acc)), 
      result: (unwrap-panic (as-max-len? (append (get result acc) (get cursor acc)) u19)),
    }
    {
      cursor: (+ u1 (get cursor acc)), 
      result: (get result acc),
    }))

(define-private (is-valid-guardian-entry (entry { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64)}) (prev-res (response bool uint)))
  (begin 
    (try! prev-res)
    (let (
      (compressed (get compressed-public-key entry))
      (uncompressed (get uncompressed-public-key entry)))
      (if (or (is-eq 0x compressed) (is-eq 0x uncompressed))
        ERR_GSU_PARSING_GUARDIAN_LEN
        (ok true)
      )
    )
  )
)

(define-private (set-new-guardian-set-id (new-set-id uint))
  (if (var-get guardian-set-initialized)
    (let (
        (latest-stacks-timestamp (unwrap! (get-stacks-block-info? time (- stacks-block-height u1)) ERR_STACKS_TIMESTAMP))
        (previous-set-expires-at (+ TWENTY_FOUR_HOURS latest-stacks-timestamp))
      )
      (var-set previous-guardian-set {
          set-id: (var-get active-guardian-set-id),
          expires-at: previous-set-expires-at
        })
      (var-set active-guardian-set-id new-set-id)
      (ok true)
    )
    (begin (var-set active-guardian-set-id new-set-id) (ok true))
  )
)

(define-private (is-valid-guardian-set (set-id uint))
  (if (is-eq (var-get active-guardian-set-id) set-id)
    (ok true)
    (let (
      (prev-guardian-set (var-get previous-guardian-set))
      (prev-guardian-set-id (get set-id prev-guardian-set))
      (prev-guardian-set-expires-at (get expires-at prev-guardian-set))
      (latest-stacks-timestamp (unwrap! (get-stacks-block-info? time (- stacks-block-height u1)) ERR_STACKS_TIMESTAMP))
    ) (ok (and (is-eq prev-guardian-set-id set-id) (>= prev-guardian-set-expires-at latest-stacks-timestamp))))
  )
)

;; @desc Set which `wormhole-core` contract is allowed to use the state contract
(define-private (set-state-contract-owner (core-contract principal))
  (contract-call? .wormhole-core-state-v1 set-active-wormhole-core-contract core-contract)
)