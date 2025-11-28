// ---------------- Firebase Config ----------------
const firebaseConfig = {
  apiKey: window.API_KEY,
  authDomain: "sikhya-setu-5bf8f.firebaseapp.com",
  projectId: "sikhya-setu-5bf8f",
  storageBucket: "sikhya-setu-5bf8f.firebasestorage.app",
  messagingSenderId: "161619737104",
  appId: "1:161619737104:web:ff8602c8ee789dc2c3a895",
  measurementId: "G-W3QTW2DD6C"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM REFS ----------------
const landingSection = document.getElementById("landingSection");
const authSection = document.getElementById("authSection");
const teacherDashboard = document.getElementById("teacherDashboard");
const studentDashboard = document.getElementById("studentDashboard");
const logoutBtn = document.getElementById("logoutBtn");
const userRoleText = document.getElementById("userRoleText");

// Auth
const showLoginTab = document.getElementById("showLoginTab");
const showSignupTab = document.getElementById("showSignupTab");
const loginFormWrapper = document.getElementById("loginFormWrapper");
const signupFormWrapper = document.getElementById("signupFormWrapper");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupRole = document.getElementById("signupRole");
const signupBtn = document.getElementById("signupBtn");

// Teacher
const courseTitle = document.getElementById("courseTitle");
const courseDescription = document.getElementById("courseDescription");
const courseLanguage = document.getElementById("courseLanguage");
const courseVideoLink = document.getElementById("courseVideoLink");
const coursePdfLink = document.getElementById("coursePdfLink");
const courseExtraLink = document.getElementById("courseExtraLink");
const createCourseBtn = document.getElementById("createCourseBtn");
const quizCourseSelect = document.getElementById("quizCourseSelect");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptA = document.getElementById("quizOptA");
const quizOptB = document.getElementById("quizOptB");
const quizOptC = document.getElementById("quizOptC");
const quizOptD = document.getElementById("quizOptD");
const quizCorrect = document.getElementById("quizCorrect");
const addQuizBtn = document.getElementById("addQuizBtn");
const teacherCoursesList = document.getElementById("teacherCoursesList");

// Student
const studentCoursesList = document.getElementById("studentCoursesList");
const quizSection = document.getElementById("quizSection");
const quizCourseTitle = document.getElementById("quizCourseTitle");
const quizQuestionText = document.getElementById("quizQuestionText");
const quizOptions = document.getElementById("quizOptions");
const submitQuizBtn = document.getElementById("submitQuizBtn");
const quizResult = document.getElementById("quizResult");
const studentProgressList = document.getElementById("studentProgressList");

let currentUser = null;
let currentUserDoc = null;
let currentCourseForQuiz = null;
let currentQuizData = null;
let selectedAnswer = null;

// ---------------- Tab Switching ----------------
showLoginTab.addEventListener("click", () => {
  showLoginTab.classList.add("active");
  showSignupTab.classList.remove("active");
  loginFormWrapper.classList.remove("hidden");
  signupFormWrapper.classList.add("hidden");
});

showSignupTab.addEventListener("click", () => {
  showSignupTab.classList.add("active");
  showLoginTab.classList.remove("active");
  signupFormWrapper.classList.remove("hidden");
  loginFormWrapper.classList.add("hidden");
});

// ---------------- XP & Level Helpers ----------------
function getLevelFromXp(xp) {
  if (xp >= 150) return 4;  // Pro
  if (xp >= 90) return 3;   // Advanced
  if (xp >= 40) return 2;   // Intermediate
  return 1;                 // Beginner
}

function getBadgeFromXp(xp) {
  if (xp >= 150) return "🌟 Rural Tech Champion";
  if (xp >= 90) return "🔥 Consistent Learner";
  if (xp >= 40) return "⚔️ Level Up Achiever";
  return "🎯 Beginner Explorer";
}

async function addXpToUser(deltaXp) {
  if (!currentUser) return;
  const userRef = db.collection("users").doc(currentUser.uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    const oldXp = data.xp || 0;
    const newXp = oldXp + deltaXp;
    const newLevel = getLevelFromXp(newXp);

    tx.update(userRef, { xp: newXp, level: newLevel });
    currentUserDoc = { ...data, xp: newXp, level: newLevel };
  });

  renderUserHeader();
}

// ---------------- Signup ----------------
signupBtn.addEventListener("click", async () => {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();
  const role = signupRole.value;

  if (!name || !email || !password) {
    alert("Fill all fields!");
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({
      name,
      email,
      role,
      xp: 0,
      level: 1,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Account created! Now you can login.");
  } catch (err) {
    alert("Signup error: " + err.message);
  }
});

// ---------------- Login ----------------
loginBtn.addEventListener("click", async () => {
  try {
    await auth.signInWithEmailAndPassword(
      loginEmail.value.trim(),
      loginPassword.value.trim()
    );
  } catch (err) {
    alert("Login error: " + err.message);
  }
});

// ---------------- Logout ----------------
logoutBtn.addEventListener("click", () => auth.signOut());

// ---------------- Auth Listener ----------------
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (!user) {
    currentUserDoc = null;
    showLanding();
    return;
  }

  const userSnap = await db.collection("users").doc(user.uid).get();
  currentUserDoc = userSnap.data() || {};
  if (currentUserDoc.xp === undefined) currentUserDoc.xp = 0;
  if (currentUserDoc.level === undefined) {
    currentUserDoc.level = getLevelFromXp(currentUserDoc.xp);
  }

  logoutBtn.classList.remove("hidden");
  authSection.classList.add("hidden");
  landingSection.classList.add("hidden");

  renderUserHeader();

  if (currentUserDoc.role === "teacher") {
    teacherDashboard.classList.remove("hidden");
    studentDashboard.classList.add("hidden");
    loadTeacherCourses();
  } else {
    teacherDashboard.classList.add("hidden");
    studentDashboard.classList.remove("hidden");
    loadStudentCourses();
    loadStudentProgress();
  }
});

function showLanding() {
  landingSection.classList.remove("hidden");
  authSection.classList.remove("hidden");
  teacherDashboard.classList.add("hidden");
  studentDashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  userRoleText.textContent = "";
}

// ---------------- Header XP Display ----------------
function renderUserHeader() {
  if (!currentUserDoc) {
    userRoleText.textContent = "";
    return;
  }
  const name = currentUserDoc.name || "User";
  const role = currentUserDoc.role || "student";
  const xp = currentUserDoc.xp || 0;
  const level = currentUserDoc.level || getLevelFromXp(xp);
  const badge = getBadgeFromXp(xp);

  userRoleText.textContent =
    `${name} – ${role.toUpperCase()} | XP: ${xp} | LVL: ${level} | ${badge}`;
}

// ---------------- Create Course ----------------
createCourseBtn.addEventListener("click", async () => {
  const title = courseTitle.value.trim();
  if (!title) {
    alert("Enter course title!");
    return;
  }

  await db.collection("courses").add({
    title,
    description: courseDescription.value.trim(),
    language: courseLanguage.value,
    video: courseVideoLink.value.trim(),
    pdf: coursePdfLink.value.trim(),
    extra: courseExtraLink.value.trim(),
    teacherId: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Course Created!");
  courseTitle.value = "";
  courseDescription.value = "";
  courseVideoLink.value = "";
  coursePdfLink.value = "";
  courseExtraLink.value = "";

  loadTeacherCourses();
});

// ---------------- Load Teacher Courses ----------------
async function loadTeacherCourses() {
  teacherCoursesList.innerHTML = "";
  quizCourseSelect.innerHTML = "";

  const snap = await db.collection("courses")
    .where("teacherId", "==", currentUser.uid)
    .get();

  snap.forEach(doc => {
    const c = doc.data();

    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${c.title}</strong><br>
        <span style="font-size:12px;color:#9ca3af">${c.language}</span>
      </div>
    `;
    teacherCoursesList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = c.title;
    quizCourseSelect.appendChild(opt);
  });
}

// ---------------- Add Quiz ----------------
addQuizBtn.addEventListener("click", async () => {
  const courseId = quizCourseSelect.value;
  const q = quizQuestion.value.trim();
  const A = quizOptA.value.trim();
  const B = quizOptB.value.trim();
  const C = quizOptC.value.trim();
  const D = quizOptD.value.trim();
  const correct = quizCorrect.value;

  if (!courseId) {
    alert("Select a course first!");
    return;
  }
  if (!q || !A || !B || !C || !D) {
    alert("Fill all quiz fields");
    return;
  }

  await db.collection("quizzes").add({
    courseId,
    question: q,
    options: { A, B, C, D },
    correct,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Quiz Added!");
  quizQuestion.value = "";
  quizOptA.value = "";
  quizOptB.value = "";
  quizOptC.value = "";
  quizOptD.value = "";
});

// ---------------- Load Student Courses ----------------
async function loadStudentCourses() {
  studentCoursesList.innerHTML = "";

  const snap = await db.collection("courses").get();
  snap.forEach(doc => {
    const c = doc.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${c.title}</strong><br>
        <span style="font-size:12px;color:#9ca3af">${c.language}</span>
      </div>
    `;

    if (c.video) {
      const vBtn = document.createElement("button");
      vBtn.textContent = "Video";
      vBtn.className = "btn small";
      vBtn.onclick = () => window.open(c.video, "_blank");
      li.appendChild(vBtn);
    }

    if (c.pdf) {
      const pBtn = document.createElement("button");
      pBtn.textContent = "Notes";
      pBtn.className = "btn small";
      pBtn.onclick = () => window.open(c.pdf, "_blank");
      li.appendChild(pBtn);
    }

    if (c.extra) {
      const eBtn = document.createElement("button");
      eBtn.textContent = "Extra";
      eBtn.className = "btn small";
      eBtn.onclick = () => window.open(c.extra, "_blank");
      li.appendChild(eBtn);
    }

    const quizBtn = document.createElement("button");
    quizBtn.textContent = "Start Quiz";
    quizBtn.className = "btn small";
    quizBtn.onclick = () => openQuiz(doc.id, c.title);
    li.appendChild(quizBtn);

    studentCoursesList.appendChild(li);
  });
}

// ---------------- Open Quiz ----------------
async function openQuiz(courseId, title) {
  currentCourseForQuiz = courseId;
  quizSection.classList.remove("hidden");
  quizOptions.innerHTML = "";
  quizResult.textContent = "";
  selectedAnswer = null;

  quizCourseTitle.textContent = "Quiz – " + title;

  const snap = await db.collection("quizzes")
    .where("courseId", "==", courseId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) {
    quizQuestionText.textContent = "No quiz added yet for this course.";
    submitQuizBtn.classList.add("hidden");
    return;
  }

  currentQuizData = snap.docs[0].data();
  quizQuestionText.textContent = currentQuizData.question;

  ["A", "B", "C", "D"].forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = `${letter}. ${currentQuizData.options[letter]}`;
    btn.className = "btn small";
    btn.onclick = () => {
      selectedAnswer = letter;
    };
    quizOptions.appendChild(btn);
  });

  submitQuizBtn.classList.remove("hidden");
}

// ---------------- Submit Quiz ----------------
submitQuizBtn.addEventListener("click", async () => {
  if (!selectedAnswer) {
    alert("Select an answer!");
    return;
  }

  const isCorrect = selectedAnswer === currentQuizData.correct;
  quizResult.textContent = isCorrect
    ? "✔️ Correct!"
    : `❌ Wrong! Right answer: ${currentQuizData.correct}`;

  await db.collection("progress").add({
    userId: currentUser.uid,
    courseId: currentCourseForQuiz,
    correct: isCorrect,
    selectedAnswer,
    correctAnswer: currentQuizData.correct,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // XP: correct = +10, wrong = +2 for effort
  await addXpToUser(isCorrect ? 10 : 2);

  selectedAnswer = null;
  loadStudentProgress();
});

// ---------------- Load Student Progress ----------------
async function loadStudentProgress() {
  studentProgressList.innerHTML = "";

  const snap = await db.collection("progress")
    .where("userId", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .get();

  snap.forEach(doc => {
    const p = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong>Course:</strong> ${p.courseId}</div>
      <div>${p.correct ? "✔️ Correct" : "❌ Wrong"}</div>
    `;
    studentProgressList.appendChild(li);
  });
}
