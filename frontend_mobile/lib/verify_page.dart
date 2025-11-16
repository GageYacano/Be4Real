// import 'dart:convert';
// import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'reset_password.dart';
// import 'login.dart';

// class VerifyPage extends StatefulWidget {
//   final String email;

//   const VerifyPage({super.key, required this.email});

//   @override
//   State<VerifyPage> createState() => _VerifyPageState();
// }

// class _VerifyPageState extends State<VerifyPage> {
//   final TextEditingController _codeController = TextEditingController();
//   bool _isLoading = false;
//   String _errorMessage = '';

//   Future<void> _verifyUser() async {
//     setState(() {
//       _isLoading = true;
//       _errorMessage = '';
//     });

//     try {
//       final response = await http.post(
//         Uri.parse('http://be4real.life/api/auth/verify-user'),
//         headers: {'Content-Type': 'application/json'},
//         body: jsonEncode({
//           'email': widget.email,
//           'code': _codeController.text.trim(),
//         }),
//       );

//       final data = jsonDecode(response.body);

//       if (response.statusCode == 200) {
//         if (mounted) {
//           Navigator.pushReplacement(
//             context,
//             MaterialPageRoute(
//               builder: (_) => ResetPasswordPage(
//                 email: widget.email,
//                 code: _codeController.text.trim(),
//               ),
//             ),
//           );
//         }
//       } else {
//         setState(() {
//           _errorMessage = data['message'] ?? 'Verification failed. Try again.';
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
//       appBar: AppBar(
//         title: const Text('Verify Email'),
//         backgroundColor: Colors.black,
//       ),
//       body: Padding(
//         padding: const EdgeInsets.all(24.0),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Text(
//               'Enter the verification code sent to\n${widget.email}',
//               style: const TextStyle(fontSize: 16),
//               textAlign: TextAlign.center,
//             ),
//             const SizedBox(height: 20),
//             TextField(
//               controller: _codeController,
//               keyboardType: TextInputType.number,
//               decoration: InputDecoration(
//                 labelText: 'Verification Code',
//                 border: OutlineInputBorder(
//                   borderRadius: BorderRadius.circular(12.0),
//                 ),
//               ),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton(
//               onPressed: _isLoading ? null : _verifyUser,
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: Colors.black,
//                 padding: const EdgeInsets.symmetric(vertical: 14),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12.0),
//                 ),
//               ),
//               child: _isLoading
//                   ? const CircularProgressIndicator(color: Colors.white)
//                   : const Text(
//                       'Verify',
//                       style: TextStyle(color: Colors.white, fontSize: 16),
//                     ),
//             ),
//             const SizedBox(height: 16),
//             if (_errorMessage.isNotEmpty)
//               Text(
//                 _errorMessage,
//                 style: const TextStyle(color: Colors.red),
//                 textAlign: TextAlign.center,
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   @override
//   void dispose() {
//     _codeController.dispose();
//     super.dispose();
//   }
// }
