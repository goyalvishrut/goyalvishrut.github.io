"""Run with the repository-local environment: python -m unittest discover -s tests."""

import unittest
from pathlib import Path

from app import app


class PortfolioRoutesTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.root = Path(app.root_path)

    def test_home_and_index_use_canonical_static_page(self):
        expected = (self.root / "index.html").read_bytes()
        for route in ("/", "/index.html"):
            with self.subTest(route=route):
                with self.client.get(route) as response:
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.data, expected)

    def test_resume_and_public_assets(self):
        with self.client.get("/resume.html") as response:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data, (self.root / "resume.html").read_bytes())
        for path in ("css/portfolio.css", "css/resume.css", "js/portfolio.js", "img/monogram.svg", "img/profile-img.jpg"):
            with self.subTest(path=path):
                with self.client.get(f"/static/assets/{path}") as response:
                    self.assertEqual(response.status_code, 200)

    def test_private_files_and_unknown_routes_are_not_served(self):
        for route in ("/.git/config", "/.env", "/app.py", "/unknown"):
            with self.subTest(route=route):
                with self.client.get(route) as response:
                    self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
