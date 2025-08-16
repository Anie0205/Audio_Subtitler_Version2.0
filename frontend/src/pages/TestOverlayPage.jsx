import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TestOverlayPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Set up test data in sessionStorage
    const testVideoUrl = '/sample_video.mp4' // This would be our test video
    sessionStorage.setItem('originalVideo', testVideoUrl)
    sessionStorage.setItem('targetLanguage', 'en')
    sessionStorage.setItem('videoFileName', 'sample_video.mp4')
    
    // Navigate to overlay page
    navigate('/overlay')
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Setting up test data...</p>
      </div>
    </div>
  )
}

export default TestOverlayPage

