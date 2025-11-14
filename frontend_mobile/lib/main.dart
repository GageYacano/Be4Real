import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'login.dart';
import 'home_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Be4Real',
      theme: ThemeData(
        // This is the theme of your application.
        
        primarySwatch: Colors.blue,
        useMaterial3: true,   
      ),
      home: const LoginPage(),
    );
  }
}






