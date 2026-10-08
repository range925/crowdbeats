import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/components/cb_logo.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('CrowdbeatsLogo & CbLogo Widget Tests', () {
    testWidgets('CbLogo alias points to CrowdbeatsLogo', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(),
          ),
        ),
      );

      expect(find.byType(CrowdbeatsLogo), findsOneWidget);
      expect(find.byType(CbLogo), findsOneWidget);
    });

    testWidgets('renders horizontal variant with default auto surface on dark theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: const Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              height: 32,
            ),
          ),
        ),
      );

      expect(find.byType(CbLogo), findsOneWidget);
      expect(find.bySemanticsLabel('Crowdbeats'), findsOneWidget);

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-logo-on-dark-cropped.png');
      expect(image.height, 32.0);
      expect(image.width, 32.0 * 6.5);
      expect(image.fit, BoxFit.contain);
    });

    testWidgets('renders horizontal variant with auto surface on light theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: const Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              surface: CbLogoSurface.auto,
              height: 40,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-logo-on-light-cropped.png');
      expect(image.height, 40.0);
      expect(image.width, 40.0 * 6.5);
    });

    testWidgets('renders dark surface even when theme is light', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: const Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              surface: CbLogoSurface.dark,
              height: 44,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-logo-on-dark-cropped.png');
      expect(image.height, 44.0);
      expect(image.width, 44.0 * 6.5);
    });

    testWidgets('renders light surface even when theme is dark', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: const Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              surface: CbLogoSurface.light,
              height: 36,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-logo-on-light-cropped.png');
      expect(image.height, 36.0);
      expect(image.width, 36.0 * 6.5);
    });

    testWidgets('renders emblem variant on dark surface with 1:1 aspect ratio', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.emblem,
              surface: CbLogoSurface.dark,
              height: 28,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-emblem-on-dark.png');
      expect(image.height, 28.0);
      expect(image.width, 28.0);
    });

    testWidgets('renders emblem variant on light surface with 1:1 aspect ratio', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.emblem,
              surface: CbLogoSurface.light,
              height: 24,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      final assetImage = image.image as AssetImage;
      expect(assetImage.assetName, 'assets/images/crowdbeats-emblem-on-light.png');
      expect(image.height, 24.0);
      expect(image.width, 24.0);
    });

    testWidgets('honors explicit width override', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              height: 32,
              width: 150,
            ),
          ),
        ),
      );

      final image = tester.widget<Image>(find.byType(Image));
      expect(image.height, 32.0);
      expect(image.width, 150.0);
    });

    testWidgets('respects withBacking container', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              height: 28,
              withBacking: true,
            ),
          ),
        ),
      );

      expect(find.byType(CbLogo), findsOneWidget);
      expect(find.byType(Container), findsWidgets);
    });

    testWidgets('respects excludeFromSemantics flag', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbLogo(
              variant: CbLogoVariant.horizontal,
              height: 32,
              excludeFromSemantics: true,
            ),
          ),
        ),
      );

      expect(find.byType(CbLogo), findsOneWidget);
      expect(find.bySemanticsLabel('Crowdbeats'), findsNothing);
    });
  });
}
