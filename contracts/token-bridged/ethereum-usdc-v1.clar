(impl-trait .hk-tokens-v1.bridged-sip10-token)

(define-fungible-token token-store)

;; Human readable name of the token
(define-read-only (get-name) 
    (ok "usdc"))

;; Ticker symbol, or empty if none
(define-read-only (get-symbol) 
    (ok "USDC"))

;; Number of decimals used, e.g. 6 would mean 1_000_000 represents 1 token
(define-read-only (get-decimals) 
    (ok u8))

;; Balance of the passed principal
(define-read-only (get-balance (owner principal)) 
    (let ((balance (ft-get-balance token-store owner)))
        (ok balance)))

;; Current total supply (which does not need to be a constant)
(define-read-only (get-total-supply)
    (ok (ft-get-supply token-store)))

;; Optional URI that represents metadata of this token
(define-read-only (get-token-uri)
    (ok none))

;; Transfer from the caller to a new principal
(define-public (transfer (amount uint) (sender principal) (recipient principal) (bytes (optional (buff 34))))
    (ok true))

;; Mint tokens
(define-public (mint (amount uint) (recipient principal) (bytes (optional (buff 34))))
    (ok u1))

;; Burn tokens
(define-public (burn (amount uint) (owner principal) (bytes (optional (buff 34))))
    (ok u1))
