import io
import sys
import unittest
from types import SimpleNamespace

from fastapi import HTTPException

from backend.auth.auth import require_admin, require_manager
from backend.models.models import UserRole


def make_user(role):
    return SimpleNamespace(
        username="phase2b-fixture",
        email="phase2b-fixture@example.invalid",
        role=role,
    )


class AuthAuthorizationTests(unittest.TestCase):
    def test_manager_denial_is_403_under_cp1252_output(self):
        previous_stdout = sys.stdout
        sys.stdout = io.TextIOWrapper(io.BytesIO(), encoding="cp1252", errors="strict")
        try:
            with self.assertRaises(HTTPException) as raised:
                require_manager(make_user(UserRole.USER))
        finally:
            sys.stdout.close()
            sys.stdout = previous_stdout

        self.assertEqual(raised.exception.status_code, 403)

    def test_admin_denial_is_403_under_cp1252_output(self):
        previous_stdout = sys.stdout
        sys.stdout = io.TextIOWrapper(io.BytesIO(), encoding="cp1252", errors="strict")
        try:
            with self.assertRaises(HTTPException) as raised:
                require_admin(make_user(UserRole.MANAGER))
        finally:
            sys.stdout.close()
            sys.stdout = previous_stdout

        self.assertEqual(raised.exception.status_code, 403)

    def test_manager_role_is_authorized(self):
        user = make_user(UserRole.MANAGER)

        self.assertIs(require_manager(user), user)

    def test_admin_role_is_authorized_for_manager_operation(self):
        user = make_user(UserRole.ADMIN)

        self.assertIs(require_manager(user), user)


if __name__ == "__main__":
    unittest.main()
