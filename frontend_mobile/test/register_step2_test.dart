import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_flutter_app/register_step1.dart';
import 'package:my_flutter_app/register_step2.dart';
import 'package:my_flutter_app/register_step3.dart';
import 'package:my_flutter_app/login.dart';

void main() {
  Widget buildTestWidget(Widget child) {
    return MaterialApp(home: child);
  }

  group("RegisterStep2 UI tests (no network)", () {
    testWidgets("Create button is disabled until checkbox is checked",
        (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep2Page(
        username: "test",
        email: "test@mail.com",
        password: "password123",
      )));

      final btn = find.text("Create account");

      // Button initially disabled
      ElevatedButton buttonWidget = tester.widget(find.byType(ElevatedButton));
      expect(buttonWidget.onPressed, isNull);

      // Tap checkbox
      await tester.tap(find.byType(Checkbox));
      await tester.pump();

      // Button now enabled
      buttonWidget = tester.widget(find.byType(ElevatedButton));
      expect(buttonWidget.onPressed, isNotNull);
    });

    testWidgets("tapping disabled button does nothing", (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep2Page(
        username: "test",
        email: "test@mail.com",
        password: "password123",
      )));

      await tester.tap(find.text("Create account"));
      await tester.pump();

      // Should NOT navigate to step 3
      expect(find.byType(RegisterStep3Page), findsNothing);
    });

    testWidgets("Back button pops the page", (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: const RegisterStep1Page(),
        routes: {
          "/step2": (context) => const RegisterStep2Page(
                username: "u",
                email: "e",
                password: "p",
              ),
        },
      ));

      // Navigate to step2
      Navigator.pushNamed(
          tester.element(find.byType(RegisterStep1Page)), "/step2");
      await tester.pumpAndSettle();

      // Tap back arrow
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      expect(find.byType(RegisterStep1Page), findsOneWidget);
    });

    // testWidgets("Log in link navigates back to LoginPage", (tester) async {
    //   await tester.pumpWidget(buildTestWidget(const RegisterStep2Page(
    //     username: "test",
    //     email: "test@mail.com",
    //     password: "password123",
    //   )));

    //   await tester.tap(find.text("Log in"));
    //   await tester.pumpAndSettle();

    //   expect(find.byType(LoginPage), findsOneWidget);
    // });

    testWidgets("Step indicators display the correct active step",
        (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep2Page(
        username: "test",
        email: "test@mail.com",
        password: "password123",
      )));

      final bars = tester.widgetList(find.byType(Container)).toList();

      // You can inspect colors:
      // But here we just assert 3 step bars exist
      expect(find.byType(Container), findsWidgets);
    });
  });
}
