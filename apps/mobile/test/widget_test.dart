import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:luxor9_mobile/theme.dart';

void main() {
  testWidgets('Luxor theme builds a MaterialApp shell', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LuxorTheme.dark(),
        home: const Scaffold(
          body: Text('LUXOR9'),
        ),
      ),
    );
    expect(find.text('LUXOR9'), findsOneWidget);
  });
}
