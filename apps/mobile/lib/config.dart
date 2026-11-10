class AppConfig {
  /// Override at build time:
  /// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000`
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:8000',
  );

  /// Dev demo principal until Clerk mobile SDK is wired.
  static const demoUser = String.fromEnvironment(
    'DEMO_USER',
    defaultValue: 'user_demo_admin',
  );
}
