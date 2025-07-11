;; Title: wormhole-core
;; Version: v4
;; Check for latest version: https://github.com/hirosystems/stacks-wormhole-core#latest-version
;; Report an issue: https://github.com/hirosystems/stacks-wormhole-core/issues

;; Contracts using the Wormhole protocol can interact directly with this contract, but it
;; is recommended instead to interact with it via proxy (`wormhole-core-proxy`)
;; Using the proxy allows you to use the latest version of `wormhole-core` without updating your contract code

;;;; Contract Principals

;; WARNING: THESE MAY NEED TO BE CHANGED WHEN UPDATING THE CORE CONTRACT!

;; The contract that is allowed to act as a proxy and specify `emitter` to `post-message`
;; This can be a constant because it will not change as long as the contract is active
(define-constant PRINCIPAL_PROXY_CONTRACT .wormhole-core-proxy-v2)

;;;; Traits

;; Implements trait specified in wormhole-core-trait contract
(impl-trait .wormhole-trait-core-v2.core-trait)
(impl-trait .wormhole-trait-governance-v1.governance-trait)
(impl-trait .wormhole-trait-export-v1.export-trait)

;; Export trait used previous contract that we are importing from
;; May not match the version of `export-trait` this contract implements
(use-trait previous-export-trait .wormhole-trait-export-v1.export-trait)

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

;; Unknown `version` number
(define-constant ERR_VAA_CHECKS_VERSION_UNSUPPORTED (err u1101))
;; Number of valid signatures insufficient (min: 2/3 * num_guardians + 1)
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

;; Wormhole Governance: error parsing `module`
(define-constant ERR_GOV_PARSING_MODULE (err u1501))
;; Wormhole Governance: error parsing `action`
(define-constant ERR_GOV_PARSING_ACTION (err u1502))
;; Wormhole Governance: error parsing `chain`
(define-constant ERR_GOV_PARSING_CHAIN (err u1503))
;; Wormhole Governance: error parsing governance VAA payload
(define-constant ERR_GOV_PARSING_PAYLOAD (err u1504))
;; Wormhole Governance: `module` is not expected value
(define-constant ERR_GOV_CHECK_MODULE (err u1505))
;; Wormhole Governance: `action` is not expected value for this message type
(define-constant ERR_GOV_CHECK_ACTION (err u1506))
;; Wormhole Governance: `chain` does not match this blockchain
(define-constant ERR_GOV_CHECK_CHAIN (err u1507))
;; Wormhole Governance: Message not from authorized chain/emitter
(define-constant ERR_GOV_CHECK_EMITTER (err u1508))
;; Wormhole Governance: Tried to use more than max number of guardians allowed
(define-constant ERR_GOV_MAX_GUARDIANS_EXCEEDED (err u1509))

;; Set Message Fee: error parsing first 128 bits of `fee`
(define-constant ERR_SMF_PARSING_FEE_1 (err u1601))
;; Set Message Fee: error parsing second 128 bits of `fee`
(define-constant ERR_SMF_PARSING_FEE_2 (err u1602))
;; Set Message Fee: overlay present in vaa bytes
(define-constant ERR_SMF_CHECK_OVERLAY (err u1603))
;; Set Message Fee: `fee` value too high
(define-constant ERR_SMF_CHECK_FEE (err u1604))

;; Transfer Fees: error parsing first 128 bits of `fee`
(define-constant ERR_TXF_PARSING_AMOUNT_1 (err u1701))
;; Transfer Fees: error parsing second 128 bits of `fee`
(define-constant ERR_TXF_PARSING_AMOUNT_2 (err u1702))
;; Transfer Fees: error parsing `recipient`
(define-constant ERR_TXF_PARSING_RECIPIENT (err u1703))
;; Transfer Fees: overlay present in vaa bytes
(define-constant ERR_TXF_CHECK_OVERLAY (err u1704))
;; Transfer Fees: `amount` value too high
(define-constant ERR_TXF_CHECK_AMOUNT (err u1705))
;; Transfer Fees: `recipient` hash is not registered with state contract
(define-constant ERR_TXF_LOOKUP_RECIPIENT_ADDRESS (err u1706))
;; Transfer Fees: `recipient` is not a valid address on this network
(define-constant ERR_TXF_CHECK_RECIPIENT_ADDRESS (err u1707))

;; Contract Upgrade: error parsing `contract`
(define-constant ERR_UPG_PARSING_CONTRACT (err u1801))
;; Contract Upgrade: overlay present in vaa bytes
(define-constant ERR_UPG_CHECK_OVERLAY (err u1802))
;; Contract Upgrade: `contract` is not valid contract address on this network
(define-constant ERR_UPG_CHECK_CONTRACT_ADDRESS (err u1803))
;; Contract Upgrade: Unauthorized successor contract
(define-constant ERR_UPG_UNAUTHORIZED (err u1804))
;; Contract Upgrade: Previous contract invalid
(define-constant ERR_UPG_PREV_CONTRACT_INVALID (err u1805))
;; Contract Upgrade: No upgrade in progress
(define-constant ERR_UPG_NOT_IN_PROGRESS (err u1806))

;; Deployment State: This deployment is not the active core contract
(define-constant ERR_DEPLOYMENT_STATE_NOT_ACTIVE (err u1901))
;; Deployment State: Tried to initialize new contract more than once
(define-constant ERR_DEPLOYMENT_STATE_ALREADY_INITIALIZED (err u1902))

;; Proxy: Call not from allowed proxy contract
(define-constant ERR_PROXY_UNAUTHORIZED (err u2001))

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
;; Wormhole Governance: TransferFees action
(define-constant GOV_ACTION_TRANSFER_FEES u4)
;; Wormhole Governance: Maximum number of Wormhole Guardians possible
(define-constant GOV_MAX_GUARDIANS u30)
;; Stacks chain ID in Wormhole protocol
(define-constant WORMHOLE_STACKS_CHAIN_ID (if is-in-mainnet 0xea86 0xc377))
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
;; List of `u0` with length of GOV_MAX_GUARDIANS
(define-constant EMPTY_LIST_MAX_GUARDIANS (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0))
(asserts! (is-eq (len EMPTY_LIST_MAX_GUARDIANS) GOV_MAX_GUARDIANS) ERR_GOV_MAX_GUARDIANS_EXCEEDED)
;; Empty 16-byte buffer
(define-constant EMPTY_BUFFER_16 0x00000000000000000000000000000000)

;;;; Data vars

;; `deployment-state` can have one of the following values:
(define-constant DEPLOYMENT_STATE_UNITIALIZED u0) ;; This deployment has not been initialized and is not ready for use
(define-constant DEPLOYMENT_STATE_ACTIVE      u1) ;; This deployment has been initialized and is the active wormhole core contract
(define-constant DEPLOYMENT_STATE_DEPRECATED  u2) ;; This deployment has been upgraded and is no longer active
;; The state of this particular deployment of the core contract
(define-data-var deployment-state uint DEPLOYMENT_STATE_UNITIALIZED)
;; If we have recieved a ContractUpgrade VAA, this is the contract we are upgrading to
;; We receive the hash of the address in the VAA. Store it this way so we don't have to register the sucessor contract manually with `get-wormhole-address`
(define-data-var successor-contract (optional { wormhole-address: (buff 32), set-at-burn-block: uint }) none)

;; ----- DATA VARS BELOW THIS LINE MUST BE EXPORTED IN `get-exported-vars`! -----

;; Guardian Set Update uncompressed public keys invalid
(define-data-var guardian-set-initialized bool false)
;; Keep track of the active guardian set-id
(define-data-var active-guardian-set-id uint u0)
;; Keep track of exiting guardian set
(define-data-var previous-guardian-set {set-id: uint, expires-at: uint} {set-id: u0, expires-at: u0})
;; Fee to post message to Wormhole guardians
(define-constant MINIMUM_MESSAGE_FEE u1)
(define-data-var message-fee uint MINIMUM_MESSAGE_FEE)

;;;; Data maps

;; WARNING: It's not a good idea to store maps in this contract!
;; There is no limit to how big they can get and this can make import/export during a ContractUpgrade operation impossible
;; Please use a separate state contract like `wormhole-core-state` for maps!

;;;; Public functions: Getters

(define-read-only (get-chain-id) WORMHOLE_STACKS_CHAIN_ID)
(define-read-only (get-successor-contract) (var-get successor-contract))
(define-read-only (get-deployment-state) (var-get deployment-state))
(define-read-only (get-message-fee) (var-get message-fee))
(define-read-only (get-governance-contract) { chain-id: GOV_EMITTING_CHAIN, address: GOV_EMITTING_ADDRESS })
;;;; Public functions

;; @desc Initialize this contract and maybe other Wormhole contracts
;;       Must be called before any other public functions (not necessary for read-only)
;;
;; @param previous-contract: If this is not the first deployment of wormhole-core, the currently active contract is required
(define-public (initialize (previous-contract (optional <previous-export-trait>)))
  (match previous-contract
    ;; Transfer state from previous contract
    contract (initialize-from-previous-contract contract)
    ;; This is the first deployment, initialize all Wormhole state
    (initialize-wormhole)))

;; @desc Returns true if this is the currently active core contract deployment (can only be one at any time)
(define-read-only (is-active-deployment)
  (is-eq (get-deployment-state) DEPLOYMENT_STATE_ACTIVE))

;; @desc Like `is-active-deployment` but returns error instead of bool
(define-read-only (check-active-deployment)
  (begin
    (asserts! (is-active-deployment) ERR_DEPLOYMENT_STATE_NOT_ACTIVE)
    (ok true)))

;; @desc Get state stored in *this* contract that can be exported during contract upgrade.
;;       THIS DOES NOT EXPORT STATE FROM `wormhole-core-state` CONTRACT!
(define-read-only (get-exported-vars) {
  guardian-set-initialized: (var-get guardian-set-initialized),
  active-guardian-set-id: (var-get active-guardian-set-id),
  previous-guardian-set: (var-get previous-guardian-set),
  message-fee: (var-get message-fee)})

;; @desc Deactivate this contract, transfer state contract ownership, and return this contract's state
;;       Can only be called by successor contract
;;
;; Steps to update `wormhole-core` contract:
;;   1. Make some changes to `wormhole-core` and deploy new contract
;;   2. Governance contract publishes VAA with address of updated `wormhole-core` contract
;;   3. Someone (anyone) calls `contract-upgrade` with the VAA
;;   4. `contract-upgrade` will validate the VAA and record the address hash of the new contract
;;   5. Someone (anyone) calls new contract's `import-state` with the old contract's address to initialize it
;;   6. New contract's `import-state` calls old contract's `export-state`, which does the following:
;;     a. Checks that `contract-caller` is the one set by the ContractUpgrade VAA
;;     b. Initialize ownership transfer of `wormhole-state-core` contract
;;     c. Sets it's internal state as "deprecated"
;;     d. Transfer all STX owned by this contract to new contract
;;     e. Returns old contract's exportable state variables
;;   7. New contract's `import-state` then does the following:
;;     a. Finalize ownership transfer of `wormhole-state-core` contract
;;     b. Initializes it's state variables to those returned by `export-state`
;;     c. Sets it's internal state to "active"
;;
;; NOTE: In future versions of this contract, `export-state` may require newer version of `export-trait` than `import-state`
(define-public (export-state)
  (let ((active (try! (check-active-deployment)))
        (contract-principal (get-contract-principal))
        (stx-balance (stx-get-balance contract-principal))
        (caller contract-caller)
        (caller-parts (unwrap! (principal-destruct? caller) ERR_UPG_CHECK_CONTRACT_ADDRESS))
        (wormhole-address (get wormhole-address (try! (contract-call? .wormhole-core-state get-wormhole-address caller))))
        (new-wormhole-address (get wormhole-address (unwrap! (get-successor-contract) ERR_UPG_UNAUTHORIZED))))
    ;; Check we have a contract principal and not a standard principal
    (asserts! (is-some (get name caller-parts)) ERR_UPG_CHECK_CONTRACT_ADDRESS)
    ;; Only the contract set by the ContractUpgrade VAA is allowed to call this function
    (asserts! (is-eq wormhole-address new-wormhole-address) ERR_UPG_UNAUTHORIZED)
    ;; Transfer ownership of state contract
    (try! (contract-call? .wormhole-core-state start-ownership-transfer caller))
    ;; If we have an STX balance, transfer to new contract
    (if (> stx-balance u0)
      (try! (as-contract (stx-transfer? stx-balance tx-sender caller)))
      true)
    (var-set deployment-state DEPLOYMENT_STATE_DEPRECATED)
    (ok (get-exported-vars))))

;; @desc Parse and check the validity of a Verified Action Approval (VAA)
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-vaa (vaa-bytes (buff 4096)))
    (let ((message (try! (parse-vaa vaa-bytes)))
          (guardian-set-id (get guardian-set-id (get vaa message))))
      ;; Ensure that the guardian-set-id is the active one or unexpired previous one
      (asserts! (try! (is-valid-guardian-set guardian-set-id)) ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY)
      (let ((active-guardians (unwrap! (contract-call? .wormhole-core-state guardian-sets-get guardian-set-id) ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY))
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
(define-public (guardian-set-upgrade (guardian-set-vaa (buff 4096)) (uncompressed-public-keys (list 30 (buff 64))))
  (let ((active (try! (check-active-deployment)))
        (message (if (var-get guardian-set-initialized)
          (try! (parse-and-verify-vaa guardian-set-vaa))
          (try! (parse-vaa guardian-set-vaa))))
        (vaa (get vaa message))
        (hash (get vaa-body-hash message))
        (cursor-guardians-data (try! (parse-and-verify-guardian-set-upgrade (get payload vaa))))
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
    ;; Check emitting address and chain
    (try! (check-emitter (get emitter-address vaa) (get emitter-chain vaa)))
    ;; ensure guardian set has atleast one member
    (asserts! (>= (len result) u1) ERR_EMPTY_GUARDIAN_SET)
    ;; Skip this check to minimize state growth
    ;; We already check that `setId` is incrementing, and that is sufficient to prevent replay
    ;;(try! (contract-call? .wormhole-core-state consume-governance-vaa hash))
    ;; Update storage
    (try! (contract-call? .wormhole-core-state guardian-sets-set set-id result))
    (try! (set-new-guardian-set-id set-id))
    (var-set guardian-set-initialized true)
    ;; Emit Event
    (print {
      event: "governance-action",
      action: "GuardianSetUpgrade",
      hash: hash,
      data: {
        id: set-id,
        guardians: {
          eth-addresses: eth-addresses,
          public-keys: uncompressed-public-keys,
        }
      }
    })
    (ok {
      vaa: vaa,
      result: {
        guardians-eth-addresses: eth-addresses,
        guardians-public-keys: uncompressed-public-keys
      }
    })))

(define-read-only (get-active-guardian-set)
  (let ((set-id (var-get active-guardian-set-id))
        (guardians (unwrap-panic (contract-call? .wormhole-core-state guardian-sets-get set-id))))
      (ok {
        set-id: set-id,
        guardians: guardians
      })))

;; @desc Post message for Wormhole Guardians from our proxy contract
;;       Allows caller to set `emitter`, so ONLY allow calls from trusted proxy contract
;;
;; @param payload: Raw data to send, specific to the contract sending the message
;; @param nonce: 32-bit nonce set by emitter
;; @param consistency-level-opt: Optional, use custom level instead of default
;; @param emitter: Principal that proxy captured using `contract-caller`
(define-public (post-message-via-proxy (payload (buff 4096)) (nonce uint) (consistency-level-opt (optional uint)) (emitter principal))
  (begin
    (asserts! (is-eq contract-caller PRINCIPAL_PROXY_CONTRACT) ERR_PROXY_UNAUTHORIZED)
    (inner-post-message payload nonce consistency-level-opt emitter)))

;; @desc Post message for Wormhole Guardians
;;
;; @param payload: Raw data to send, specific to the contract sending the message
;; @param nonce: 32-bit nonce set by emitter
;; @param consistency-level-opt: Optional, use custom level instead of default
(define-public (post-message (payload (buff 4096)) (nonce uint) (consistency-level-opt (optional uint)))
  (inner-post-message payload nonce consistency-level-opt contract-caller))

;; @desc Set message fee for `post-message` using VAA
;;       Returns `ok(fee)` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (set-message-fee (vaa-bytes (buff 4096)))
  (let ((active (try! (check-active-deployment)))
        (message (try! (parse-and-verify-set-message-fee vaa-bytes)))
        (vaa (get vaa message))
        (hash (get vaa-body-hash message))
        (gov-payload (get payload (get payload vaa)))
        (fee (get fee gov-payload)))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state consume-governance-vaa hash))

    ;; --- Commit State ---
    (var-set message-fee fee)

    ;; Emit event
    (print {
      event: "governance-action",
      action: "SetMessageFee",
      hash: hash,
      data: {
        fee: fee
      }
    })
    (ok fee)))

;; @desc Parse and validate VAA for updating `post-message` fee
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-set-message-fee (vaa-bytes (buff 4096)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address and chain
    (try! (check-emitter (get emitter-address vaa) (get emitter-chain vaa)))

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa {
        payload: (try! (parse-set-message-fee-payload (get payload vaa)))
      }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Transfer message fees accumulated from `post-message` using VAA
;;       Returns `ok({amount, recipient})` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (transfer-fees (vaa-bytes (buff 4096)))
  (let ((active (try! (check-active-deployment)))
        (message (try! (parse-and-verify-transfer-fees vaa-bytes)))
        (vaa (get vaa message))
        (hash (get vaa-body-hash message))
        (gov-payload (get payload (get payload vaa)))
        (amount (get amount gov-payload))
        (recipient (get recipient gov-payload)))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state consume-governance-vaa hash))

    ;; --- Execute Action ---
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))

    ;; Emit event
    (print {
      event: "governance-action",
      action: "TransferFees",
      hash: hash,
      data: {
        recipient: recipient,
        amount: amount
      }
    })
    (ok {
      recipient: recipient,
      amount: amount
    })))

;; @desc Parse and validate VAA for transferring `post-message` fees
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-transfer-fees (vaa-bytes (buff 4096)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address and chain
    (try! (check-emitter (get emitter-address vaa) (get emitter-chain vaa)))

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa {
        payload: (try! (parse-transfer-fees-payload (get payload vaa)))
      }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Upgrade wormhole-core contract to new deployment
;;       Returns `(ok contract)` if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-public (contract-upgrade (vaa-bytes (buff 4096)))
  (let ((active (try! (check-active-deployment)))
        (message (try! (parse-and-verify-contract-upgrade vaa-bytes)))
        (vaa (get vaa message))
        (hash (get vaa-body-hash message))
        (gov-payload (get payload (get payload vaa)))
        (contract (get contract gov-payload)))

    ;; --- Message has been validated, check if we can apply update ---
    ;; Check we are not re-processing an old message
    (try! (contract-call? .wormhole-core-state consume-governance-vaa hash))

    ;; --- Commit State ---
    ;; Save address and keep this contract active for now.
    ;; When successor contract calls this contract's `export-state` function, this contract will transfer state ownership and then deactivate
    ;; This verifies new contract actually exists before this one becomes unusable
    ;; Also keep track of when this was set
    (var-set successor-contract (some {
      wormhole-address: contract,
      set-at-burn-block: burn-block-height
    }))

    ;; Emit event
    (print {
      event: "governance-action",
      action: "ContractUpgrade",
      hash: hash,
      data: {
        contract: contract
      }
    })
    (ok contract)))

;; @desc Parse and validate VAA for updating `wormhole-core` contract
;;       Returns parsed VAA as tuple if successful
;;
;; @param vaa-bytes: VAA as raw bytes
(define-read-only (parse-and-verify-contract-upgrade (vaa-bytes (buff 4096)))
  (let ((message (try! (parse-and-verify-vaa vaa-bytes)))
        (vaa (get vaa message)))

    ;; Check emitting address and chain
    (try! (check-emitter (get emitter-address vaa) (get emitter-chain vaa)))

    ;; Replace payload raw bytes with parsed payload
    (ok {
      vaa: (merge vaa {
        payload: (try! (parse-contract-upgrade-payload (get payload vaa)))
      }),
      vaa-body-hash: (get vaa-body-hash message)
    })))

;; @desc Get or generate new "Wormhole address" for a Stacks `prrincipal` that can be used in Wormhole messages
;;       Addresses in the Wormhole protocol are limited to 32 bytes, but a Stacks `principal` can be longer than this
;;       NOTE: Charges sender a fee to generate new address
(define-public (get-wormhole-address (p principal))
  (let ((result (try! (contract-call? .wormhole-core-state get-wormhole-address p))))
    (if (get created result)
      ;; Charge fee for generating new address (to prevent state contract spamming)
      (try! (charge-message-fee))
      ;; Address already cached, no fee
      true)
    (ok result)))

;;;; Private functions

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
;; @param vaa-bytes: VAA as raw bytes
(define-private (parse-vaa (vaa-bytes (buff 4096)))
  (let ((cursor-version (unwrap! (read-uint-8 { bytes: vaa-bytes, pos: u0 })
          ERR_VAA_PARSING_VERSION))
        (cursor-guardian-set-id (unwrap! (read-uint-32 (get next cursor-version))
          ERR_VAA_PARSING_GUARDIAN_SET))
        (cursor-signatures-len (unwrap! (read-uint-8 (get next cursor-guardian-set-id))
          ERR_VAA_PARSING_SIGNATURES_LEN))
        (signatures-len (get value cursor-signatures-len))
        (check-signatures-len (asserts! (<= signatures-len GOV_MAX_GUARDIANS)
          ERR_GOV_MAX_GUARDIANS_EXCEEDED))
        (cursor-signatures (fold batch-read-signatures
          EMPTY_LIST_MAX_GUARDIANS
          {
              next: (get next cursor-signatures-len),
              value: (list),
              iter: (get value cursor-signatures-len)
          }))
        (vaa-body-hash (keccak256 (keccak256 (get value (unwrap! (read-buff-4096-max (get next cursor-signatures) none)
          ERR_VAA_HASHING_BODY)))))
        (cursor-timestamp (unwrap! (read-uint-32 (get next cursor-signatures))
          ERR_VAA_PARSING_TIMESTAMP))
        (cursor-nonce (unwrap! (read-uint-32 (get next cursor-timestamp))
          ERR_VAA_PARSING_NONCE))
        (cursor-emitter-chain (unwrap! (read-uint-16 (get next cursor-nonce))
          ERR_VAA_PARSING_EMITTER_CHAIN))
        (cursor-emitter-address (unwrap! (read-buff-32 (get next cursor-emitter-chain))
          ERR_VAA_PARSING_EMITTER_ADDRESS))
        (cursor-sequence (unwrap! (read-uint-64 (get next cursor-emitter-address))
          ERR_VAA_PARSING_SEQUENCE))
        (cursor-consistency-level (unwrap! (read-uint-8 (get next cursor-sequence))
          ERR_VAA_PARSING_CONSISTENCY_LEVEL))
        (cursor-payload (unwrap! (read-buff-4096-max (get next cursor-consistency-level) none)
          ERR_VAA_PARSING_PAYLOAD))
        (public-keys-results (fold batch-recover-public-keys
          (get value cursor-signatures)
          {
              message-hash: vaa-body-hash,
              value: (list)
          })))
    (asserts! (is-eq (get pos (get next cursor-payload)) (len vaa-bytes)) ERR_GSU_CHECK_OVERLAY)
    (ok {
        vaa: {
          version: (get value cursor-version),
          guardian-set-id: (get value cursor-guardian-set-id),
          signatures-len: signatures-len,
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

;; @desc Parse and check the header of a VAA containing a governance payload
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for VAA governance payload header:
;;   [32]byte    module     Should be "Core"
;;   u8          action     Should be `3` for this message type
;;   u16         chain      Chain this action is intended for
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-private (parse-governance-payload-header (gov-action uint) (vaa-payload (buff 4096)))
  (let ((cursor-module (unwrap! (read-buff-32 { bytes: vaa-payload, pos: u0 })
          ERR_GOV_PARSING_MODULE))
        (cursor-action (unwrap! (read-uint-8 (get next cursor-module))
          ERR_GOV_PARSING_ACTION))
        (cursor-chain (unwrap! (read-buff-2 (get next cursor-action))
          ERR_GOV_PARSING_CHAIN))
        (cursor-payload (unwrap! (read-buff-4096-max (get next cursor-chain) none)
          ERR_GOV_PARSING_PAYLOAD))
        (module (get value cursor-module))
        (action (get value cursor-action))
        (chain (get value cursor-chain)))

    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq module CORE_STRING_MODULE)
      ERR_GOV_CHECK_MODULE)
    ;; Ensure that this message is matching the expected action
    (asserts! (is-eq action gov-action)
      ERR_GOV_CHECK_ACTION)
    ;; Ensure that this message is addressed to this chain
    (asserts! (is-eq chain WORMHOLE_STACKS_CHAIN_ID)
      ERR_GOV_CHECK_CHAIN)

    ;; --- Checks Passed, Return Parsed Payload ---
    (ok {
      module: module,
      action: action,
      chain: (buff-to-uint-be chain),
      payload: (get value cursor-payload),
    })))

;; @desc Parse and check VAA payload for `set-message-fee`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for SetMessageFee payload:
;;   [35]byte    header     Governance payload header
;;   u256        fee        New fee to emit message (in uSTX)
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-private (parse-set-message-fee-payload (vaa-payload (buff 4096)))
  (let ((gov-payload (try! (parse-governance-payload-header GOV_ACTION_SET_MESSAGE_FEE vaa-payload)))
        (cursor-fee-first-128-bits (unwrap! (read-buff-16 { bytes: (get payload gov-payload), pos: u0 })
          ERR_SMF_PARSING_FEE_1))
        (cursor-fee-second-128-bits (unwrap! (read-uint-128 (get next cursor-fee-first-128-bits))
          ERR_SMF_PARSING_FEE_2))
        (fee (get value cursor-fee-second-128-bits)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    (asserts! (is-eq (get pos (get next cursor-fee-second-128-bits)) (len (get payload gov-payload)))
      ERR_SMF_CHECK_OVERLAY)
    ;; Check fee fits into `u128`, because that's the max value clarity can represent
    (asserts! (is-eq (get value cursor-fee-first-128-bits) EMPTY_BUFFER_16)
      ERR_SMF_CHECK_FEE)
    ;; Check fee isn't below minimum
    (asserts! (>= fee MINIMUM_MESSAGE_FEE)
      ERR_SMF_CHECK_FEE)

    ;; --- Checks Passed, Return Parsed Payload ---
    (ok (merge gov-payload {
      payload: {
        fee: fee
      }
    }))))

;; @desc Parse and check VAA payload for `transfer-fees`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for TransferFees payload:
;;   [35]byte   header     Governance payload header
;;   u256       amount     Amount to transfer (in uSTX)
;;   [32]byte   recipient  Hash of recipient address (MUST HAVE BEEN REGISTERED WITH `get-wormhole-address`!!)
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-private (parse-transfer-fees-payload (vaa-payload (buff 4096)))
  (let ((gov-payload (try! (parse-governance-payload-header GOV_ACTION_TRANSFER_FEES vaa-payload)))
        (cursor-amount-first-128-bits (unwrap! (read-buff-16 { bytes: (get payload gov-payload), pos: u0 })
          ERR_TXF_PARSING_AMOUNT_1))
        (cursor-amount-second-128-bits (unwrap! (read-uint-128 (get next cursor-amount-first-128-bits))
          ERR_TXF_PARSING_AMOUNT_2))
        (recipient-hash (unwrap! (read-buff-32 (get next cursor-amount-second-128-bits))
          ERR_TXF_PARSING_RECIPIENT))
        (recipient (unwrap! (contract-call? .wormhole-core-state wormhole-to-stacks-get (get value recipient-hash))
          ERR_TXF_LOOKUP_RECIPIENT_ADDRESS)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    (asserts! (is-eq (get pos (get next recipient-hash)) (len (get payload gov-payload)))
      ERR_TXF_CHECK_OVERLAY)
    ;; Check amount fits into `u128`, because that's the max value clarity can represent
    (asserts! (is-eq (get value cursor-amount-first-128-bits) EMPTY_BUFFER_16)
      ERR_TXF_CHECK_AMOUNT)
    ;; Check recipient address is valid on this network
    (asserts! (is-standard recipient)
      ERR_TXF_CHECK_RECIPIENT_ADDRESS)

    ;; --- Checks Passed, Return Parsed Payload ---
    (ok (merge gov-payload {
      payload: {
        amount: (get value cursor-amount-second-128-bits),
        recipient: recipient,
      }
    }))))

;; @desc Parse and check VAA payload for `contract-upgrade`
;;       Returns parsed payload as tuple if successful
;;
;; Expected message format for ContractUpgrade VAA payload:
;;   [35]byte      header     Governance payload header
;;   [32]byte      successor  Hash of sucessor contract principal
;;
;; @param vaa-payload: VAA `payload` as raw bytes
(define-private (parse-contract-upgrade-payload (vaa-payload (buff 4096)))
  (let ((gov-payload (try! (parse-governance-payload-header GOV_ACTION_CONTRACT_UPGRADE vaa-payload)))
        (contract (unwrap! (read-buff-32 { bytes: (get payload gov-payload), pos: u0 })
          ERR_UPG_PARSING_CONTRACT)))

    ;; --- Validate Message Data ---
    ;; Check no extra bytes in buffer
    (asserts! (is-eq (get pos (get next contract)) (len (get payload gov-payload)))
      ERR_UPG_CHECK_OVERLAY)

    ;; --- Checks Passed, Return Parsed Payload ---
    (ok (merge gov-payload {
      payload: {
        contract: (get value contract),
      }
    }))))

;; @desc Foldable function admitting an uncompressed 64 bytes public key as an input, producing a record { uncompressed-public-key, compressed-public-key }
(define-private (check-and-consolidate-public-keys
      (uncompressed-public-key (buff 64))
      (acc {
        cursor: uint,
        eth-addresses: (list 30 (buff 20)),
        result: (list 30 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64)})
      }))
  (let ((eth-address (unwrap-panic (element-at? (get eth-addresses acc) (get cursor acc))))
        (compressed-public-key (compress-public-key uncompressed-public-key))
        (entry (if (is-eth-address-matching-public-key uncompressed-public-key eth-address)
            { compressed-public-key: compressed-public-key, uncompressed-public-key: uncompressed-public-key }
            { compressed-public-key: 0x, uncompressed-public-key: 0x })))
    {
      cursor: (+ u1 (get cursor acc)),
      eth-addresses: (get eth-addresses acc),
      result: (unwrap-panic (as-max-len? (append (get result acc) entry) u30)),
    }))

;; @desc Foldable function admitting an guardian input and their signature as an input, producing a record { recovered-compressed-public-key }
(define-private (batch-recover-public-keys
      (entry { guardian-id: uint, signature: (buff 65) })
      (acc { message-hash: (buff 32), value: (list 30 { recovered-compressed-public-key: (buff 33), guardian-id: uint }) }))
  (let ((recovered-compressed-public-key (secp256k1-recover? (get message-hash acc) (get signature entry)))
        (updated-public-keys (match recovered-compressed-public-key
            public-key (append (get value acc) { recovered-compressed-public-key: public-key, guardian-id: (get guardian-id entry) } )
            error (get value acc))))
    {
      message-hash: (get message-hash acc),
      value: (unwrap-panic (as-max-len? updated-public-keys u30))
    }))

;; @desc Foldable function evaluating signatures from a list of { guardian-id: u8, signature: (buff 65) }, returning a list of recovered public-keys
(define-private (batch-check-active-public-keys
      (entry { recovered-compressed-public-key: (buff 33), guardian-id: uint })
      (acc {
        active-guardians: (list 30 { compressed-public-key: (buff 33), uncompressed-public-key: (buff 64) }),
        result: (list 30 (buff 33))
      }))
   (let ((compressed-public-key (get compressed-public-key (unwrap-panic (element-at? (get active-guardians acc) (get guardian-id entry))))))
     (if (and
            (is-eq (get recovered-compressed-public-key entry) compressed-public-key)
            (is-none (index-of? (get result acc) (get recovered-compressed-public-key entry))))
          {
            result: (unwrap-panic (as-max-len? (append (get result acc) (get recovered-compressed-public-key entry)) u30)),
            active-guardians: (get active-guardians acc)
          }
          acc)))

;; @desc Foldable function parsing a sequence of bytes into a list of { guardian-id: u8, signature: (buff 65) }
(define-private (batch-read-signatures
      (entry uint)
      (acc { next: { bytes: (buff 4096), pos: uint }, iter: uint, value: (list 30 { guardian-id: uint, signature: (buff 65) })}))
  (if (is-eq (get iter acc) u0)
    { iter: u0, next: (get next acc), value: (get value acc) }
    (let ((cursor-guardian-id (unwrap-panic (read-uint-8 (get next acc))))
          (cursor-signature (unwrap-panic (read-buff-65 (get next cursor-guardian-id)))))
      {
        iter: (- (get iter acc) u1),
        next: (get next cursor-signature),
        value:
          (unwrap-panic (as-max-len? (append (get value acc) { guardian-id: (get value cursor-guardian-id), signature: (get value cursor-signature) }) u30))
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

(define-private (parse-guardian (cue-position uint) (acc { bytes: (buff 4096), result: (list 30 (buff 20))}))
  (let (
    (cursor-address-bytes (unwrap-panic (read-buff-20 { bytes: (get bytes acc), pos: cue-position })))
  )
  (if (is-none (index-of? (get result acc) (get value cursor-address-bytes)))
    {
      bytes: (get bytes acc),
      result: (unwrap-panic (as-max-len? (append (get result acc) (get value cursor-address-bytes)) u30))
    }
    acc
  )))

;; @desc Parse and verify payload's VAA
(define-private (parse-and-verify-guardian-set-upgrade (bytes (buff 4096)))
  (let
      ((cursor-module (unwrap! (read-buff-32 { bytes: bytes, pos: u0 })
          ERR_GSU_PARSING_MODULE))
      (cursor-action (unwrap! (read-uint-8 (get next cursor-module))
          ERR_GSU_PARSING_ACTION))
      (cursor-chain (unwrap! (read-uint-16 (get next cursor-action))
          ERR_GSU_PARSING_CHAIN))
      (cursor-new-index (unwrap! (read-uint-32 (get next cursor-chain))
          ERR_GSU_PARSING_INDEX))
      (cursor-guardians-count (unwrap! (read-uint-8 (get next cursor-new-index))
          ERR_GSU_PARSING_GUARDIAN_LEN))
      (guardians-count (get value cursor-guardians-count))
      (check-guardians-count (asserts! (<= guardians-count GOV_MAX_GUARDIANS)
          ERR_GOV_MAX_GUARDIANS_EXCEEDED))
      (guardians-bytes (unwrap! (read-buff-4096-max (get next cursor-guardians-count) (some (* guardians-count GUARDIAN_ETH_ADDRESS_SIZE)))
          ERR_GSU_PARSING_GUARDIANS_BYTES))
      (guardians-cues (get result (fold is-guardian-cue (get value guardians-bytes) { cursor: u0, result: (list) })))
      (eth-addresses (get result (fold parse-guardian guardians-cues { bytes: (get value guardians-bytes), result: (list) }))))
    (asserts! (is-eq (get pos (get next guardians-bytes)) (len bytes)) ERR_GSU_CHECK_OVERLAY)
    ;; Ensure there are no duplicated addresses
    (asserts! (is-eq (len eth-addresses) guardians-count) ERR_DUPLICATED_GUARDIAN_ADDRESSES)
    ;; Ensure that this message was emitted from authorized module
    (asserts! (is-eq (get value cursor-module) CORE_STRING_MODULE)
      ERR_GSU_CHECK_MODULE)
    ;; Ensure that this message is matching the adequate action
    (asserts! (is-eq (get value cursor-action) GOV_ACTION_GUARDIAN_SET_UPDATE)
      ERR_GSU_CHECK_ACTION)
    ;; Ensure that this message is matching the expected chain
    (asserts! (or (is-eq (get value cursor-chain) (buff-to-uint-be WORMHOLE_STACKS_CHAIN_ID)) (is-eq (get value cursor-chain) GOV_BROADCAST_CHAIN_ID) ) ERR_GSU_CHECK_CHAIN)
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

(define-private (is-guardian-cue (byte (buff 1)) (acc { cursor: uint, result: (list 30 uint) }))
  (if (is-eq u0 (mod (get cursor acc) GUARDIAN_ETH_ADDRESS_SIZE))
    {
      cursor: (+ u1 (get cursor acc)),
      result: (unwrap-panic (as-max-len? (append (get result acc) (get cursor acc)) u30)),
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

;; Get this contract's principal
(define-private (get-contract-principal)
  (as-contract tx-sender))

;; @desc Initialize all Wormhole contracts (this one and the state contract)
;;       Only needs to be called once, when Wormhole contracts are first deployed
;;
;; Returns
;;  - (ok true):  State was initialized
;;  - (err ...):  Already initialized or permissions error
(define-private (initialize-wormhole)
  (begin
    (try! (contract-call? .wormhole-core-state initialize (get-contract-principal)))
    ;; This is the initial deployment of `wormhole-core`
    (var-set deployment-state DEPLOYMENT_STATE_ACTIVE)

    ;; Emit event
    (print {
      event: "initialize",
      data: {
        previous-contract: none
      }
    })

    (ok true)))

;; @desc Call previous contract's `export-state` to initialize this contract
;;
;; NOTE: This uses the previous contract's version of `export-trait`
(define-private (initialize-from-previous-contract (previous-contract <previous-export-trait>))
  (let ((active-contract (unwrap! (contract-call? .wormhole-core-state get-active-wormhole-core-contract) ERR_UPG_PREV_CONTRACT_INVALID)))
    (asserts! (is-eq (contract-of previous-contract) active-contract) ERR_UPG_PREV_CONTRACT_INVALID)
    ;; Only allow importing state once
    (asserts! (is-eq (get-deployment-state) DEPLOYMENT_STATE_UNITIALIZED) ERR_DEPLOYMENT_STATE_ALREADY_INITIALIZED)
    (let ((previous-state (try! (contract-call? previous-contract export-state))))
      ;; Finalize ownership transfer of state contract
      (try! (contract-call? .wormhole-core-state finalize-ownership-transfer))
      ;; Import state from previous contract
      (var-set guardian-set-initialized (get guardian-set-initialized previous-state))
      (var-set active-guardian-set-id (get active-guardian-set-id previous-state))
      (var-set previous-guardian-set (get previous-guardian-set previous-state))
      (var-set message-fee (get message-fee previous-state))
      ;; Activate this contract
      (var-set deployment-state DEPLOYMENT_STATE_ACTIVE)

      ;; Emit event
      (print {
        event: "initialize",
        data: {
          previous-contract: (some {
            address: previous-contract,
            state: previous-state
          })
        }
      })

      (ok true))))

;; @desc Charge sender fee set by `set-message-fee`
(define-private (charge-message-fee)
  (let ((fee (var-get message-fee)))
    ;; If a fee has been set, collect it
    (if (> fee u0)
      (try! (stx-transfer? fee tx-sender (get-contract-principal)))
      true
    )
    (ok true)))

;; @desc This function does the work for both `post-message` and `post-message-by-proxy`
;;       See those functions for further details
;;       Those functions will set and/or check `emitter`, this one assumes `emiiter` is valid
(define-private (inner-post-message (payload (buff 4096)) (nonce uint) (consistency-level-opt (optional uint)) (emitter principal))
  (let ((active (try! (check-active-deployment)))
        (consistency-level (default-to DEFAULT_CONSISTENCY_LEVEL consistency-level-opt))
        (fee (var-get message-fee)))
    ;; `consistency-level` must fit into `u8` type
    (asserts! (<= consistency-level MAX_VALUE_U8) ERR_POST_OVERFLOW_CONSISTENCY_LEVEL)
    ;; `nonce` must fit into `u32` type
    (asserts! (<= nonce MAX_VALUE_U32) ERR_POST_OVERFLOW_NONCE)
    ;; If a fee has been set, collect it
    (try! (charge-message-fee))
    (contract-call? .wormhole-core-state post-message payload nonce consistency-level emitter)))


(define-private (check-emitter (address (buff 32)) (chain uint))
  (begin
    ;; Check emitting address
    (asserts! (is-eq address GOV_EMITTING_ADDRESS) ERR_GOV_CHECK_EMITTER)
    ;; Check emitting chain
    (asserts! (is-eq chain GOV_EMITTING_CHAIN) ERR_GOV_CHECK_EMITTER)
    (ok true)))

;;;; Inlined code from `SP2J933XB2CP2JQ1A4FGN8JA968BBG3NK3EKZ7Q9F.hk-cursor-v2`

;; Inlining code avoids the overhead from `contract-call?`
;; Only include the functions that are used here

(define-private (read-buff-1 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u1)) (err u1)) u1) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u1) }
    }))

(define-private (read-buff-2 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u2)) (err u1)) u2) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u2) }
    }))

(define-private (read-buff-4 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u4)) (err u1)) u4) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u4) }
    }))

(define-private (read-buff-8 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u8)) (err u1)) u8) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u8) }
    }))

(define-private (read-buff-16 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u16)) (err u1)) u16) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u16) }
    }))

(define-private (read-buff-20 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u20)) (err u1)) u20) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u20) }
    }))

(define-private (read-buff-32 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u32)) (err u1)) u32) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u32) }
    }))

(define-private (read-buff-65 (cursor { bytes: (buff 4096), pos: uint }))
    (ok {
        value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) (get pos cursor) (+ (get pos cursor) u65)) (err u1)) u65) (err u1)),
        next: { bytes: (get bytes cursor), pos: (+ (get pos cursor) u65) }
    }))

(define-private (read-buff-4096-max (cursor { bytes: (buff 4096), pos: uint }) (size (optional uint)))
    (let ((min (get pos cursor))
          (max (match size value
            (+ value (get pos cursor))
            (len (get bytes cursor)))))
      (ok {
          value: (unwrap! (as-max-len? (unwrap! (slice? (get bytes cursor) min max) (err u1)) u4096) (err u1)),
          next: { bytes: (get bytes cursor), pos: max }
      })))

(define-private (read-uint-8 (cursor { bytes: (buff 4096), pos: uint }))
    (let ((cursor-bytes (try! (read-buff-1 cursor))))
        (ok (merge cursor-bytes { value: (buff-to-uint-be (get value cursor-bytes)) }))))

(define-private (read-uint-16 (cursor { bytes: (buff 4096), pos: uint }))
    (let ((cursor-bytes (try! (read-buff-2 cursor))))
        (ok (merge cursor-bytes { value: (buff-to-uint-be (get value cursor-bytes)) }))))

(define-private (read-uint-32 (cursor { bytes: (buff 4096), pos: uint }))
    (let ((cursor-bytes (try! (read-buff-4 cursor))))
        (ok (merge cursor-bytes { value: (buff-to-uint-be (get value cursor-bytes)) }))))

(define-private (read-uint-64 (cursor { bytes: (buff 4096), pos: uint }))
    (let ((cursor-bytes (try! (read-buff-8 cursor))))
        (ok (merge cursor-bytes { value: (buff-to-uint-be (get value cursor-bytes)) }))))

(define-private (read-uint-128 (cursor { bytes: (buff 4096), pos: uint }))
    (let ((cursor-bytes (try! (read-buff-16 cursor))))
        (ok (merge cursor-bytes { value: (buff-to-uint-be (get value cursor-bytes)) }))))

(define-private (slice (cursor { bytes: (buff 4096), pos: uint }) (size (optional uint)))
    (match (slice? (get bytes cursor)
                   (get pos cursor)
                   (match size value
                   (+ (get pos cursor) value)
                      (len (get bytes cursor))))
        bytes bytes 0x))