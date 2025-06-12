"use-strict";
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const explanation = document.getElementById("explanation");
const coordinates = document.getElementById("coordinates");
const vertexList = document.getElementById("vertexList");
const intersectionPoints = document.getElementById("intersectionPoints");
const nextStepBtn = document.getElementById("nextStepBtn");
let vertices = [];
let filledLines = [];
let currentScanLine = null;
let currentIntersections = [];
let isDrawing = false;
let currentY = null;
let yMin = null;
let yMax = null;
let holdInterval = null;
let isPolygonClosed = false;
const HOLD_DELAY = 50;

const MAJOR_GRID_SIZE = 50;
const MINOR_GRID_SIZE = 10;
const MAJOR_GRID_COLOR = "#333";
const MINOR_GRID_COLOR = "#222";
const AXIS_COLOR = "#666";

// Make centerX and centerY let variables instead of const so they can be updated
let centerX;
let centerY;

// Initialize center coordinates
function initializeCenter() {
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
}

// Call this after getting canvas element
initializeCenter();

function resizeCanvas() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  canvas.width = 0.55 * viewportWidth;
  canvas.height = 0.7 * viewportHeight;

  // Reinitialize center after resize
  initializeCenter();
  drawGrid();
}

// Add resize event listener
window.addEventListener("resize", resizeCanvas);

function getIntersectionLabel(index) {
  return String.fromCharCode(65 + index);
}

// Modify the updateVertexList function to implement click-to-edit
function updateVertexList() {
  vertexList.style.display = vertices.length > 0 ? "block" : "none";
  vertexList.innerHTML = vertices
    .map(
      (vertex, index) => `
        <div class="vertex-entry">
                <span class="vertex-number">V${index + 1}</span>
            <div class="vertex-data">
                <div class="coordinate-box">
                    <span class="coord">
                        x: <span class="coord-value" 
                               data-vertex="${index}" 
                               data-coord="x">${Math.round(vertex.x)}</span>
                    </span>
                    <span class="coord">
                        y: <span class="coord-value" 
                               data-vertex="${index}" 
                               data-coord="y">${Math.round(vertex.y)}</span>
                    </span>
                </div>
            </div>
        </div>
    `
    )
    .join("");

  // Add click listeners to coordinate values
  const coordValues = document.querySelectorAll(".coord-value");
  coordValues.forEach((span) => {
    span.addEventListener("click", makeEditable);
  });
}

// Function to make coordinate editable on click
function makeEditable(event) {
  const span = event.target;
  const value = span.textContent;
  const vertexIndex = span.dataset.vertex;
  const coord = span.dataset.coord;

  // Create input element
  const input = document.createElement("input");
  input.type = "number";
  input.value = value;
  input.className = "coord-input";
  input.dataset.vertex = vertexIndex;
  input.dataset.coord = coord;

  // Replace span with input
  span.parentNode.replaceChild(input, span);
  input.focus();

  // Add event listeners to handle changes and blur
  input.addEventListener("blur", () => handleEditComplete(input, value));
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      input.blur();
    }
  });
}

// Function to handle when editing is complete
function handleEditComplete(input, originalValue) {
  const newValue = parseInt(input.value);
  const vertexIndex = parseInt(input.dataset.vertex);
  const coord = input.dataset.coord;

  // Create new span element
  const span = document.createElement("span");
  span.className = "coord-value";
  span.dataset.vertex = vertexIndex;
  span.dataset.coord = coord;

  // Validate input
  if (isNaN(newValue)) {
    span.textContent = originalValue;
  } else {
    // Update vertex coordinates
    vertices[vertexIndex][coord] = newValue;
    span.textContent = newValue;

    // Reset filling process if it has started
    if (currentScanLine !== null) {
      filledLines = [];
      currentIntersections = [];
      currentScanLine = null;
      currentY = null;
      nextStepBtn.disabled = false;
      document.getElementById("startFillBtn").disabled = false;
    }

    // Redraw canvas with updated coordinates
    redrawCanvas();
  }

  // Replace input with span
  input.parentNode.replaceChild(span, input);
  span.addEventListener("click", makeEditable);
}

function canvasToGrid(x, y) {
  return {
    x: x - centerX,
    y: centerY - y,
  };
}

function gridToCanvas(x, y) {
  return {
    x: x + centerX,
    y: centerY - y,
  };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing

  // Draw minor grid lines
  ctx.beginPath();
  ctx.strokeStyle = MINOR_GRID_COLOR;
  ctx.lineWidth = 1;

  for (
    let x = centerX % MINOR_GRID_SIZE;
    x <= canvas.width;
    x += MINOR_GRID_SIZE
  ) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
  }
  for (
    let y = centerY % MINOR_GRID_SIZE;
    y <= canvas.height;
    y += MINOR_GRID_SIZE
  ) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
  }
  ctx.stroke();

  // Draw major grid lines and labels
  ctx.beginPath();
  ctx.strokeStyle = MAJOR_GRID_COLOR;
  ctx.lineWidth = 1;

  for (
    let x = centerX % MAJOR_GRID_SIZE;
    x <= canvas.width;
    x += MAJOR_GRID_SIZE
  ) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    const gridX = Math.round(canvasToGrid(x, 0).x);
    if (gridX !== 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "13px monospace";
      ctx.fillText(gridX.toString(), x + 2, centerY - 2);
    }
  }

  for (
    let y = centerY % MAJOR_GRID_SIZE;
    y <= canvas.height;
    y += MAJOR_GRID_SIZE
  ) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    const gridY = Math.round(canvasToGrid(0, y).y);
    if (gridY !== 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "13px monospace";
      ctx.fillText(gridY.toString(), centerX + 2, y - 2);
    }
  }
  ctx.stroke();

  // Draw axis lines
  ctx.beginPath();
  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 2;
  ctx.moveTo(0, centerY + 0.5);
  ctx.lineTo(canvas.width, centerY + 0.5);
  ctx.moveTo(centerX + 0.5, 0);
  ctx.lineTo(centerX + 0.5, canvas.height);
  ctx.stroke();
}

function drawVertexWithLabel(x, y, index) {
  const canvasPos = gridToCanvas(x, y);

  // Draw circular glow effect
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, 8, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(
    canvasPos.x,
    canvasPos.y,
    2,
    canvasPos.x,
    canvasPos.y,
    8
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw vertex point with border
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Create label
  const label = `V${index}`;
  ctx.font = "bold 12px monospace";
  const textMetrics = ctx.measureText(label);
  const padding = 6;
  const cornerRadius = 4;

  // Draw label background with rounded corners
  const bgX = canvasPos.x + 12;
  const bgY = canvasPos.y - 22;
  const bgWidth = textMetrics.width + padding * 2;
  const bgHeight = 20;

  ctx.beginPath();
  ctx.moveTo(bgX + cornerRadius, bgY);
  ctx.lineTo(bgX + bgWidth - cornerRadius, bgY);
  ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius);
  ctx.lineTo(bgX + bgWidth, bgY + bgHeight - cornerRadius);
  ctx.quadraticCurveTo(
    bgX + bgWidth,
    bgY + bgHeight,
    bgX + bgWidth - cornerRadius,
    bgY + bgHeight
  );
  ctx.lineTo(bgX + cornerRadius, bgY + bgHeight);
  ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius);
  ctx.lineTo(bgX, bgY + cornerRadius);
  ctx.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
  ctx.closePath();

  // Add background with subtle gradient
  const bgGradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + bgHeight);
  bgGradient.addColorStop(0, "rgba(40, 40, 40, 0.9)");
  bgGradient.addColorStop(1, "rgba(20, 20, 20, 0.9)");
  ctx.fillStyle = bgGradient;
  ctx.fill();

  // Add subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw connector line
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.moveTo(canvasPos.x + 3, canvasPos.y);
  ctx.lineTo(bgX, bgY + bgHeight / 2);
  ctx.stroke();

  // Draw text with slight shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#fff";
  ctx.fillText(label, bgX + padding, bgY + 14);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawIntersectionPoint(x, y, index) {
  const canvasPos = gridToCanvas(x, y);

  ctx.beginPath();
  ctx.fillStyle = "#ff4444";
  ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI * 2);
  ctx.fill();

  const label = String.fromCharCode(65 + index);
  ctx.font = "18px monospace";
  ctx.fillStyle = "white";
  ctx.fillText(label, canvasPos.x + 10, canvasPos.y - 5);
}

function drawHorizontalLine(x1, y, x2, color) {
  const start = gridToCanvas(x1, y);
  const end = gridToCanvas(x2, y);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3; // Changed from 1 to 3 for thicker line
  ctx.moveTo(Math.round(start.x), Math.round(start.y));
  ctx.lineTo(Math.round(end.x), Math.round(end.y));
  ctx.stroke();
}

function drawPolygonOutline() {
  if (vertices.length === 0) return;

  if (vertices.length === 1) {
    const vertex = vertices[0];
    drawVertexWithLabel(vertex.x, vertex.y, 1);
    return;
  }

  const edgeCount = isPolygonClosed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < edgeCount; i++) {
    const j = (i + 1) % vertices.length;
    const start = gridToCanvas(vertices[i].x, vertices[i].y);
    const end = gridToCanvas(vertices[j].x, vertices[j].y);

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  vertices.forEach((vertex, index) => {
    drawVertexWithLabel(vertex.x, vertex.y, index + 1);
  });
}

function drawFilledLines() {
  filledLines.forEach((line) => {
    drawHorizontalLine(line.x1, line.y, line.x2, "#4488ff");
  });
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Draw filled lines first (background)
  drawFilledLines();

  // Draw polygon edges
  if (vertices.length > 1) {
    const edgeCount = isPolygonClosed ? vertices.length : vertices.length - 1;
    for (let i = 0; i < edgeCount; i++) {
      const j = (i + 1) % vertices.length;
      const start = gridToCanvas(vertices[i].x, vertices[i].y);
      const end = gridToCanvas(vertices[j].x, vertices[j].y);

      ctx.beginPath();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2.5;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  // Draw current scan line if active
  if (currentScanLine !== null) {
    const leftPoint = canvasToGrid(0, 0);
    const rightPoint = canvasToGrid(canvas.width, 0);
    drawHorizontalLine(
      leftPoint.x,
      currentScanLine,
      rightPoint.x,
      "rgba(255,0,0,0.8)"
    );

    // Draw intersection points
    currentIntersections.forEach((x, index) => {
      drawIntersectionPoint(x, currentScanLine, index);
    });
    // updateIntersectionPoints();
  }

  // Draw vertices last (on top of everything)
  vertices.forEach((vertex, index) => {
    drawVertexWithLabel(vertex.x, vertex.y, index + 1);
  });
}

function roundToPixel(value) {
  return Math.round(value * 100) / 100;
}

function findIntersections(y) {
  let intersections = [];
  const edgeCount = isPolygonClosed ? vertices.length : vertices.length - 1;

  for (let i = 0; i < edgeCount; i++) {
    const j = (i + 1) % vertices.length;
    const v1 = vertices[i];
    const v2 = vertices[j];

    if (roundToPixel(v1.y) === roundToPixel(v2.y)) continue;

    if (y >= Math.min(v1.y, v2.y) && y < Math.max(v1.y, v2.y)) {
      const x = roundToPixel(
        v1.x + ((y - v1.y) * (v2.x - v1.x)) / (v2.y - v1.y)
      );
      intersections.push(x);
    }
  }

  return intersections.sort((a, b) => a - b);
}

const questions = [
  {
    id: 1,
    title: "Before Starting",
    text: "What is the main purpose of the scan-line algorithm?",
    options: [
      "To draw the outline of a polygon",
      "To fill the interior of a polygon",
      "To detect intersections between lines",
      "To calculate the area of a polygon",
    ],
    correctAnswer: 1,
    feedback: {
      0: "This is incorrect. The scan-line algorithm is not used for drawing the outline of a polygon. Instead, it focuses on filling the interior by processing horizontal scan lines.",
      1: "Correct! The scan-line algorithm is specifically designed to fill the interior of a polygon. It does so by iterating through the vertical sections and determining which points lie within the polygon boundaries.",
      2: "This is incorrect. The scan-line algorithm is not meant for detecting intersections between lines. That would involve algorithms like line-sweep or other geometric intersection detection methods.",
      3: "This is incorrect. The scan-line algorithm does not calculate the area of a polygon. Calculating the area typically involves mathematical formulas using vertex coordinates, not this algorithm.",
    },
  },
  {
    id: 2,
    title: "Understanding Intersections",
    text: "Why do we sort the intersection points from left to right?",
    options: [
      "It's not necessary, any order works",
      "To make the visualization look better",
      "To correctly determine which segments to fill",
      "To optimize the algorithm's performance",
    ],
    correctAnswer: 2,
    feedback: {
      0: "This is incorrect. Sorting intersection points is crucial for the algorithm to work correctly. Without sorting, the algorithm may fill incorrect areas.",
      1: "This is incorrect. The main reason to sort intersection points is not for visualization but to ensure the scan-line algorithm fills the segments in the correct order.",
      2: "Correct! Sorting the intersection points ensures that the algorithm fills between the right segments in the correct order, preventing errors in filling and maintaining accuracy.",
      3: "This is incorrect. While sorting might help the performance in some cases, it is mainly done to ensure the scan-line algorithm functions correctly in filling the polygon.",
    },
  },
  {
    id: 3,
    title: "Y-Coordinate Analysis",
    text: "What are the minimum (y<sub>min</sub>) and maximum (y<sub>max</sub>) y-coordinates of the scanline?",
    getOptions: (yMin, yMax) => [
      `y<sub>min</sub> = ${yMin - 1}, y<sub>max</sub> = ${yMax}`,
      `y<sub>min</sub> = ${yMin}, y<sub>max</sub> = ${yMax + 1}`,
      `y<sub>min</sub> = ${yMin}, y<sub>max</sub> = ${yMax}`,
      `y<sub>min</sub> = ${yMin - 1}, y<sub>max</sub> = ${yMax + 1}`,
    ],
    correctAnswer: 2,
    getFeedback: (yMin, yMax) => ({
      0: `This is incorrect. The minimum y-coordinate should be ${yMin}, not ${
        yMin - 1
      }, and the maximum should be ${yMax}.`,
      1: `This is incorrect. The maximum y-coordinate should be ${yMax}, not ${
        yMax + 1
      }, and the minimum should be ${yMin}.`,
      2: `Correct! The scanline starts from y<sub>min</sub> = ${yMin} at its lowest point to y<sub>max</sub> = ${yMax} at its highest point.`,
      3: `This is incorrect. The minimum y-coordinate is ${yMin}, and the maximum is ${yMax}.`,
    }),
  },
  {
    id: 4,
    title: "Scanline Count",
    getText: (yMin, yMax) =>
      `Given y<sub>min</sub>=${yMin} and y<sub>max</sub>=${yMax}, how many scanlines will the algorithm process?`,
    getOptions: (yMin, yMax) => {
      const correctAnswer = yMax - yMin + 1;
      return [
        correctAnswer.toString(),
        (correctAnswer - 1).toString(),
        (correctAnswer + 1).toString(),
        (yMax - yMin + 5).toString(),
      ];
    },
    correctAnswer: 0,
    getFeedback: (yMin, yMax) => ({
      0: `Correct! The scan-line algorithm processes all lines from y<sub>min</sub> (${yMin}) to y<sub>max</sub> (${yMax}), inclusive, requiring y<sub>max</sub> - y<sub>min</sub> + 1 scanlines.`,
      1: `This is incorrect. The correct number of scanlines is ${
        yMax - yMin + 1
      }, not ${yMax - yMin}.`,
      2: `This is incorrect. The correct number of scanlines is ${
        yMax - yMin + 1
      }, not ${yMax - yMin + 2}.`,
      3: `This is incorrect. The correct number of scanlines is ${
        yMax - yMin + 1
      }, not ${yMax - yMin + 5}.`,
    }),
  },
  {
    id: 5,
    title: "Final Check",
    text: "What determines when the scan-line algorithm is complete?",
    options: [
      "When we reach the bottom of the canvas",
      "When we reach the maximum y-coordinate of the polygon",
      "When all pixels are filled",
      "When we complete one full scan",
    ],
    correctAnswer: 1,
    feedback: {
      0: "This is incorrect. The algorithm completes when it reaches the maximum y-coordinate, not when it reaches the bottom of the canvas.",
      1: "Correct! The algorithm finishes once the scan-line reaches the maximum y-coordinate of the polygon, indicating that the polygon has been fully processed.",
      2: "This is incorrect. While filling all pixels is a step in the algorithm, the process completes when the maximum y-coordinate is reached, signaling the end of the polygon.",
      3: "This is incorrect. Completing one full scan refers to a part of the process, but the algorithm is considered complete when the scan-line reaches the maximum y-coordinate.",
    },
  },
];


let currentQuestionIndex = 0;
const modal = document.getElementById("qaModal");

// Make sure modal has relative positioning
// modal.style.position = 'relative';

// Add close button HTML
const closeButton = document.createElement("button");
closeButton.id = "modalClose";
closeButton.className = "modal-close";
closeButton.innerHTML = "&times;";
closeButton.style.cssText = `
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
    font-size: 24px;
    border: none;
    background: none;
    padding: 5px 10px;
    color: white;
    z-index: 1000;
`;
// Insert close button into modal
   const modalContent = modal.querySelector(".modal-content") || modal;
   modalContent.insertBefore(closeButton, modalContent.firstChild);

   function showQuestion(questionIndex) {
     currentQuestionIndex = questionIndex;
     const question = questions[questionIndex];
     document.getElementById("questionTitle").textContent = question.title;

     // Handle dynamic text and options based on yMin and yMax
     const text = question.getText
       ? question.getText(yMin, yMax)
       : question.text;
     document.getElementById("questionText").innerHTML = text;

     const optionsContainer = document.getElementById("optionsContainer");
     optionsContainer.innerHTML = "";

     const options = question.getOptions
       ? question.getOptions(yMin, yMax)
       : question.options;
     options.forEach((option, index) => {
       const button = document.createElement("button");
       button.className = "option-button";
       button.innerHTML = option;
       button.onclick = () => checkAnswer(index, questionIndex);
       optionsContainer.appendChild(button);
     });

     document.getElementById("feedback").style.display = "none";
     modal.style.display = "block";

     // Reset close button behavior for new question
     closeButton.onclick = () => showQuestion(questionIndex);
   }

   function checkAnswer(selectedIndex, questionIndex) {
     const question = questions[questionIndex];
     const feedback = document.getElementById("feedback");
     const buttons = document.querySelectorAll(".option-button");

     buttons.forEach((button) => {
       button.disabled = true;
     });

     if (selectedIndex === question.correctAnswer) {
       buttons[selectedIndex].classList.add("correct");
       const feedbackText = question.getFeedback
         ? question.getFeedback(yMin, yMax)[selectedIndex]
         : question.feedback[selectedIndex];
       feedback.innerHTML = feedbackText;
       feedback.className = "feedback correct";
       feedback.style.display = "block";

       // Set close button behavior for correct answer
       closeButton.onclick = () => {
         modal.style.display = "none";
         document.getElementById("clearBtn").disabled = false;
         if (questionIndex === 2) {
           showQuestion(3);
         }
         if (questionIndex === 3) {
           startFillProcess();
         }
       };
     } else {
       buttons[selectedIndex].classList.add("incorrect");
       buttons[question.correctAnswer].classList.add("correct");
       const feedbackText = question.getFeedback
         ? question.getFeedback(yMin, yMax)[selectedIndex]
         : question.feedback[selectedIndex];
feedback.innerHTML =feedbackText +
  "<br>" +
  "<span style='color: red; font-weight: bold; font-size: 20px;'>Please try again.</span>";
       feedback.className = "feedback incorrect";
       feedback.style.display = "block";

       // Set close button behavior for incorrect answer
       closeButton.onclick = () => showQuestion(questionIndex);
     }
   }

// Modify startFill function
function startFill() {
  if (vertices.length < 3) {
    alert("Please draw a complete polygon first");
    return;
  }
  if (!isPolygonClosed) {
    alert("Please close the polygon before starting the fill process");
    return;
  }
  yMin = Math.floor(Math.min(...vertices.map((v) => v.y)));
  yMax = Math.ceil(Math.max(...vertices.map((v) => v.y)));
  showQuestion(2);
  // showQuestion(3);
}

// Add new function to start fill process after first question
function startFillProcess() {
  filledLines = [];
  currentIntersections = [];
  yMin = Math.floor(Math.min(...vertices.map((v) => v.y)));
  yMax = Math.ceil(Math.max(...vertices.map((v) => v.y)));
  currentY = yMin;
  nextStepBtn.disabled = false;
  document.getElementById("startFillBtn").disabled = true;

  updateExplanation(`
                Starting scan-line algorithm:<br>
                - Y-range of polygon: ${yMin} to ${yMax}<br>
                - Current scanline position: ${currentY}<br><br>
                Click "Next Step" to move the scanline.
            `);
  currentScanLine = currentY;
  redrawCanvas();
}

let stepCount = 0;
let questionAsked = false; // Flag to check if the question has been shown
function nextStep() {
  stepCount++;
  // console.log(stepCount);
  if (currentY > yMax) {
    updateExplanation('Fill complete! Click "Clear Canvas" to start over.');
    nextStepBtn.disabled = true;
    canvas.style.pointerEvents = "none";
    return;
  }

  const halfSteps = (yMax - yMin + 1) / 2;

  if (stepCount >= halfSteps && !questionAsked) {
    showQuestion(1);
    questionAsked = true; // Set the flag to true once the question is shown
  }

  // Show final question when reaching max Y
  if (currentY == yMax) {
    showQuestion(4);
    // return;
  }
  currentScanLine = currentY;
  currentIntersections = findIntersections(currentY);
  redrawCanvas();

  let explanationText = `
                Scanline at y = ${currentY}<br><br>
                Found ${currentIntersections.length} intersection points:<br>
            `;

  if (currentIntersections.length > 0) {
    explanationText +=
      currentIntersections
        .map(
          (x, index) =>
            `Point ${getIntersectionLabel(index)} at x = ${Math.round(x)}`
        )
        .join("<br>") + "<br><br>";
  }

  if (currentIntersections.length >= 2) {
    for (let i = 0; i < currentIntersections.length - 1; i += 2) {
      filledLines.push({
        x1: currentIntersections[i],
        x2: currentIntersections[i + 1],
        y: currentY,
      });
      explanationText += `Filling between points ${getIntersectionLabel(
        i
      )} and ${getIntersectionLabel(i + 1)}<br>`;
    }
  }

  redrawCanvas();
  updateExplanation(explanationText);
  currentY++;
}

function updateExplanation(text) {
  explanation.innerHTML = text;
}

// Event Listeners
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const gridPos = canvasToGrid(canvasX, canvasY);
  coordinates.textContent = `Mouse Pos = (X:${Math.round(
    gridPos.x
  )}, Y: ${Math.round(gridPos.y)})`;
});

let draggingVertex = null;

// Adjusted canvas mouse down event to support dragging
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const gridPos = canvasToGrid(canvasX, canvasY);

  // Check if the mouse is close to any vertex
  const closeVertexIndex = vertices.findIndex((vertex) => {
    const dx = gridPos.x - vertex.x;
    const dy = gridPos.y - vertex.y;
    return Math.sqrt(dx * dx + dy * dy) < 5; // Adjust radius if needed
  });

  if (closeVertexIndex !== -1) {
    if (isPolygonClosed) {
      // Start dragging the vertex even if the polygon is closed
      draggingVertex = closeVertexIndex;
      updateExplanation(`Dragging vertex ${draggingVertex + 1}.`);
    } else {
      // Polygon is not closed, and we clicked near a vertex
      if (closeVertexIndex === 0 && vertices.length > 2) {
        // Close the polygon if it's the first vertex and polygon has enough vertices
        isPolygonClosed = true;
        isDrawing = false;
        updateExplanation(
          'Polygon complete! Click "Start Fill" to begin the scan-line algorithm.'
        );
        redrawCanvas();
        return;
      } else {
        // Start dragging the clicked vertex
        draggingVertex = closeVertexIndex;
        updateExplanation(`Dragging vertex ${draggingVertex + 1}.`);
      }
    }
  } else {
    // Add a new vertex if not dragging and polygon is not closed
    if (isPolygonClosed) {
      alert("Polygon has been closed! Press 'Start Fill' to begin filling.");
      return;
    }
    if (vertices.length > 2) {
      const firstVertex = vertices[0];
      const dx = gridPos.x - firstVertex.x;
      const dy = gridPos.y - firstVertex.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        // Close the polygon
        isPolygonClosed = true;
        isDrawing = false;
        updateExplanation(
          'Polygon complete! Click "Start Fill" to begin the scan-line algorithm.'
        );
        redrawCanvas();
        return;
      }
    }

    vertices.push({ x: gridPos.x, y: gridPos.y });
    updateVertexList();
    redrawCanvas();
    updateExplanation(`Added vertex ${vertices.length}.<br>
                 Continue clicking to add more vertices.<br>
                 Click near the first vertex to close the polygon.`);
  }
});

// Mousemove to drag the vertex
canvas.addEventListener("mousemove", (e) => {
  if (draggingVertex !== null) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const gridPos = canvasToGrid(canvasX, canvasY);

    // Update the position of the dragged vertex
    vertices[draggingVertex] = { x: gridPos.x, y: gridPos.y };
    updateVertexList();
    redrawCanvas();
  }
});

// Mouseup to release the dragged vertex
canvas.addEventListener("mouseup", () => {
  if (draggingVertex !== null) {
    updateExplanation(`Released vertex ${draggingVertex + 1}.`);
    draggingVertex = null;
  }
});

// Mouseleave to ensure dragging stops when the mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  draggingVertex = null;
});

nextStepBtn.addEventListener("mousedown", function (e) {
  if (e.button === 0) {
    nextStep();
    holdInterval = setInterval(nextStep, HOLD_DELAY);
  }
});

nextStepBtn.addEventListener("mouseup", function () {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
});

nextStepBtn.addEventListener("mouseleave", function () {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
});

document.getElementById("startFillBtn").addEventListener("click", startFill);

// document.getElementById("clearBtn").addEventListener("click", () => {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   vertices = [];
//   filledLines = [];
//   currentScanLine = null;
//   currentIntersections = [];
//   currentY = null;
//   isPolygonClosed = false;
//   canvas.style.pointerEvents = "auto";
//   nextStepBtn.disabled = true;
//   document.getElementById("startFillBtn").disabled = false;
//   vertexList.innerHTML = "";
//   vertexList.style.display = "none";
//   intersectionPoints.innerHTML = "";
//   updateExplanation(
//     'Click on the canvas to draw a polygon. Once done, click "Start Fill" to begin the scan-line process.'
//   );
//   // coordinates.textContent = `Mouse Pos = (X:0, Y:0)`;
//   redrawCanvas();
//   questionAsked = false; // Flag to check if the question has been shown
// });

// reset_button.addEventListener("click", () => {
//   dp = [];
//   display_canvas = false;
//   last_move_direction = "";
//   times_next_called = 0;
//   point1 = [];
//   point2 = [];
//   slope = 0;
//   currx = 0;
//   curry = 0;
//   decision_parameter = 0;
//   ctx.beginPath();
//   ctx.clearRect(0, 0, width, height);
// });

// function resetWindow() {
//   // Reload the current window
//   window.location.reload();
// }
// submit_button.click();

const toggleInstructions = document.getElementById("toggle-instructions");
const procedureMessage = document.getElementById("procedure-message");

// Function to show the instructions overlay
const showInstructions = () => {
  procedureMessage.style.display = "block";
};

// Function to hide the instructions overlay
const hideInstructions = (event) => {
  // Close if click is outside the overlay or if it's the toggle button again
  if (
    !procedureMessage.contains(event.target) &&
    event.target !== toggleInstructions
  ) {
    procedureMessage.style.display = "none";
  }
};

// Attach event listeners
toggleInstructions.addEventListener("click", (event) => {
  // Toggle the visibility of the overlay
  if (procedureMessage.style.display === "block") {
    procedureMessage.style.display = "none";
  } else {
    showInstructions();
  }
  event.stopPropagation(); // Prevent immediate closure after clicking the button
});

document.addEventListener("click", hideInstructions);

// Prevent closing the overlay when clicking inside it
procedureMessage.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent the click inside from closing the overlay
});

// Initialize the canvas
redrawCanvas();
showQuestion(0);
resizeCanvas();
drawGrid();
