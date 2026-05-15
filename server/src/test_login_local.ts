async function testLogin() {
  const API_URL = 'http://localhost:5000/api';
  try {
    console.log('Testing login at:', `${API_URL}/auth/login`);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@mock.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error: any) {
    console.error('Login failed:', error.message);
  }
}

testLogin();
