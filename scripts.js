// Pomodoro Timer
let timerInterval;
let timeLeft;
let isWorkSession = true;
let sessionCount = 0;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const workDurationInput = document.getElementById('work-duration');
const shortBreakInput = document.getElementById('short-break');
const longBreakInput = document.getElementById('long-break');

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function startTimer(duration) {
    if (!timerInterval) {
        timeLeft = duration * 60;
        updateTimer();
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimer();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                if (isWorkSession) {
                    sessionCount++;
                    if (sessionCount % 4 === 0) {
                        alert('Time for a long break!');
                        startTimer(longBreakInput.value);
                    } else {
                        alert('Time for a short break!');
                        startTimer(shortBreakInput.value);
                    }
                } else {
                    alert('Break is over! Time to work.');
                    startTimer(workDurationInput.value);
                }
                isWorkSession = !isWorkSession;
            }
        }, 1000);
    }
}

startBtn.addEventListener('click', () => {
    startTimer(workDurationInput.value);
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = workDurationInput.value * 60;
    updateTimer();
});

// Recording Section
const recordBtn = document.getElementById('record-btn');
const video = document.getElementById('video');

recordBtn.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                video.play();
            })
            .catch(error => {
                console.error('Error accessing the camera:', error);
            });
    }
});

// Efficiency Graph (Placeholder)
const ctx = document.getElementById('efficiencyChart').getContext('2d');
const efficiencyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['0 min', '5 min', '10 min', '15 min', '20 min', '25 min'],
        datasets: [{
            label: 'Study Efficiency',
            data: [0, 50, 70, 90, 80, 60],
            borderColor: '#6c5ce7',
            fill: false
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});