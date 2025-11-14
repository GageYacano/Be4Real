import 'dart:convert';
import 'package:http/http.dart' as http;
import 'post.dart';
import 'auth_service.dart';

class FeedService {
  static const String baseUrl = "http://167.99.26.82/api/post/get_feed";
  final AuthService _authService = AuthService();

  /// GET FEED
  Future<List<Post>> getFeed() async {
    final token = await _authService.getToken();

    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((e) => Post.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load feed: ${response.body}");
    }
  }

  /// LIKE POST
  Future<void> likePost(String postId) async {
    final token = await _authService.getToken();

    await http.post(
      Uri.parse("$baseUrl/$postId/like"),
      headers: {"Authorization": "Bearer $token"},
    );
  }

  /// COMMENT ON POST
  Future<void> commentOnPost(String postId, String text) async {
    final token = await _authService.getToken();

    await http.post(
      Uri.parse("$baseUrl/$postId/comment"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({"text": text}),
    );
  }
}
