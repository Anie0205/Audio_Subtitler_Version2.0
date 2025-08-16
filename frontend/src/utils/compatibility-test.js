// Compatibility test utility for frontend-backend communication
import { buildApiUrl, ENDPOINTS } from '../config/api.js'

export const testBackendCompatibility = async () => {
  const results = {
    health: false,
    pipeline: false,
    overlay: false,
    errors: []
  }

  try {
    // Test health endpoint
    const healthResponse = await fetch(buildApiUrl(ENDPOINTS.HEALTH))
    if (healthResponse.ok) {
      results.health = true
      console.log('✅ Health endpoint working')
    } else {
      results.errors.push(`Health endpoint failed: ${healthResponse.status}`)
    }
  } catch (error) {
    results.errors.push(`Health endpoint error: ${error.message}`)
  }

  try {
    // Test pipeline endpoint (GET request to check if it exists)
    const pipelineResponse = await fetch(buildApiUrl('/pipeline/'))
    if (pipelineResponse.ok) {
      results.pipeline = true
      console.log('✅ Pipeline endpoint accessible')
    } else {
      results.errors.push(`Pipeline endpoint failed: ${pipelineResponse.status}`)
    }
  } catch (error) {
    results.errors.push(`Pipeline endpoint error: ${error.message}`)
  }

  try {
    // Test overlay endpoint (GET request to check if it exists)
    const overlayResponse = await fetch(buildApiUrl('/overlay/'))
    if (overlayResponse.ok) {
      results.overlay = true
      console.log('✅ Overlay endpoint accessible')
    } else {
      results.errors.push(`Overlay endpoint failed: ${overlayResponse.status}`)
    }
  } catch (error) {
    results.errors.push(`Overlay endpoint error: ${error.message}`)
  }

  return results
}

export const logCompatibilityStatus = (results) => {
  console.log('🔍 Backend Compatibility Test Results:')
  console.log(`Health Check: ${results.health ? '✅' : '❌'}`)
  console.log(`Pipeline: ${results.pipeline ? '✅' : '❌'}`)
  console.log(`Overlay: ${results.overlay ? '✅' : '❌'}`)
  
  if (results.errors.length > 0) {
    console.log('❌ Errors found:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  } else {
    console.log('🎉 All endpoints are compatible!')
  }
}
