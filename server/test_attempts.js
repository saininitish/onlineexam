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
    console.log('Login:', loginData);

    const token = loginData.token;
    if (!token) return console.log('No token');

    const testsRes = await fetch('http://localhost:5000/api/student/tests', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tests = await testsRes.json();

    if (tests.length === 0) return console.log('No tests');

    const testId = tests[0].id;

    // First attempt
    console.log('Submitting first attempt...');
    const submit1 = await fetch('http://localhost:5000/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ test_id: testId, answers: [], time_taken: 10 })
    });
    console.log('Submit 1:', await submit1.json());

    // Second attempt
    console.log('Submitting second attempt...');
    const submit2 = await fetch('http://localhost:5000/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ test_id: testId, answers: [], time_taken: 20 })
    });
    console.log('Submit 2:', await submit2.json());

  } catch(e) {
    console.error(e);
  }
}
run();
