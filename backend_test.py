import requests
import sys
import json
from datetime import datetime

class BulgarcaKolaycaAPITester:
    def __init__(self, base_url="https://kolayca-courses.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, test_response_content=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise Exception(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Test response content if requested
                if test_response_content:
                    try:
                        response_json = response.json()
                        if response_json:
                            print(f"   Response contains data: {len(response_json) if isinstance(response_json, (list, dict)) else 'Valid JSON'}")
                            result["response_content"] = True
                        else:
                            print(f"   Warning: Empty response")
                            result["response_content"] = False
                    except:
                        print(f"   Warning: Invalid JSON response")
                        result["response_content"] = False
                        
                return success, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Error response: {response.text[:200]}...")
                result["error_message"] = response.text[:200] if response.text else "No error message"
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            result["error_message"] = "Request timeout"
            result["success"] = False
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result["error_message"] = str(e)
            result["success"] = False
            return False, {}
        finally:
            self.results.append(result)

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET", 
            "",
            200,
            test_response_content=True
        )

    def test_contact_form(self):
        """Test contact form submission"""
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "This is a test message for the contact form.",
            "language": "tr"
        }
        
        success, response = self.run_test(
            "Contact Form Submission",
            "POST",
            "contact",
            200,
            data=test_data,
            test_response_content=True
        )
        
        if success and response:
            if 'id' in response and 'created_at' in response:
                print(f"   Contact form created with ID: {response.get('id', 'N/A')}")
                return True
            else:
                print(f"   Warning: Response missing expected fields")
        
        return success

    def test_get_contact_forms(self):
        """Test getting contact forms"""
        return self.run_test(
            "Get Contact Forms",
            "GET",
            "contact",
            200,
            test_response_content=True
        )

    def test_quiz_questions_bulgarian(self):
        """Test getting Bulgarian quiz questions"""
        success, response = self.run_test(
            "Get Bulgarian Quiz Questions",
            "GET",
            "quiz/questions/bulgarian",
            200,
            test_response_content=True
        )
        
        if success and response:
            questions = response.get('questions', [])
            if len(questions) > 0:
                print(f"   Retrieved {len(questions)} Bulgarian questions")
                # Check first question structure
                if questions[0].get('id') and questions[0].get('question') and questions[0].get('options'):
                    print(f"   Question structure is valid")
                    return True
                else:
                    print(f"   Warning: Question structure invalid")
            else:
                print(f"   Warning: No questions returned")
        
        return success

    def test_quiz_questions_turkish(self):
        """Test getting Turkish quiz questions"""
        success, response = self.run_test(
            "Get Turkish Quiz Questions",
            "GET",
            "quiz/questions/turkish",
            200,
            test_response_content=True
        )
        
        if success and response:
            questions = response.get('questions', [])
            if len(questions) > 0:
                print(f"   Retrieved {len(questions)} Turkish questions")
                return True
            else:
                print(f"   Warning: No questions returned")
        
        return success

    def test_quiz_submission(self):
        """Test level test quiz submission"""
        test_data = {
            "name": "Test Student",
            "email": "student@example.com",
            "language_learning": "bulgarian",
            "answers": [
                {"question_id": 1, "selected_option": 1},
                {"question_id": 2, "selected_option": 2},
                {"question_id": 3, "selected_option": 1}
            ]
        }
        
        success, response = self.run_test(
            "Level Test Quiz Submission",
            "POST",
            "quiz/submit",
            200,
            data=test_data,
            test_response_content=True
        )
        
        if success and response:
            if 'score' in response and 'recommended_level' in response:
                print(f"   Quiz result: {response.get('score', 0)}/{response.get('total_questions', 0)} - Level: {response.get('recommended_level', 'N/A')}")
                return True
            else:
                print(f"   Warning: Quiz response missing expected fields")
        
        return success

    def test_quiz_invalid_language(self):
        """Test quiz with invalid language (should return 404)"""
        return self.run_test(
            "Quiz Invalid Language",
            "GET",
            "quiz/questions/invalid",
            404
        )

def main():
    """Main test execution"""
    print("🚀 Starting BulgarcaKolayca API Tests...")
    print("=" * 60)
    
    tester = BulgarcaKolaycaAPITester()
    
    # Run all tests
    print("\n📡 Testing Core API...")
    tester.test_root_endpoint()
    
    print("\n📝 Testing Contact Form APIs...")
    tester.test_contact_form()
    tester.test_get_contact_forms()
    
    print("\n🧠 Testing Level Test APIs...")
    tester.test_quiz_questions_bulgarian()
    tester.test_quiz_questions_turkish()
    tester.test_quiz_submission()
    
    print("\n🚫 Testing Error Handling...")
    tester.test_quiz_invalid_language()

    # Print results summary
    print("\n" + "=" * 60)
    print(f"📊 Test Results Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    # Show failed tests
    failed_tests = [r for r in tester.results if not r['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   • {test['test_name']}: {test['actual_status']} (expected {test['expected_status']})")
            if 'error_message' in test:
                print(f"     Error: {test['error_message']}")
    else:
        print(f"\n✅ All tests passed!")

    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            'detailed_results': tester.results
        }, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())