import { useState } from "react";
import { useCreateGlucoseLog, useOcrProcess } from "@/hooks/use-glucose-logs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export function LogEntryModal({ children, defaultTab = "manual" }: { children: React.ReactNode, defaultTab?: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Manual Form State
  const [val, setVal] = useState("");
  const [type, setType] = useState<"fasting" | "post_prandial" | "hba1c" | "random">("fasting");
  
  // OCR State
  const [scannedData, setScannedData] = useState<any[]>([]);
  
  const createMutation = useCreateGlucoseLog();
  const ocrMutation = useOcrProcess();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val) return;
    
    await createMutation.mutateAsync({
      value: val,
      type,
      unit: "mg/dL",
      source: "manual",
      isConfirmed: true,
      measuredAt: new Date().toISOString(),
    });
    setOpen(false);
    setVal("");
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    try {
      const result = await ocrMutation.mutateAsync(acceptedFiles[0]);
      setScannedData(result.extractedValues);
    } catch (e) {
      // Error handled in hook toast
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': ['.jpeg', '.jpg', '.png']},
    maxFiles: 1
  });

  const confirmOcrEntry = async (entry: any) => {
    await createMutation.mutateAsync({
      value: String(entry.value),
      type: entry.type,
      unit: "mg/dL",
      source: "ocr",
      isConfirmed: true,
      measuredAt: new Date().toISOString(),
    });
    // Remove confirmed entry from list
    setScannedData(prev => prev.filter(i => i !== entry));
    if (scannedData.length <= 1) {
      setOpen(false); // Close if last item
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden gap-0">
        <div className="p-6 bg-gradient-to-br from-white to-secondary/20">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-display text-primary">Add Glucose Reading</DialogTitle>
            <DialogDescription>
              Enter manually or scan a report.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Manual Entry</TabsTrigger>
              <TabsTrigger value="ocr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Smart Scan</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Glucose Level (mg/dL)</Label>
                  <Input 
                    id="value" 
                    type="number" 
                    placeholder="e.g. 110" 
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Measurement Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fasting">Fasting (Before meal)</SelectItem>
                      <SelectItem value="post_prandial">Post Prandial (After meal)</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="hba1c">HbA1c (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base mt-4" 
                  disabled={createMutation.isPending || !val}
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                  Save Reading
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="ocr">
              {scannedData.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Review Extracted Values:</p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {scannedData.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-lg text-primary">{item.value} <span className="text-xs text-muted-foreground font-normal">mg/dL</span></p>
                          <p className="text-sm text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
                        </div>
                        <Button size="sm" onClick={() => confirmOcrEntry(item)} disabled={createMutation.isPending}>
                          Confirm
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  <Button variant="ghost" onClick={() => setScannedData([])} className="w-full mt-2 text-muted-foreground">
                    Scan New Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    {...getRootProps()} 
                    className={clsx(
                      "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-48",
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/30",
                      ocrMutation.isPending && "opacity-50 pointer-events-none"
                    )}
                  >
                    <input {...getInputProps()} />
                    {ocrMutation.isPending ? (
                      <>
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="font-medium text-primary">Analyzing report...</p>
                        <p className="text-xs text-muted-foreground mt-1">Extracting values via AI Vision</p>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-secondary rounded-full mb-4">
                          <UploadCloud className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-medium">Click or drag report image here</p>
                        <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">Supports JPG, PNG. Make sure text is clear.</p>
                      </>
                    )}
                  </div>
                  
                  {ocrMutation.isError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Failed to read image. Try again or use manual entry.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
