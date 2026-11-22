import test from 'node:test';
import assert from 'node:assert/strict';
import { getWalletConfig } from '../src/config/wallet.js';
test('wallet configuration removes invalid and duplicate packages and fails closed without limits', () => {
 const oldPackages = process.env.WALLET_DEPOSIT_PACKAGES;
 const oldMinimum = process.env.WALLET_MIN_WITHDRAWAL;
 try {
  process.env.WALLET_DEPOSIT_PACKAGES = '100,50,50,0,-1,1.5,invalid';
  process.env.WALLET_MIN_WITHDRAWAL = '25';
  assert.deepEqual(getWalletConfig(),{depositPackages:[50,100],minimumWithdrawal:25});
  delete process.env.WALLET_DEPOSIT_PACKAGES;
  process.env.WALLET_MIN_WITHDRAWAL = 'invalid';
  assert.deepEqual(getWalletConfig(),{depositPackages:[],minimumWithdrawal:null});
 } finally {
  if(oldPackages === undefined) delete process.env.WALLET_DEPOSIT_PACKAGES; else process.env.WALLET_DEPOSIT_PACKAGES = oldPackages;
  if(oldMinimum === undefined) delete process.env.WALLET_MIN_WITHDRAWAL; else process.env.WALLET_MIN_WITHDRAWAL = oldMinimum;
 }
});
