import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'login.dart';

const SERVER = "http://be4real.life/api";

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => ProfilePageState();
}

class ProfilePageState extends State<ProfilePage> {
  String username = "Loading...";
  String userId = "";
  int followers = 0;
  int following = 0;
  int reactions = 0;

  int postCount = 0; // accurate backend count
  List<String> postImages = [];

  bool loading = true;
  String? avatarBase64;

  @override
  void initState() {
    super.initState();
    loadLocal();
    fetchProfile();
  }

  // 🔥 called from HomePage when profile tab is tapped
  Future<void> refreshProfile() async {
    setState(() {
      loading = true;
    });
    await fetchProfile();
  }

  // ---------------------------------------------------------
  Future<void> loadLocal() async {
    final prefs = await SharedPreferences.getInstance();
    username = prefs.getString("username") ?? "Unknown";
    userId = prefs.getString("currentUserId") ?? "";
  }

  // ---------------------------------------------------------
  Future<void> fetchProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("authToken");

      if (token == null || userId.isEmpty) {
        setState(() => loading = false);
        return;
      }

      final res = await http.get(
        Uri.parse("$SERVER/user/get/$userId"),
        headers: {"Authorization": "Bearer $token"},
      );

      final json = jsonDecode(res.body);
      final user = json["data"]["user"];

      final rawPostsList = user["posts"] as List? ?? [];

      setState(() {
        username = user["username"] ?? username;
        followers = user["followers"] ?? 0;
        following = user["following"] ?? 0;
        reactions = user["reactions"] ?? 0;
        postCount = rawPostsList.length;
      });

      // Normalize Post IDs
      final rawPosts = List<String>.from(
        rawPostsList.map((p) => normalizeId(p)),
      );

      List<String> images = [];
      avatarBase64 = null; // reset so avatar updates on refresh

      for (final pid in rawPosts) {
        try {
          final postRes = await http.get(
            Uri.parse("$SERVER/post/get/$pid"),
            headers: {"Authorization": "Bearer $token"},
          );

          if (postRes.statusCode == 200) {
            final postJson = jsonDecode(postRes.body);
            final img = postJson["data"]["post"]["imgData"];

            if (img is String && img.isNotEmpty) {
              images.add(img);

              // FIRST image becomes avatar
              avatarBase64 ??= img;
            }
          }
        } catch (_) {}
      }

      setState(() {
        postImages = images;
        loading = false;
      });
    } catch (e) {
      print("Profile load error: $e");
      setState(() => loading = false);
    }
  }

  // ---------------------------------------------------------
  String normalizeId(dynamic value) {
    if (value is String) return value;
    if (value is Map) {
      if (value.containsKey("\$oid")) return value["\$oid"];
      if (value.containsKey("oid")) return value["oid"];
    }
    return value.toString();
  }

  // ---------------------------------------------------------
  ImageProvider getAvatarImage() {
    if (avatarBase64 != null) {
      try {
        return MemoryImage(base64Decode(cleanBase64(avatarBase64!)));
      } catch (_) {}
    }

    final seed = Uri.encodeComponent(username);
    final url =
        "https://api.dicebear.com/7.x/avataaars/png?seed=$seed&size=128";

    return NetworkImage(url);
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
              onRefresh: () async {
                await fetchProfile();
              },
              child: ListView(
                padding: const EdgeInsets.only(left: 20, right: 20, top: 10),
                children: [
                  // ---------------------------------
                  // PROFILE HEADER
                  // ---------------------------------
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

                  // ---------------------------------
                  // POSTS GRID
                  // ---------------------------------
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
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black54,
          ),
        ),
      ],
    );
  }
}
