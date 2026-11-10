import 'package:flutter/material.dart';

import '../api/client.dart';
import '../theme.dart';

class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key, required this.api});

  final LuxorApi api;

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  late Future<List<dynamic>> _future;
  String? _busyId;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() => _future = widget.api.approvals());
  }

  Future<void> _act(String id, bool approve) async {
    setState(() => _busyId = id);
    try {
      if (approve) {
        await widget.api.approve(id);
      } else {
        await widget.api.reject(id);
      }
      _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.hasError) {
          return Center(child: Text('${snap.error}', style: const TextStyle(color: LuxorTheme.muted)));
        }
        if (!snap.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snap.data!;
        if (items.isEmpty) {
          return const Center(
            child: Text('No approvals yet', style: TextStyle(color: LuxorTheme.muted)),
          );
        }
        return RefreshIndicator(
          onRefresh: () async {
            _reload();
            await _future;
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final a = items[i] as Map<String, dynamic>;
              final id = a['id']?.toString() ?? '';
              final pending = a['status'] == 'pending';
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${a['action']}', style: const TextStyle(fontSize: 16)),
                      Text(
                        '${a['resource_type']}/${a['resource_id']} · ${a['status']}',
                        style: const TextStyle(color: LuxorTheme.muted, fontSize: 12),
                      ),
                      if (pending) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            ElevatedButton(
                              onPressed: _busyId == id ? null : () => _act(id, true),
                              child: const Text('Approve'),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: _busyId == id ? null : () => _act(id, false),
                              child: const Text('Reject'),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
