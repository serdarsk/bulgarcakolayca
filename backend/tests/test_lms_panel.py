"""
LMS Panel Backend Tests for BulgarcaKolayca
Tests: Authentication, Student Management, Lessons, Materials, Notifications
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kolayca-courses.preview.emergentagent.com').rstrip('/')

# Test credentials
TEACHER_EMAIL = "teacher@bulgarcakolayca.com"
TEACHER_PASSWORD = "teacher123"

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_teacher_login_success(self):
        """Test teacher login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == TEACHER_EMAIL
        assert data["user"]["role"] == "teacher"
        assert len(data["token"]) > 0
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_student_registration(self):
        """Test student registration flow"""
        test_email = f"TEST_student_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "TEST Student User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "user_id" in data
        assert "approval" in data["message"].lower() or "waiting" in data["message"].lower()
    
    def test_student_login_pending_approval(self):
        """Test that unapproved student cannot login"""
        # First register a new student
        test_email = f"TEST_pending_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "TEST Pending Student"
        })
        assert reg_response.status_code == 200
        
        # Try to login - should fail with 403 (pending approval)
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "testpass123"
        })
        assert login_response.status_code == 403, f"Expected 403 for pending student, got {login_response.status_code}"
    
    def test_duplicate_registration(self):
        """Test that duplicate email registration fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEACHER_EMAIL,
            "password": "testpass123",
            "name": "Duplicate User"
        })
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"


class TestProtectedEndpoints:
    """Test JWT protected endpoints"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_get_me_with_token(self, teacher_token):
        """Test /auth/me endpoint with valid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == TEACHER_EMAIL
        assert data["role"] == "teacher"
    
    def test_get_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_get_me_invalid_token(self):
        """Test /auth/me endpoint with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401


class TestStudentManagement:
    """Test teacher student management endpoints"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_get_all_students(self, teacher_token):
        """Test getting all students"""
        response = requests.get(f"{BASE_URL}/api/teacher/students", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_pending_students(self, teacher_token):
        """Test getting pending students"""
        response = requests.get(f"{BASE_URL}/api/teacher/pending-students", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_add_student_manually(self, teacher_token):
        """Test teacher adding student manually (auto-approved)"""
        test_email = f"TEST_manual_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/teacher/add-student", 
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "TEST Manual Student"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        
        # Verify student can login (auto-approved)
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "testpass123"
        })
        assert login_response.status_code == 200, "Manually added student should be able to login"
    
    def test_approve_student_workflow(self, teacher_token):
        """Test student approval workflow"""
        # Register a new student
        test_email = f"TEST_approve_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "TEST Approval Student"
        })
        assert reg_response.status_code == 200
        student_id = reg_response.json()["user_id"]
        
        # Verify student is in pending list
        pending_response = requests.get(f"{BASE_URL}/api/teacher/pending-students", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert pending_response.status_code == 200
        pending_ids = [s["id"] for s in pending_response.json()]
        assert student_id in pending_ids, "New student should be in pending list"
        
        # Approve the student
        approve_response = requests.post(f"{BASE_URL}/api/teacher/approve-student",
            json={"student_id": student_id, "approved": True},
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert approve_response.status_code == 200
        
        # Verify student can now login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "testpass123"
        })
        assert login_response.status_code == 200, "Approved student should be able to login"


class TestLessons:
    """Test lesson CRUD operations"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_create_lesson(self, teacher_token):
        """Test creating a new lesson"""
        response = requests.post(f"{BASE_URL}/api/lessons",
            json={
                "title": "TEST Bulgarca A1 - Ders 1",
                "description": "Test lesson description",
                "date": "2026-02-15",
                "start_time": "10:00",
                "end_time": "11:00",
                "lesson_type": "individual",
                "student_ids": [],
                "zoom_link": "https://zoom.us/j/test123",
                "level": "A1"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "lesson_id" in data
        assert "message" in data
    
    def test_get_lessons(self, teacher_token):
        """Test getting all lessons"""
        response = requests.get(f"{BASE_URL}/api/lessons", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_and_delete_lesson(self, teacher_token):
        """Test creating and deleting a lesson"""
        # Create lesson
        create_response = requests.post(f"{BASE_URL}/api/lessons",
            json={
                "title": "TEST Delete Lesson",
                "description": "To be deleted",
                "date": "2026-03-01",
                "start_time": "14:00",
                "end_time": "15:00",
                "lesson_type": "individual",
                "student_ids": [],
                "zoom_link": "",
                "level": "A2"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert create_response.status_code == 200
        lesson_id = create_response.json()["lesson_id"]
        
        # Delete lesson
        delete_response = requests.delete(f"{BASE_URL}/api/lessons/{lesson_id}", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert delete_response.status_code == 200
    
    def test_update_lesson(self, teacher_token):
        """Test updating a lesson"""
        # Create lesson first
        create_response = requests.post(f"{BASE_URL}/api/lessons",
            json={
                "title": "TEST Update Lesson",
                "description": "Original description",
                "date": "2026-03-10",
                "start_time": "09:00",
                "end_time": "10:00",
                "lesson_type": "individual",
                "student_ids": [],
                "zoom_link": "",
                "level": "B1"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert create_response.status_code == 200
        lesson_id = create_response.json()["lesson_id"]
        
        # Update lesson
        update_response = requests.put(f"{BASE_URL}/api/lessons/{lesson_id}",
            json={
                "title": "TEST Updated Lesson Title",
                "description": "Updated description"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert update_response.status_code == 200


class TestMaterials:
    """Test materials CRUD operations"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_create_material(self, teacher_token):
        """Test creating a new material"""
        response = requests.post(f"{BASE_URL}/api/materials",
            json={
                "title": "TEST A1 Ders Notları",
                "description": "Test material description",
                "link": "https://drive.google.com/test123",
                "file_type": "document",
                "visible_to": []
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "material_id" in data
    
    def test_get_materials(self, teacher_token):
        """Test getting all materials"""
        response = requests.get(f"{BASE_URL}/api/materials", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_and_delete_material(self, teacher_token):
        """Test creating and deleting a material"""
        # Create material
        create_response = requests.post(f"{BASE_URL}/api/materials",
            json={
                "title": "TEST Delete Material",
                "description": "To be deleted",
                "link": "https://dropbox.com/test456",
                "file_type": "video",
                "visible_to": []
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert create_response.status_code == 200
        material_id = create_response.json()["material_id"]
        
        # Delete material
        delete_response = requests.delete(f"{BASE_URL}/api/materials/{material_id}", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert delete_response.status_code == 200


class TestNotifications:
    """Test notification endpoints"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_get_notifications(self, teacher_token):
        """Test getting notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_unread_count(self, teacher_token):
        """Test getting unread notification count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
    
    def test_mark_all_read(self, teacher_token):
        """Test marking all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", 
            json={},
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200


class TestRescheduleRequests:
    """Test reschedule request endpoints"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Teacher login failed")
    
    def test_get_reschedule_requests(self, teacher_token):
        """Test getting reschedule requests"""
        response = requests.get(f"{BASE_URL}/api/reschedule-requests", headers={
            "Authorization": f"Bearer {teacher_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
