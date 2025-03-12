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

  static readonly ERR_POST_OVERFLOW_CONSISTENCY_LEVEL = 1401;
  static readonly ERR_POST_OVERFLOW_NONCE = 1402;

  static readonly ERR_SMF_CHECK_OVERLAY = 1507;
  static readonly ERR_SMF_CHECK_FEE = 1508;
  static readonly ERR_SMF_CHECK_MODULE = 1509;
  static readonly ERR_SMF_CHECK_ACTION = 1510;
  static readonly ERR_SMF_CHECK_CHAIN = 1511;

  static readonly ERR_TXF_CHECK_OVERLAY = 1607;
  static readonly ERR_TXF_CHECK_FEE = 1608;
  static readonly ERR_TXF_CHECK_MODULE = 1609;
  static readonly ERR_TXF_CHECK_ACTION = 1610;
  static readonly ERR_TXF_CHECK_CHAIN = 1611;
  static readonly ERR_TXF_CHECK_RECIPIENT_ADDRESS = 1612;

  static readonly ERR_UPG_PARSING_MODULE = 1701;
  static readonly ERR_UPG_PARSING_ACTION = 1702;
  static readonly ERR_UPG_PARSING_CHAIN = 1703;
  static readonly ERR_UPG_PARSING_CONTRACT = 1706;
  static readonly ERR_UPG_CHECK_OVERLAY = 1707;
  static readonly ERR_UPG_CHECK_MODULE = 1709;
  static readonly ERR_UPG_CHECK_ACTION = 1710;
  static readonly ERR_UPG_CHECK_CHAIN = 1711;
  static readonly ERR_UPG_CHECK_CONTRACT_ADDRESS = 1712;
  static readonly ERR_UPG_UNAUTHORIZED = 1713;

  static readonly ERR_GOV_CHECK_EMITTER = 1801;
}

// Constants from `wormhole-core-state` Clarity contract
export class WormholeCoreState {
  static readonly CONTRACT_NAME = "wormhole-core-state-v1";
  // Must match what is in `$(CONTRACT_NAME}.clar`
  static readonly ERR_STATE_VAA_REPLAYED = 10004;
}
