import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShieldCheck, Lock, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.login(email, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@school.com');
      setPassword('admin123');
    } else {
      setEmail('staff@school.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Parent / Student Portal</span>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-8">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-2 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">Staff & Admin Portal</CardTitle>
            <CardDescription>
              Sign in to verify student document submissions
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <Input
                label="Staff Email"
                type="email"
                required
                placeholder="admin@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In to Admin Console
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 text-center">
                Demo Credentials (1-Click Fill)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFillDemo('admin')}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Admin Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFillDemo('staff')}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Staff Demo
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center text-center text-[11px] text-slate-400">
            Student Document Verification Hub
          </CardFooter>
        </Card>
      </div>

      <div className="text-center text-xs text-slate-400">
        Demo System • Secure Internal Portal
      </div>
    </div>
  );
};
