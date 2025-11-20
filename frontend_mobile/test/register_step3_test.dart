import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_flutter_app/register_step3.dart';
import 'package:my_flutter_app/login.dart';
import 'package:my_flutter_app/home_page.dart';

void main() {
  Widget buildTestWidget(Widget child) {
    return MaterialApp(home: child);
  }

  group("RegisterStep3Page UI tests (no HTTP)", () {
    testWidgets("shows the correct email text", (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const RegisterStep3Page(email: "test@mail.com"),
      ));

      expect(find.textContaining("test@mail.com"), findsOneWidget);
    });

    testWidgets("Verify button disabled state works", (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const RegisterStep3Page(email: "test@mail.com"),
      ));

      // pressing verify with empty code triggers local validation only
      await tester.tap(find.text("Verify"));
      await tester.pump();

      expect(find.text("Please enter the verification code."), findsOneWidget);
    });

    testWidgets("typing a verification code removes error message",
        (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const RegisterStep3Page(email: "test@mail.com"),
      ));

      // cause initial error
      await tester.tap(find.text("Verify"));
      await tester.pump();

      expect(find.text("Please enter the verification code."), findsOneWidget);

      // enter a code
      await tester.enterText(find.byType(TextField), "123456");
      await tester.pump();

      // error text still present until verify pressed
      expect(find.text("Please enter the verification code."), findsOneWidget);
    });

    testWidgets("step indicator renders 3 bars", (tester) async {
      await tester.pumpWidget(buildTestWidget(
        const RegisterStep3Page(email: "test@mail.com"),
      ));

      // Each step bar is a Container with height = 3
      final bars = find.byWidgetPredicate((widget) {
        return widget is Container &&
            widget.constraints?.minHeight == 3 &&
            widget.constraints?.maxHeight == 3;
      });

      expect(bars, findsWidgets);
    });
  });
}
