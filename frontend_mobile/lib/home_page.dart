// import 'package:flutter/material.dart';
// import 'post.dart';
// import 'feed_service.dart';
// import 'auth_service.dart';
// import 'login.dart';
// import 'register.dart';

// class HomePage extends StatefulWidget {
//   @override
//   _HomePageState createState() => _HomePageState();
// }

// class _HomePageState extends State<HomePage> {
//   final FeedService _feedService = FeedService();
//   //final AuthService _authService = AuthService();
//   late Future<List<Post>> _feedFuture;
//   String? currentUsername;

//   @override
//   void initState() {
//     super.initState();
//     //_checkLoginStatus();
//   }

//   // /// Check if user is logged in
//   // Future<void> _checkLoginStatus() async {
//   //   final user =
//   //       await _authService.getCurrentUser(); // returns null if logged out

//   //   if (user == null) {
//   //     _goToLogin();
//   //   } else {
//   //     setState(() {
//   //       currentUsername = user.username;
//   //       _feedFuture = _feedService.getFeed();
//   //     });
//   //   }
//   // }

//   // void _goToLogin() {
//   //   Navigator.pushReplacement(
//   //     context,
//   //     MaterialPageRoute(builder: (_) => LoginPage()),
//   //   );
//   // }

//   void _logout() async {
//     Navigator.pushReplacement(
//       context,
//       MaterialPageRoute(builder: (context) => HomePage()),
//     );
//   }

//   void _refreshFeed() {
//     setState(() {
//       _feedFuture = _feedService.getFeed();
//     });
//   }

//   @override
//   Widget build(BuildContext context) {
//     if (currentUsername == null) {
//       return Scaffold(
//         body: Center(child: CircularProgressIndicator()),
//       );
//     }

//     return Scaffold(
//       appBar: AppBar(
//         title: Text("Live Feed"),
//         actions: [
//           Center(child: Text("Hi, $currentUsername")),
//           IconButton(
//             icon: Icon(Icons.logout),
//             onPressed: _logout,
//           ),
//         ],
//       ),
//       body: FutureBuilder<List<Post>>(
//         future: _feedFuture,
//         builder: (context, snapshot) {
//           if (!snapshot.hasData) {
//             return Center(child: CircularProgressIndicator());
//           }

//           final posts = snapshot.data!;

//           return RefreshIndicator(
//             onRefresh: () async => _refreshFeed(),
//             child: ListView.builder(
//               itemCount: posts.length,
//               itemBuilder: (context, index) => _buildPostCard(posts[index]),
//             ),
//           );
//         },
//       ),
//       floatingActionButton: FloatingActionButton(
//         child: Icon(Icons.person_add),
//         onPressed: () {
//           Navigator.push(
//             context,
//             MaterialPageRoute(builder: (_) => RegisterPage()),
//           );
//         },
//       ),
//     );
//   }

//   /// A single card showing a post
//   Widget _buildPostCard(Post post) {
//     return Card(
//       margin: EdgeInsets.all(12),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           ListTile(
//             leading: CircleAvatar(child: Text(post.username[0])),
//             title: Text(post.username),
//           ),
//           if (post.imageUrl != null) Image.network(post.imageUrl!),
//           Padding(
//             padding: const EdgeInsets.all(12.0),
//             child: Text(post.content),
//           ),
//           Row(
//             children: [
//               IconButton(
//                 icon: Icon(Icons.favorite_border),
//                 onPressed: () async {
//                   await _feedService.likePost(post.id);
//                   setState(() => post.likes++);
//                 },
//               ),
//               Text("${post.likes}"),
//               SizedBox(width: 20),
//               IconButton(
//                 icon: Icon(Icons.comment_outlined),
//                 onPressed: () {
//                   _showCommentInput(post);
//                 },
//               ),
//               Text("${post.comments}"),
//             ],
//           ),
//         ],
//       ),
//     );
//   }

//   void _showCommentInput(Post post) {
//     final controller = TextEditingController();

//     showDialog(
//       context: context,
//       builder: (_) {
//         return AlertDialog(
//           title: Text("Add Comment"),
//           content: TextField(
//             controller: controller,
//             decoration: InputDecoration(hintText: "Write a comment..."),
//           ),
//           actions: [
//             TextButton(
//               onPressed: () async {
//                 await _feedService.commentOnPost(post.id, controller.text);
//                 setState(() => post.comments++);
//                 Navigator.pop(context);
//               },
//               child: Text("Submit"),
//             )
//           ],
//         );
//       },
//     );
//   }
// }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'login.dart';
import 'profile_page.dart';
//import 'camera.dart';
import 'profile_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                "Home Page",
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const LoginPage(),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                  backgroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text(
                  'Sign Out',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // ElevatedButton(
              //   onPressed: () {
              //     Navigator.pushReplacement(
              //       context,
              //       MaterialPageRoute(
              //         builder: (context) => CameraPage(),
              //       ),
              //     );
              //   },
              //   style: ElevatedButton.styleFrom(
              //     padding:
              //         const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              //     backgroundColor: Colors.black,
              //     shape: RoundedRectangleBorder(
              //       borderRadius: BorderRadius.circular(25),
              //     ),
              //   ),
              //   child: const Text(
              //     'Open Camera',
              //     style: TextStyle(
              //       fontSize: 16,
              //       color: Colors.white,
              //     ),
              //   ),
              // ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProfilePage(),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                  backgroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text(
                  'Profile Page',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
