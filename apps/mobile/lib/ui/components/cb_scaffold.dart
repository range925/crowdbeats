// Crowdbeats V2 — Responsive & Safe Layout Scaffolds
// Provides keyboard-aware scrolling, SafeArea encapsulation, focus management,
// and loading/error states across mobile targets.

import 'package:flutter/material.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';
import '../theme/cb_typography.dart';
import 'cb_button.dart';

class CbSafeScaffold extends StatelessWidget {
  const CbSafeScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.dismissKeyboardOnTap = true,
    this.safeAreaTop = true,
    this.safeAreaBottom = true,
    this.padding,
    this.backgroundColor,
  });

  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final bool dismissKeyboardOnTap;
  final bool safeAreaTop;
  final bool safeAreaBottom;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final bg = backgroundColor ?? ext.surfaceCanvas;

    Widget content = SafeArea(
      top: safeAreaTop,
      bottom: safeAreaBottom,
      child: padding != null
          ? Padding(padding: padding!, child: body)
          : body,
    );

    if (dismissKeyboardOnTap) {
      content = GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: () => FocusScope.of(context).unfocus(),
        child: content,
      );
    }

    return Scaffold(
      backgroundColor: bg,
      resizeToAvoidBottomInset: true,
      appBar: appBar,
      body: content,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}

class CbLoadingScaffold extends StatelessWidget {
  const CbLoadingScaffold({
    super.key,
    this.message = 'Loading…',
    this.appBar,
  });

  final String message;
  final PreferredSizeWidget? appBar;

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    return CbSafeScaffold(
      appBar: appBar,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: ext.borderFocus,
              ),
            ),
            const SizedBox(height: CbSpacing.s4),
            Text(
              message,
              style: CbTypography.bodyMd(color: ext.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class CbErrorScaffold extends StatelessWidget {
  const CbErrorScaffold({
    super.key,
    this.title = 'Unable to Load',
    this.message = 'A network or system error occurred. Please try again.',
    this.onRetry,
    this.appBar,
  });

  final String title;
  final String message;
  final VoidCallback? onRetry;
  final PreferredSizeWidget? appBar;

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;

    return CbSafeScaffold(
      appBar: appBar,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(CbSpacing.s8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: ext.statusError,
              ),
              const SizedBox(height: CbSpacing.s4),
              Text(
                title,
                style: CbTypography.sectionTitle(color: ext.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: CbSpacing.s2),
              Text(
                message,
                style: CbTypography.bodyMd(color: ext.textSecondary),
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: CbSpacing.s6),
                CbButton(
                  label: 'Try Again',
                  variant: CbButtonVariant.secondary,
                  onPressed: onRetry,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
