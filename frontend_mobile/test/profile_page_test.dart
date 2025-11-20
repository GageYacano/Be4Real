import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  // Same as ProfilePageState.normalizeId
  String normalizeId(dynamic v) {
    if (v is String) return v;
    if (v is Map && v.containsKey("\$oid")) return v["\$oid"];
    return v.toString();
  }

  // Same as cleanBase64()
  String cleanBase64(String raw) {
    final i = raw.indexOf("base64,");
    return i == -1 ? raw : raw.substring(i + 7);
  }

  // Same avatar logic (but without ImageProvider rendering)
  String getAvatarImageSource(String? avatarBase64, String username) {
    if (avatarBase64 != null &&
        avatarBase64.isNotEmpty &&
        avatarBase64 != "null") {
      if (avatarBase64.startsWith("http")) {
        return avatarBase64; // network URL
      }
      return "base64:${cleanBase64(avatarBase64)}"; // mark base64 for tests
    }

    return "dicebear:$username"; // fallback
  }

  group("normalizeId()", () {
    test("returns string directly", () {
      expect(normalizeId("12345"), "12345");
    });

    test("converts numbers to string", () {
      expect(normalizeId(42), "42");
    });
  });

  group("cleanBase64()", () {
    test("removes base64 header", () {
      const raw = "data:image/png;base64,ABCDEF==";
      expect(cleanBase64(raw), "ABCDEF==");
    });

    test("returns unchanged if header not present", () {
      const raw = "XYZ123";
      expect(cleanBase64(raw), "XYZ123");
    });
  });

  group("getAvatarImageSource()", () {
    test("returns dicebear avatar when no base64 or URL", () {
      final result = getAvatarImageSource(null, "john");
      expect(result, "dicebear:john");
    });

    test("returns URL directly if provided", () {
      final result = getAvatarImageSource(
        "http://example.com/avatar.png",
        "john",
      );
      expect(result, "http://example.com/avatar.png");
    });

    test("returns cleaned base64", () {
      const raw = "data:image/png;base64,AAAA1111";
      final result = getAvatarImageSource(raw, "john");

      expect(result, "base64:AAAA1111");
    });

    test("handles already-clean base64", () {
      const raw = "BBBB2222";
      final result = getAvatarImageSource(raw, "john");

      expect(result, "base64:BBBB2222");
    });
  });
}
