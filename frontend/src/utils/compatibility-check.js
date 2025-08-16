// Comprehensive compatibility check between frontend and backend
import { buildApiUrl, ENDPOINTS } from '../config/api.js'

export const runCompatibilityCheck = async () => {
  const results = {
    endpoints: {},
    overall: true,
    errors: []
  }

  console.log('🔍 Starting comprehensive compatibility check...')

  // Check each endpoint
  const endpointChecks = [
    { name: 'Health Check', endpoint: ENDPOINTS.HEALTH, method: 'GET' },
    { name: 'Pipeline Process', endpoint: ENDPOINTS.PIPELINE_PROCESS, method: 'GET' },
    { name: 'Pipeline Overlay', endpoint: ENDPOINTS.PIPELINE_OVERLAY, method: 'GET' },
    { name: 'Overlay Service', endpoint: ENDPOINTS.OVERLAY_OVERLAY, method: 'GET' },
    { name: 'Translator Service', endpoint: ENDPOINTS.TRANSLATOR_TRANSLATE, method: 'GET' }
  ]

  for (const check of endpointChecks) {
    try {
      const response = await fetch(buildApiUrl(check.endpoint), { method: check.method })
      const isWorking = response.status < 500 // Any 4xx status means endpoint exists
      
      results.endpoints[check.name] = {
        status: isWorking ? '✅ Working' : '⚠️ Exists but error',
        endpoint: check.endpoint,
        statusCode: response.status,
        method: check.method
      }

      if (!isWorking) {
        results.overall = false
        results.errors.push(`${check.name}: HTTP ${response.status}`)
      }

      console.log(`${isWorking ? '✅' : '⚠️'} ${check.name}: ${check.endpoint} (${response.status})`)
      
    } catch (error) {
      results.endpoints[check.name] = {
        status: '❌ Failed',
        endpoint: check.endpoint,
        error: error.message,
        method: check.method
      }
      results.overall = false
      results.errors.push(`${check.name}: ${error.message}`)
      console.log(`❌ ${check.name}: ${check.endpoint} - ${error.message}`)
    }
  }

  // Check API configuration
  const configCheck = {
    development: buildApiUrl('/health'),
    production: buildApiUrl('/health'),
    current: buildApiUrl('/health')
  }

  results.config = configCheck
  console.log('📋 API Configuration:')
  console.log(`  Development: ${configCheck.development}`)
  console.log(`  Production: ${configCheck.production}`)
  console.log(`  Current: ${configCheck.current}`)

  return results
}

export const logCompatibilityReport = (results) => {
  console.log('\n📊 COMPATIBILITY REPORT')
  console.log('=' * 50)
  
  console.log('\n🔗 Endpoint Status:')
  Object.entries(results.endpoints).forEach(([name, info]) => {
    console.log(`  ${info.status} ${name}`)
    console.log(`    Endpoint: ${info.endpoint}`)
    console.log(`    Method: ${info.method}`)
    if (info.statusCode) console.log(`    Status: ${info.statusCode}`)
    if (info.error) console.log(`    Error: ${info.error}`)
    console.log('')
  })

  console.log('\n⚙️ Configuration:')
  console.log(`  Development URL: ${results.config.development}`)
  console.log(`  Production URL: ${results.config.production}`)
  console.log(`  Current URL: ${results.config.current}`)

  console.log('\n🎯 Overall Status:')
  if (results.overall) {
    console.log('  ✅ ALL ENDPOINTS COMPATIBLE')
  } else {
    console.log('  ❌ SOME ENDPOINTS HAVE ISSUES')
    console.log('  Errors:')
    results.errors.forEach(error => console.log(`    - ${error}`))
  }

  return results.overall
}
