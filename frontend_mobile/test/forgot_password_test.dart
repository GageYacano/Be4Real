import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import '../lib/forgot_password.dart';

void main() {
  testWidgets("ForgotPassword renders input field", (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: ForgotPasswordPage()),
    );

    expect(find.byType(TextField), findsOneWidget);
    expect(find.text("Send Code"), findsOneWidget);
  });
}
