import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'home_page.dart';
import 'login.dart';

class RegisterStep3Page extends StatefulWidget {
  final String email;

  const RegisterStep3Page({
    super.key,
    required this.email,
  });

  @override
  State<RegisterStep3Page> createState() => _RegisterStep3PageState();
}

class _RegisterStep3PageState extends State<RegisterStep3Page> {
  final TextEditingController _codeController = TextEditingController();
  bool _isLoading = false;
  bool _isResending = false;
  String _errorMessage = "";

  Future<void> _verifyCode() async {
    final code = _codeController.text.trim();

    if (code.isEmpty) {
      setState(() => _errorMessage = "Please enter the verification code.");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    try {
      final res = await http.post(
        Uri.parse("http://be4real.life/api/auth/verify-user"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "email": widget.email.trim(),
          "code": code,
        }),
      );

      print("VERIFY RESPONSE ↓↓↓");
      print("STATUS: ${res.statusCode}");
      print("BODY: ${res.body}");

      final data = jsonDecode(res.body);

      // FIXED SUCCESS CHECK
      if (res.statusCode == 200 &&
          data["status"] == "success" &&
          data["token"] != null) {
        final token = data["token"];
        final userId = _decodeUserIdFromJwt(token);

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => HomePage(
              authToken: token,
              currentUserId: userId,
            ),
          ),
        );
        return;
      }

      // ANY OTHER CASE
      setState(() => _errorMessage = "Invalid code or user not found.");
    } catch (e) {
      setState(() => _errorMessage = "Unexpected error. Please try again.");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _resendCode() async {
    if (_isResending) return;

    setState(() => _isResending = true);

    try {
      await http.post(
        Uri.parse("http://be4real.life/api/auth/send-verification"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": widget.email.trim()}),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Verification code resent.")),
      );
    } catch (e) {
      setState(() => _errorMessage = "Failed to resend code.");
    } finally {
      setState(() => _isResending = false);
    }
  }

  Widget _stepBar(bool active) {
    return Container(
      height: 3,
      decoration: BoxDecoration(
        color: active ? Colors.black : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const grey = Color(0xFF6E6E6E);

    return Scaffold(
      backgroundColor: Colors.white,
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("be4real",
                          style: TextStyle(
                              fontSize: 32, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      const Text("Verify your account",
                          style:
                              TextStyle(fontSize: 18, color: Colors.black87)),
                      const SizedBox(height: 5),
                      Text(
                        "Enter the code sent to\n${widget.email}",
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 15, color: grey),
                      ),
                      const SizedBox(height: 25),
                      Row(
                        children: [
                          Expanded(child: _stepBar(false)),
                          const SizedBox(width: 12),
                          Expanded(child: _stepBar(false)),
                          const SizedBox(width: 12),
                          Expanded(child: _stepBar(true)),
                        ],
                      ),
                      const SizedBox(height: 30),
                      TextField(
                        controller: _codeController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: "Verification Code",
                          hintText: "000000",
                          hintStyle: const TextStyle(
                            color: Colors.grey,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 30),
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _verifyCode,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white)
                              : const Text("Verify",
                                  style: TextStyle(
                                      color: Colors.white, fontSize: 16)),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (_errorMessage.isNotEmpty)
                        Text(_errorMessage,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center),
                      const SizedBox(height: 20),
                      GestureDetector(
                        onTap: _resendCode,
                        child: const Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: "Didn't receive a code? ",
                                style: TextStyle(fontSize: 15, color: grey),
                              ),
                              TextSpan(
                                text: "Resend",
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 30),
                      GestureDetector(
                        onTap: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const LoginPage()),
                          );
                        },
                        child: const Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: "Already have an account? ",
                                style: TextStyle(fontSize: 15, color: grey),
                              ),
                              TextSpan(
                                text: "Log in",
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _decodeUserIdFromJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return "";

    final normalized = base64Url.normalize(parts[1]);
    final decoded = utf8.decode(base64Url.decode(normalized));
    final payload = jsonDecode(decoded);

    return payload["sub"] ?? ""; // backend user ID
  }
}
