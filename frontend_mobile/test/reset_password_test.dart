import 'package:flutter_test/flutter_test.dart';

void main() {
  String? validate(String code, String password, String confirm) {
    if (code.isEmpty || password.isEmpty || confirm.isEmpty) {
      return "Fill out all fields.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (password != confirm) {
      return "Passwords do not match.";
    }

    return null; // success
  }

  test("returns error when fields are empty", () {
    expect(
      validate("", "password123", "password123"),
      "Fill out all fields.",
    );

    expect(
      validate("123456", "", "password123"),
      "Fill out all fields.",
    );

    expect(
      validate("123456", "password123", ""),
      "Fill out all fields.",
    );
  });

  test("password must be at least 8 characters", () {
    expect(
      validate("123456", "short", "short"),
      "Password must be at least 8 characters.",
    );
  });

  test("passwords must match", () {
    expect(
      validate("123456", "password123", "different"),
      "Passwords do not match.",
    );
  });

  test("returns null if everything is valid", () {
    expect(
      validate("123456", "password123", "password123"),
      null,
    );
  });
}
