import 'package:flutter/material.dart';

class LuxorTheme {
  static const obsidian = Color(0xFF0B0D10);
  static const elevated = Color(0xFF14181F);
  static const ivory = Color(0xFFF3EFE6);
  static const cyan = Color(0xFF2EC4B6);
  static const muted = Color(0xFF8B93A7);
  static const border = Color(0xFF2A3140);
  static const danger = Color(0xFFD64545);

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidian,
      colorScheme: const ColorScheme.dark(
        primary: cyan,
        surface: elevated,
        onPrimary: Color(0xFF041312),
        onSurface: ivory,
        error: danger,
      ),
    );
    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidian,
        foregroundColor: ivory,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: elevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
          side: const BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: obsidian,
        border: OutlineInputBorder(borderSide: BorderSide(color: border)),
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: border)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: cyan)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: cyan,
          foregroundColor: const Color(0xFF041312),
          shape: const RoundedRectangleBorder(),
        ),
      ),
    );
  }
}
