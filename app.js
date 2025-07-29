// Quiz Maker Application WITHOUT localStorage (in-memory storage only)
class QuizApp {
  constructor() {
    /* In-memory data stores */
    this.users = []; // Registered users
    this.quizzes = []; // All quizzes
    this.results = []; // Completed quiz results

    /* Session state */
    this.currentUser = null;
    this.currentQuiz = null;
    this.currentQuizIndex = 0;
    this.userAnswers = [];

    this.init();
  }

  /* ---------- INITIALIZATION ---------- */
  init() {
    this.seedSampleData();
    this.cacheDom();
    this.bindGlobalEvents();
    this.bindFormEvents();
    this.updateAuthState();
    this.showPage("home");
  }

  seedSampleData() {
    // Only seed once per page load
    this.quizzes = [
      {
        id: 1,
        title: "JavaScript Fundamentals",
        description: "Test your knowledge of basic JavaScript concepts",
        creator: "WebDev Academy",
        createdAt: "2025-07-25",
        questions: [
          {
            id: 1,
            question: "What is the correct way to declare a variable in JavaScript?",
            options: [
              "var myVar;",
              "variable myVar;",
              "declare myVar;",
              "int myVar;",
            ],
            correctAnswer: 0,
          },
          {
            id: 2,
            question: "Which method is used to add an element to the end of an array?",
            options: ["append()", "push()", "add()", "insert()"],
            correctAnswer: 1,
          },
          {
            id: 3,
            question: "What does 'DOM' stand for?",
            options: [
              "Document Object Model",
              "Data Object Management",
              "Dynamic Object Method",
              "Document Oriented Markup",
            ],
            correctAnswer: 0,
          },
        ],
      },
      {
        id: 2,
        title: "HTML & CSS Basics",
        description: "Fundamental concepts of web markup and styling",
        creator: "Frontend Masters",
        createdAt: "2025-07-24",
        questions: [
          {
            id: 1,
            question: "Which HTML tag is used for the largest heading?",
            options: ["<h6>", "<h1>", "<heading>", "<header>"],
            correctAnswer: 1,
          },
          {
            id: 2,
            question: "What does CSS stand for?",
            options: [
              "Computer Style Sheets",
              "Creative Style Sheets",
              "Cascading Style Sheets",
              "Colorful Style Sheets",
            ],
            correctAnswer: 2,
          },
        ],
      },
    ];
  }

  cacheDom() {
    /* Navigation + pages */
    this.navMenu = document.getElementById("nav-menu");
    this.navToggle = document.getElementById("nav-toggle");

    this.pages = document.querySelectorAll(".page");
    this.homePage = document.getElementById("home-page");
    this.quizListPage = document.getElementById("quiz-list-page");
    this.createQuizPage = document.getElementById("create-quiz-page");

    /* Quiz list */
    this.quizGrid = document.getElementById("quiz-grid");
    this.quizSearch = document.getElementById("quiz-search");
    this.quizSort = document.getElementById("quiz-sort");

    /* Auth */
    this.loginForm = document.getElementById("login-form");
    this.registerForm = document.getElementById("register-form");
    this.logoutBtn = document.getElementById("logout-btn");
    this.navUserLabel = document.getElementById("nav-user");

    /* Create quiz */
    this.addQuestionBtn = document.getElementById("add-question-btn");
    this.createQuizForm = document.getElementById("create-quiz-form");
    this.questionsContainer = document.getElementById("questions-container");

    /* Take quiz */
    this.quizTitleDisplay = document.getElementById("quiz-title-display");
    this.progressFill = document.getElementById("progress-fill");
    this.questionCounter = document.getElementById("question-counter");
    this.currentQuestionEl = document.getElementById("current-question");
    this.optionsContainer = document.getElementById("options-container");
    this.prevQuestionBtn = document.getElementById("prev-question-btn");
    this.nextQuestionBtn = document.getElementById("next-question-btn");
    this.submitQuizBtn = document.getElementById("submit-quiz-btn");

    /* Results */
    this.scorePercentage = document.getElementById("score-percentage");
    this.scoreText = document.getElementById("score-text");
    this.answerReview = document.getElementById("answer-review");
    this.retakeQuizBtn = document.getElementById("retake-quiz-btn");

    /* Toast + loading */
    this.toastContainer = document.getElementById("toast-container");
    this.loadingOverlay = document.getElementById("loading-overlay");
  }

  /* ---------- EVENT BINDING ---------- */
  bindGlobalEvents() {
    // Generic navigation handler
    document.addEventListener("click", (e) => {
      const target = e.target;

      // Navigate between pages
      if (target && target.dataset.page) {
        e.preventDefault();
        this.showPage(target.dataset.page);
        return;
      }

      // Take / delete quiz buttons (event delegation)
      if (target.classList.contains("take-quiz-btn")) {
        const quizId = parseInt(target.dataset.quizId);
        this.startQuiz(quizId);
        return;
      }
      if (target.classList.contains("delete-quiz-btn")) {
        const quizId = parseInt(target.dataset.quizId);
        this.deleteQuiz(quizId);
        return;
      }
    });

    // Mobile menu toggle
    this.navToggle.addEventListener("click", () => {
      this.navMenu.classList.toggle("active");
    });
  }

  bindFormEvents() {
    // Auth
    if (this.loginForm)
      this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    if (this.registerForm)
      this.registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    if (this.logoutBtn)
      this.logoutBtn.addEventListener("click", () => this.handleLogout());

    // Search + sort (Quiz list)
    if (this.quizSearch)
      this.quizSearch.addEventListener("input", (e) =>
        this.filterQuizzes(e.target.value)
      );
    if (this.quizSort)
      this.quizSort.addEventListener("change", (e) =>
        this.sortQuizzes(e.target.value)
      );

    // Create quiz
    if (this.addQuestionBtn)
      this.addQuestionBtn.addEventListener("click", () => this.addQuestion());
    if (this.createQuizForm)
      this.createQuizForm.addEventListener("submit", (e) =>
        this.handleCreateQuiz(e)
      );

    // Quiz taking
    if (this.prevQuestionBtn)
      this.prevQuestionBtn.addEventListener("click", () => this.prevQuestion());
    if (this.nextQuestionBtn)
      this.nextQuestionBtn.addEventListener("click", () => this.nextQuestion());
    if (this.submitQuizBtn)
      this.submitQuizBtn.addEventListener("click", () => this.submitQuiz());
    if (this.retakeQuizBtn)
      this.retakeQuizBtn.addEventListener("click", () => this.retakeQuiz());
  }

  /* ---------- AUTH ---------- */
  handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirmPwd = document.getElementById("register-confirm").value;

    if (password !== confirmPwd) {
      this.showToast("Passwords do not match", "error");
      return;
    }

    if (this.users.some((u) => u.email === email || u.username === username)) {
      this.showToast("User already exists", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      quizzesCreated: [],
      quizzesTaken: [],
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.updateAuthState();
    this.showToast("Registration successful", "success");
    this.showPage("home");
  }

  handleLogin(e) {
    e.preventDefault();
    const emailOrUsername = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const user = this.users.find(
      (u) =>
        (u.email === emailOrUsername || u.username === emailOrUsername) &&
        u.password === password
    );

    if (!user) {
      this.showToast("Invalid credentials", "error");
      return;
    }

    this.currentUser = user;
    this.updateAuthState();
    this.showToast("Logged in", "success");
    this.showPage("home");
  }

  handleLogout() {
    this.currentUser = null;
    this.updateAuthState();
    this.showToast("Logged out", "success");
    this.showPage("home");
  }

  updateAuthState() {
    const authEls = document.querySelectorAll(".auth-required");
    const guestEls = document.querySelectorAll(".guest-only");

    if (this.currentUser) {
      authEls.forEach((el) => el.classList.remove("hidden"));
      guestEls.forEach((el) => el.classList.add("hidden"));
      this.navUserLabel.textContent = `Welcome, ${this.currentUser.username}`;
    } else {
      authEls.forEach((el) => el.classList.add("hidden"));
      guestEls.forEach((el) => el.classList.remove("hidden"));
      this.navUserLabel.textContent = "";
    }
  }

  /* ---------- PAGE MANAGEMENT ---------- */
  showPage(pageKey) {
    // Hide all pages then show the requested one
    this.pages.forEach((p) => p.classList.remove("active"));
    const target = document.getElementById(`${pageKey}-page`);
    if (target) target.classList.add("active");

    // Close mobile menu (if open)
    this.navMenu.classList.remove("active");

    // Page-specific setup
    if (pageKey === "quiz-list") this.renderQuizList();
    if (pageKey === "create-quiz") this.prepareQuizBuilder();
  }

  /* ---------- QUIZ LIST ---------- */
  renderQuizList(quizzes = this.quizzes) {
    this.quizGrid.innerHTML = "";

    if (!quizzes.length) {
      this.quizGrid.innerHTML = "<p>No quizzes available.</p>";
      return;
    }

    quizzes.forEach((q) => {
      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `
        <div class="quiz-card__header"><h3>${q.title}</h3></div>
        <p>${q.description}</p>
        <div class="quiz-card__meta">
          <span>${q.questions.length} questions</span> •
          <span>By ${q.creator}</span> •
          <span>${new Date(q.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="quiz-card__actions">
          <button class="btn btn--primary take-quiz-btn" data-quiz-id="${q.id}">Take Quiz</button>
          ${
            this.currentUser &&
            (this.currentUser.username === q.creator ||
              this.currentUser.quizzesCreated.includes(q.id))
              ? `<button class="btn btn--outline delete-quiz-btn" data-quiz-id="${q.id}">Delete</button>`
              : ""
          }
        </div>
      `;
      this.quizGrid.appendChild(card);
    });
  }

  filterQuizzes(term = "") {
    const filtered = this.quizzes.filter(
      (q) =>
        q.title.toLowerCase().includes(term.toLowerCase()) ||
        q.description.toLowerCase().includes(term.toLowerCase())
    );
    this.renderQuizList(filtered);
  }

  sortQuizzes(mode) {
    let sorted = [...this.quizzes];
    if (mode === "newest")
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (mode === "oldest")
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (mode === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    this.renderQuizList(sorted);
  }

  deleteQuiz(id) {
    if (!confirm("Delete this quiz?")) return;
    this.quizzes = this.quizzes.filter((q) => q.id !== id);
    this.renderQuizList();
    this.showToast("Quiz deleted", "success");
  }

  /* ---------- QUIZ CREATION ---------- */
  prepareQuizBuilder() {
    if (!this.currentUser) {
      this.showToast("Login required to create quizzes", "error");
      this.showPage("login");
      return;
    }
    this.createQuizForm.reset();
    this.questionsContainer.innerHTML = "";
    this.addQuestion();
  }

  addQuestion() {
    const qNum = this.questionsContainer.children.length + 1;
    const block = document.createElement("div");
    block.className = "question-block";
    block.innerHTML = `
      <div class="form-group">
        <label class="form-label">Question ${qNum}</label>
        <input type="text" class="form-control question-text" placeholder="Enter question" required>
      </div>
      <div class="form-group">
        <label class="form-label">Options (select the correct answer)</label>
        ${["A", "B", "C", "D"].map(
          (l, idx) => `
          <div class="option-input">
            <input type="radio" name="correct-${qNum}" value="${idx}" required>
            <input type="text" class="form-control option-text" placeholder="Option ${l}" required>
          </div>`
        ).join("")}
      </div>
      <button type="button" class="btn btn--outline btn--sm remove-question-btn">Delete Question</button>
    `;
    block.querySelector(".remove-question-btn").addEventListener("click", () => {
      block.remove();
      this.reindexQuestions();
    });
    this.questionsContainer.appendChild(block);
  }

  reindexQuestions() {
    [...this.questionsContainer.children].forEach((blk, i) => {
      blk.querySelector(".form-label").textContent = `Question ${i + 1}`;
      blk.querySelectorAll("input[type=radio]").forEach((r) => {
        r.name = `correct-${i + 1}`;
      });
    });
  }

  handleCreateQuiz(e) {
    e.preventDefault();
    const title = document.getElementById("quiz-title").value.trim();
    const description = document.getElementById("quiz-description").value.trim();

    const questionBlocks = [...document.querySelectorAll(".question-block")];
    if (!questionBlocks.length) {
      this.showToast("Add at least one question", "error");
      return;
    }

    const questions = [];
    let valid = true;
    questionBlocks.forEach((blk, idx) => {
      const qText = blk.querySelector(".question-text").value.trim();
      const opts = [...blk.querySelectorAll(".option-text")].map((o) =>
        o.value.trim()
      );
      const correctEl = blk.querySelector(`input[name='correct-${idx + 1}']:checked`);
      if (!qText || opts.some((o) => !o) || !correctEl) {
        valid = false;
        return;
      }
      questions.push({
        id: idx + 1,
        question: qText,
        options: opts,
        correctAnswer: parseInt(correctEl.value),
      });
    });

    if (!valid) {
      this.showToast("Please complete all questions", "error");
      return;
    }

    const newQuiz = {
      id: Date.now(),
      title,
      description,
      creator: this.currentUser.username,
      createdAt: new Date().toISOString(),
      questions,
    };
    this.quizzes.push(newQuiz);
    this.currentUser.quizzesCreated.push(newQuiz.id);
    this.showToast("Quiz created", "success");
    this.showPage("quiz-list");
  }

  /* ---------- QUIZ TAKING ---------- */
  startQuiz(id) {
    this.currentQuiz = this.quizzes.find((q) => q.id === id);
    if (!this.currentQuiz) {
      this.showToast("Quiz not found", "error");
      return;
    }
    this.currentQuizIndex = 0;
    this.userAnswers = new Array(this.currentQuiz.questions.length).fill(null);
    this.quizTitleDisplay.textContent = this.currentQuiz.title;
    this.showPage("take-quiz");
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const q = this.currentQuiz.questions[this.currentQuizIndex];

    // Progress bar + counter
    const pct = ((this.currentQuizIndex + 1) / this.currentQuiz.questions.length) * 100;
    this.progressFill.style.width = `${pct}%`;
    this.questionCounter.textContent = `Question ${this.currentQuizIndex + 1} of ${this.currentQuiz.questions.length}`;

    // Question text
    this.currentQuestionEl.textContent = q.question;

    // Options
    this.optionsContainer.innerHTML = "";
    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
      if (this.userAnswers[this.currentQuizIndex] === idx) btn.classList.add("selected");
      btn.addEventListener("click", () => this.selectAnswer(idx));
      this.optionsContainer.appendChild(btn);
    });

    // Nav buttons state
    this.prevQuestionBtn.disabled = this.currentQuizIndex === 0;
    const hasAns = this.userAnswers[this.currentQuizIndex] !== null;
    this.nextQuestionBtn.disabled = !hasAns;
    this.submitQuizBtn.disabled = !hasAns;

    if (this.currentQuizIndex === this.currentQuiz.questions.length - 1) {
      this.nextQuestionBtn.classList.add("hidden");
      this.submitQuizBtn.classList.remove("hidden");
    } else {
      this.nextQuestionBtn.classList.remove("hidden");
      this.submitQuizBtn.classList.add("hidden");
    }
  }

  selectAnswer(idx) {
    this.userAnswers[this.currentQuizIndex] = idx;
    this.renderCurrentQuestion();
  }

  nextQuestion() {
    if (this.currentQuizIndex < this.currentQuiz.questions.length - 1) {
      this.currentQuizIndex += 1;
      this.renderCurrentQuestion();
    }
  }
  prevQuestion() {
    if (this.currentQuizIndex > 0) {
      this.currentQuizIndex -= 1;
      this.renderCurrentQuestion();
    }
  }

  submitQuiz() {
    const score = this.userAnswers.reduce(
      (tot, ans, idx) =>
        tot + (ans === this.currentQuiz.questions[idx].correctAnswer ? 1 : 0),
      0
    );
    const percentage = Math.round((score / this.currentQuiz.questions.length) * 100);

    const result = {
      id: Date.now(),
      userId: this.currentUser?.id ?? null,
      quizId: this.currentQuiz.id,
      score,
      totalQuestions: this.currentQuiz.questions.length,
      percentage,
      answers: [...this.userAnswers],
      completedAt: new Date().toISOString(),
    };
    this.results.push(result);
    this.showResults(result);
  }

  showResults(res) {
    this.scorePercentage.textContent = `${res.percentage}%`;
    this.scoreText.textContent = `You scored ${res.score} out of ${res.totalQuestions}`;
    this.answerReview.innerHTML = "";

    this.currentQuiz.questions.forEach((q, idx) => {
      const item = document.createElement("div");
      const correct = res.answers[idx] === q.correctAnswer;
      item.className = `answer-item ${correct ? "correct" : "incorrect"}`;
      item.innerHTML = `
        <h4>Question ${idx + 1}: ${q.question}</h4>
        <p><strong>Your answer:</strong> ${q.options[res.answers[idx]] ?? "Not answered"}</p>
        <p><strong>Correct answer:</strong> ${q.options[q.correctAnswer]}</p>
      `;
      this.answerReview.appendChild(item);
    });

    this.showPage("results");
  }

  retakeQuiz() {
    if (this.currentQuiz) this.startQuiz(this.currentQuiz.id);
  }

  /* ---------- UTILITIES ---------- */
  showToast(msg, type = "success") {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Bootstrap after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  window.app = new QuizApp();
});