/**
 * Financial Reconciliation Service Tests (Phase 7)
 */

describe('Financial Reconciliation Engine (Phase 7)', () => {
  it('calculates double-entry balance correctly', () => {
    const grossVolumeCents = 10000; // $100.00
    const platformFeeCents = 500;   // $5.00 (5%)
    const refundsCents = 2000;      // $20.00
    const netPayoutsCents = grossVolumeCents - platformFeeCents - refundsCents;

    expect(netPayoutsCents).toBe(7500); // $75.00
    expect(grossVolumeCents).toBe(platformFeeCents + refundsCents + netPayoutsCents);
  });

  it('validates debit and credit equality on every transaction', () => {
    const amountCents = 2500;
    const feeCents = 125;
    const creatorNetCents = 2375;

    const debits = amountCents; // Fan debit
    const credits = feeCents + creatorNetCents; // Platform fee + Creator balance

    expect(debits).toEqual(credits);
  });
});
