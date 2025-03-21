// Constants used by multiple tests

export class MaxValue {
  static readonly U8 = 255;
  static readonly U32 = 4294967295;
  // Use `BigInt` for values over `Number.MAX_SAFE_INTEGER`
  static readonly U64 = 18446744073709551615n;
  static readonly U128 = 340282366920938463463374607431768211455n;
}

// Constants from `wormhole-core` Clarity contract
export class WormholeCore {
  static readonly CONTRACT_NAME = "wormhole-core-v4";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly EXPECTED_CHAIN_ID = 0xc377; // Value for testnet/devnet/simnet
  static readonly DEFAULT_CONSISTENCY_LEVEL = 0;
  static readonly ACTION_CONTRACT_UPGRADE = 1;
  static readonly ACTION_SET_MESSAGE_FEE = 3;
  static readonly ACTION_TRANSFER_FEES = 4;

  static readonly DEPLOYMENT_STATE_UNITIALIZED = 0;
  static readonly DEPLOYMENT_STATE_ACTIVE = 1;
  static readonly DEPLOYMENT_STATE_DEPRECATED = 2;

  static readonly ERR_POST_OVERFLOW_CONSISTENCY_LEVEL = 1401;
  static readonly ERR_POST_OVERFLOW_NONCE = 1402;

  static readonly ERR_GOV_PARSING_MODULE = 1501;
  static readonly ERR_GOV_PARSING_ACTION = 1502;
  static readonly ERR_GOV_PARSING_CHAIN = 1503;
  static readonly ERR_GOV_PARSING_PAYLOAD = 1504;
  static readonly ERR_GOV_CHECK_MODULE = 1505;
  static readonly ERR_GOV_CHECK_ACTION = 1506;
  static readonly ERR_GOV_CHECK_CHAIN = 1507;
  static readonly ERR_GOV_CHECK_EMITTER = 1508;

  static readonly ERR_SMF_PARSING_FEE_1 = 1601;
  static readonly ERR_SMF_PARSING_FEE_2 = 1602;
  static readonly ERR_SMF_CHECK_OVERLAY = 1603;
  static readonly ERR_SMF_CHECK_FEE = 1604;

  static readonly ERR_TXF_PARSING_AMOUNT_1 = 1701;
  static readonly ERR_TXF_PARSING_AMOUNT_2 = 1702;
  static readonly ERR_TXF_PARSING_RECIPIENT = 1703;
  static readonly ERR_TXF_CHECK_OVERLAY = 1704;
  static readonly ERR_TXF_CHECK_AMOUNT = 1705;
  static readonly ERR_TXF_CHECK_RECIPIENT_ADDRESS = 1706;

  static readonly ERR_UPG_PARSING_CONTRACT = 1801;
  static readonly ERR_UPG_CHECK_OVERLAY = 1802;
  static readonly ERR_UPG_CHECK_CONTRACT_ADDRESS = 1803;
  static readonly ERR_UPG_UNAUTHORIZED = 1804;

  static readonly ERR_DEPLOYMENT_STATE_NOT_ACTIVE = 1901;
  static readonly ERR_DEPLOYMENT_STATE_ALREADY_INITIALIZED = 1902;
}

// Constants from `wormhole-core-state` Clarity contract
export class WormholeCoreState {
  static readonly CONTRACT_NAME = "wormhole-core-state";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly ERR_STATE_UNAUTHORIZED = 10001;
  static readonly ERR_STATE_INVALID_VALUE = 10002;
  static readonly ERR_STATE_VAA_REPLAYED = 10003;
  static readonly ERR_STATE_XFER_NOT_IN_PROGRESS = 10004;
}

// Constants from `wormhole-core-state` Clarity contract
export class WormholeCoreProxy {
  static readonly CONTRACT_NAME = "wormhole-trait-core-v2-trait-checker";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly ERR_TRAIT_CHECK_CONTRACT_MISMATCH = 20001;
}
