import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class CameraPreviewScreen extends StatefulWidget {
  final CameraController controller;
  CameraPreviewScreen({required this.controller});

  @override
  _CameraPreviewScreenState createState() => _CameraPreviewScreenState();
}

class _CameraPreviewScreenState extends State<CameraPreviewScreen> {
  bool isTaking = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          CameraPreview(widget.controller),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton(
                onPressed: isTaking
                    ? null
                    : () async {
                        setState(() => isTaking = true);
                        final XFile picture =
                            await widget.controller.takePicture();
                        Navigator.pop(context, picture.path);
                      },
                child: Icon(Icons.camera_alt),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
