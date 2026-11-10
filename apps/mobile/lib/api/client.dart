import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';

class LuxorApi {
  LuxorApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'X-Demo-User': AppConfig.demoUser,
      };

  Uri _u(String path) => Uri.parse('${AppConfig.apiBaseUrl}$path');

  Future<Map<String, dynamic>> overview() async {
    final res = await _client.get(_u('/api/v1/overview'), headers: _headers);
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> workflows() async {
    final res = await _client.get(_u('/api/v1/workflows'), headers: _headers);
    _ensureOk(res);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> workflow(String id) async {
    final res = await _client.get(_u('/api/v1/workflows/$id'), headers: _headers);
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> approvals() async {
    final res = await _client.get(_u('/api/v1/approvals'), headers: _headers);
    _ensureOk(res);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> approve(String id) async {
    final res = await _client.post(
      _u('/api/v1/approvals/$id/approve'),
      headers: _headers,
      body: jsonEncode({'decision': 'approve', 'reason': 'mobile'}),
    );
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> reject(String id) async {
    final res = await _client.post(
      _u('/api/v1/approvals/$id/reject'),
      headers: _headers,
      body: jsonEncode({'decision': 'reject', 'reason': 'mobile'}),
    );
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> chat(String message, {String? workflowId}) async {
    final res = await _client.post(
      _u('/api/v1/chat'),
      headers: _headers,
      body: jsonEncode({
        'message': message,
        'workflow_id': workflowId,
        'context': {'location': 'Dubai', 'product_type': 'residential'},
      }),
    );
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  void _ensureOk(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('API ${res.statusCode}: ${res.body}');
    }
  }
}
