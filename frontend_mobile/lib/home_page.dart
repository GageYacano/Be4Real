import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:math';

import 'main.dart';
import 'profile_page.dart';
import 'public_profile_page.dart';
import 'login.dart';
import 'camera.dart';
import 'auto_post.dart';

const SERVER = "http://be4real.life/api";

class HomePage extends StatefulWidget {
  final String authToken;
  final String? currentUserId;

  const HomePage({
    super.key,
    required this.authToken,
    this.currentUserId,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Post> posts = [];
  bool loading = true;
  String? error;
  Timer? _autoPostTimer;
  final Random _rng = Random();

  int index = 0; // 0 = feed, 1 = profile

  // persistent profile with key so we can tell it to refresh
  late final ProfilePage _profilePage;
  final GlobalKey<ProfilePageState> _profileKey = GlobalKey<ProfilePageState>();

  // cache for public profiles (so they don't rebuild every time)
  final Map<String, PublicProfilePage> _publicProfileCache = {};

  @override
  void initState() {
    super.initState();

    print("HomePage initState called!");

    // Create once with key
    _profilePage = ProfilePage(key: _profileKey);

    fetchFeed();

    // Pass context so camera can open
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AutoPostService().start(context);
    });
    //AutoPostService().start(context);
    //_startRandomPostingLoop();
  }

  // void _startRandomPostingLoop() {
  //   // Start immediately
  //   _scheduleNextPost();
  // }

  // void _scheduleNextPost() {
  //   // random number between 5 sec and 60 sec
  //   int nextDelay = _rng.nextInt(55) + 5; // results in 5–60 seconds
  //   print("Next auto-picture in $nextDelay seconds...");

  //   _autoPostTimer?.cancel();
  //   _autoPostTimer = Timer(Duration(seconds: nextDelay), () async {
  //     // Take + Upload
  //     print("Taking automatic picture...");
  //     bool ok =
  //         await CameraService.autoCaptureAndUpload(context, widget.authToken);

  //     if (ok) {
  //       ScaffoldMessenger.of(context).showSnackBar(
  //         SnackBar(content: Text("Picture uploaded successfully!")),
  //       );
  //     } else {
  //       ScaffoldMessenger.of(context).showSnackBar(
  //         SnackBar(content: Text("Failed to upload picture.")),
  //       );
  //     }

  //     if (ok) {
  //       print("Auto post uploaded successfully!");
  //     } else {
  //       print("Auto post failed.");
  //     }

  //     // Schedule the next one
  //     _scheduleNextPost();
  //   });
  // }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  String cleanBase64(String raw) {
    final idx = raw.indexOf("base64,");
    return idx != -1 ? raw.substring(idx + 7) : raw;
  }

  String dicebearURL(String username) {
    final seed = Uri.encodeComponent(username);
    return "https://api.dicebear.com/7.x/avataaars/png?seed=$seed&size=128";
    // if you want the same avatar service as before
  }

  String resolveProfileAvatar(String raw, String username) {
    if (raw.isEmpty || raw == "null") return dicebearURL(username);
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("/assets") || raw.contains("default")) {
      return dicebearURL(username);
    }
    return raw;
  }

  // -------------------------------------------------------------
  // Fetch user info for each post
  // -------------------------------------------------------------
  Future<Map<String, String>> fetchUserInfo(String uid) async {
    try {
      final res = await http.get(
        Uri.parse("$SERVER/user/get/$uid"),
        headers: {"Authorization": "Bearer ${widget.authToken}"},
      );

      final json = jsonDecode(res.body);
      final u = json["data"]["user"];

      return {
        "username": u["username"] ?? "Unknown",
        "profileImg": u["profileImg"] ?? "",
      };
    } catch (_) {
      return {"username": "Unknown", "profileImg": ""};
    }
  }

  // -------------------------------------------------------------
  // Load Feed
  // -------------------------------------------------------------
  Future<void> fetchFeed() async {
    setState(() => loading = true);

    try {
      final res = await http.get(
        Uri.parse("$SERVER/post/get-feed?limit=100"),
        headers: {"Authorization": "Bearer ${widget.authToken}"},
      );

      final body = jsonDecode(res.body);
      final rawPosts = body["data"]["posts"] as List;

      List<Post> loaded = [];

      for (final p in rawPosts) {
        final uid = p["user"];
        final userInfo = await fetchUserInfo(uid);

        final avatar = resolveProfileAvatar(
          userInfo["profileImg"]!,
          userInfo["username"]!,
        );

        // Parse reactions
        final rawReactions = p["reactions"] ?? {};
        Map<String, int> reactionCounts = {};
        Set<String> selectedByMe = {};

        rawReactions.forEach((emoji, users) {
          List<String> userIds = [];

          if (users is List) userIds = List<String>.from(users);
          if (users is Map) {
            userIds = users.values.map((e) => e.toString()).toList();
          }

          reactionCounts[emoji] = userIds.length;

          if (widget.currentUserId != null &&
              userIds.contains(widget.currentUserId)) {
            selectedByMe.add(emoji);
          }
        });

        loaded.add(
          Post(
            postId: p["_id"],
            userId: uid,
            username: userInfo["username"]!,
            profileImg: avatar,
            image: p["imgData"] ?? "",
            time: formatTime(p["ctime"]),
            reactionList: reactionCounts,
            userReactions: selectedByMe,
          ),
        );
      }

      setState(() => posts = loaded);
    } catch (e) {
      setState(() => error = "Error: $e");
    } finally {
      setState(() => loading = false);
    }
  }

  // -------------------------------------------------------------
  // Time Formatting
  // -------------------------------------------------------------
  String formatTime(int timestamp) {
    final diff = DateTime.now().millisecondsSinceEpoch - timestamp;
    final minutes = diff ~/ 60000;

    if (minutes < 1) return "Just now";
    if (minutes < 60) return "${minutes}m";
    final hours = minutes ~/ 60;
    if (hours < 24) return "${hours}h";
    return "${hours ~/ 24}d";
  }

  // -------------------------------------------------------------
  // Toggle Reaction
  // -------------------------------------------------------------
  Future<void> toggleReaction(Post post, String emoji) async {
    final removing = post.userReactions.contains(emoji);

    await http.post(
      Uri.parse("$SERVER/post/react"),
      headers: {
        "Authorization": "Bearer ${widget.authToken}",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "postId": post.postId,
        "reaction": emoji,
        "removeReaction": removing,
      }),
    );
  }

  // -------------------------------------------------------------
  // UI — Feed View w/ Pull-to-refresh
  // -------------------------------------------------------------
  Widget buildFeedView() {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));

    return RefreshIndicator(
      color: Colors.black,
      onRefresh: () async {
        await fetchFeed();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: posts.length + 1,
        itemBuilder: (_, i) {
          if (i == 0) return buildHowItWorksCard();
          return buildPostCard(posts[i - 1]);
        },
      ),
    );
  }

  Widget buildHowItWorksCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7F7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: "How it works: ",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            TextSpan(
              text:
                  "Your phone takes random photos throughout the day. You never know when it's coming. Stay real, stay ready!",
            ),
          ],
          style: TextStyle(
            fontSize: 15,
            color: Color(0xFF6E6E6E),
            height: 1.4,
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // Reaction Buttons (styled your way)
  // -------------------------------------------------------------
  Widget buildReactionsRow(Post p) {
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: p.reactionList.entries.map((entry) {
        final emoji = entry.key;
        final count = entry.value;
        final isMine = p.userReactions.contains(emoji);

        return GestureDetector(
          onTap: () async {
            await toggleReaction(p, emoji);
            setState(() {
              if (isMine) {
                p.userReactions.remove(emoji);
                p.reactionList[emoji] = count - 1;
              } else {
                p.userReactions.add(emoji);
                p.reactionList[emoji] = count + 1;
              }
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isMine ? const Color(0xFFE3F2FD) : const Color(0xFFF2F2F2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isMine ? Colors.blueAccent : Colors.grey.shade400,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 4),
                Text(
                  count.toString(),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isMine ? Colors.blue.shade900 : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // -------------------------------------------------------------
  // Post Box + Navigate to Public Profile (with cache)
  // -------------------------------------------------------------
  Widget buildPostCard(Post p) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // HEADER
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundImage: NetworkImage(p.profileImg),
                ),
                const SizedBox(width: 10),

                // tap username → public profile page
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (!_publicProfileCache.containsKey(p.userId)) {
                        _publicProfileCache[p.userId] =
                            PublicProfilePage(userId: p.userId);
                      }

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => _publicProfileCache[p.userId]!,
                        ),
                      );
                    },
                    child: Text(
                      p.username,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),

                Text(
                  p.time,
                  style:
                      const TextStyle(fontSize: 12, color: Color(0xFF6E6E6E)),
                ),
              ],
            ),
          ),

          // POST IMAGE
          p.image.isNotEmpty
              ? Image.memory(
                  base64Decode(cleanBase64(p.image)),
                  height: 280,
                  width: double.infinity,
                  fit: BoxFit.cover,
                )
              : const SizedBox(
                  height: 280,
                  child: Center(child: Text("No image")),
                ),

          // REACTIONS
          if (p.reactionList.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: buildReactionsRow(p),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _autoPostTimer?.cancel();
    super.dispose();
  }

  // -------------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          "be4real",
          style: TextStyle(
              fontSize: 26, fontWeight: FontWeight.bold, color: Colors.black),
        ),
        elevation: 0.8,
        backgroundColor: Colors.white,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.black),
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.clear();
              await prefs.remove("authToken");

              // Navigator.pushAndRemoveUntil(
              //   context,
              //   MaterialPageRoute(builder: (_) => const LoginPage()),
              //   (_) => false,
              // );

              AutoPostService().stop();

              navigatorKey.currentState?.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginPage()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: index,
        children: [
          buildFeedView(),
          _profilePage,
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (i) async {
          setState(() => index = i);

          if (i == 0) {
            // refresh home feed when returning
            await fetchFeed();
          } else if (i == 1) {
            //refresh profile data whenever profile tab is tapped
            _profileKey.currentState?.refreshProfile();
          }
        },
        selectedItemColor: Colors.black,
        unselectedItemColor: Colors.grey,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: "Home"),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}

// -------------------------------------------------------------
// MODEL
// -------------------------------------------------------------
class Post {
  String postId;
  String userId; // who posted it
  String username;
  String profileImg;
  String image;
  String time;
  Map<String, int> reactionList;
  Set<String> userReactions;

  Post({
    required this.postId,
    required this.userId,
    required this.username,
    required this.profileImg,
    required this.image,
    required this.time,
    required this.reactionList,
    required this.userReactions,
  });
}
