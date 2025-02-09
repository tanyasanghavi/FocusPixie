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

// Function to update canvas dimensions and position
function updateCanvas() {
  if (!videoElement || !canvas) return;

  // Set canvas dimensions to match video dimensions
  canvas.style.left = videoElement.offsetLeft + 'px';
  canvas.style.top = videoElement.offsetTop + 'px';
  canvas.style.width = videoElement.offsetWidth + 'px';
  canvas.style.height = videoElement.offsetHeight + 'px';
  canvas.style.position = 'absolute';

  // Set canvas internal dimensions to match video resolution
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Update display size for face-api.js
  displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);
}

// Start face tracking when the "Start" button is clicked
function startTimer() {
  if (!isTracking) {
    isTracking = true;
    videoElement.style.display = 'block';
    canvas.style.display = 'block';

    updateCanvas(); // Ensure initial canvas dimensions are set

    // Keep updating canvas dimensions every 100ms
    setInterval(updateCanvas, 50);

    // Run face detection every 100ms
    setInterval(detectExpressions, 50);
    
  }

  // Start countdown timer
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

// function startTimer() {
//   if (!isTracking) {
//     isTracking = true;
//     videoElement.style.display = 'block';
//     canvas.style.display = 'block';

//     // Update canvas dimensions and position
//     updateCanvas();

//     // Start updating canvas every 100ms
//     setInterval(updateCanvas, 100);

//     // Start face detection
//     detectExpressions();
//   }

//   // Start the timer
//   if (!timerInterval) {
//     timerInterval = setInterval(() => {
//       if (timeLeft > 0) {
//         timeLeft--;
//         updateTimerDisplay();
//       } else {
//         clearInterval(timerInterval);
//         alert('Time is up! Great job staying focused!');
//       }
//     }, 1000);
//   }
// }


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
    if (expressions.neutral > 0.5 && expressions.happy < 0.2 && expressions.sad < 0.2) {
      const landmarks = detections[0].landmarks;
      const mouthDistance = Math.abs(landmarks.positions[57].y - landmarks.positions[8].y); // Distance between upper and lower lip

      if (mouthDistance > 35) { // Adjust threshold as needed
        alert('You seem to be yawning. Stay focused!');
      }
    }

    // Check if the user is looking away (head pose estimation)
    const headPose = faceapi.utils.getHeadPose(detections[0].landmarks);
    if (Math.abs(headPose.angle.yaw) > 10 || Math.abs(headPose.angle.pitch) > 10) {
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
