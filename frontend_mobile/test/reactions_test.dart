// import 'package:flutter/material.dart';
// import 'package:flutter_test/flutter_test.dart';
// import 'package:shared_preferences/shared_preferences.dart';
// import 'package:my_flutter_app/home_page.dart';

// int _extractCount(WidgetTester tester) {
//   final countText = tester.widget<Text>(
//     find.textContaining(RegExp(r'^\d+$')).first,
//   );
//   return int.parse(countText.data!);
// }

// void main() {
//   setUp(() {
//     SharedPreferences.setMockInitialValues({
//       "authToken": "test-token",
//       "currentUserId": "test-user",
//     });
//   });

//   int _extractCountForEmoji(WidgetTester tester, String emoji) {
//     // Find the Row (or parent widget) containing the emoji
//     final emojiWidget = find.text(emoji).first;
//     final parent = find
//         .ancestor(
//           of: emojiWidget,
//           matching: find.byType(Row),
//         )
//         .first;

//     // Inside that Row find the Text widget that is a number
//     final numberFinder = find.descendant(
//       of: parent,
//       matching: find.byWidgetPredicate(
//         (widget) =>
//             widget is Text && RegExp(r'^\d+$').hasMatch(widget.data ?? ''),
//       ),
//     );

//     final countText = tester.widget<Text>(numberFinder);
//     return int.parse(countText.data!);
//   }

//   testWidgets('Reaction count updates when reaction emoji tapped',
//       (tester) async {
//     await tester.pumpWidget(MaterialApp(
//         home: const HomePage(
//             authToken: "test-token", currentUserId: "test-user")));

//     const emoji = "👍";

//     final thumbsUp = find.text(emoji);
//     expect(thumbsUp, findsWidgets);

//     final before = _extractCountForEmoji(tester, emoji);

//     await tester.tap(thumbsUp.first);
//     await tester.pump();

//     final after = _extractCountForEmoji(tester, emoji);

//     expect(after, before + 1);
//   });
// }

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:my_flutter_app/home_page.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      "authToken": "test-token",
      "currentUserId": "test-user",
    });
  });

  /// Extracts the reaction count for a given emoji by:
  /// - finding the emoji Text widget
  /// - finding the Row containing that emoji
  /// - finding the Text widget inside the Row that contains only digits
  int _extractCountForEmoji(WidgetTester tester, String emoji) {
    final emojiFinder = find.text(emoji).first;

    // Row that contains emoji + count
    final rowFinder = find
        .ancestor(
          of: emojiFinder,
          matching: find.byType(Row),
        )
        .first;

    // Inside that row find the text containing only digits
    final countFinder = find.descendant(
      of: rowFinder,
      matching: find.byWidgetPredicate(
        (widget) =>
            widget is Text && RegExp(r'^\d+$').hasMatch(widget.data ?? ''),
      ),
    );

    final textWidget = tester.widget<Text>(countFinder);
    return int.parse(textWidget.data!);
  }

  testWidgets(
    'Reaction count updates when 👍 emoji is tapped',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HomePage(
            authToken: "test-token",
            currentUserId: "test-user",
          ),
        ),
      );

      const emoji = "👍";

      final emojiFinder = find.text(emoji);
      expect(emojiFinder, findsWidgets);

      // Before tapping
      final before = _extractCountForEmoji(tester, emoji);

      // Tap the reaction chip
      await tester.tap(emojiFinder.first);
      await tester.pump(); // Trigger rebuild after setState()

      // After tapping
      final after = _extractCountForEmoji(tester, emoji);

      expect(after, before + 1);
    },
  );
}
