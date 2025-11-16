import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:http/http.dart' as http;

const SERVER = "http://be4real.life/api";

class CameraService {
  /// Compress and convert picture to base64
  static Future<String?> _compressAndEncode(String path) async {
    try {
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        path,
        quality: 50, // compress to 50%
      );
      if (compressedBytes == null) return null;
      return "data:image/jpeg;base64,${base64Encode(compressedBytes)}";
    } catch (e) {
      debugPrint("Compression error: $e");
      return null;
    }
  }

  //upload image
  static Future<bool> _uploadPost(String base64Image, String token) async {
    try {
      final uri = Uri.parse("$SERVER/post/make-post");
      final response = await http.post(
        uri,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({"imgData": base64Image}),
      );
      debugPrint("UPLOAD RESPONSE: ${response.body}");
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Upload error: $e");
      return false;
    }
  }

  static Future<bool> autoCaptureAndUpload(
      BuildContext context, String token) async {
    //show alert
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        title: Text("Camera"),
        content: Text("GET READY TO BE 4 REAL!."),
      ),
    );

    await Future.delayed(const Duration(seconds: 3));

    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }

    final cameras = await availableCameras();
    if (cameras.isEmpty) return false;

    final frontCamera = cameras.firstWhere(
      (cam) => cam.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );

    final controller = CameraController(
      frontCamera,
      ResolutionPreset.medium,
      enableAudio: false,
    );
    await controller.initialize();

    String? base64Image;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) {
          Future.delayed(const Duration(seconds: 2), () async {
            if (base64Image == null) {
              final XFile picture = await controller.takePicture();
              base64Image = await _compressAndEncode(picture.path);
              Navigator.pop(context);
            }
          });
          return AlertDialog(
            content: SizedBox(
              width: 300,
              height: 400,
              child: CameraPreview(controller),
            ),
          );
        },
      ),
    );

    await controller.dispose();

    if (base64Image == null) return false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        content: SizedBox(
          height: 80,
          child: Center(child: Text("Uploading...")),
        ),
      ),
    );

    bool success = await _uploadPost(base64Image!, token);

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(success ? "Upload successful!" : "Upload failed!")),
    );

    return success;
  }
}
