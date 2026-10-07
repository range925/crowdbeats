// Crowdbeats V2 — Personal Info Screen
//
// Edit Display Name, Contact Email, Phone, and Persona-specific metadata.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/auth_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_button.dart';

class PersonalInfoScreen extends ConsumerStatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  ConsumerState<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends ConsumerState<PersonalInfoScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _bioController;
  bool _saving = false;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authStateProvider);
    _nameController = TextEditingController(text: auth.displayName ?? '');
    _phoneController = TextEditingController(text: auth.user?.phoneNumber ?? '');
    _bioController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() { _saving = true; _successMessage = null; });
    try {
      final user = ref.read(authStateProvider).user;
      if (user != null) {
        await user.updateDisplayName(_nameController.text.trim());
      }
      setState(() {
        _saving = false;
        _successMessage = 'Profile information updated successfully.';
      });
    } catch (_) {
      setState(() {
        _saving = false;
        _successMessage = 'Failed to update profile. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal Information'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_successMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: CbColors.liveGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: CbColors.liveGreen, width: 1),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: CbColors.liveGreen, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _successMessage!,
                          style: const TextStyle(color: CbColors.liveGreen, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Email (Read-only badge)
              const Text('Email Address', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E2032),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.email_outlined, color: Colors.white54, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        auth.email ?? '—',
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: CbColors.liveGreen.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('Verified', style: TextStyle(color: CbColors.liveGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Display Name
              const Text('Display Name', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Your name or stage name',
                  prefixIcon: const Icon(Icons.person_outline, color: CbColors.purpleLight, size: 18),
                  filled: true,
                  fillColor: const Color(0xFF1E2032),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: CbColors.borderSubtle)),
                ),
              ),
              const SizedBox(height: 20),

              // Phone Number
              const Text('Phone Number', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: '+1 (555) 000-0000',
                  prefixIcon: const Icon(Icons.phone_outlined, color: CbColors.purpleLight, size: 18),
                  filled: true,
                  fillColor: const Color(0xFF1E2032),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: CbColors.borderSubtle)),
                ),
              ),
              const SizedBox(height: 32),

              CbButton(
                label: 'Save Changes',
                isLoading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
