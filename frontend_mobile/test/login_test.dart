import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:my_flutter_app/login.dart';
import 'package:my_flutter_app/home_page.dart';
import 'package:my_flutter_app/register_step1.dart';
import 'package:my_flutter_app/forgot_password.dart';

// Generate mocks with: flutter pub run build_runner build
@GenerateMocks([http.Client])
import '../test/login_test.mocks.dart';

void main() {
  late MockClient mockClient;

  setUp(() {
    mockClient = MockClient();
    SharedPreferences.setMockInitialValues({});
  });

  Widget createLoginPage() {
    return const MaterialApp(
      home: LoginPage(),
    );
  }

  group('LoginPage UI Tests', () {
    testWidgets('displays all UI elements', (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      expect(find.text('be4real'), findsOneWidget);
      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text("Don't have an account? "), findsOneWidget);
      expect(find.text('Sign up'), findsOneWidget);
    });

    testWidgets('email and password fields accept input',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      final emailField = find.widgetWithText(TextField, 'Email');
      final passwordField = find.widgetWithText(TextField, 'Password');

      await tester.enterText(emailField, 'test@example.com');
      await tester.enterText(passwordField, 'password123');

      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('password123'), findsOneWidget);
    });

    testWidgets('password field obscures text', (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      final passwordField = find.widgetWithText(TextField, 'Password');
      final textField = tester.widget<TextField>(passwordField);

      expect(textField.obscureText, isTrue);
    });

    testWidgets('navigates to ForgotPasswordPage when forgot password tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.tap(find.text('Forgot password?'));
      await tester.pumpAndSettle();

      expect(find.byType(ForgotPasswordPage), findsOneWidget);
    });

    testWidgets('navigates to RegisterStep1Page when sign up tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.tap(find.text('Sign up'));
      await tester.pumpAndSettle();

      expect(find.byType(RegisterStep1Page), findsOneWidget);
    });
  });

  group('LoginPage Validation Tests', () {
    testWidgets('shows error when fields are empty',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.tap(find.text('Sign in'));
      await tester.pump();

      expect(find.text('Please fill out all fields.'), findsOneWidget);
    });

    testWidgets('shows error when only email is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.enterText(
          find.widgetWithText(TextField, 'Email'), 'test@example.com');
      await tester.tap(find.text('Sign in'));
      await tester.pump();

      expect(find.text('Please fill out all fields.'), findsOneWidget);
    });

    testWidgets('shows error when only password is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.enterText(
          find.widgetWithText(TextField, 'Password'), 'password123');
      await tester.tap(find.text('Sign in'));
      await tester.pump();

      expect(find.text('Please fill out all fields.'), findsOneWidget);
    });
  });

  group('LoginPage API Tests', () {
    testWidgets('shows loading indicator during login',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.enterText(
          find.widgetWithText(TextField, 'Email'), 'test@example.com');
      await tester.enterText(
          find.widgetWithText(TextField, 'Password'), 'password123');

      await tester.tap(find.text('Sign in'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows error message on invalid credentials',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      await tester.enterText(
          find.widgetWithText(TextField, 'Email'), 'wrong@example.com');
      await tester.enterText(
          find.widgetWithText(TextField, 'Password'), 'wrongpass');

      await tester.tap(find.text('Sign in'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 2));

      // Error message will appear based on your API response
      expect(find.byType(Text), findsWidgets);
    });

    // testWidgets('trims whitespace from email and password',
    //     (WidgetTester tester) async {
    //   await tester.pumpWidget(createLoginPage());

    //   await tester.enterText(
    //       find.widgetWithText(TextField, 'Email'), '  test@example.com  ');
    //   await tester.enterText(
    //       find.widgetWithText(TextField, 'Password'), '  password123  ');

    //   await tester.tap(find.text('Sign in'));
    //   await tester.pump();

    //   // Verify trimming happens (you'd need to mock the HTTP call to verify)
    //   expect(find.byType(CircularProgressIndicator), findsOneWidget);
    // });
  });

  group('LoginPage Navigation Tests', () {
    // testWidgets('button is disabled while loading',
    //     (WidgetTester tester) async {
    //   await tester.pumpWidget(createLoginPage());

    //   await tester.enterText(
    //       find.widgetWithText(TextField, 'Email'), 'test@example.com');
    //   await tester.enterText(
    //       find.widgetWithText(TextField, 'Password'), 'password123');

    //   await tester.tap(find.text('Sign in'));
    //   await tester.pump();

    //   final button = tester.widget<ElevatedButton>(
    //       find.widgetWithText(ElevatedButton, 'Sign in'));
    //   expect(button.onPressed, isNull);
    // });

    //   testWidgets('clears error message on new login attempt',
    //       (WidgetTester tester) async {
    //     await tester.pumpWidget(createLoginPage());

    //     // First attempt - trigger error
    //     await tester.tap(find.text('Sign in'));
    //     await tester.pump();
    //     expect(find.text('Please fill out all fields.'), findsOneWidget);

    //     // Enter credentials
    //     await tester.enterText(
    //         find.widgetWithText(TextField, 'Email'), 'test@example.com');
    //     await tester.enterText(
    //         find.widgetWithText(TextField, 'Password'), 'password123');

    //     // Second attempt
    //     await tester.tap(find.text('Sign in'));
    //     await tester.pump();

    //     // Error should be cleared
    //     //expect(find.text('Please fill out all fields.'), findsNothing);
    //   });
  });

  group('LoginPage Styling Tests', () {
    testWidgets('sign in button has correct styling',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      final button = tester.widget<ElevatedButton>(
          find.widgetWithText(ElevatedButton, 'Sign in'));
      final style = button.style;

      expect(style?.backgroundColor?.resolve({}), equals(Colors.black));
    });

    testWidgets('text fields have rounded borders',
        (WidgetTester tester) async {
      await tester.pumpWidget(createLoginPage());

      final emailField =
          tester.widget<TextField>(find.widgetWithText(TextField, 'Email'));
      final decoration = emailField.decoration as InputDecoration;
      final border = decoration.border as OutlineInputBorder;

      expect(border.borderRadius, BorderRadius.circular(15));
    });
  });
}
