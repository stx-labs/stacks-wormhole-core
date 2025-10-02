// Constants used by multiple tests

export class MaxValue {
  static readonly U8 = 255;
  static readonly U16 = 65535;
  static readonly U32 = 4294967295;
  // Use `BigInt` for values over `Number.MAX_SAFE_INTEGER`
  static readonly U64 = 18446744073709551615n;
  static readonly U128 = 340282366920938463463374607431768211455n;
}

// Constants from `wormhole-core` Clarity contract
export class WormholeCore {
  static readonly CONTRACT_NAME = "wormhole-core-v4";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly EXPECTED_CHAIN_ID = 0x003c; // Value for testnet/devnet/simnet
  static readonly DEFAULT_CONSISTENCY_LEVEL = 0;
  static readonly ACTION_CONTRACT_UPGRADE = 1;
  static readonly ACTION_SET_MESSAGE_FEE = 3;
  static readonly ACTION_TRANSFER_FEES = 4;

  static readonly DEPLOYMENT_STATE_UNITIALIZED = 0;
  static readonly DEPLOYMENT_STATE_ACTIVE = 1;
  static readonly DEPLOYMENT_STATE_DEPRECATED = 2;

  static readonly ERR_VAA_PARSING_VERSION = 1001;
  static readonly ERR_VAA_PARSING_GUARDIAN_SET_ID = 1002;
  static readonly ERR_VAA_PARSING_SIGNATURES_LEN = 1003;
  static readonly ERR_VAA_PARSING_SIGNATURES = 1004;
  static readonly ERR_VAA_PARSING_TIMESTAMP = 1005;
  static readonly ERR_VAA_PARSING_NONCE = 1006;
  static readonly ERR_VAA_PARSING_EMITTER_CHAIN = 1007;
  static readonly ERR_VAA_PARSING_EMITTER_ADDRESS = 1008;
  static readonly ERR_VAA_PARSING_SEQUENCE = 1009;
  static readonly ERR_VAA_PARSING_CONSISTENCY_LEVEL = 1010;
  static readonly ERR_VAA_PARSING_PAYLOAD = 1011;
  static readonly ERR_VAA_HASHING_BODY = 1012;

  static readonly ERR_VAA_CHECKS_VERSION_UNSUPPORTED = 1101;
  static readonly ERR_VAA_CHECKS_THRESHOLD_SIGNATURE = 1102;
  static readonly ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY = 1103;

  static readonly ERR_GSU_PARSING_INDEX = 1201;
  static readonly ERR_GSU_PARSING_GUARDIAN_LEN = 1202;
  static readonly ERR_GSU_PARSING_GUARDIANS_BYTES = 1203;
  static readonly ERR_GSU_UNCOMPRESSED_PUBLIC_KEYS = 1204;

  static readonly ERR_GSU_CHECK_INDEX = 1301;
  static readonly ERR_GSU_CHECK_CALLER = 1302;
  static readonly ERR_GSU_CHECK_OVERLAY = 1303;
  static readonly ERR_GSU_EMPTY_GUARDIAN_SET = 1304;
  static readonly ERR_GSU_DUPLICATED_GUARDIAN_ADDRESSES = 1305;
  static readonly ERR_DUPLICATED_GUARDIAN_ADDRESSES = 1309;

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
  static readonly ERR_GOV_MAX_GUARDIANS_EXCEEDED = 1509;

  static readonly ERR_SMF_PARSING_FEE_1 = 1601;
  static readonly ERR_SMF_PARSING_FEE_2 = 1602;
  static readonly ERR_SMF_CHECK_OVERLAY = 1603;
  static readonly ERR_SMF_CHECK_FEE = 1604;

  static readonly ERR_TXF_PARSING_AMOUNT_1 = 1701;
  static readonly ERR_TXF_PARSING_AMOUNT_2 = 1702;
  static readonly ERR_TXF_PARSING_RECIPIENT = 1703;
  static readonly ERR_TXF_CHECK_OVERLAY = 1704;
  static readonly ERR_TXF_CHECK_AMOUNT = 1705;
  static readonly ERR_TXF_LOOKUP_RECIPIENT_ADDRESS = 1706;
  static readonly ERR_TXF_CHECK_RECIPIENT_ADDRESS = 1707;

  static readonly ERR_UPG_PARSING_CONTRACT = 1801;
  static readonly ERR_UPG_CHECK_OVERLAY = 1802;
  static readonly ERR_UPG_CHECK_CONTRACT_ADDRESS = 1803;
  static readonly ERR_UPG_UNAUTHORIZED = 1804;
  static readonly ERR_UPG_PREV_CONTRACT_INVALID = 1805;

  static readonly ERR_DEPLOYMENT_STATE_NOT_ACTIVE = 1901;
  static readonly ERR_DEPLOYMENT_STATE_ALREADY_INITIALIZED = 1902;

  static readonly ERR_PROXY_UNAUTHORIZED = 2001;
  static readonly ERR_STACKS_TIMESTAMP = 2002;
  static readonly ERR_NO_GUARDIAN_SET = 2003;
  static readonly ERR_NO_GUARDIANS = 2004;

  static readonly GOV_EMITTING_CHAIN = 1;
  static readonly GOV_EMITTING_ADDRESS =
    "0x0000000000000000000000000000000000000000000000000000000000000004";
  static readonly GOV_BROADCAST_CHAIN_ID = 0;
  static readonly GOV_ACTION_CONTRACT_UPGRADE = 1;
  static readonly GOV_ACTION_GUARDIAN_SET_UPDATE = 2;
  static readonly GOV_ACTION_SET_MESSAGE_FEE = 3;
  static readonly GOV_ACTION_TRANSFER_FEES = 4;
  static readonly GOV_MAX_GUARDIANS = 30;

  static readonly CORE_STRING_MODULE =
    "0x00000000000000000000000000000000000000000000000000000000436f7265";
  static readonly MINIMUM_MESSAGE_FEE = 1;
}

// Constants from `wormhole-core-state` Clarity contract
export class WormholeCoreState {
  static readonly CONTRACT_NAME = "wormhole-core-state";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly ERR_STATE_UNINITIALIZED = 10001;
  static readonly ERR_STATE_UNAUTHORIZED = 10002;
  static readonly ERR_STATE_ALREADY_INITIALIZED = 10003;
  static readonly ERR_STATE_INVALID_VALUE = 10004;
  static readonly ERR_STATE_VAA_REPLAYED = 10005;
  static readonly ERR_STATE_XFER_NOT_IN_PROGRESS = 10006;
}

// Constants from `wormhole-core-state` Clarity contract
export class WormholeCoreProxy {
  static readonly CONTRACT_NAME = "wormhole-core-proxy-v2";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly ERR_TRAIT_CHECK_NO_ACTIVE_CONTRACT = 20001;
  static readonly ERR_TRAIT_CHECK_CONTRACT_MISMATCH = 20002;
}
