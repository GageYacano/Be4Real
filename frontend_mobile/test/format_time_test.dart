import 'package:flutter_test/flutter_test.dart';

void main() {
  String testFormatTime(int timestamp) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return "${diff ~/ 60000}m";
    if (diff < 86400000) return "${diff ~/ 3600000}h";
    return "${diff ~/ 86400000}d";
  }

  test('testFormatTime produces correct values', () {
    final now = DateTime.now().millisecondsSinceEpoch;

    expect(testFormatTime(now), "Just now");
    expect(testFormatTime(now - 60000), "1m");
    expect(testFormatTime(now - 3600000), "1h");
    expect(testFormatTime(now - 86400000), "1d");
  });
}
