//

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

  // pagination
  String? lastPostId; // used for loading older posts
  bool hasMore = true; // whether more exists on server
  bool isLoadingMore = false;

  final ScrollController _scrollController = ScrollController();

  // bottom nav + profile
  int index = 0;
  late final ProfilePage _profilePage;
  final GlobalKey<ProfilePageState> _profileKey = GlobalKey<ProfilePageState>();
  final Map<String, PublicProfilePage> _publicProfileCache = {};

  @override
  void initState() {
    super.initState();

    _profilePage = ProfilePage(key: _profileKey);

    fetchFeed(); // initial load

    // infinite scroll listener
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >
          _scrollController.position.maxScrollExtent - 200) {
        loadMorePosts();
      }
    });

    // enable autopost
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AutoPostService().start(context);
    });
  }

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
  }

  String resolveProfileAvatar(String raw, String username) {
    if (raw.isEmpty || raw == "null") return dicebearURL(username);
    if (raw.startsWith("http")) return raw;
    return dicebearURL(username);
  }

  // -------------------------------------------------------------
  // Fetch user info
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
  // Parse posts (shared by fetchFeed + loadMorePosts)
  // -------------------------------------------------------------
  Future<List<Post>> parsePosts(List rawPosts) async {
    List<Post> loaded = [];

    for (final p in rawPosts) {
      final uid = p["user"];
      final userInfo = await fetchUserInfo(uid);

      final avatar = resolveProfileAvatar(
        userInfo["profileImg"]!,
        userInfo["username"]!,
      );

      // parse reactions
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
          postId: p["postId"] ?? p["_id"],
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

    return loaded;
  }

  // -------------------------------------------------------------
  // Load Feed (first page)
  // -------------------------------------------------------------
  Future<void> fetchFeed() async {
    setState(() {
      loading = true;
      hasMore = true;
      lastPostId = null;
    });

    try {
      final res = await http.get(
        Uri.parse("$SERVER/post/get-feed?limit=10"),
        headers: {"Authorization": "Bearer ${widget.authToken}"},
      );

      final body = jsonDecode(res.body);
      final rawPosts = body["data"]["posts"] as List;

      final loaded = await parsePosts(rawPosts);

      setState(() {
        posts = loaded;
        if (posts.isNotEmpty) lastPostId = posts.last.postId;
        hasMore = rawPosts.length == 10;
      });
    } catch (e) {
      setState(() => error = "Error: $e");
    } finally {
      setState(() => loading = false);
    }
  }

  // -------------------------------------------------------------
  // Load more (infinite scroll)
  // -------------------------------------------------------------
  Future<void> loadMorePosts() async {
    if (isLoadingMore || !hasMore || lastPostId == null) return;

    setState(() => isLoadingMore = true);

    try {
      final res = await http.get(
        Uri.parse("$SERVER/post/get-feed?limit=10&before=$lastPostId"),
        headers: {"Authorization": "Bearer ${widget.authToken}"},
      );

      final body = jsonDecode(res.body);
      final rawPosts = body["data"]["posts"] as List;

      final more = await parsePosts(rawPosts);

      setState(() {
        posts.addAll(more);
        if (more.isNotEmpty) lastPostId = more.last.postId;
        hasMore = rawPosts.length == 10;
      });
    } finally {
      setState(() => isLoadingMore = false);
    }
  }

  // -------------------------------------------------------------
  // Time formatting
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
  // Toggle reaction
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
  // UI — Feed view
  // -------------------------------------------------------------
  Widget buildFeedView() {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));

    return RefreshIndicator(
      color: Colors.black,
      onRefresh: fetchFeed,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(20),
        itemCount: posts.length + 2,
        itemBuilder: (_, i) {
          if (i == 0) return buildHowItWorksCard();

          if (i == posts.length + 1) {
            return hasMore
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(child: CircularProgressIndicator()),
                  )
                : const SizedBox.shrink();
          }

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
              style:
                  TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
            ),
            TextSpan(
              text:
                  "Your phone takes random photos throughout the day. You never know when it's coming. Stay real, stay ready!",
            ),
          ],
          style: TextStyle(fontSize: 15, color: Color(0xFF6E6E6E), height: 1.4),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // Reaction chips
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
  // Post card
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
                GestureDetector(
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
                const Spacer(),
                Text(
                  p.time,
                  style:
                      const TextStyle(fontSize: 12, color: Color(0xFF6E6E6E)),
                ),
              ],
            ),
          ),

          // IMAGE
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
    _scrollController.dispose();
    AutoPostService().stop();
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
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
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
            await fetchFeed();
          } else if (i == 1) {
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

class Post {
  String postId;
  String userId;
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
