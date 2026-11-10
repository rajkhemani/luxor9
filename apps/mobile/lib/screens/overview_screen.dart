import 'package:flutter/material.dart';

import '../api/client.dart';
import '../theme.dart';

class OverviewScreen extends StatefulWidget {
  const OverviewScreen({super.key, required this.api});

  final LuxorApi api;

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.overview();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = widget.api.overview());
        await _future;
      },
      child: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) {
            return ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'API offline: ${snap.error}\n\nStart apps/api on :8000 and point API_BASE_URL at your machine IP for devices.',
                    style: const TextStyle(color: LuxorTheme.muted),
                  ),
                ),
              ],
            );
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final d = snap.data!;
          final recent = (d['recent_workflows'] as List<dynamic>? ?? []);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Control Tower',
                style: TextStyle(fontSize: 28, color: LuxorTheme.ivory),
              ),
              const SizedBox(height: 4),
              const Text(
                'Luxor9 for Real-Estate Developers',
                style: TextStyle(color: LuxorTheme.muted),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Stat('Active', '${d['active_workflows']}'),
                  _Stat('Approvals', '${d['pending_approvals']}'),
                  _Stat('Done', '${d['completed_workflows']}'),
                ],
              ),
              const SizedBox(height: 24),
              const Text('Recent workflows', style: TextStyle(fontSize: 18)),
              const SizedBox(height: 8),
              ...recent.map((w) {
                final m = w as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    title: Text(m['objective']?.toString() ?? ''),
                    subtitle: Text(m['status']?.toString() ?? ''),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 110,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: LuxorTheme.border),
        color: LuxorTheme.elevated,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontSize: 22, color: LuxorTheme.cyan)),
          Text(label, style: const TextStyle(color: LuxorTheme.muted, fontSize: 12)),
        ],
      ),
    );
  }
}
