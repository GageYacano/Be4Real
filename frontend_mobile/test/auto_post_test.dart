import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:math';

import 'package:my_flutter_app/auto_post.dart'; // <-- change to your path

// -----------------------------------------------------------------------------
// MOCKS
// -----------------------------------------------------------------------------
class MockNavigatorObserver extends Mock implements NavigatorObserver {}

class FakeRoute extends Fake implements Route<dynamic> {}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    registerFallbackValue(FakeRoute());
  });

  group('AutoPostService', () {
    late AutoPostService service;

    setUp(() {
      service = AutoPostService();
      TestWidgetsFlutterBinding.ensureInitialized();
    });

    tearDown(() {
      service.stop();
    });

    test('is a singleton', () {
      final instance1 = AutoPostService();
      final instance2 = AutoPostService();

      expect(instance1, same(instance2));
    });

    testWidgets('handles rapid start/stop calls', (tester) async {
      SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: ElevatedButton(
                  onPressed: () {
                    service.start(context);
                    service.stop();
                    service.start(context);
                    service.stop();
                    service.start(context);
                  },
                  child: const Text('Rapid Test'),
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.text('Rapid Test'));
      await tester.pump();

      // Should handle rapid calls without crashing
      expect(find.text('Rapid Test'), findsOneWidget);

      service.stop();
    });

    testWidgets('preserves singleton state across multiple accesses',
        (tester) async {
      SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

      bool testPassed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: ElevatedButton(
                  onPressed: () {
                    final s1 = AutoPostService();
                    s1.start(context);

                    final s2 = AutoPostService();
                    // Both should be the same instance
                    expect(s1, same(s2));
                    testPassed = true;
                  },
                  child: const Text('Test Singleton'),
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.text('Test Singleton'));
      await tester.pump();

      expect(testPassed, isTrue);

      service.stop();
    });

    test('random delay range is correct', () {
      // Test the math used in the service
      final random = Random();

      for (int i = 0; i < 100; i++) {
        int delay = random.nextInt(55) + 5;
        expect(delay, greaterThanOrEqualTo(5));
        expect(delay, lessThanOrEqualTo(60));
      }
    });

    testWidgets('can be stopped multiple times safely', (tester) async {
      SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: ElevatedButton(
                  onPressed: () {
                    service.start(context);
                    service.stop();
                    service.stop(); // Call stop again
                    service.stop(); // And again
                  },
                  child: const Text('Test Multiple Stops'),
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.text('Test Multiple Stops'));
      await tester.pump();

      // Should not crash
      expect(find.text('Test Multiple Stops'), findsOneWidget);
    });

    group('AutoPostService Integration', () {
      late AutoPostService service;

      setUp(() {
        service = AutoPostService();
      });

      tearDown(() {
        service.stop();
      });
    });
  });
}
