import 'dart:convert';
import 'package:http/http.dart' as http;

class User {
  final String username;
  User({required this.username});
}

class AuthService {
  static const String baseUrl = "http://167.99.26.82/api/auth";

  // In-memory storage for the current token and user
  String? _token;
  User? _currentUser;

  /// REGISTER
  Future<bool> register(String username, String password) async {
    final response = await http.post(
      Uri.parse("$baseUrl/register"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "username": username,
        "password": password,
      }),
    );

    return response.statusCode == 201;
  }

  /// LOGIN
  Future<bool> login(String username, String password) async {
    final response = await http.post(
      Uri.parse("$baseUrl/login"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "username": username,
        "password": password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      // Store token and user data in-memory
      _token = data["token"];
      _currentUser = User(username: data["username"]);

      return true;
    } else {
      return false;
    }
  }

  /// LOGOUT
  Future<void> logout() async {
    // Clear the in-memory token and user data
    _token = null;
    _currentUser = null;
  }

  /// GET TOKEN
  Future<String?> getToken() async {
    return _token; // Return the in-memory token
  }

  /// GET CURRENT USER
  Future<User?> getCurrentUser() async {
    return _currentUser; // Return the in-memory user
  }
}

// import 'dart:convert';
// import 'package:http/http.dart' as http;
// import 'package:shared_preferences/shared_preferences.dart';

// class User {
//   final String username;
//   User({required this.username});
// }

// class AuthService {
//   static const String baseUrl = "http://167.99.26.82/api/auth";

//   /// REGISTER
//   Future<bool> register(String username, String password) async {
//     final response = await http.post(
//       Uri.parse("$baseUrl/register"),
//       headers: {"Content-Type": "application/json"},
//       body: jsonEncode({
//         "username": username,
//         "password": password,
//       }),
//     );

//     return response.statusCode == 201;
//   }

//   /// LOGIN
//   Future<bool> login(String username, String password) async {
//     final response = await http.post(
//       Uri.parse("$baseUrl/login"),
//       headers: {"Content-Type": "application/json"},
//       body: jsonEncode({
//         "username": username,
//         "password": password,
//       }),
//     );

//     if (response.statusCode == 200) {
//       final data = jsonDecode(response.body);

//       final prefs = await SharedPreferences.getInstance();
//       await prefs.setString("token", data["token"]);
//       await prefs.setString("username", data["username"]);

//       return true;
//     } else {
//       return false;
//     }
//   }

//   /// LOGOUT
//   Future<void> logout() async {
//     final prefs = await SharedPreferences.getInstance();
//     await prefs.clear();
//   }

//   /// GET TOKEN
//   Future<String?> getToken() async {
//     final prefs = await SharedPreferences.getInstance();
//     return prefs.getString("token");
//   }

//   /// GET CURRENT USER
//   Future<User?> getCurrentUser() async {
//     final prefs = await SharedPreferences.getInstance();
//     final username = prefs.getString("username");
//     final token = prefs.getString("token");

//     if (username != null && token != null) {
//       return User(username: username);
//     } else {
//       return null;
//     }
//   }
// }
