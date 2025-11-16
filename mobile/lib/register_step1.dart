import 'package:flutter/material.dart';
import 'register_step2.dart';
import 'login.dart';

class RegisterStep1Page extends StatefulWidget {
  const RegisterStep1Page({super.key});

  @override
  State<RegisterStep1Page> createState() => _RegisterStep1PageState();
}

class _RegisterStep1PageState extends State<RegisterStep1Page> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  String _errorMessage = "";

  // CLIENT-SIDE ONLY VALIDATION
  String? validateFields(String username, String email, String password) {
    if (username.isEmpty || email.isEmpty || password.isEmpty) {
      return "Please fill out all fields.";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (!email.contains("@") || !email.contains(".")) {
      return "Invalid email format.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return null;
  }

  void _goToStep2() {
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    final validationError = validateFields(username, email, password);
    if (validationError != null) {
      setState(() => _errorMessage = validationError);
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => RegisterStep2Page(
          username: username,
          email: email,
          password: password,
        ),
      ),
    );
  }

  Widget _stepBar(bool active) {
    return Container(
      height: 3,
      width: 70,
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

      // Center UI properly
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
                      // TITLE
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

                      // STEP BAR
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _stepBar(true),
                          const SizedBox(width: 12),
                          _stepBar(false),
                          const SizedBox(width: 12),
                          _stepBar(false),
                        ],
                      ),

                      const SizedBox(height: 30),

                      // USERNAME
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text("Username",
                            style: TextStyle(fontSize: 14)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        decoration: InputDecoration(
                          hintText: "johndoe",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // EMAIL
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text("Email", style: TextStyle(fontSize: 14)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          hintText: "john@example.com",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // PASSWORD
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text("Password", style: TextStyle(fontSize: 14)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          hintText: "••••••••",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),

                      const SizedBox(height: 25),

                      // CONTINUE BUTTON
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: _goToStep2,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            "Continue",
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      if (_errorMessage.isNotEmpty)
                        Text(
                          _errorMessage,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
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
                                  style:
                                      TextStyle(fontSize: 15, color: grey)),
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
