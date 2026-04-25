async function run() {
  try {
    const email = 'test_reattempt' + Date.now() + '@example.com';
    await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Student', email: email, password: 'password', role: 'student' })
    });
    
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'password' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const testsRes = await fetch('http://localhost:5000/api/student/tests', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tests = await testsRes.json();
    
    if (tests.length === 0) return console.log('No tests found.');

    const testId = tests[0].id;
    console.log('Fetching test:', testId);

    const testDataRes = await fetch('http://localhost:5000/api/student/test/' + testId, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', testDataRes.status);
    const text = await testDataRes.text();
    console.log('Response:', text);

  } catch(e) {
    console.error(e);
  }
}
run();
