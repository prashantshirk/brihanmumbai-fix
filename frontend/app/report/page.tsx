"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { complaintAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Camera,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  Copy,
  ExternalLink,
  Loader2,
  Navigation,
} from "lucide-react";

const wards = [
  "A-Ward", "B-Ward", "C-Ward", "D-Ward", "E-Ward",
  "F/N-Ward", "F/S-Ward", "G/N-Ward", "G/S-Ward",
  "H/E-Ward", "H/W-Ward", "K/E-Ward", "K/W-Ward",
  "L-Ward", "M/E-Ward", "M/W-Ward", "N-Ward",
  "P/N-Ward", "P/S-Ward", "R/C-Ward", "R/N-Ward",
  "R/S-Ward", "S-Ward", "T-Ward"
];

interface AnalysisResult {
  issueType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  department: string;
  confidence: number;
  description: string;
}

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [location, setLocation] = useState("");
  const [ward, setWard] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [complaintId, setComplaintId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis (in production, this would call the backend)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock analysis result
    const mockAnalysis: AnalysisResult = {
      issueType: "Pothole",
      severity: "High",
      department: "Roads & Infrastructure",
      confidence: 94,
      description: "Large pothole detected on road surface. The damage appears to extend approximately 2-3 feet in diameter with significant depth. This poses a safety hazard for vehicles and pedestrians.",
    };
    
    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
    setStep(2);
  };

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsGettingLocation(true);
    setLocationCaptured(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "User-Agent": "BrihanMumbaiFix/1.0 contact@brihanmumbai.in" } }
          );
          const data = await res.json();
          if (data.display_name) {
            setLocation(data.display_name);
          }
          setLocationCaptured(true);
        } catch {
          setLocationCaptured(true);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        alert("Location access denied. Please type your address manually.");
        console.error("Geolocation error:", err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  const handleSubmit = async () => {
    if (!location || !ward || !analysis || !imagePreview) return;

    setIsAnalyzing(true);
    try {
      const created = await complaintAPI.create({
        image_url: imagePreview,
        issue_type: analysis.issueType,
        severity: analysis.severity,
        description: analysis.description,
        department: analysis.department,
        location,
        ward_number: ward,
        latitude,
        longitude,
        additional_details: additionalDetails,
      });

      const id =
        created.id ||
        created._id ||
        `BMF-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`;
      setComplaintId(id);
      setStep(3);
    } catch (err) {
      console.error("Failed to submit complaint:", err);
      alert("Could not submit complaint right now. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    const complaintLetter = generateComplaintLetter();
    navigator.clipboard.writeText(complaintLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateComplaintLetter = () => {
    return `FORMAL COMPLAINT LETTER

Complaint ID: ${complaintId}
Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}

To,
The ${analysis?.department} Department
BrihanMumbai Municipal Corporation
${ward}

Subject: Report of ${analysis?.issueType} - ${analysis?.severity} Severity

Dear Sir/Madam,

I am writing to formally report a civic issue that requires immediate attention.

Issue Details:
- Type: ${analysis?.issueType}
- Severity: ${analysis?.severity}
- Location: ${location}
- Ward: ${ward}

Description:
${analysis?.description}

${additionalDetails ? `Additional Information:\n${additionalDetails}\n` : ""}
I request your department to take necessary action at the earliest to resolve this issue for the safety and convenience of citizens.

Thank you for your attention to this matter.

Sincerely,
A Concerned Citizen

---
This complaint was filed through BrihanMumbai Fix
Track status at: https://brihanmumbai.fix/track/${complaintId}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-destructive text-destructive-foreground";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Report an Issue</h1>
              <Badge variant="secondary">Step {step} of 3</Badge>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span className={step >= 1 ? "text-primary font-medium" : ""}>Upload</span>
              <span className={step >= 2 ? "text-primary font-medium" : ""}>Details</span>
              <span className={step >= 3 ? "text-primary font-medium" : ""}>Complete</span>
            </div>
          </div>

          {/* Step 1: Image Upload */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="size-5" />
                  Upload Issue Photo
                </CardTitle>
                <CardDescription>
                  Take or upload a clear photo of the civic issue. Our AI will analyze it automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!imagePreview ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
                        <Upload className="size-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Drag and drop your image here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select Image
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Supports JPG, PNG, WEBP (Max 5MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="Issue preview"
                        className="w-full aspect-video object-cover"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-primary" />
                      <span>{imageFile?.name}</span>
                      <span>({(imageFile!.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!imageFile || isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Image
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: AI Analysis & Location */}
          {step === 2 && analysis && (
            <div className="space-y-6">
              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="size-5" />
                    AI Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Our AI has analyzed your image. Please verify the details below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <img
                      src={imagePreview!}
                      alt="Issue"
                      className="w-32 h-24 object-cover rounded-lg border"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(analysis.severity)}>
                          {analysis.severity} Severity
                        </Badge>
                        <Badge variant="secondary">{analysis.issueType}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span>{analysis.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Meter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI Confidence</span>
                      <span className="font-medium">{analysis.confidence}%</span>
                    </div>
                    <Progress value={analysis.confidence} className="h-2" />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">AI Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-5" />
                    Location Details
                  </CardTitle>
                  <CardDescription>
                    Provide the exact location to help authorities find and fix the issue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location / Address</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="location"
                        placeholder="E.g., Near Andheri Railway Station, opposite Landmark building, Link Road"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {isGettingLocation ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                        {isGettingLocation
                          ? "Getting location..."
                          : locationCaptured
                          ? "Location captured ✓"
                          : "Use My Location"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward">Select Ward</Label>
                    <Select value={ward} onValueChange={setWard}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Additional Details <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Any extra context, nearby landmarks, or specific details about the issue..."
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground text-right">{additionalDetails.length}/1000</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!location || !ward || isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Report
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="size-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Report Submitted Successfully!</h2>
                      <p className="text-muted-foreground mt-2">
                        Your complaint has been registered and forwarded to the relevant department.
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-4 inline-block">
                      <p className="text-sm text-muted-foreground mb-1">Complaint ID</p>
                      <p className="text-xl font-mono font-bold text-primary">{complaintId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complaint Letter */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Formal Complaint Letter</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                      <Copy className="size-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <CardDescription>
                    A formal complaint letter has been generated. You can copy and save it for your records.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {generateComplaintLetter()}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1 gap-2">
                  <Link href="/dashboard">
                    View Dashboard
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep(1);
                    setImageFile(null);
                    setImagePreview(null);
                    setAnalysis(null);
                    setLocation("");
                    setWard("");
                    setAdditionalDetails("");
                    setLatitude(null);
                    setLongitude(null);
                    setIsGettingLocation(false);
                    setLocationCaptured(false);
                    setComplaintId("");
                  }}
                >
                  Report Another Issue
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
