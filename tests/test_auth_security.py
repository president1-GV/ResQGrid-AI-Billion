"""
ResQGrid AI Billion - Security & Authentication Test Suite
Tests for password hashing, HMAC-SHA256 signed bearer tokens,
RBAC role permissions, and PII redaction.
"""

import unittest
import time
from backend.services.auth_service import AuthService, UserRole


class TestAuthSecurity(unittest.TestCase):

    def setUp(self):
        AuthService.init_users()

    def test_password_hashing_and_verification(self):
        """Verifies salted PBKDF2 password hashing and verification."""
        raw_pwd = "TacticalCommand#2026"
        pwd_hash, salt = AuthService._hash_password(raw_pwd)
        self.assertNotEqual(raw_pwd, pwd_hash)
        self.assertTrue(AuthService._verify_password(raw_pwd, pwd_hash, salt))
        self.assertFalse(AuthService._verify_password("WrongPassword", pwd_hash, salt))

    def test_token_generation_and_verification(self):
        """Verifies HMAC-SHA256 signed token generation and signature validation."""
        user = AuthService.authenticate_user("commander@resqgrid.ai", "Commander#2026")
        self.assertIsNotNone(user)
        self.assertEqual(user.role, UserRole.INCIDENT_COMMANDER)

        token = AuthService.create_token(user, expires_delta_hours=24)
        self.assertIn(".", token)

        payload = AuthService.verify_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], user.user_id)
        self.assertEqual(payload["email"], "commander@resqgrid.ai")
        self.assertEqual(payload["role"], "INCIDENT_COMMANDER")

    def test_token_tampering_detection(self):
        """Verifies tamper-evident HMAC signature detects payload alteration."""
        user = AuthService.authenticate_user("commander@resqgrid.ai", "Commander#2026")
        token = AuthService.create_token(user)
        payload_b64, signature = token.split(".")

        # Tamper with signature
        tampered_token = f"{payload_b64}.{signature[:-4]}ffff"
        self.assertIsNone(AuthService.verify_token(tampered_token))

        # Tamper with payload
        tampered_token2 = f"eyJuYW1lIjoiSGFja2VyIn0.{signature}"
        self.assertIsNone(AuthService.verify_token(tampered_token2))

    def test_user_authentication_failure(self):
        """Verifies wrong password or unknown email returns None."""
        self.assertIsNone(AuthService.authenticate_user("commander@resqgrid.ai", "Wrong#Pass"))
        self.assertIsNone(AuthService.authenticate_user("unknown@resqgrid.ai", "Any#Pass"))

    def test_rbac_roles_seeded(self):
        """Verifies all 4 command and field roles are configured with appropriate permissions."""
        commander = AuthService.authenticate_user("commander@resqgrid.ai", "Commander#2026")
        logistics = AuthService.authenticate_user("logistics@resqgrid.ai", "Logistics#2026")
        responder = AuthService.authenticate_user("responder@resqgrid.ai", "Responder#2026")
        auditor = AuthService.authenticate_user("auditor@resqgrid.ai", "Auditor#2026")

        self.assertIn("approve_allocation", commander.permissions)
        self.assertIn("manage_warehouses", logistics.permissions)
        self.assertIn("submit_report", responder.permissions)
        self.assertIn("view_audit_logs", auditor.permissions)

    def test_pii_redaction(self):
        """Verifies personal phone numbers, emails, and ID numbers are scrubbed."""
        text_with_pii = (
            "Resident Rajesh Kumar (Phone: +91 9876543210, Email: rajesh@example.com, "
            "Aadhaar: 1234-5678-9012) is trapped with 4 family members."
        )
        clean = AuthService.redact_pii(text_with_pii)
        self.assertNotIn("9876543210", clean)
        self.assertNotIn("rajesh@example.com", clean)
        self.assertNotIn("1234-5678-9012", clean)
        self.assertIn("[REDACTED PHONE]", clean)
        self.assertIn("[REDACTED EMAIL]", clean)
        self.assertIn("[REDACTED NATIONAL ID]", clean)


if __name__ == "__main__":
    unittest.main()
