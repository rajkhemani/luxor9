import 'package:flutter/material.dart';

import '../api/client.dart';
import '../theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.api});

  final LuxorApi api;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _messages = <_Msg>[
    _Msg(
      role: 'assistant',
      text:
          'Describe a development objective. I will draft a governed blueprint for approval.',
    ),
  ];
  String? _workflowId;
  String? _status;
  bool _busy = false;

  Future<void> _send(String text) async {
    if (text.trim().isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _messages.add(_Msg(role: 'user', text: text.trim()));
      _controller.clear();
    });
    try {
      final res = await widget.api.chat(text.trim(), workflowId: _workflowId);
      final wf = res['workflow'] as Map<String, dynamic>;
      setState(() {
        _workflowId = wf['id']?.toString();
        _status = wf['status']?.toString();
        _messages.add(_Msg(role: 'assistant', text: res['reply']?.toString() ?? ''));
      });
    } catch (e) {
      setState(() {
        _messages.add(_Msg(role: 'assistant', text: 'Error: $e'));
      });
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final awaitingBlueprint = _status == 'awaiting_blueprint_approval';
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (context, i) {
              final m = _messages[i];
              final mine = m.role == 'user';
              return Align(
                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.85,
                  ),
                  decoration: BoxDecoration(
                    color: mine
                        ? LuxorTheme.cyan.withValues(alpha: 0.15)
                        : LuxorTheme.elevated,
                    border: Border.all(color: LuxorTheme.border),
                  ),
                  child: Text(m.text),
                ),
              );
            },
          ),
        ),
        if (_workflowId != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Workflow $_workflowId · ${_status ?? ''}',
              style: const TextStyle(color: LuxorTheme.muted, fontSize: 12),
            ),
          ),
        if (awaitingBlueprint)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _busy ? null : () => _send('approve'),
                    child: const Text('Approve blueprint'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _busy ? null : () => _send('decline'),
                    style: OutlinedButton.styleFrom(foregroundColor: LuxorTheme.danger),
                    child: const Text('Decline'),
                  ),
                ),
              ],
            ),
          ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    enabled: !_busy,
                    decoration: const InputDecoration(
                      hintText: 'e.g. Dubai Creek Harbour launch intel',
                    ),
                    onSubmitted: _send,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _busy ? null : () => _send(_controller.text),
                  child: const Text('Send'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Msg {
  _Msg({required this.role, required this.text});
  final String role;
  final String text;
}
