
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Chrome, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // If user is already authed and NOT currently syncing profile, go to dashboard
    if (user && !isUserLoading && !isSyncing) {
      console.log("[AUTH] Redirecting to dashboard...");
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isSyncing, router]);

  const syncUserProfile = async (uid: string, email: string | null, displayName: string | null) => {
    if (!db) return;
    setIsSyncing(true);
    console.log("[AUTH] Syncing intelligence for:", uid);
    
    const userRef = doc(db, 'users', uid);
    
    try {
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log("[AUTH] Creating new profile document...");
        await setDoc(userRef, {
          id: uid,
          email: email || '',
          displayName: displayName || 'Operator',
          plan: 'FREE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          totalSavedOverall: 0,
          inboundEmailAddress: `${uid.slice(0, 8)}@operator.ai`,
        }, { merge: true });
      } else {
        console.log("[AUTH] Existing profile found.");
        // Ensure essential fields exist
        await setDoc(userRef, {
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      
      console.log("[AUTH] Sync success.");
      // Small delay to let Firebase cache settle
      await new Promise(r => setTimeout(r, 500));
      router.push('/dashboard');
    } catch (err: any) {
      console.error("[AUTH] Sync failed:", err.message);
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
        }));
      }
      setError("Failed to sync neural profile. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
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
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      await syncUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Configuring Environment...</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Initializing your neural profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
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
              <CardTitle className="text-4xl font-bold font-headline tracking-tight text-slate-900">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg uppercase tracking-widest text-[10px] font-bold">
                {isLogin ? 'Operator is standby.' : 'Initialize your efficiency engine.'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-12 pt-0 space-y-8">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 gap-3 text-lg font-medium transition-all"
              onClick={handleGoogleSignIn}
              disabled={loading || !auth}
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground/50">
                <span className="bg-background px-4">Or with email</span>
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
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary transition-all text-slate-900"
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
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary transition-all text-slate-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-danger text-xs font-bold text-center bg-danger/5 p-3 rounded-xl border border-danger/10">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
                disabled={loading || !auth}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {isLogin ? 'Login' : 'Create Account'}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button 
                className="text-muted-foreground hover:text-slate-900 transition-colors text-sm font-medium"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "No account? Register" : "Have an account? Login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
