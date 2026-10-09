// Crowdbeats V2 — Flutter ThemeData (Phase 4)
// DM Sans via google_fonts. Uses CbColors semantic tokens throughout.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'cb_colors.dart';
import 'cb_spacing.dart';

import 'cb_typography.dart';

// ── Theme Extension — carries Crowdbeats-specific tokens ─────────────────────

@immutable
class CbThemeExtension extends ThemeExtension<CbThemeExtension> {
  const CbThemeExtension({
    required this.accentPrimarySubtle,
    required this.accentSecondarySubtle,
    required this.liveSurface,
    required this.liveText,
    required this.liveGlow,
    required this.surfaceCard,
    required this.surfaceOverlay,
    required this.surfacePressed,
    required this.borderSubtle,
    required this.textTertiary,
    this.surfaceCanvas = CbColors.darkCanvas,
    this.surfaceRaised = CbColors.darkRaised,
    this.borderStrong = CbColors.darkBorderStrong,
    this.borderFocus = CbColors.brandElectricViolet,
    this.textPrimary = CbColors.textPrimary,
    this.textSecondary = CbColors.textSecondary,
    this.textInverse = const Color(0xFF131315),
    this.statusLive = CbColors.brandAquaMint,
    this.statusLiveBg = const Color(0x1F2DD4BF),
    this.statusError = CbColors.errorRed,
    this.statusWarning = CbColors.heartOrange,
    this.statusSuccess = CbColors.liveGreen,
    this.isLiveMode = false,
  });

  final Color accentPrimarySubtle;
  final Color accentSecondarySubtle;
  final Color liveSurface;
  final Color liveText;
  final Color liveGlow;
  final Color surfaceCard;
  final Color surfaceOverlay;
  final Color surfacePressed;
  final Color borderSubtle;
  final Color textTertiary;
  final Color surfaceCanvas;
  final Color surfaceRaised;
  final Color borderStrong;
  final Color borderFocus;
  final Color textPrimary;
  final Color textSecondary;
  final Color textInverse;
  final Color statusLive;
  final Color statusLiveBg;
  final Color statusError;
  final Color statusWarning;
  final Color statusSuccess;
  final bool isLiveMode;

  @override
  CbThemeExtension copyWith({
    Color? accentPrimarySubtle,
    Color? accentSecondarySubtle,
    Color? liveSurface,
    Color? liveText,
    Color? liveGlow,
    Color? surfaceCard,
    Color? surfaceOverlay,
    Color? surfacePressed,
    Color? borderSubtle,
    Color? textTertiary,
    Color? surfaceCanvas,
    Color? surfaceRaised,
    Color? borderStrong,
    Color? borderFocus,
    Color? textPrimary,
    Color? textSecondary,
    Color? textInverse,
    Color? statusLive,
    Color? statusLiveBg,
    Color? statusError,
    Color? statusWarning,
    Color? statusSuccess,
    bool? isLiveMode,
  }) {
    return CbThemeExtension(
      accentPrimarySubtle:  accentPrimarySubtle  ?? this.accentPrimarySubtle,
      accentSecondarySubtle:accentSecondarySubtle?? this.accentSecondarySubtle,
      liveSurface:          liveSurface          ?? this.liveSurface,
      liveText:             liveText             ?? this.liveText,
      liveGlow:             liveGlow             ?? this.liveGlow,
      surfaceCard:          surfaceCard          ?? this.surfaceCard,
      surfaceOverlay:       surfaceOverlay       ?? this.surfaceOverlay,
      surfacePressed:       surfacePressed       ?? this.surfacePressed,
      borderSubtle:         borderSubtle         ?? this.borderSubtle,
      textTertiary:         textTertiary         ?? this.textTertiary,
      surfaceCanvas:        surfaceCanvas        ?? this.surfaceCanvas,
      surfaceRaised:        surfaceRaised        ?? this.surfaceRaised,
      borderStrong:         borderStrong         ?? this.borderStrong,
      borderFocus:          borderFocus          ?? this.borderFocus,
      textPrimary:          textPrimary          ?? this.textPrimary,
      textSecondary:        textSecondary        ?? this.textSecondary,
      textInverse:          textInverse          ?? this.textInverse,
      statusLive:           statusLive           ?? this.statusLive,
      statusLiveBg:         statusLiveBg         ?? this.statusLiveBg,
      statusError:          statusError          ?? this.statusError,
      statusWarning:        statusWarning        ?? this.statusWarning,
      statusSuccess:        statusSuccess        ?? this.statusSuccess,
      isLiveMode:           isLiveMode           ?? this.isLiveMode,
    );
  }

  @override
  CbThemeExtension lerp(CbThemeExtension? other, double t) {
    if (other is! CbThemeExtension) return this;
    return CbThemeExtension(
      accentPrimarySubtle:  Color.lerp(accentPrimarySubtle,  other.accentPrimarySubtle,  t)!,
      accentSecondarySubtle:Color.lerp(accentSecondarySubtle,other.accentSecondarySubtle,t)!,
      liveSurface:          Color.lerp(liveSurface,          other.liveSurface,          t)!,
      liveText:             Color.lerp(liveText,             other.liveText,             t)!,
      liveGlow:             Color.lerp(liveGlow,             other.liveGlow,             t)!,
      surfaceCard:          Color.lerp(surfaceCard,          other.surfaceCard,          t)!,
      surfaceOverlay:       Color.lerp(surfaceOverlay,       other.surfaceOverlay,       t)!,
      surfacePressed:       Color.lerp(surfacePressed,       other.surfacePressed,       t)!,
      borderSubtle:         Color.lerp(borderSubtle,         other.borderSubtle,         t)!,
      textTertiary:         Color.lerp(textTertiary,         other.textTertiary,         t)!,
      surfaceCanvas:        Color.lerp(surfaceCanvas,        other.surfaceCanvas,        t)!,
      surfaceRaised:        Color.lerp(surfaceRaised,        other.surfaceRaised,        t)!,
      borderStrong:         Color.lerp(borderStrong,         other.borderStrong,         t)!,
      borderFocus:          Color.lerp(borderFocus,          other.borderFocus,          t)!,
      textPrimary:          Color.lerp(textPrimary,          other.textPrimary,          t)!,
      textSecondary:        Color.lerp(textSecondary,        other.textSecondary,        t)!,
      textInverse:          Color.lerp(textInverse,          other.textInverse,          t)!,
      statusLive:           Color.lerp(statusLive,           other.statusLive,           t)!,
      statusLiveBg:         Color.lerp(statusLiveBg,         other.statusLiveBg,         t)!,
      statusError:          Color.lerp(statusError,          other.statusError,          t)!,
      statusWarning:        Color.lerp(statusWarning,        other.statusWarning,        t)!,
      statusSuccess:        Color.lerp(statusSuccess,        other.statusSuccess,        t)!,
      isLiveMode:           t < 0.5 ? isLiveMode : other.isLiveMode,
    );
  }

  // Convenience accessor
  static CbThemeExtension of(BuildContext context) {
    return Theme.of(context).extension<CbThemeExtension>() ?? defaults;
  }

  static const CbThemeExtension defaults = CbThemeExtension(
    accentPrimarySubtle:  CbColors.accentPrimarySubtle,
    accentSecondarySubtle:CbColors.accentSecondarySubtle,
    liveSurface:          CbColors.liveSurface,
    liveText:             CbColors.liveText,
    liveGlow:             CbColors.liveGlow,
    surfaceCard:          CbColors.surfaceCard,
    surfaceOverlay:       CbColors.surfaceOverlay,
    surfacePressed:       CbColors.surfacePressed,
    borderSubtle:         CbColors.borderSubtle,
    textTertiary:         CbColors.textTertiary,
    surfaceCanvas:        CbColors.darkCanvas,
    surfaceRaised:        CbColors.darkRaised,
    borderStrong:         CbColors.darkBorderStrong,
    borderFocus:          CbColors.brandElectricViolet,
    textPrimary:          CbColors.textPrimary,
    textSecondary:        CbColors.textSecondary,
    textInverse:          Color(0xFF131315),
    statusLive:           CbColors.brandAquaMint,
    statusLiveBg:         Color(0x1F2DD4BF),
    statusError:          CbColors.errorRed,
    statusWarning:        CbColors.heartOrange,
    statusSuccess:        CbColors.liveGreen,
  );

  static const CbThemeExtension lightDefaults = CbThemeExtension(
    accentPrimarySubtle:  Color(0x1A7C3AED),
    accentSecondarySubtle:Color(0x1A7C3AED),
    liveSurface:          Color(0xFFECFDF5),
    liveText:             CbColors.lightStatusLive,
    liveGlow:             Color(0x2210B981),
    surfaceCard:          CbColors.lightCard,
    surfaceOverlay:       CbColors.lightOverlay,
    surfacePressed:       CbColors.lightPressed,
    borderSubtle:         CbColors.lightBorderSubtle,
    textTertiary:         CbColors.lightTextTertiary,
    surfaceCanvas:        CbColors.lightCanvas,
    surfaceRaised:        CbColors.lightRaised,
    borderStrong:         CbColors.lightBorderStrong,
    borderFocus:          CbColors.brandElectricViolet,
    textPrimary:          CbColors.lightTextPrimary,
    textSecondary:        CbColors.lightTextSecondary,
    textInverse:          Colors.white,
    statusLive:           CbColors.lightStatusLive,
    statusLiveBg:         CbColors.lightStatusLiveBg,
    statusError:          CbColors.lightStatusError,
    statusWarning:        CbColors.lightStatusWarning,
    statusSuccess:        CbColors.lightStatusSuccess,
  );
}

// ── ThemeData ─────────────────────────────────────────────────────────────────

class CbTheme {
  CbTheme._();

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    final textTheme = GoogleFonts.plusJakartaSansTextTheme(base.textTheme).apply(
      bodyColor:    CbColors.textPrimary,
      displayColor: CbColors.textPrimary,
    );

    return base.copyWith(
      scaffoldBackgroundColor:CbColors.surfaceBase,
      canvasColor:            CbColors.surfaceBase,
      extensions:             const <ThemeExtension<dynamic>>[
        CbThemeExtension.defaults,
      ],

      colorScheme: const ColorScheme.dark(
        primary:          CbColors.accentPrimary,
        onPrimary:        CbColors.textOnPrimary,
        secondary:        CbColors.accentSecondary,
        onSecondary:      CbColors.textOnPrimary,
        surface:          CbColors.surfaceBase,
        onSurface:        CbColors.textPrimary,
        error:            CbColors.statusError,
        onError:          CbColors.textOnPrimary,
        outline:          CbColors.borderSubtle,
      ),

      textTheme: textTheme,
      primaryTextTheme: GoogleFonts.plusJakartaSansTextTheme(base.primaryTextTheme),

      appBarTheme: AppBarTheme(
        backgroundColor:  CbColors.surfaceRaised,
        foregroundColor:  CbColors.textPrimary,
        elevation:        0,
        centerTitle:      true,
        titleTextStyle:   GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: CbColors.textPrimary,
          letterSpacing: -0.01,
        ),
        iconTheme: const IconThemeData(color: CbColors.textPrimary),
      ),

      cardTheme: CardThemeData(
        color:       CbColors.surfaceCard,
        surfaceTintColor: Colors.transparent,
        elevation:   0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          side: const BorderSide(color: CbColors.borderSubtle, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor:   CbColors.accentPrimary,
          foregroundColor:   CbColors.textOnPrimary,
          minimumSize:       const Size(CbSpacing.touchMin, CbSpacing.touchComfortable),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          textStyle:         GoogleFonts.dmSans(fontWeight: FontWeight.w600, fontSize: 16),
          elevation:         0,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CbColors.accentPrimary,
          side: const BorderSide(color: CbColors.accentPrimary, width: 1.5),
          minimumSize: const Size(CbSpacing.touchMin, CbSpacing.touchMin),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: CbColors.accentSecondary,
          minimumSize: const Size(CbSpacing.touchMin, CbSpacing.touchMin),
          textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled:          true,
        fillColor:       CbColors.surfaceCard,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: CbSpacing.s4,
          vertical:   CbSpacing.s3_5,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
          borderSide: const BorderSide(color: CbColors.borderSubtle, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
          borderSide: const BorderSide(color: CbColors.borderSubtle, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
          borderSide: const BorderSide(color: CbColors.borderFocus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
          borderSide: const BorderSide(color: CbColors.borderError, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
          borderSide: const BorderSide(color: CbColors.borderError, width: 2),
        ),
        hintStyle: GoogleFonts.dmSans(color: CbColors.textTertiary, fontSize: 16),
        labelStyle: GoogleFonts.dmSans(color: CbColors.textSecondary, fontSize: 14),
        errorStyle: GoogleFonts.dmSans(color: CbColors.statusError, fontSize: 12),
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor:   CbColors.surfaceRaised,
        surfaceTintColor:  Colors.transparent,
        elevation:         0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(CbSpacing.radiusXl),
          ),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color:     CbColors.borderSubtle,
        thickness: 1,
        space:     1,
      ),

      chipTheme: ChipThemeData(
        backgroundColor:      CbColors.surfaceCard,
        selectedColor:        CbColors.accentPrimary,
        labelStyle:           GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w500),
        side: const BorderSide(color: CbColors.borderSubtle, width: 1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: CbSpacing.s3,
          vertical:   CbSpacing.s2,
        ),
      ),

      iconTheme: const IconThemeData(
        color: CbColors.textSecondary,
        size:  24,
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor:  CbColors.surfaceRaised,
        contentTextStyle: GoogleFonts.dmSans(color: CbColors.textPrimary, fontSize: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor:      CbColors.surfaceRaised,
        indicatorColor:       CbColors.accentPrimarySubtle,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: CbColors.accentPrimary, size: 24);
          }
          return const IconThemeData(color: CbColors.textTertiary, size: 24);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.dmSans(
            fontSize: 11,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? CbColors.accentPrimary : CbColors.textTertiary,
            letterSpacing: 0.03,
          );
        }),
        height: 64,
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        overlayColor: WidgetStateProperty.all(Colors.transparent),
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: CbColors.surfaceRaised,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          side: const BorderSide(color: CbColors.borderSubtle, width: 1),
        ),
        titleTextStyle: GoogleFonts.dmSans(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: CbColors.textPrimary,
        ),
        contentTextStyle: GoogleFonts.dmSans(
          fontSize: 16,
          color: CbColors.textSecondary,
        ),
      ),
    );
  }

  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    const lightTextPrimary = Color(0xFF111827);
    const lightSurface = Color(0xFFFFFFFF);
    const lightBackground = Color(0xFFF9FAFB);
    const lightBorder = Color(0xFFE5E7EB);

    final textTheme = GoogleFonts.plusJakartaSansTextTheme(base.textTheme).apply(
      bodyColor: lightTextPrimary,
      displayColor: lightTextPrimary,
    );

    return base.copyWith(
      scaffoldBackgroundColor: lightBackground,
      canvasColor: lightBackground,
      extensions: const <ThemeExtension<dynamic>>[
        CbThemeExtension.lightDefaults,
      ],
      colorScheme: const ColorScheme.light(
        primary: CbColors.accentPrimary,
        onPrimary: Colors.white,
        secondary: CbColors.stitchPurple,
        onSecondary: Colors.white,
        surface: lightSurface,
        onSurface: lightTextPrimary,
        error: CbColors.statusError,
        onError: Colors.white,
        outline: lightBorder,
      ),
      textTheme: textTheme,
      primaryTextTheme: GoogleFonts.plusJakartaSansTextTheme(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        backgroundColor: lightSurface,
        foregroundColor: lightTextPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: lightTextPrimary,
          letterSpacing: -0.01,
        ),
        iconTheme: const IconThemeData(color: lightTextPrimary),
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          side: const BorderSide(color: lightBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CbColors.accentPrimary,
          foregroundColor: Colors.white,
          minimumSize: const Size(CbSpacing.touchMin, CbSpacing.touchComfortable),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 16),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CbColors.accentPrimary,
          side: const BorderSide(color: CbColors.accentPrimary, width: 1.5),
          minimumSize: const Size(CbSpacing.touchMin, CbSpacing.touchMin),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
          ),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: lightSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(CbSpacing.radiusXl),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: lightBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }
}

// ── Context Extension for Ergonomic Theme Access ─────────────────────────────

extension CbThemeContext on BuildContext {
  CbThemeExtension get cbTheme => CbThemeExtension.of(this);
  ColorScheme get cbColors => Theme.of(this).colorScheme;
  TextTheme get cbTypography => Theme.of(this).textTheme;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}
