import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintAPI } from '../api'
import { 
  Camera, Upload, CheckCircle, AlertCircle, MapPin, 
  Loader2, Copy, Check, Navigation, FileText 
} from 'lucide-react'

const MUMBAI_WARDS = [
  'A-Ward', 'B-Ward', 'C-Ward', 'D-Ward', 'E-Ward',
  'F/N-Ward', 'F/S-Ward', 'G/N-Ward', 'G/S-Ward',
  'H/E-Ward', 'H/W-Ward', 'K/E-Ward', 'K/W-Ward',
  'L-Ward', 'M/E-Ward', 'M/W-Ward', 'N-Ward',
  'P/N-Ward', 'P/S-Ward', 'R/C-Ward', 'R/N-Ward',
  'R/S-Ward', 'S-Ward', 'T-Ward'
]

const ISSUE_ICONS = {
  'Pothole': '🕳️',
  'Garbage/Waste': '🗑️',
  'Water Leakage': '💧',
  'Broken Streetlight': '💡',
  'Damaged Footpath': '🚶',
  'Open Drain': '🌊',
  'Illegal Construction': '🏗️',
  'Other': '📋'
}

function Home() {
  const navigate = useNavigate()
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1 - Image Upload
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Step 2 - Analysis Results
  const [analysisResult, setAnalysisResult] = useState(null)
  const [location, setLocation] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  
  // Step 3 - Complaint
  const [complaintText, setComplaintText] = useState('')
  const [submittedComplaint, setSubmittedComplaint] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // UI State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle file selection
  const handleFileSelect = (file) => {
    setError('')
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or WEBP.')
      return
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }
    
    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Step 1 → Step 2: Analyze Image
  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      setError('Please upload an image first.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const result = await complaintAPI.analyzeImage(formData)
      setAnalysisResult(result)
      setCurrentStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze image. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Step 2 → Step 3: Generate Complaint
  const handleGenerateComplaint = async () => {
    if (!location.trim()) {
      setError('Please enter a location.')
      return
    }
    
    if (!wardNumber) {
      setError('Please select a ward.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Create complaint data
      const complaintData = {
        image_url: analysisResult.image_url,
        issue_type: analysisResult.issue_type,
        severity: analysisResult.severity,
        description: analysisResult.description,
        department: analysisResult.department,
        location: location,
        ward_number: wardNumber,
        latitude: latitude,
        longitude: longitude
      }
      
      const result = await complaintAPI.create(complaintData)
      setComplaintText(result.complaint_text)
      setSubmittedComplaint(result)
      setCurrentStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate complaint. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy complaint text to clipboard
  const handleCopyComplaint = () => {
    navigator.clipboard.writeText(complaintText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Get severity badge color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium text-gray-700">Upload Photo</span>
            <span className="text-sm font-medium text-gray-700">Confirm Details</span>
            <span className="text-sm font-medium text-gray-700">Submit</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-primary text-primary px-4 py-3 rounded flex items-start">
            <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Upload Photo */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-heading font-bold text-dark mb-6">Upload Photo of Civic Issue</h2>
            
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-primary bg-red-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
                style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Camera className="mx-auto mb-4 text-gray-400" size={64} />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Drop your photo here or click to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, WEBP (Max 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full max-h-96 object-contain bg-gray-100"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Choose Different Photo
                  </button>
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        AI is analyzing your photo...
                      </>
                    ) : (
                      'Analyze Issue'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Confirm Details */}
        {currentStep === 2 && analysisResult && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-heading font-bold text-dark mb-6">Confirm Issue Details</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Uploaded Image */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Uploaded Photo</h3>
                <img 
                  src={analysisResult.image_url} 
                  alt="Uploaded issue" 
                  className="w-full rounded-xl border border-gray-200"
                />
              </div>
              
              {/* AI Analysis Results */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-3">AI Analysis Results</h3>
                
                {/* Issue Type */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Issue Type</p>
                  <p className="text-lg font-semibold text-dark flex items-center">
                    <span className="text-2xl mr-2">{ISSUE_ICONS[analysisResult.issue_type] || '📋'}</span>
                    {analysisResult.issue_type}
                  </p>
                </div>
                
                {/* Severity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">Severity Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(analysisResult.severity)}`}>
                    {analysisResult.severity}
                  </span>
                </div>
                
                {/* Department */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Department</p>
                  <p className="text-base font-semibold text-dark">{analysisResult.department}</p>
                </div>
                
                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{analysisResult.description}</p>
                </div>
                
                {/* Confidence */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">AI Confidence: {analysisResult.confidence}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${analysisResult.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location / Address *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g., Linking Road, Bandra West"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={getCurrentLocation}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    title="Get current location"
                  >
                    <Navigation size={20} />
                  </button>
                </div>
                {latitude && longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMC Ward *
                </label>
                <select
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Ward</option>
                  {MUMBAI_WARDS.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerateComplaint}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Generating...
                  </>
                ) : (
                  'Generate Complaint'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && submittedComplaint && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Success State */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h2 className="text-3xl font-heading font-bold text-dark mb-2">Complaint Submitted!</h2>
              <p className="text-gray-600">Your complaint has been registered successfully.</p>
              <p className="text-sm text-gray-500 mt-2">
                Complaint ID: <span className="font-mono font-semibold text-primary">{submittedComplaint._id}</span>
              </p>
            </div>
            
            {/* Complaint Letter */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Generated Complaint Letter
                </h3>
                <button
                  onClick={handleCopyComplaint}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {complaintText}
                </pre>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                View Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-red-50 transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
