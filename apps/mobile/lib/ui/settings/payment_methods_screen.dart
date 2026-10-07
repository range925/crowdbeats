// Crowdbeats V2 — Payment Methods Screen
//
// Compliant with PCI-DSS & Stripe Elements / PaymentSheet standards.
// Zero raw card details stored in app or Firestore.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../components/cb_card_input_sheet.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  // Safe payment methods mock/list (populated via Stripe listPaymentMethods)
  final List<Map<String, dynamic>> _savedMethods = [
    {
      'id': 'pm_1',
      'brand': 'Visa',
      'last4': '4242',
      'expMonth': 12,
      'expYear': 2028,
      'isDefault': true,
    },
    {
      'id': 'pm_2',
      'brand': 'Mastercard',
      'last4': '5555',
      'expMonth': 8,
      'expYear': 2027,
      'isDefault': false,
    },
  ];

  void _setDefault(String id) {
    setState(() {
      for (final m in _savedMethods) {
        m['isDefault'] = (m['id'] == id);
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Default payment method updated.')),
    );
  }

  Future<void> _addCard() async {
    final newPm = await CbCardInputSheet.show(context);
    if (newPm != null && mounted) {
      setState(() {
        for (final m in _savedMethods) {
          if (newPm.isDefault) m['isDefault'] = false;
        }
        _savedMethods.insert(0, {
          'id': newPm.id,
          'brand': newPm.brand,
          'last4': newPm.last4,
          'expMonth': newPm.expMonth,
          'expYear': newPm.expYear,
          'isDefault': newPm.isDefault,
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Card ${newPm.displayName} added successfully!'),
          backgroundColor: CbColors.liveGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Methods'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Security notice card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF151722),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: CbColors.liveGreen, size: 22),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Payments processed securely via Stripe. 256-bit encryption. PCI-DSS Level 1 Certified.',
                        style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text('SAVED CARDS', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
              const SizedBox(height: 12),

              ..._savedMethods.map((m) {
                final isDefault = m['isDefault'] as bool;
                final brand = m['brand'] as String;
                final last4 = m['last4'] as String;
                final exp = '${m['expMonth']}/${m['expYear']}';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E2032),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isDefault ? CbColors.purpleMain : CbColors.borderSubtle, width: isDefault ? 1.5 : 1.0),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF151722),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.credit_card, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  '$brand •••• $last4',
                                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                                ),
                                if (isDefault) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: CbColors.purpleDim,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('Default', style: TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text('Expires $exp', style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ),
                      if (!isDefault)
                        TextButton(
                          onPressed: () => _setDefault(m['id'] as String),
                          child: const Text('Make Default', style: TextStyle(color: CbColors.purpleLight, fontSize: 12)),
                        ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 24),

              OutlinedButton.icon(
                onPressed: _addCard,
                icon: const Icon(Icons.add, color: CbColors.purpleLight),
                label: const Text('Add New Card'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: CbColors.purpleMain),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
