// Crowdbeats V2 — Audit Event Model (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/audit/audit.ts
// NOTE: AuditEvent is SERVER_ONLY — this Dart model is for read-only display (staff app only)

class AuditEvent {
  const AuditEvent({
    required this.eventId,
    required this.action,
    required this.actorUid,
    required this.actorType,
    required this.metadata,
    required this.correlationId,
    required this.createdAt,
    this.targetId,
    this.targetType,
    this.platform,
  });

  final String eventId;
  final String action;
  final String actorUid;
  final String actorType;
  final String? targetId;
  final String? targetType;
  final Map<String, dynamic> metadata;
  final String correlationId;
  final String createdAt;
  // No updatedAt — immutable
  final String? platform;

  factory AuditEvent.fromJson(Map<String, dynamic> json) => AuditEvent(
        eventId: json['eventId'] as String,
        action: json['action'] as String,
        actorUid: json['actorUid'] as String,
        actorType: json['actorType'] as String,
        metadata: Map<String, dynamic>.from(json['metadata'] as Map),
        correlationId: json['correlationId'] as String,
        createdAt: json['createdAt'] as String,
        targetId: json['targetId'] as String?,
        targetType: json['targetType'] as String?,
        platform: json['platform'] as String?,
      );
}

// ─── Idempotency Record (client-invisible, mirrored for staff tooling) ────────

class IdempotencyRecord {
  const IdempotencyRecord({
    required this.key,
    required this.uid,
    required this.operation,
    required this.status,
    required this.createdAt,
    required this.expiresAt,
    this.responseSnapshot,
  });

  final String key;
  final String uid;
  final String operation;
  final String status; // 'processing' | 'succeeded' | 'failed'
  final dynamic responseSnapshot;
  final String createdAt;
  final String expiresAt;
}
