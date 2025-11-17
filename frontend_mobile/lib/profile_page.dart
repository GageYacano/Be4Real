import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'login.dart';

const SERVER = "http://be4real.life/api";

// Cache user profile so switching tabs is instant
_CachedPrivateProfile? _cachedPrivate;

class _CachedPrivateProfile {
  final String username;
  final int reactions;
  final int postCount;
  final List<String> images;
  final String? avatar; // base64 or url

  _CachedPrivateProfile({
    required this.username,
    required this.reactions,
    required this.postCount,
    required this.images,
    required this.avatar,
  });
}

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => ProfilePageState();
}

class ProfilePageState extends State<ProfilePage> {
  String username = "Loading...";
  String userId = "";
  int reactions = 0;
  int postCount = 0;
  List<String> postImages = [];
  String? avatarBase64;

  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadLocal();

    // If cached → show instantly, then refresh silently
    if (_cachedPrivate != null) {
      username = _cachedPrivate!.username;
      reactions = _cachedPrivate!.reactions;
      postCount = _cachedPrivate!.postCount;
      postImages = _cachedPrivate!.images;
      avatarBase64 = _cachedPrivate!.avatar;
      loading = false;
      fetchProfile(); // silent update
    } else {
      fetchProfile();
    }
  }

  // Called from HomePage when profile tab is opened
  Future<void> refreshProfile() async {
    setState(() => loading = true);
    await fetchProfile();
  }

  Future<void> loadLocal() async {
    final prefs = await SharedPreferences.getInstance();
    username = prefs.getString("username") ?? "Unknown";
    userId = prefs.getString("currentUserId") ?? "";
  }

  // ---------------------------------------------------------
  // FAST PROFILE FETCH (parallel + cached + first-post-avatar)
  // ---------------------------------------------------------
  Future<void> fetchProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("authToken");
      if (token == null || userId.isEmpty) {
        setState(() => loading = false);
        return;
      }

      // Fetch user info
      final res = await http.get(
        Uri.parse("$SERVER/user/get/$userId"),
        headers: {"Authorization": "Bearer $token"},
      );

      final json = jsonDecode(res.body);
      final user = json["data"]["user"];

      final usernameNew = user["username"] ?? username;
      final reactionsNew = user["reactions"] ?? 0;
      final rawPosts = user["posts"] as List? ?? [];
      final postCountNew = rawPosts.length;
      final backendProfileImg = user["profileImg"];

      // IDs in correct order (reverse so oldest → newest)
      final pidList = rawPosts.map(normalizeId).toList().reversed.toList();

      // Parallel fetch all post images
      final futures = pidList.map((pid) async {
        try {
          final pr = await http.get(
            Uri.parse("$SERVER/post/get/$pid"),
            headers: {"Authorization": "Bearer $token"},
          );
          if (pr.statusCode == 200) {
            final j = jsonDecode(pr.body);
            final img = j["data"]["post"]["imgData"];
            if (img is String && img.isNotEmpty) return img;
          }
        } catch (_) {}
        return null;
      }).toList();

      final results = await Future.wait(futures);
      final imagesNew = results.whereType<String>().toList();

      // Avatar logic (same as PublicProfilePage)
      String? avatarToStore;
      if (imagesNew.isNotEmpty) {
        avatarToStore = imagesNew.first; // FIRST post ever
      } else if (backendProfileImg != null &&
          backendProfileImg.toString().isNotEmpty &&
          backendProfileImg.toString() != "null") {
        avatarToStore = backendProfileImg.toString();
      } else {
        avatarToStore = null; // dicebear fallback
      }

      // cache the profile
      _cachedPrivate = _CachedPrivateProfile(
        username: usernameNew,
        reactions: reactionsNew,
        postCount: postCountNew,
        images: imagesNew,
        avatar: avatarToStore,
      );

      setState(() {
        username = usernameNew;
        reactions = reactionsNew;
        postCount = postCountNew;
        postImages = imagesNew;
        avatarBase64 = avatarToStore;
        loading = false;
      });
    } catch (e) {
      print("Profile load error: $e");
      setState(() => loading = false);
    }
  }

  // ---------------------------------------------------------
  String normalizeId(dynamic v) {
    if (v is String) return v;
    if (v is Map && v.containsKey("\$oid")) return v["\$oid"];
    return v.toString();
  }

  // ---------------------------------------------------------
  ImageProvider getAvatarImage() {
    if (avatarBase64 != null &&
        avatarBase64!.isNotEmpty &&
        avatarBase64 != "null") {
      if (avatarBase64!.startsWith("http")) {
        return NetworkImage(avatarBase64!);
      }
      try {
        return MemoryImage(base64Decode(cleanBase64(avatarBase64!)));
      } catch (_) {}
    }

    return NetworkImage(
      "https://api.dicebear.com/7.x/avataaars/png?seed=$username&size=128",
    );
  }

  String cleanBase64(String raw) {
    final i = raw.indexOf("base64,");
    return i == -1 ? raw : raw.substring(i + 7);
  }

  // ---------------------------------------------------------
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
    const bg = Colors.white;
    const cardBg = Color(0xFFF7F7F7);
    const borderColor = Color(0xFFE5E5E5);

    return Scaffold(
      backgroundColor: bg,
      body: loading
          ? const Center(child: CircularProgressIndicator(color: Colors.black))
          : RefreshIndicator(
              color: Colors.black,
              onRefresh: fetchProfile,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: Colors.grey.shade300,
                          backgroundImage: getAvatarImage(),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          username,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            stat("posts", postCount.toString()),
                            const SizedBox(width: 35),
                            stat("reactions", reactions.toString()),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Posts grid
                  Container(
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: borderColor),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: postImages.isEmpty
                        ? const Text(
                            "You haven't shared anything yet.",
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.black54),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              crossAxisSpacing: 4,
                              mainAxisSpacing: 4,
                            ),
                            itemCount: postImages.length,
                            itemBuilder: (_, i) {
                              return Image.memory(
                                base64Decode(cleanBase64(postImages[i])),
                                fit: BoxFit.cover,
                              );
                            },
                          ),
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
            color: Colors.black,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ],
    );
  }
}
