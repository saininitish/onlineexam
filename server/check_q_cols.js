async function run() {
  const email = 'test_reattempt1777105635074@example.com';
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const res = await fetch('http://localhost:5000/api/student/tests', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tests = await res.json();
  const testId = tests[0].id;
  
  const attemptRes = await fetch('http://localhost:5000/api/student/test/' + testId, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const attemptData = await attemptRes.json();
  console.log('Columns on questions table:', Object.keys(attemptData.questions[0]));
}
run();
