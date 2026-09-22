export const sampleCase = {
  id: "LX-2026-0918-A",
  title: "APK-based UPI fraud — ₹4,85,000",
  filedDate: "2026-09-18T09:14:00+05:30",
  status: "Active — Golden Hour",
  totalAmount: 485000,
  currency: "INR",
  victim: {
    label: "Complainant (Victim)",
    phone: "98••••••12",
    bankAccountLast4: "4471",
    bank: "Suraksha Cooperative Bank (sample)"
  }
};

export const exhibits = [
  { id: "E01", type: "Telecom CDR", filename: "cdr_victim_98xxxx12.csv",
    records: 214, sha256: "a1f9c3...e02b", status: "Verified", uploadedAt: "2026-09-18T09:20:00+05:30" },
  { id: "E02", type: "Bank Statement", filename: "bank_stmt_4471.xlsx",
    records: 38, sha256: "7be402...9f11", status: "Verified", uploadedAt: "2026-09-18T09:21:00+05:30" },
  { id: "E03", type: "IPDR Session Logs", filename: "ipdr_sessions_sep18.csv",
    records: 96, sha256: "d0a7e5...44cd", status: "Verified", uploadedAt: "2026-09-18T09:23:00+05:30" },
  { id: "E04", type: "Mule Account Records", filename: "mule_layer_accounts.xlsx",
    records: 12, sha256: "c92b81...117a", status: "Verified", uploadedAt: "2026-09-18T09:25:00+05:30" },
  { id: "E05", type: "P2P Exchange Logs", filename: "exchange_offramp_logs.json",
    records: 9, sha256: "5f3d90...ab02", status: "Verified", uploadedAt: "2026-09-18T09:27:00+05:30" },
  { id: "E06", type: "Malware APK Manifest", filename: "sms_forwarder.apk.manifest.json",
    records: 1, sha256: "e114af...caa9", status: "Verified", uploadedAt: "2026-09-18T09:29:00+05:30" }
];

// Sample-case fixture ends here.
export const entities = [
  { id: "victim",   label: "Victim account (••4471)",     type: "victim" },
  { id: "attacker_phone", label: "Attacker-controlled number", type: "attacker" },
  { id: "apk",      label: "SMS-forwarder APK",            type: "malware", linkedExhibit: "E06" },
  { id: "mule1",     label: "Mule A/C — HDFC ••3321 (sample)", type: "mule", tier: 1 },
  { id: "mule2",     label: "Mule A/C — PNB ••7790 (sample)",  type: "mule", tier: 2 },
  { id: "mule3",     label: "Mule A/C — Canara ••1190 (sample)", type: "mule", tier: 2 },
  { id: "vpa_fraud", label: "VPA: fraud••@examplebank",     type: "vpa", tier: 2 },
  { id: "exchange",  label: "Exchange wallet — CoinRamp ••221 (sample)", type: "offramp", tier: 3 },
  { id: "atm_cashout", label: "ATM cash-out cluster (3 locations)", type: "offramp", tier: 3 }
];
export const flowEdges = [
  { from: "apk", to: "victim", label: "OTP intercepted", timestamp: "2026-09-18T08:51:00+05:30" },
  { from: "victim", to: "mule1", amount: 485000, timestamp: "2026-09-18T08:54:00+05:30", exhibit: "E02" },
  { from: "mule1", to: "mule2", amount: 260000, timestamp: "2026-09-18T09:02:00+05:30", exhibit: "E04" },
  { from: "mule1", to: "mule3", amount: 225000, timestamp: "2026-09-18T09:04:00+05:30", exhibit: "E04" },
  { from: "mule2", to: "vpa_fraud", amount: 250000, timestamp: "2026-09-18T09:11:00+05:30", exhibit: "E04" },
  { from: "mule3", to: "atm_cashout", amount: 195000, timestamp: "2026-09-18T09:18:00+05:30", exhibit: "E05" },
  { from: "vpa_fraud", to: "exchange", amount: 240000, timestamp: "2026-09-18T09:33:00+05:30", exhibit: "E05" }
];

export const freezeQueue = [
  { rank: 1, entityId: "mule2", score: 96,
    reason: "Balance confirmed present: ₹10,000 residual + high inbound velocity in last 30 min",
    action: "Freeze immediately" },
  { rank: 2, entityId: "vpa_fraud", score: 88,
    reason: "₹2,50,000 credited 9:11am, not yet moved onward — funds recoverable now",
    action: "Freeze immediately" },
  { rank: 3, entityId: "mule3", score: 61,
    reason: "Partially drained — ₹30,000 balance remains, linked to 2 other active cases",
    action: "Freeze + flag for cross-case review" },
  { rank: 4, entityId: "exchange", score: 54,
    reason: "Funds likely converted to crypto — preservation notice, not a bank freeze",
    action: "Send preservation notice" },
  { rank: 5, entityId: "mule1", score: 22,
    reason: "Fully drained within 8 minutes of receipt, zero balance",
    action: "Deprioritize — intelligence value only" }
];

export const timelineEvents = [
  { time: "2026-09-18T08:47:00+05:30", type: "Malware", exhibit: "E06", text: "SMS-forwarder APK installed on victim device (sideloaded)" },
  { time: "2026-09-18T08:51:00+05:30", type: "Call",    exhibit: "E01", text: "Inbound call from spoofed bank support number, 4m12s" },
  { time: "2026-09-18T08:53:00+05:30", type: "SMS",      exhibit: "E06", text: "OTP SMS silently forwarded to attacker-controlled number" },
  { time: "2026-09-18T08:54:00+05:30", type: "Bank",     exhibit: "E02", text: "₹4,85,000 debited from victim account to Mule A/C ••3321" },
  { time: "2026-09-18T08:56:00+05:30", type: "IPDR",     exhibit: "E03", text: "Fraud session originated from IP geolocated outside victim's home circle" },
  { time: "2026-09-18T09:02:00+05:30", type: "Bank",     exhibit: "E04", text: "Layer 1 split: ₹2,60,000 to Mule A/C ••7790" },
  { time: "2026-09-18T09:04:00+05:30", type: "Bank",     exhibit: "E04", text: "Layer 1 split: ₹2,25,000 to Mule A/C ••1190" },
  { time: "2026-09-18T09:11:00+05:30", type: "Bank",     exhibit: "E04", text: "₹2,50,000 forwarded to VPA fraud••@examplebank" },
  { time: "2026-09-18T09:14:00+05:30", type: "Complaint", exhibit: null, text: "Victim files complaint — case LX-2026-0918-A opened" },
  { time: "2026-09-18T09:18:00+05:30", type: "Bank",     exhibit: "E05", text: "₹1,95,000 withdrawn across 3 ATM locations" },
  { time: "2026-09-18T09:33:00+05:30", type: "Exchange", exhibit: "E05", text: "₹2,40,000 converted at exchange wallet CoinRamp ••221" }
];

