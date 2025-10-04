import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { currencyAPI } from '../services/api';
import { validatePassword, getPasswordStrength } from '../utils/passwordUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
  });
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { register, error } = useAuth();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await currencyAPI.getCountries();
        setCountries(response.data.countries);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate password in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setPasswordErrors(passwordValidation.errors);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      country: formData.country,
    });
    
    if (!result.success) {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isLoadingCountries) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center mb-6">
            <Link 
              to="/" 
              className="inline-block mx-auto transform hover:scale-110 transition-transform duration-300 animate-pulse hover:shadow-md"
            >
              <Logo size="w-16 h-16" />
            </Link>
            <Link 
              to="/" 
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your company account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <div className="card-gradient">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="form-input"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="form-input"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="country" className="form-label">
                Country
              </label>
              <select
                id="country"
                name="country"
                required
                className="form-input"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="">Select your country</option>
                {countries.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Your company's base currency will be set to your country's currency
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`form-input ${passwordErrors.length > 0 ? 'border-red-500' : ''}`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              
              {/* Password strength indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Strength:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-6 rounded ${
                            level <= (passwordStrength.level === 'weak' ? 1 : 
                                     passwordStrength.level === 'medium' ? 2 :
                                     passwordStrength.level === 'strong' ? 3 : 4)
                              ? `bg-${passwordStrength.color}-500`
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Password validation errors */}
              {passwordErrors.length > 0 && (
                <div className="mt-2">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Password requirements */}
              <div className="mt-2 text-xs text-gray-500">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary w-full flex justify-center"
            >
              Create Account
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
