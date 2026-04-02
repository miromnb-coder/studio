"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, FileText, Upload, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { AnalysisService } from '@/services/analysis-service';

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In a real app, we'd upload to Firebase Storage here
      // const analysis = await AnalysisService.analyze({ documentText: textInput, imageDataUri: preview || undefined });
      
      // Simulate API delay
      await new Promise(r => setTimeout(r, 2000));
      
      // Navigate to a mock results page or create a record in Firestore
      // For this demo, we'll just redirect to dashboard with a mock query
      router.push('/dashboard?new_analysis=true');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">New Analysis</h1>
            <p className="text-muted-foreground text-lg">Upload your financial documents to uncover savings.</p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-white/5 border border-white/5 p-1">
              <TabsTrigger value="upload" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-background transition-all">
                <Camera className="w-4 h-4 mr-2" />
                Upload Screenshot
              </TabsTrigger>
              <TabsTrigger value="text" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-background transition-all">
                <FileText className="w-4 h-4 mr-2" />
                Paste Statement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card className="premium-card border-dashed border-2 min-h-[300px] flex flex-col items-center justify-center relative group">
                {preview ? (
                  <div className="w-full h-full p-4 flex flex-col items-center">
                    <img src={preview} alt="Preview" className="max-h-[300px] rounded-lg object-contain mb-4" />
                    <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }} className="rounded-full border-white/10">
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <div className="flex flex-col items-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold font-headline">Drop screenshot or click to browse</p>
                        <p className="text-muted-foreground">Supports PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </>
                )}
              </Card>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-3 text-sm text-muted-foreground">
                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                <p>We work best with screenshots from your banking apps, email receipts, or PDF statements.</p>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-6">
              <Card className="premium-card overflow-hidden">
                <Textarea 
                  placeholder="Paste your statement text here... (e.g. Netflix $15.99, Spotify $9.99...)" 
                  className="min-h-[300px] border-0 focus-visible:ring-0 p-6 text-lg leading-relaxed bg-transparent"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </Card>
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                <Plus className="w-4 h-4" />
                <span>Tip: Be sure to include amounts and merchant names for better accuracy.</span>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <Button 
              className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20"
              disabled={loading || (!textInput && !file)}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Documents...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
