# Be4Real Mobile Frontend

Flutter mobile application for Be4Real.

## Structure

```
frontend_mobile/
├── lib/
│   ├── forgot_password.dart          # Forgot password screen
│   ├── home_page.dart                # Home feed
│   ├── login.dart                    # Login page
│   ├── main.dart                     # Entry point
│   ├── profile_page.dart             # User profile page
│   ├── public_profile_page.dart      # Public profile view
│   ├── register_notneeded.dart       # Legacy registration
│   ├── register_step1.dart           # Registration step 1
│   ├── register_step2.dart           # Registration step 2
│   ├── register_step3.dart           # Registration step 3
│   ├── reset_password.dart           # Reset password screen
│
├── android/                          # Android platform files
├── ios/                              # iOS platform files
├── linux/                            # Linux platform files
├── macos/                            # macOS platform files
├── web/                              # Web support
├── windows/                          # Windows platform files
├── test/                             # Flutter tests
├── pubspec.yaml                      # Dependencies
├── pubspec.lock
├── package.json                      # NPM config (if used)
└── README.md
```

## Running the code

Install dependencies:

```
flutter pub get
```

Run on a physical Android device:

```
flutter run
```

Run on a physical iPhone (macOS required):

```
flutter run -d <device-id>
```

Run in Chrome (works for everyone):

```
flutter run -d chrome
```

## Build for Production

Android APK:

```
flutter build apk
```

