// Crowdbeats V2 — Stitch Authoritative Form Field (Project 5326179813018056505)
// Dark rounded input field with leading icon, validation state, and char counters.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

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
    Color borderColor = CbColors.borderSubtle;
    if (_isFocused) {
      borderColor = CbColors.purpleMain;
    } else if (widget.isValid == false) {
      borderColor = CbColors.errorRed;
    } else if (widget.isValid == true) {
      borderColor = CbColors.liveGreen;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.label,
              style: const TextStyle(
                color: CbColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (widget.validationText != null)
              Text(
                widget.validationText!,
                style: TextStyle(
                  color: widget.isValid == true ? CbColors.liveGreen : CbColors.errorRed,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: CbColors.surface2,
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
            style: const TextStyle(
              color: CbColors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: const TextStyle(
                color: CbColors.textMuted,
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
                      ? const Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: Icon(Icons.check_circle, color: CbColors.liveGreen, size: 20),
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
