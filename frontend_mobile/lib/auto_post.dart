import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'camera.dart';

class AutoPostService {
  static final AutoPostService _instance = AutoPostService._internal();
  factory AutoPostService() => _instance;
  AutoPostService._internal();

  Timer? _autoPostTimer;
  final Random _rng = Random();
  bool _running = false;

  BuildContext? _context;

  //start the auto post
  void start(BuildContext context) {
    if (_running) return;
    _running = true;
    _context = context;
    print("AutoPostService started.");
    _scheduleNextPost();
  }

  //random 5-60 sec for now
  void _scheduleNextPost() {
    if (!_running) return;

    int nextDelay = _rng.nextInt(55) + 5;
    print("Next auto-post in $nextDelay seconds...");

    _autoPostTimer?.cancel();
    _autoPostTimer = Timer(Duration(seconds: nextDelay), () async {
      if (!_running) return;

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("authToken");

      // If logged out, stop service
      if (token == null) {
        print("No auth token — stopping AutoPostService.");
        stop();
        return;
      }

      if (_context == null) {
        print("No valid context — cannot open camera. Retrying...");
        _scheduleNextPost();
        return;
      }

      print("Taking automatic picture...");
      bool ok = await CameraService.autoCaptureAndUpload(_context!, token);

      if (_context != null) {
        ScaffoldMessenger.of(_context!).showSnackBar(
          SnackBar(
            content: Text(ok
                ? "Picture uploaded successfully!"
                : "Failed to upload picture."),
          ),
        );
      }

      print(ok ? "Auto post uploaded successfully!" : "Auto post failed.");

      _scheduleNextPost();
    });
  }

  //stop posting
  void stop() {
    _running = false;
    _autoPostTimer?.cancel();
    _context = null;
    print("AutoPostService stopped.");
  }
}
