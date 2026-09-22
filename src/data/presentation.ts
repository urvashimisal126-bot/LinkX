export const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const time = (s: string) => new Date(s).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
export const identifiers: Record<string, string[]> = {
  victim: ['98••••••12', 'Suraksha Cooperative Bank ••4471'],
  attacker_phone: ['Attacker-controlled number', 'Shared device linkage in E01 + E06'],
  apk: ['sms_forwarder.apk.manifest.json', 'Permission: receive / forward SMS'],
  mule1: ['HDFC ••3321 (sample)'], mule2: ['PNB ••7790 (sample)'],
  mule3: ['Canara ••1190 (sample)'], vpa_fraud: ['fraud••@examplebank'],
  exchange: ['CoinRamp ••221 (sample)'], atm_cashout: ['3 ATM locations'],
};
export const support: Record<string, string[]> = {
  victim: ['E01', 'E02', 'E03', 'E06'], attacker_phone: ['E01', 'E06'], apk: ['E06'],
  mule1: ['E02', 'E04'], mule2: ['E04'], mule3: ['E04', 'E05'], vpa_fraud: ['E04', 'E05'], exchange: ['E05'], atm_cashout: ['E05'],
};
export const resolution: Record<string, string> = {
  victim: 'Phone + account match across E01 + E02; IP session in E03',
  attacker_phone: 'IMEI match across E01 + E06', apk: 'SMS-forwarding destination in E06',
  mule1: 'Beneficiary account match across E02 + E04', mule2: 'Bank account match in E04',
  mule3: 'Account + cash-out reference across E04 + E05', vpa_fraud: 'VPA match across E04 + E05',
  exchange: 'Wallet reference in E05', atm_cashout: 'Withdrawal references in E05',
};
