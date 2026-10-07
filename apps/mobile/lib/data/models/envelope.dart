// Crowdbeats V2 — API Response Envelope (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/common/envelope.ts

// ─── Error Codes ──────────────────────────────────────────────────────────────

// Exhaustive platform error code taxonomy.
// Dart equivalent of TypeScript ErrorCode const object.
enum ErrorCode {
  // Auth
  unauthenticated,
  forbidden,
  tokenExpired,
  accountDisabled,
  // Validation
  invalidArgument,
  missingRequiredField,
  invalidMoneyAmount,
  invalidSplitConfig,
  belowMinimumTip,
  aboveMaximumTip,
  // Resource
  notFound,
  alreadyExists,
  conflict,
  // Idempotency
  duplicateRequest,
  // Payment
  paymentDeclined,
  paymentRequiresAction,
  stripeError,
  refundWindowExpired,
  payoutBelowMinimum,
  bankAccountNotLinked,
  // Session / Stage
  sessionNotActive,
  sessionAlreadyEnded,
  qrTokenExpired,
  qrTokenInvalid,
  qrTokenAlreadyUsed,
  // Membership
  notAMember,
  alreadyAMember,
  insufficientRole,
  // Rate Limiting
  rateLimited,
  // Moderation
  accountSuspended,
  contentRemoved,
  // Internal
  internalError,
  serviceUnavailable,
  unimplemented;

  static ErrorCode fromString(String s) => ErrorCode.values.firstWhere(
        (e) => e.name == _camelToUpperSnake(s),
        orElse: () => ErrorCode.internalError,
      );

  static String _camelToUpperSnake(String s) => s
      .replaceAllMapped(RegExp(r'[A-Z]'), (m) => '_${m.group(0)!}')
      .toUpperCase()
      .replaceFirst(RegExp(r'^_'), '');
}

// ─── API Error ────────────────────────────────────────────────────────────────

class ApiError {
  const ApiError({required this.code, required this.message, this.details});

  final ErrorCode code;
  final String message;
  final Map<String, dynamic>? details;

  factory ApiError.fromJson(Map<String, dynamic> json) => ApiError(
        code: ErrorCode.fromString(json['code'] as String),
        message: json['message'] as String,
        details: json['details'] as Map<String, dynamic>?,
      );
}

// ─── Response Envelope ────────────────────────────────────────────────────────

sealed class ApiResponse<T> {
  const ApiResponse();
}

class ApiSuccess<T> extends ApiResponse<T> {
  const ApiSuccess({required this.data, required this.correlationId, this.nextCursor});

  final T data;
  final String correlationId;
  final String? nextCursor;
}

class ApiFailure<T> extends ApiResponse<T> {
  const ApiFailure({required this.error, required this.correlationId});

  final ApiError error;
  final String correlationId;
}

ApiResponse<T> apiResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Map<String, dynamic>) fromJsonT,
) {
  final ok = json['ok'] as bool;
  final correlationId = json['correlationId'] as String;
  if (ok) {
    return ApiSuccess<T>(
      data: fromJsonT(json['data'] as Map<String, dynamic>),
      correlationId: correlationId,
      nextCursor: json['nextCursor'] as String?,
    );
  } else {
    return ApiFailure<T>(
      error: ApiError.fromJson(json['error'] as Map<String, dynamic>),
      correlationId: correlationId,
    );
  }
}
