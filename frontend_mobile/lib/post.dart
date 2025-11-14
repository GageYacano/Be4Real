class Post {
  final String id;
  final String username;
  final String content;
  final String? imageUrl;
  int likes;
  int comments;

  Post({
    required this.id,
    required this.username,
    required this.content,
    this.imageUrl,
    required this.likes,
    required this.comments,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['_id'],
      username: json['username'],
      content: json['content'],
      imageUrl: json['imageUrl'],
      likes: json['likes'],
      comments: json['comments'],
    );
  }
}
