"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrorCode = void 0;
var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    AuthErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    AuthErrorCode["FORBIDDEN"] = "FORBIDDEN";
    AuthErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    AuthErrorCode["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    AuthErrorCode["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    AuthErrorCode["INVALID_VERIFICATION_CODE"] = "INVALID_VERIFICATION_CODE";
    AuthErrorCode["VERIFICATION_CODE_EXPIRED"] = "VERIFICATION_CODE_EXPIRED";
    AuthErrorCode["MAX_ATTEMPTS_EXCEEDED"] = "MAX_ATTEMPTS_EXCEEDED";
    AuthErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    AuthErrorCode["SESSION_REVOKED"] = "SESSION_REVOKED";
    AuthErrorCode["TOKEN_REUSE_DETECTED"] = "TOKEN_REUSE_DETECTED";
    AuthErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    AuthErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    AuthErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    AuthErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(AuthErrorCode || (exports.AuthErrorCode = AuthErrorCode = {}));
//# sourceMappingURL=errors.js.map