import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'login.dart';

class PublicProfilePage extends StatefulWidget {
  final String userId;

  const PublicProfilePage({super.key, required this.userId});

  @override
  State<PublicProfilePage> createState() => _PublicProfilePageState();
}

class _PublicProfilePageState extends State<PublicProfilePage> {
  String username = "Loading...";
  int reactions = 0;
  int postCount = 0;
  List<String> postImages = [];
  String? backendProfileImg;

  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchPublicProfile();
  }

  // ---------------------------------------------------------
  // Fetch Public Profile
  // ---------------------------------------------------------
  Future<void> fetchPublicProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("authToken");
      if (token == null) return;

      // GET USER INFO
      final res = await http.get(
        Uri.parse("http://be4real.life/api/user/get/${widget.userId}"),
        headers: {"Authorization": "Bearer $token"},
      );

      final json = jsonDecode(res.body);
      final user = json["data"]["user"];

      username = user["username"] ?? "Unknown";
      reactions = user["reactions"] ?? 0;
      backendProfileImg = user["profileImg"];
      final rawPosts = user["posts"] as List? ?? [];
      postCount = rawPosts.length;

      // Fetch Post Images
      List<String> imgs = [];

      for (final p in rawPosts) {
        final pid = normalizeId(p);

        final postRes = await http.get(
          Uri.parse("http://be4real.life/api/post/get/$pid"),
          headers: {"Authorization": "Bearer $token"},
        );

        if (postRes.statusCode == 200) {
          final postJson = jsonDecode(postRes.body);
          final img = postJson["data"]["post"]["imgData"];
          if (img is String && img.isNotEmpty) imgs.add(img);
        }
      }

      setState(() {
        postImages = imgs;
        loading = false;
      });
    } catch (_) {
      setState(() => loading = false);
    }
  }

  // ---------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------

  String normalizeId(dynamic v) {
    if (v is String) return v;
    if (v is Map && v.containsKey("\$oid")) return v["\$oid"];
    return v.toString();
  }

  String cleanBase64(String raw) {
    final i = raw.indexOf("base64,");
    return i == -1 ? raw : raw.substring(i + 7);
  }

  ImageProvider getAvatarImage() {
    if (backendProfileImg != null &&
        backendProfileImg!.isNotEmpty &&
        backendProfileImg != "null" &&
        !backendProfileImg!.contains("default")) {
      return NetworkImage(backendProfileImg!);
    }

    return NetworkImage(
        "https://api.dicebear.com/7.x/avataaars/png?seed=$username&size=128");
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
      (_) => false,
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          username,
          style: const TextStyle(color: Colors.black),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.3,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.black),
            onPressed: logout,
          )
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())

          // ⭐⭐ Added RefreshIndicator ⭐⭐
          : RefreshIndicator(
              color: Colors.black,
              onRefresh: () async {
                await fetchPublicProfile();
              },
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundImage: getAvatarImage(),
                          backgroundColor: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          username,
                          style: const TextStyle(
                              fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            stat("posts", postCount.toString()),
                            const SizedBox(width: 40),
                            stat("reactions", reactions.toString()),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                  postImages.isEmpty
                      ? const Text(
                          "No posts yet.",
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54),
                        )
                      : GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 4,
                            crossAxisSpacing: 4,
                          ),
                          itemCount: postImages.length,
                          itemBuilder: (_, i) {
                            return Image.memory(
                              base64Decode(cleanBase64(postImages[i])),
                              fit: BoxFit.cover,
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }

  Widget stat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black54,
          ),
        ),
      ],
    );
  }
}
