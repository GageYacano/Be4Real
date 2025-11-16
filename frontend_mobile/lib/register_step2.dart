import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'register_step1.dart';
import 'register_step3.dart';

class RegisterStep2Page extends StatefulWidget {
  final String username;
  final String email;
  final String password;

  const RegisterStep2Page({
    super.key,
    required this.username,
    required this.email,
    required this.password,
  });

  @override
  State<RegisterStep2Page> createState() => _RegisterStep2PageState();
}

class _RegisterStep2PageState extends State<RegisterStep2Page> {
  bool allowCamera = false;
  bool _isLoading = false;
  String _errorMessage = "";

  Widget _stepBar(bool active) {
    return Container(
      height: 3,
      decoration: BoxDecoration(
        color: active ? Colors.black : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }

  Future<void> _createAccount() async {
    if (!allowCamera) return;

    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    try {
      // 1. CREATE ACCOUNT (but not verified yet)
      final res = await http.post(
        Uri.parse("http://be4real.life/api/auth/register"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "username": widget.username,
          "email": widget.email,
          "password": widget.password,
        }),
      );

      final data = jsonDecode(res.body);

      if (res.statusCode == 200) {
        // 2. AUTO-SEND VERIFICATION EMAIL (fix for missing first email)
        await http.post(
          Uri.parse("http://be4real.life/api/auth/send-verification"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({"email": widget.email}),
        );

        // 3. NAVIGATE TO STEP 3
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => RegisterStep3Page(
              email: widget.email,
            ),
          ),
        );
      } else {
        setState(() {
          _errorMessage = data["message"] ?? "Registration failed.";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Network error. Please try again.";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
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
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        "be4real",
                        style: TextStyle(
                            fontSize: 32, fontWeight: FontWeight.bold),
                      ),

                      const SizedBox(height: 10),

                      const Text(
                        "Welcome to be4real",
                        style: TextStyle(fontSize: 18, color: Colors.black87),
                      ),

                      const SizedBox(height: 5),

                      const Text(
                        "Create your account",
                        style: TextStyle(fontSize: 15, color: grey),
                      ),

                      const SizedBox(height: 20),

                      Row(
                        children: [
                          Expanded(child: _stepBar(false)),
                          const SizedBox(width: 12),
                          Expanded(child: _stepBar(true)),
                          const SizedBox(width: 12),
                          Expanded(child: _stepBar(false)),
                        ],
                      ),

                      const SizedBox(height: 30),

                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Row(
                          children: [
                            Icon(Icons.arrow_back,
                                size: 30, color: Colors.black),
                            SizedBox(width: 8),
                            Text(
                              "Back",
                              style:
                                  TextStyle(fontSize: 18, color: Colors.black),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 25),

                      // CHECKBOX
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: allowCamera,
                            activeColor: Colors.black,
                            onChanged: (value) {
                              setState(() => allowCamera = value ?? false);
                            },
                          ),
                          const Expanded(
                            child: Text(
                              "I agree to allow be4real to take random photos using my device camera and share them with my friends.",
                              style: TextStyle(
                                  fontSize: 14, color: Colors.black87),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      if (_errorMessage.isNotEmpty)
                        Text(
                          _errorMessage,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),

                      const SizedBox(height: 20),

                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: allowCamera && !_isLoading
                              ? _createAccount
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: allowCamera
                                ? Colors.black
                                : Colors.grey.shade400,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white)
                              : const Text(
                                  "Create account",
                                  style: TextStyle(
                                      color: Colors.white, fontSize: 16),
                                ),
                        ),
                      ),

                      const SizedBox(height: 30),

                      GestureDetector(
                        onTap: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const RegisterStep1Page()),
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
}
