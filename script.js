// Load face-api.js models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startApp);

let isTracking = false;
let videoElement;
let canvas;
let displaySize;

function startApp() {
  videoElement = document.getElementById('video');
  canvas = document.getElementById('overlay');

  // Access the user's webcam
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      videoElement.srcObject = stream;
    })
    .catch(err => {
      console.error('Error accessing the webcam:', err);
    });
}

// Start face tracking when the "Start" button is clicked
function startTimer() {
  if (!isTracking) {
    isTracking = true;
    videoElement.style.display = 'block';
    canvas.style.display = 'block';

    // Set canvas dimensions to match video dimensions
    canvas.style.left=videoElement.offsetLeft
    canvas.style.top=videoElement.offsetTop
    canvas.style.width=videoElement.offsetWidth

    canvas.style.height=videoElement.offsetHeight
    canvas.style.position='absolute'
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    detectExpressions();
  }

  // Start the timer
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        alert('Time is up! Great job staying focused!');
      }
    }, 1000);
  }
}

// Pause face tracking
function pauseTimer() {
  isTracking = false;
  videoElement.style.display = 'none';
  canvas.style.display = 'none';
}

// Reset face tracking
function resetTimer() {
  isTracking = false;
  videoElement.style.display = 'none';
  canvas.style.display = 'none';
  document.getElementById('timer').innerText = '25:00';
}

// Detect facial expressions and distractions
async function detectExpressions() {
  if (!isTracking) return;

  const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();
    
  // Resize detections to match the video size
  const resizedDetections = faceapi.resizeResults(detections, displaySize);

  // Clear the canvas and draw detections
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  faceapi.draw.drawDetections(canvas, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

  // Check for distractions
  if (detections.length > 0) {
    const expressions = detections[0].expressions;

    // Check for yawning (neutral expression with mouth open)
    if (expressions.neutral > 0.9) {
      const landmarks = detections[0].landmarks;
      const mouthDistance = Math.abs(landmarks.positions[57].y - landmarks.positions[8].y); // Distance between upper and lower lip

      if (mouthDistance > 20) { // Adjust threshold as needed
        alert('You seem to be yawning. Stay focused!');
      }
    }

    // Check if the user is looking away (head pose estimation)
    const headPose = faceapi.utils.getHeadPose(detections[0].landmarks);
    if (Math.abs(headPose.angle.yaw) > 20 || Math.abs(headPose.angle.pitch) > 20) {
      alert('You are looking away. Please focus on the task!');
    }
  }

  // Continue detection
  requestAnimationFrame(detectExpressions);
}

// Timer functionality
let timerInterval;
let timeLeft = 1500; // 25 minutes in seconds

function setTimer(minutes) {
  timeLeft = minutes * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isTracking = false;
  videoElement.style.display = 'none';
  canvas.style.display = 'none';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 1500;
  updateTimerDisplay();
  isTracking = false;
  videoElement.style.display = 'none';
  canvas.style.display = 'none';
}

//     async function loadModels() {
//       try {
//         await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
//         await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
//         await faceapi.nets.faceExpressionNet.loadFromUri('./models');
//         console.log('Models loaded successfully');
//       } catch (error) {
//         console.error('Failed to load models:', error);
//       }
//     }

//     async function startFaceDetection() {
//         console.log('Starting face detection...');
//         video.style.display = 'block';
//         overlay.style.display = 'block';
    
//         try {
//             // Check if models are loaded
//             if (!faceapi.nets.tinyFaceDetector.isLoaded()) {
//                 console.error('Models not loaded yet!');
//                 await loadModels(); // Try loading models again
//             }
    
//             const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//             video.srcObject = stream;
            
//             // Wait for video to be ready
//             await new Promise((resolve) => video.addEventListener('play', resolve));
//             console.log('Video started playing');
    
//             // Set proper dimensions
//             const displaySize = { 
//                 width: video.videoWidth,
//                 height: video.videoHeight 
//             };
//             console.log('Display size:', displaySize);
    
//             // Match canvas to video dimensions
//             overlay.width = displaySize.width;
//             overlay.height = displaySize.height;
//             faceapi.matchDimensions(overlay, displaySize);
    
//             // Detection loop
//             setInterval(async () => {
//                 try {
//                     const detections = await faceapi.detectAllFaces(
//                         video, 
//                         new faceapi.TinyFaceDetectorOptions({
//                             inputSize: 512,    // Increase input size
//                             scoreThreshold: 0.3 // Lower threshold for detection
//                         })
//                     )
//                     .withFaceLandmarks()
//                     .withFaceExpressions();
    
//                     console.log('Detection result:', detections); // Log detections
    
//                     if (detections.length > 0) {
//                         console.log('Face detected!');
//                     } else {
//                         console.log('No face detected');
//                     }
    
//                     const resizedDetections = faceapi.resizeResults(detections, displaySize);
//                     const ctx = overlay.getContext('2d');
//                     ctx.clearRect(0, 0, overlay.width, overlay.height);
    
//                     // Draw with different colors for visibility
//                     ctx.strokeStyle = '#00FF00';
//                     ctx.lineWidth = 3;
//                     faceapi.draw.drawDetections(overlay, resizedDetections);
//                     faceapi.draw.drawFaceLandmarks(overlay, resizedDetections);
//                     faceapi.draw.drawFaceExpressions(overlay, resizedDetections);
    
//                 } catch (err) {
//                     console.error('Detection error:', err);
//                 }
//             }, 100);
    
//         } catch (err) {
//             console.error('Webcam error:', err);
//         }
//     }
    
//     // Modified loadModels function with better error handling
//     async function loadModels() {
//         try {
//             console.log('Loading models...');
//             await Promise.all([
//                 faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
//                 faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
//                 faceapi.nets.faceExpressionNet.loadFromUri('./models')
//             ]);
//             console.log('✅ Models loaded successfully');
            
//             // Verify models are loaded
//             const modelsLoaded = 
//                 faceapi.nets.tinyFaceDetector.isLoaded() &&
//                 faceapi.nets.faceLandmark68Net.isLoaded() &&
//                 faceapi.nets.faceExpressionNet.isLoaded();
                
//             console.log('Models loaded status:', modelsLoaded);
//         } catch (err) {
//             console.error('❌ Error loading models:', err);
//             throw err;
//         }
//     }
    
//     // async function startFaceDetection() {
//     //   // Show video and canvas
//     //   video.style.display = 'block';
//     //   overlay.style.display = 'block';

//     //   // Start webcam
//     //   try {
//     //     const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//     //     video.srcObject = stream;
//     //     video.play();
//     //   } catch (error) {
//     //     console.error('Error accessing webcam:', error);
//     //     return;
//     //   }

//     //   // Detect facial expressions
//     //   video.addEventListener('play', () => {
//     //     const canvas = faceapi.createCanvasFromMedia(video);
//     //     document.body.append(canvas);
//     //     const displaySize = { width: video.width, height: video.height };
//     //     faceapi.matchDimensions(canvas, displaySize);

//     //     setInterval(async () => {
//     //       const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//     //         .withFaceLandmarks()
//     //         .withFaceExpressions();
//     //       const resizedDetections = faceapi.resizeResults(detections, displaySize);
//     //       canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
//     //       faceapi.draw.drawDetections(canvas, resizedDetections);
//     //       faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
//     //       faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
//     //     }, 100);
//     //   });
//     // }

//     // // Load models when the page loads
//     // loadModels();