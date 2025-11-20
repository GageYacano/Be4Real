import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import '../lib/home_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      "authToken": "test-token",
      "currentUserId": "test-user",
    });
  });

  testWidgets("HomePage loads", (tester) async {
    await tester.pumpWidget(
      MaterialApp(
          home: HomePage(authToken: "test-token", currentUserId: "test-user")),
    );

    expect(find.byType(HomePage), findsOneWidget);
  });
}
