// import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';
// import 'home_page.dart';
// import 'forgot_password.dart';
// import 'login.dart';
// import 'google_loginpage.dart';
// import 'register.dart';

// class RegisterPage extends StatefulWidget {
//   const RegisterPage({super.key});

//   @override
//   State<RegisterPage> createState() => _RegisterPageState();
// }

// class _RegisterPageState extends State<RegisterPage> {
//   final TextEditingController _firstNameController = TextEditingController();
//   final TextEditingController _lastNameController = TextEditingController();
//   final TextEditingController _phoneController = TextEditingController();
//   final TextEditingController _birthdayController = TextEditingController();
//   String _errorMessage = '';
//   bool _isLoading = false;

//   Future<void> _login() async {
//     setState(() {
//       _isLoading = true;
//       _errorMessage = '';
//     });

//     try {
//       final response = await http.post(
//         Uri.parse('http://167.99.26.82:8080/api/src/auth/register'),
//         headers: {'Content-Type': 'application/json'},
//         body: jsonEncode({
//           'firstName': _firstNameController.text,
//           'lastName': _lastNameController.text,
//           'phone': _phoneController.text,
//           'birthday': _birthdayController.text,
//         }),
//       );

//       if (response.statusCode == 200) {
//         final data = jsonDecode(response.body);

//         if (data['status'] == "success") {
//           // Login successful, navigate to second page
//           if (mounted) {
//             Navigator.pushReplacement(
//               context,
//               MaterialPageRoute(
//                 builder: (context) => const HomePage(),
//               ),
//             );
//           }
//         } else {
//           setState(() {
//             _errorMessage = data['status'];
//           });
//         }
//       } else {
//         setState(() {
//           _errorMessage = 'Register failed. Please try again.';
//         });
//       }
//     } catch (e) {
//       setState(() {
//         _errorMessage = 'Network error. Please check your connection.';
//       });
//     } finally {
//       setState(() {
//         _isLoading = false;
//       });
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       body: Center(
//         child: Padding(
//           padding: const EdgeInsets.all(32.0),
//           child: Column(
//             mainAxisAlignment: MainAxisAlignment.center,
//             crossAxisAlignment: CrossAxisAlignment.stretch,
//             children: [
//               const Text(
//                 'be4real',
//                 style: TextStyle(
//                   fontSize: 32,
//                   fontWeight: FontWeight.bold,
//                 ),
//                 textAlign: TextAlign.center,
//               ),
//               const SizedBox(height: 10),
//               const Text(
//                 "Create your account",
//                 style: TextStyle(
//                   fontSize: 16,
//                 ),
//                 textAlign: TextAlign.center,
//               ),
//               const SizedBox(height: 20),
//               Row(
//                 children: [
//                   Expanded(
//                     child: Container(
//                       height: 3.0,
//                       color: Colors.black,
//                     ),
//                   ),
//                   const Padding(
//                     padding: EdgeInsets.symmetric(horizontal: 8.0),
//                   ),
//                   Expanded(
//                     child: Container(
//                       height: 1.0,
//                       color: Colors.grey,
//                     ),
//                   ),
//                 ],
//               ),
//               const SizedBox(height: 20),
//               TextField(
//                 controller: _firstNameController,
//                 decoration: InputDecoration(
//                   labelText: 'FirstName',
//                   border: OutlineInputBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 16),
//               TextField(
//                 controller: _lastNameController,
//                 decoration: InputDecoration(
//                   labelText: 'LastName',
//                   border: OutlineInputBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 16),
//               TextField(
//                 controller: _phoneController,
//                 obscureText: true,
//                 decoration: InputDecoration(
//                   labelText: 'Phone Number',
//                   border: OutlineInputBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 16),
//               TextField(
//                 controller: _birthdayController,
//                 obscureText: true,
//                 decoration: InputDecoration(
//                   labelText: 'Birthday',
//                   border: OutlineInputBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 24),
//               ElevatedButton(
//                 onPressed: () {
//                   Navigator.pushReplacement(
//                     context,
//                     MaterialPageRoute(
//                         builder: (context) => const RegisterPage()),
//                   );
//                 },
//                 style: ElevatedButton.styleFrom(
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   backgroundColor: Colors.black,
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//                 child: _isLoading
//                     ? const CircularProgressIndicator()
//                     : const Text(
//                         'Continue',
//                         style: TextStyle(
//                           fontSize: 16,
//                           color: Colors.white,
//                         ),
//                       ),
//               ),
//               const SizedBox(height: 35),
//               //sign in with gmail option
//               Row(
//                 children: [
//                   Expanded(
//                     child: Container(
//                       height: 1.0,
//                       color: Colors.grey,
//                     ),
//                   ),
//                   const Padding(
//                     padding: EdgeInsets.symmetric(horizontal: 8.0),
//                     child: Text(
//                       "or",
//                       style: TextStyle(fontSize: 16),
//                       textAlign: TextAlign.center,
//                     ),
//                   ),
//                   Expanded(
//                     child: Container(
//                       height: 1.0,
//                       color: Colors.grey,
//                     ),
//                   ),
//                 ],
//               ),
//               const SizedBox(height: 35),
//               //add image that links to google sign in here...
//               ElevatedButton(
//                 onPressed: () {
//                   Navigator.pushReplacement(
//                     context,
//                     MaterialPageRoute(
//                         builder: (context) => const GoogleLoginPage()),
//                   );
//                 },
//                 style: ElevatedButton.styleFrom(
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   backgroundColor: Colors.white,
//                   side: BorderSide(color: Colors.grey, width: 1.0),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(15.0),
//                   ),
//                 ),
//                 child: _isLoading
//                     ? const CircularProgressIndicator()
//                     : const Text(
//                         'Continue with Google',
//                         style: TextStyle(
//                           fontSize: 16,
//                           color: Colors.black,
//                         ),
//                       ),
//               ),
//               ////////////////////////////////////////////////////
//               //already have account login now option
//               const SizedBox(height: 24),
//               GestureDetector(
//                 onTap: () {
//                   Navigator.pushReplacement(
//                     context,
//                     MaterialPageRoute(builder: (context) => LoginPage()),
//                   );
//                 },
//                 child: Center(
//                   child: RichText(
//                     text: const TextSpan(
//                       style: TextStyle(color: Colors.black),
//                       children: <TextSpan>[
//                         TextSpan(
//                           text: "Already have an account?",
//                           style: TextStyle(
//                             fontSize: 16,
//                           ),
//                         ),
//                         TextSpan(
//                           text: " Log in",
//                           style: TextStyle(
//                             fontSize: 16,
//                             fontWeight: FontWeight.bold,
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 16),
//               if (_errorMessage.isNotEmpty)
//                 Text(
//                   _errorMessage,
//                   style: const TextStyle(
//                     color: Colors.red,
//                     fontSize: 14,
//                   ),
//                   textAlign: TextAlign.center,
//                 ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   @override
//   void dispose() {
//     _firstNameController.dispose();
//     _lastNameController.dispose();
//     _phoneController.dispose();
//     _birthdayController.dispose();
//     super.dispose();
//   }
// }
