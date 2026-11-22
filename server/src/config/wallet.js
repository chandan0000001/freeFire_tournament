// Read lazily so dotenv is loaded before configuration is resolved.
export function getWalletConfig() {
  const depositPackages = [...new Set((process.env.WALLET_DEPOSIT_PACKAGES || '').split(',').map(Number).filter(n => Number.isSafeInteger(n) && n > 0))].sort((a,b) => a-b);
  const minimumWithdrawal = Number(process.env.WALLET_MIN_WITHDRAWAL);
  return { depositPackages, minimumWithdrawal: Number.isSafeInteger(minimumWithdrawal) && minimumWithdrawal > 0 ? minimumWithdrawal : null };
}
