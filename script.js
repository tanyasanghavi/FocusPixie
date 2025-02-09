let timerInterval;
    let timeLeft = 1500;
    let isPaused = true;

    function updateTimer() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startTimer() {
      if (isPaused) {
        isPaused = false;
        timerInterval = setInterval(() => {
          if (timeLeft > 0) {
            timeLeft--;
            updateTimer();
          } else {
            clearInterval(timerInterval);
            alert("Time's up! Take a break, wanderer.");
          }
        }, 1000);
      }
      startFaceDetection();
    }

    function pauseTimer() {
      clearInterval(timerInterval);
      isPaused = true;
    }

    function resetTimer() {
      clearInterval(timerInterval);
      timeLeft = 1500;
      isPaused = true;
      updateTimer();
    }

    function setTimer(minutes) {
      clearInterval(timerInterval);
      timeLeft = minutes * 60;
      isPaused = true;
      updateTimer();
    }
    updateTimer();

    // Face API Integration
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');

    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        await faceapi.nets.faceExpressionNet.loadFromUri('./models');
        console.log('Models loaded successfully');
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    }

    async function startFaceDetection() {
      // Show video and canvas
      video.style.display = 'block';
      overlay.style.display = 'block';

      // Start webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        video.play();
      } catch (error) {
        console.error('Error accessing webcam:', error);
        return;
      }

      // Detect facial expressions
      video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }, 100);
      });
    }

    // Load models when the page loads
    loadModels();