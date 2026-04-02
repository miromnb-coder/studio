'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const auth = getAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const syncUserProfile = async (uid: string, email: string | null, displayName: string | null) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: uid,
        email: email || '',
        displayName: displayName || 'User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalSavedOverall: 0,
        inboundEmailAddress: null,
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      await syncUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <Card className="glass border-white/5 shadow-2xl overflow-hidden rounded-[32px]">
          <CardHeader className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-background font-bold text-2xl mx-auto shadow-2xl shadow-primary/20">
              O
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-bold font-headline tracking-tight">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg uppercase tracking-widest text-[10px] font-bold">
                {isLogin ? 'The operator is standing by.' : 'Initialize your savings engine.'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-12 pt-0 space-y-8">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 gap-3 text-lg font-medium transition-all"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground/50">
                <span className="bg-[#19191C] px-4">Or use email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-danger text-sm font-medium text-center">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button 
                className="text-muted-foreground hover:text-white transition-colors text-sm font-medium"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
