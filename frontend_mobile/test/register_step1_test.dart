import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_flutter_app/register_step1.dart';
import 'package:my_flutter_app/register_step2.dart';
import 'package:my_flutter_app/login.dart';

void main() {
  Widget buildTestWidget(Widget child) {
    return MaterialApp(
      home: child,
    );
  }

  group("validateFields()", () {
    testWidgets("returns validation errors correctly", (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep1Page()));

      // Access private State class
      final state = tester.state(find.byType(RegisterStep1Page)) as dynamic;

      expect(
        state.validateFields("", "a@b.com", "12345678"),
        "Please fill out all fields.",
      );

      expect(
        state.validateFields("john", "", "12345678"),
        "Please fill out all fields.",
      );

      expect(
        state.validateFields("john", "a@b.com", ""),
        "Please fill out all fields.",
      );

      expect(
        state.validateFields("ab", "test@mail.com", "12345678"),
        "Username must be at least 3 characters.",
      );

      expect(
        state.validateFields("john", "bademail", "12345678"),
        "Invalid email format.",
      );

      expect(
        state.validateFields("john", "test@mail.com", "123"),
        "Password must be at least 8 characters.",
      );

      expect(
        state.validateFields("john", "test@mail.com", "12345678"),
        null,
      );
    });
  });

  group("Widget tests", () {
    testWidgets("shows error when trying to continue with empty fields",
        (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep1Page()));

      await tester.tap(find.text("Continue"));
      await tester.pump();

      expect(find.text("Please fill out all fields."), findsOneWidget);
    });

    testWidgets("successful input navigates to RegisterStep2Page",
        (tester) async {
      await tester.pumpWidget(buildTestWidget(const RegisterStep1Page()));

      await tester.enterText(find.byType(TextField).at(0), "john_doe");
      await tester.enterText(find.byType(TextField).at(1), "test@mail.com");
      await tester.enterText(find.byType(TextField).at(2), "12345678");

      await tester.tap(find.text("Continue"));
      await tester.pumpAndSettle();

      expect(find.byType(RegisterStep2Page), findsOneWidget);
    });

    //   testWidgets("Log in link navigates to LoginPage", (tester) async {
    //     await tester.pumpWidget(buildTestWidget(const RegisterStep1Page()));

    //     await tester.tap(
    //       find.byWidgetPredicate(
    //         (widget) =>
    //             widget is GestureDetector &&
    //             widget.child is RichText &&
    //             (widget.child as RichText).text.toPlainText().contains("Log in"),
    //       ),
    //     );
    //     await tester.pumpAndSettle();

    //     expect(find.byType(LoginPage), findsOneWidget);
    //   });
  });
}
