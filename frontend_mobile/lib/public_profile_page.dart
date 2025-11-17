import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'login.dart';

// Global cache so public profiles load instantly next time
final Map<String, _CachedPublicProfile> _publicProfileCache = {};

class _CachedPublicProfile {
  final String username;
  final int reactions;
  final int postCount;
  final List<String> images;
  final String? avatar; // can be base64 OR url

  _CachedPublicProfile({
    required this.username,
    required this.reactions,
    required this.postCount,
    required this.images,
    required this.avatar,
  });
}

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
  String? backendProfileImg; // stores either first post img (base64) OR profileImg url

  bool loading = true;

  @override
  void initState() {
    super.initState();

    // If cached → show instantly, then refresh in background
    if (_publicProfileCache.containsKey(widget.userId)) {
      final c = _publicProfileCache[widget.userId]!;
      username = c.username;
      reactions = c.reactions;
      postCount = c.postCount;
      postImages = c.images;
      backendProfileImg = c.avatar;
      loading = false;

      // silent refresh
      fetchPublicProfile();
    } else {
      fetchPublicProfile();
    }
  }

  // ---------------------------------------------------------
  // Fetch Public Profile (FAST + correct avatar logic)
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

      final newUsername = user["username"] ?? "Unknown";
      final newReactions = user["reactions"] ?? 0;
      final profileImgFromBackend = user["profileImg"];
      final rawPosts = user["posts"] as List? ?? [];
      final newPostCount = rawPosts.length;

      // ---- FAST POST IMAGE FETCHING USING PARALLEL CALLS ----
      final pids = rawPosts.map(normalizeId).toList();

      final futures = pids.map((pid) async {
        final r = await http.get(
          Uri.parse("http://be4real.life/api/post/get/$pid"),
          headers: {"Authorization": "Bearer $token"},
        );
        if (r.statusCode == 200) {
          final j = jsonDecode(r.body);
          final img = j["data"]["post"]["imgData"];
          if (img is String && img.isNotEmpty) return img;
        }
        return null;
      }).toList();

      final results = await Future.wait(futures);
      final newImages = results.whereType<String>().toList();

      // ✅ Avatar logic:
      // 1) If any posts exist → first post image (base64)
      // 2) Else if profileImg exists → use that (url/string)
      // 3) Else → null → dicebear fallback
      String? avatarToStore;
      if (newImages.isNotEmpty) {
        avatarToStore = newImages.first; // base64 image
      } else if (profileImgFromBackend != null &&
          profileImgFromBackend.toString().isNotEmpty &&
          profileImgFromBackend.toString() != "null") {
        avatarToStore = profileImgFromBackend.toString(); // backend url
      } else {
        avatarToStore = null;
      }

      // update cache
      _publicProfileCache[widget.userId] = _CachedPublicProfile(
        username: newUsername,
        reactions: newReactions,
        postCount: newPostCount,
        images: newImages,
        avatar: avatarToStore,
      );

      setState(() {
        username = newUsername;
        reactions = newReactions;
        postCount = newPostCount;
        postImages = newImages;
        backendProfileImg = avatarToStore;
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
    // If we have something stored, decide whether it's base64 or URL
    if (backendProfileImg != null &&
        backendProfileImg!.isNotEmpty &&
        backendProfileImg != "null") {
      // If it's clearly a URL → use NetworkImage
      if (backendProfileImg!.startsWith("http")) {
        return NetworkImage(backendProfileImg!);
      }
      // Otherwise treat as base64 image
      try {
        return MemoryImage(base64Decode(cleanBase64(backendProfileImg!)));
      } catch (_) {
        // fall through to dicebear if decoding fails
      }
    }

    // Fallback: dicebear avatar based on username
    return NetworkImage(
      "https://api.dicebear.com/7.x/avataaars/png?seed=$username&size=128",
    );
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
          : RefreshIndicator(
              color: Colors.black,
              onRefresh: fetchPublicProfile,
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
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
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
