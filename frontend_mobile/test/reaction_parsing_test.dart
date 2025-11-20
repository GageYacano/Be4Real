import 'package:flutter_test/flutter_test.dart';
import 'package:my_flutter_app/home_page.dart';

void main() {
  test('reaction parsing works for List', () {
    final raw = {
      "❤️": ["u1", "u2"]
    };

    Map<String, int> reactionCounts = {};
    Set<String> selectedByMe = {};
    String myId = "u1";

    raw.forEach((emoji, users) {
      final list = List<String>.from(users);
      reactionCounts[emoji] = list.length;
      if (list.contains(myId)) selectedByMe.add(emoji);
    });

    expect(reactionCounts["❤️"], 2);
    expect(selectedByMe.contains("❤️"), true);
  });

  test('reaction parsing works for Map form', () {
    final raw = {
      "👍": {"a": "u3", "b": "u4"}
    };

    Map<String, int> reactionCounts = {};
    Set<String> selectedByMe = {};
    String myId = "u4";

    raw.forEach((emoji, users) {
      final list = users.values.map((e) => e.toString()).toList();
      reactionCounts[emoji] = list.length;
      if (list.contains(myId)) selectedByMe.add(emoji);
    });

    expect(reactionCounts["👍"], 2);
    expect(selectedByMe.contains("👍"), true);
  });
}
