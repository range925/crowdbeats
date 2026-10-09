// Crowdbeats V2 — Stitch Authoritative Form Field (Project 5326179813018056505)
// Dark rounded input field with leading icon, validation state, and char counters.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';
import 'package:google_fonts/google_fonts.dart';

class CbFormField extends StatefulWidget {
  const CbFormField({
    super.key,
    required this.label,
    this.controller,
    this.initialValue,
    this.hintText,
    this.leadingIcon,
    this.trailing,
    this.isValid,
    this.validationText,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.maxLength,
    this.onChanged,
    this.validator,
  });

  final String label;
  final TextEditingController? controller;
  final String? initialValue;
  final String? hintText;
  final Widget? leadingIcon;
  final Widget? trailing;
  final bool? isValid;
  final String? validationText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int maxLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;

  @override
  State<CbFormField> createState() => _CbFormFieldState();
}

class _CbFormFieldState extends State<CbFormField> {
  late final FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    Color borderColor = ext.borderSubtle;
    if (_isFocused) {
      borderColor = ext.borderFocus;
    } else if (widget.isValid == false) {
      borderColor = ext.statusError;
    } else if (widget.isValid == true) {
      borderColor = ext.statusSuccess;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                widget.label,
                style: GoogleFonts.plusJakartaSans(
                  color: ext.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (widget.validationText != null) ...[
              const SizedBox(width: 8),
              Text(
                widget.validationText!,
                style: GoogleFonts.plusJakartaSans(
                  color: widget.isValid == true ? ext.statusSuccess : ext.statusError,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: ext.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: borderColor, width: _isFocused ? 1.5 : 1.0),
          ),
          child: TextFormField(
            controller: widget.controller,
            initialValue: widget.initialValue,
            focusNode: _focusNode,
            obscureText: widget.obscureText,
            keyboardType: widget.keyboardType,
            maxLines: widget.maxLines,
            maxLength: widget.maxLength,
            onChanged: widget.onChanged,
            validator: widget.validator,
            style: GoogleFonts.plusJakartaSans(
              color: ext.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: GoogleFonts.plusJakartaSans(
                color: ext.textTertiary,
                fontSize: 14,
              ),
              prefixIcon: widget.leadingIcon != null
                  ? Padding(
                      padding: const EdgeInsets.only(left: 12, right: 8),
                      child: widget.leadingIcon,
                    )
                  : null,
              prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              suffixIcon: widget.trailing ??
                  (widget.isValid == true
                      ? Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: Icon(Icons.check_circle, color: ext.statusSuccess, size: 20),
                        )
                      : null),
              suffixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: CbSpacing.s4,
                vertical: CbSpacing.s3_5,
              ),
              border: InputBorder.none,
              counterText: '',
            ),
          ),
        ),
      ],
    );
  }
}
