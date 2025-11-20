// import 'dart:convert';
// import 'package:flutter/material.dart';
// import 'package:flutter_test/flutter_test.dart';
// import 'package:mocktail/mocktail.dart';
// import 'package:http/http.dart' as http;
// import 'package:shared_preferences/shared_preferences.dart';

// import 'package:my_flutter_app/public_profile_page.dart';
// import 'package:my_flutter_app/login.dart';

// // -----------------------------------------------------------------------------
// // MOCKS
// // -----------------------------------------------------------------------------
// class MockHttpClient extends Mock implements http.Client {}

// class FakeUri extends Fake implements Uri {}

// // -----------------------------------------------------------------------------
// // TEST HELPERS
// // -----------------------------------------------------------------------------
// http.Response createUserResponse({
//   String username = 'testuser',
//   int reactions = 5,
//   String? profileImg,
//   List<String> posts = const [],
// }) {
//   return http.Response(
//     jsonEncode({
//       'data': {
//         'user': {
//           'username': username,
//           'reactions': reactions,
//           'profileImg': profileImg,
//           'posts': posts.map((id) => {'\$oid': id}).toList(),
//         }
//       }
//     }),
//     200,
//   );
// }

// http.Response createPostResponse(String imgData) {
//   return http.Response(
//     jsonEncode({
//       'data': {
//         'post': {
//           'imgData': imgData,
//         }
//       }
//     }),
//     200,
//   );
// }

// // -----------------------------------------------------------------------------
// // TESTS
// // -----------------------------------------------------------------------------
// void main() {
//   TestWidgetsFlutterBinding.ensureInitialized();

//   late MockHttpClient mockHttp;

//   setUpAll(() {
//     registerFallbackValue(FakeUri());
//   });

//   setUp(() {
//     mockHttp = MockHttpClient();
//   });

//   group('PublicProfilePage - UI Elements', () {
//     testWidgets('shows loading indicator initially', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => Future.delayed(
//                 const Duration(seconds: 1),
//                 () => createUserResponse(),
//               ));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       expect(find.byType(CircularProgressIndicator), findsOneWidget);
//     });

//     testWidgets('displays username in app bar and body', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse(username: 'john_doe'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('john_doe'), findsAtLeastNWidgets(1));
//     });

//     testWidgets('displays stats correctly', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async =>
//               createUserResponse(reactions: 10, posts: ['p1', 'p2']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('base64img1'));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p2'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('base64img2'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('10'), findsOneWidget); // reactions
//       expect(find.text('2'), findsOneWidget); // post count
//       expect(find.text('posts'), findsOneWidget);
//       expect(find.text('reactions'), findsOneWidget);
//     });

//     testWidgets('shows "No posts yet" when no posts', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse(posts: []));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('No posts yet.'), findsOneWidget);
//     });

//     testWidgets('displays CircleAvatar', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.byType(CircleAvatar), findsOneWidget);
//     });

//     testWidgets('displays logout button', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.byIcon(Icons.logout), findsOneWidget);
//     });

//     testWidgets('displays RefreshIndicator', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.byType(RefreshIndicator), findsOneWidget);
//     });
//   });

//   group('PublicProfilePage - Data Fetching', () {
//     testWidgets('fetches user data from API', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: {'Authorization': 'Bearer test_token'},
//           )).thenAnswer((_) async => createUserResponse(
//             username: 'api_user',
//             reactions: 15,
//           ));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       verify(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: {'Authorization': 'Bearer test_token'},
//           )).called(1);

//       expect(find.text('api_user'), findsAtLeastNWidgets(1));
//       expect(find.text('15'), findsOneWidget);
//     });

//     testWidgets('fetches post images in parallel', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       const fakeBase64 =
//           'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(posts: ['p1', 'p2']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse(fakeBase64));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p2'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse(fakeBase64));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       verify(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).called(1);

//       verify(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p2'),
//             headers: any(named: 'headers'),
//           )).called(1);

//       expect(find.byType(GridView), findsOneWidget);
//     });

//     testWidgets('handles missing auth token', (tester) async {
//       SharedPreferences.setMockInitialValues({}); // No token

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should show loading state and not crash
//       expect(find.text('Loading...'), findsAtLeastNWidgets(1));
//     });

//     testWidgets('handles network errors gracefully', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenThrow(Exception('Network error'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should stop loading without crashing
//       expect(find.byType(CircularProgressIndicator), findsNothing);
//     });

//     testWidgets('handles 404 response', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => http.Response('Not found', 404));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should handle gracefully
//       expect(find.byType(CircularProgressIndicator), findsNothing);
//     });
//   });

//   group('PublicProfilePage - Pull to Refresh', () {
//     testWidgets('refreshes data on pull down', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       int callCount = 0;
//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async {
//         callCount++;
//         return createUserResponse();
//       });

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       final initialCalls = callCount;

//       // Pull to refresh
//       await tester.drag(find.byType(RefreshIndicator), const Offset(0, 300));
//       await tester.pumpAndSettle();

//       expect(callCount, greaterThan(initialCalls));
//     });

//     testWidgets('refresh indicator has correct color', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       final refreshIndicator =
//           tester.widget<RefreshIndicator>(find.byType(RefreshIndicator));
//       expect(refreshIndicator.color, equals(Colors.black));
//     });
//   });

//   group('PublicProfilePage - Logout', () {
//     testWidgets('logout clears preferences', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       await tester.tap(find.byIcon(Icons.logout));
//       await tester.pumpAndSettle();

//       final prefs = await SharedPreferences.getInstance();
//       expect(prefs.getString('authToken'), isNull);
//     });

//     testWidgets('logout navigates to login page', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       await tester.tap(find.byIcon(Icons.logout));
//       await tester.pumpAndSettle();

//       expect(find.byType(LoginPage), findsOneWidget);
//       expect(find.byType(PublicProfilePage), findsNothing);
//     });

//     testWidgets('logout removes all navigation history', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse());

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       await tester.tap(find.byIcon(Icons.logout));
//       await tester.pumpAndSettle();

//       // Try to go back - should not be possible
//       final navigator = tester.state<NavigatorState>(find.byType(Navigator));
//       expect(navigator.canPop(), isFalse);
//     });
//   });

//   group('PublicProfilePage - GridView', () {
//     testWidgets('displays posts in grid', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       const fakeBase64 =
//           'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

//       when(() => mockHttp.get(
//                 Uri.parse('http://be4real.life/api/user/get/123'),
//                 headers: any(named: 'headers'),
//               ))
//           .thenAnswer(
//               (_) async => createUserResponse(posts: ['p1', 'p2', 'p3']));

//       for (var i = 1; i <= 3; i++) {
//         when(() => mockHttp.get(
//               Uri.parse('http://be4real.life/api/post/get/p$i'),
//               headers: any(named: 'headers'),
//             )).thenAnswer((_) async => createPostResponse(fakeBase64));
//       }

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.byType(GridView), findsOneWidget);
//       expect(find.byType(Image), findsNWidgets(4)); // 3 posts + 1 avatar
//     });

//     testWidgets('grid has correct configuration', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       const fakeBase64 =
//           'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(posts: ['p1']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse(fakeBase64));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       final gridView = tester.widget<GridView>(find.byType(GridView));
//       final delegate =
//           gridView.gridDelegate as SliverGridDelegateWithFixedCrossAxisCount;

//       expect(delegate.crossAxisCount, equals(3));
//       expect(delegate.mainAxisSpacing, equals(4));
//       expect(delegate.crossAxisSpacing, equals(4));
//     });

//     testWidgets('grid items have correct fit', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       const fakeBase64 =
//           'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(posts: ['p1']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse(fakeBase64));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Find Image widgets inside GridView (exclude avatar)
//       final images = find.byType(Image).evaluate().toList();
//       // Avatar is first, grid images follow
//       expect(images.length, greaterThan(1));
//     });
//   });

//   group('PublicProfilePage - Error Handling', () {
//     testWidgets('handles invalid JSON response', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => http.Response('Invalid JSON', 200));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should stop loading without crashing
//       expect(find.byType(CircularProgressIndicator), findsNothing);
//     });

//     testWidgets('handles failed post fetches', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(posts: ['p1', 'p2']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => http.Response('', 404));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p2'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('base64'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should only show 1 successful post (the one that returned 200)
//       expect(find.text('1'), findsOneWidget); // post count
//     });

//     testWidgets('handles empty post data', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/123'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(posts: ['p1']));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse(''));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       // Should handle empty image data
//       expect(find.text('No posts yet.'), findsOneWidget);
//     });
//   });

//   group('PublicProfilePage - AppBar', () {
//     testWidgets('app bar has correct styling', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse(username: 'test_user'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       final appBar = tester.widget<AppBar>(find.byType(AppBar));
//       expect(appBar.backgroundColor, equals(Colors.white));
//       expect(appBar.foregroundColor, equals(Colors.black));
//       expect(appBar.elevation, equals(0.3));
//     });

//     testWidgets('app bar title updates with username', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer(
//               (_) async => createUserResponse(username: 'dynamic_user'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       final appBar = tester.widget<AppBar>(find.byType(AppBar));
//       final title = appBar.title as Text;
//       expect(title.data, equals('dynamic_user'));
//     });
//   });

//   group('PublicProfilePage - Stats Widget', () {
//     testWidgets('stat widget displays correctly', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(any(), headers: any(named: 'headers')))
//           .thenAnswer((_) async => createUserResponse(
//                 reactions: 42,
//                 posts: ['p1', 'p2', 'p3'],
//               ));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('img1'));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p2'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('img2'));

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/post/get/p3'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createPostResponse('img3'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: '123'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('42'), findsOneWidget);
//       expect(find.text('3'), findsOneWidget);
//       expect(find.text('posts'), findsOneWidget);
//       expect(find.text('reactions'), findsOneWidget);
//     });
//   });

//   group('PublicProfilePage - Different User IDs', () {
//     testWidgets('handles different user IDs correctly', (tester) async {
//       SharedPreferences.setMockInitialValues({'authToken': 'test_token'});

//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/user1'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(username: 'user_one'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: 'user1'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('user_one'), findsAtLeastNWidgets(1));

//       // Now test with different user ID
//       when(() => mockHttp.get(
//             Uri.parse('http://be4real.life/api/user/get/user2'),
//             headers: any(named: 'headers'),
//           )).thenAnswer((_) async => createUserResponse(username: 'user_two'));

//       await tester.pumpWidget(
//         MaterialApp(
//           home: PublicProfilePage(userId: 'user2'),
//         ),
//       );

//       await tester.pumpAndSettle();

//       expect(find.text('user_two'), findsAtLeastNWidgets(1));
//     });
//   });
// }
