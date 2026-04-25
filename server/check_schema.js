async function run() {
  const email = 'test_reattempt1777105635074@example.com';
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const res = await fetch('http://localhost:5000/api/student/attempts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const attempts = await res.json();
  const attemptId = attempts[0].id;
  
  const attemptRes = await fetch('http://localhost:5000/api/student/attempt/' + attemptId, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const attemptData = await attemptRes.json();
  console.log(attemptData.answers[0]);
}
run();
