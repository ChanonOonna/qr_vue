// Face Models Service with Caching and Lazy Loading
class FaceModelsService {
  constructor() {
    this.modelsLoaded = false
    this.loading = false
    this.error = null
    this.loadPromise = null
    this.faceApiLoaded = false
  }

  // Check if face-api is loaded
  isFaceApiLoaded() {
    return this.faceApiLoaded
  }

  // Check if models are already loaded
  isModelsLoaded() {
    return this.modelsLoaded
  }

  // Load face-api.js library
  async loadFaceApi() {
    if (this.faceApiLoaded || typeof faceapi !== 'undefined') {
      this.faceApiLoaded = true
      return true
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = '/js/face-api.min.js'
      script.onload = () => {
        this.faceApiLoaded = true
        console.log('✅ Face API library loaded')
        
        // Configure backend after loading
        this._configureBackend()
        
        resolve(true)
      }
      script.onerror = () => {
        console.error('❌ Failed to load Face API library')
        reject(new Error('Failed to load Face API library'))
      }
      document.head.appendChild(script)
    })
  }

  // Configure backend with fallback
  _configureBackend() {
    if (typeof faceapi === 'undefined') return
    
    try {
      // Try to set CPU backend first (more reliable)
      if (faceapi.env && faceapi.env.setBackend) {
        faceapi.env.setBackend('cpu')
        console.log('✅ CPU backend set successfully')
      }
    } catch (error) {
      console.log('⚠️ CPU backend setting failed, trying WebGL:', error)
      
      try {
        // Fallback to WebGL if CPU fails
        if (faceapi.env && faceapi.env.setBackend) {
          faceapi.env.setBackend('webgl')
          console.log('✅ WebGL backend set successfully')
        }
      } catch (webglError) {
        console.log('⚠️ WebGL backend also failed, using default:', webglError)
      }
    }
  }

  // Load models with caching
  async loadModels() {
    // If already loaded, return immediately
    if (this.modelsLoaded) {
      return true
    }

    // If already loading, wait for the existing promise
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Start loading
    this.loading = true
    this.error = null

    this.loadPromise = this._loadModelsInternal()
    
    try {
      await this.loadPromise
      this.modelsLoaded = true
      console.log('✅ Face models loaded and cached successfully')
      return true
    } catch (error) {
      this.error = error.message
      console.error('❌ Failed to load face models:', error)
      throw error
    } finally {
      this.loading = false
      this.loadPromise = null
    }
  }

  // Internal method to load models
  async _loadModelsInternal() {
    // Load face-api.js first if not loaded
    if (!this.faceApiLoaded && typeof faceapi === 'undefined') {
      console.log('🔄 Loading Face API library...')
      await this.loadFaceApi()
    }

    // Check if face-api is available
    if (typeof faceapi === 'undefined') {
      throw new Error('Face API not loaded')
    }

    // Log backend information
    try {
      const backend = faceapi.env.getBackend()
      console.log(`🔧 Using backend: ${backend}`)
    } catch (error) {
      console.log('⚠️ Could not determine backend')
    }

    // Hybrid approach: Try CDN first, then local
    try {
      console.log('🔄 Trying CDN first (fastest option)...')
      await this._loadFromCDN()
      console.log('✅ Successfully loaded from CDN!')
      return
    } catch (error) {
      console.log('❌ CDN failed, falling back to local models...', error.message)
      
      try {
        console.log('🔄 Loading from local models (reliable fallback)...')
        await this._loadFromLocal()
        console.log('✅ Successfully loaded from local models!')
        return
      } catch (localError) {
        console.error('❌ Both CDN and local models failed:', localError.message)
        throw new Error(`Failed to load models: CDN failed (${error.message}), Local failed (${localError.message})`)
      }
    }
  }

  // Load from CDN
  async _loadFromCDN() {
    // Try multiple CDN sources for better reliability
    const CDN_URLS = [
      'https://cdn.jsdelivr.net/npm/face-api.js@1.0.0/weights',
      'https://unpkg.com/face-api.js@1.0.0/weights',
      'https://cdnjs.cloudflare.com/ajax/libs/face-api.js/1.0.0/weights'
    ]
    
    let lastError = null
    
    for (const CDN_BASE_URL of CDN_URLS) {
      try {
        console.log(`🔄 Trying CDN: ${CDN_BASE_URL}`)
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_BASE_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_BASE_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(CDN_BASE_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_BASE_URL)
        ])
        
        console.log(`✅ Successfully loaded from CDN: ${CDN_BASE_URL}`)
        return
      } catch (error) {
        console.log(`❌ CDN failed: ${CDN_BASE_URL}`, error.message)
        lastError = error
        continue
      }
    }
    
    // All CDNs failed
    console.log('❌ All CDN sources failed, will use local models')
    throw new Error(`All CDN sources failed. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  // Load from local models
  async _loadFromLocal() {
    const LOCAL_BASE_URL = '/models'
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_BASE_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_BASE_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(LOCAL_BASE_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_BASE_URL)
    ])
    
    console.log('✅ Models loaded from local')
  }

  // Get loading status
  getLoadingStatus() {
    return {
      loading: this.loading,
      loaded: this.modelsLoaded,
      faceApiLoaded: this.faceApiLoaded,
      error: this.error
    }
  }

  // Get loading source information
  getLoadingSource() {
    if (!this.modelsLoaded) {
      return 'not_loaded'
    }
    
    // Check if models were loaded from CDN or local
    // This is a simple check - in practice you might want to store the source
    try {
      // Try to access a model from CDN to see if it's available
      const testUrl = 'https://cdn.jsdelivr.net/npm/face-api.js@1.0.0/weights/tiny_face_detector_model-weights_manifest.json'
      fetch(testUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            return 'cdn'
          } else {
            return 'local'
          }
        })
        .catch(() => 'local')
    } catch {
      return 'local'
    }
    
    return 'local' // Default to local if we can't determine
  }

  // Clear cache (for testing)
  clearCache() {
    this.modelsLoaded = false
    this.faceApiLoaded = false
    this.loadPromise = null
    this.error = null
  }
}

// Create singleton instance
const faceModelsService = new FaceModelsService()

export default faceModelsService 