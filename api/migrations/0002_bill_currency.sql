-- Each bill is denominated in one currency; amounts stay integer minor units (cents / paise).
-- Existing bills predate currencies and were all created as USD, so they default to USD.
ALTER TABLE bills ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'
  CONSTRAINT ck_bills_currency_supported CHECK (currency IN ('INR', 'USD'));
