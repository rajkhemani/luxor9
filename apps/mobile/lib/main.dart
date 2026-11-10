import 'package:flutter/material.dart';

import 'api/client.dart';
import 'screens/approvals_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/overview_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const Luxor9App());
}

class Luxor9App extends StatelessWidget {
  const Luxor9App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LUXOR9',
      debugShowCheckedModeBanner: false,
      theme: LuxorTheme.dark(),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final _api = LuxorApi();
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      OverviewScreen(api: _api),
      ChatScreen(api: _api),
      ApprovalsScreen(api: _api),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text.rich(
          TextSpan(
            text: 'LUXOR',
            children: [
              TextSpan(text: '9', style: TextStyle(color: LuxorTheme.cyan)),
            ],
          ),
        ),
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Tower'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
          NavigationDestination(icon: Icon(Icons.verified_outlined), label: 'Approvals'),
        ],
      ),
    );
  }
}
