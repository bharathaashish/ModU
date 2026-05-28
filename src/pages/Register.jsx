import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]*$/;

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateUsername = useCallback((val) => {
    if (val.length > 0 && !USERNAME_REGEX.test(val)) {
      return 'Only letters, numbers, underscores, and periods allowed';
    }
    return '';
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    const fmtErr = validateUsername(username);
    if (fmtErr) {
      setError(fmtErr);
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (Number(age) < 13 || Number(age) > 120) {
      setError('Please provide a valid age (13+)');
      return;
    }
    if (phone.length < 7) {
      setError('Please provide a valid phone number');
      return;
    }

    const result = await register({ username, name, password, email, age: Number(age), phone });
    if (result.success) {
      navigate('/onboarding');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-card" style={{ maxWidth: '450px' }}>
        <h1 className="logo-text"><span style={{ fontWeight: 900 }}>M</span>od<span style={{ fontWeight: 900 }}>U</span></h1>
        <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Sign up to see photos and videos from your friends.</p>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="Full Name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <input
              type="text"
              placeholder="Username"
              className="input"
              value={username}
              onChange={handleUsernameChange}
              style={usernameError ? { borderColor: 'var(--error-color)' } : {}}
              required
            />
            {usernameError && <div style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px' }}>{usernameError}</div>}
          </div>
          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Age"
              className="input"
              style={{ width: '30%' }}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="13"
              max="120"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="input"
              style={{ width: '70%' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="button" style={{ marginTop: '8px' }}>
            <UserPlus size={18} />
            Register
          </button>
        </form>
        <div style={{ marginTop: '24px', fontSize: '14px' }}>
          Have an account? <Link to="/login" className="link">Log in</Link>
        </div>
      </div>
    </div>
  );
}
