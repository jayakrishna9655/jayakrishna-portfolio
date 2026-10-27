/**
 * Jayakrishna - Microservices Quiz Distributed System Portfolio
 * Interactive Application Logic & Simulation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initFlowSimulator();
  initArchitectureInspector();
  initApiExplorer();
  initScrollSpy();
  initCopyHelpers();
  initGithubRepos();
});

/* =========================================
   1. THEME TOGGLE (Default: HR Light Mode)
   ========================================= */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const printNavBtn = document.getElementById('printResumeNavBtn');
  const savedTheme = localStorage.getItem('portfolio-theme') || 'light';

  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '🌙';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('portfolio-theme', 'light');
        themeToggleBtn.innerHTML = '🌙';
        showToast('Light theme activated');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('portfolio-theme', 'dark');
        themeToggleBtn.innerHTML = '☀️';
        showToast('Dark theme activated');
      }
    });
  }

  if (printNavBtn) {
    printNavBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

/* =========================================
   2. DISTRIBUTED FLOW SIMULATOR
   ========================================= */
const simulationStages = [
  {
    step: 1,
    badge: 'STAGE 1: CLIENT REQUEST',
    title: 'Client Dispatches Quiz Creation to API Gateway',
    explanation: 'The frontend client (or mobile app) posts a quiz request to the unified API Gateway on port 8765. The client does not know about internal IPs or individual microservice ports — everything passes through the secure single ingress point.',
    actors: [
      { role: 'Initiator', name: 'Web Client / Postman' },
      { role: 'Ingress Point', name: 'API Gateway (Port 8765)' },
      { role: 'Protocol', name: 'HTTP REST / JSON' }
    ],
    method: 'POST',
    endpoint: 'http://localhost:8765/quiz/create',
    payload: {
      categoryName: 'Java',
      numQuestions: 5,
      title: 'Spring Cloud Microservices Assessment'
    },
    responsePreview: '302 / Pending Routing to Downstream Quiz Service'
  },
  {
    step: 2,
    badge: 'STAGE 2: ROUTING & LOAD BALANCING',
    title: 'API Gateway Resolves Service via Eureka & Routes to Quiz Service',
    explanation: 'Using Spring Cloud Gateway\'s RouteLocator DSL, the gateway evaluates the path `/quiz/**`. It queries the Netflix Eureka Service Registry for active instances of `QUIZ-SERVICE` and dispatches the reactive WebFlux request with client-side load balancing to Port 8082.',
    actors: [
      { role: 'Service Registry', name: 'Netflix Eureka (Port 8761)' },
      { role: 'Router', name: 'Spring Cloud Gateway (Port 8765)' },
      { role: 'Target Microservice', name: 'Quiz Service (Port 8082)' }
    ],
    method: 'GET',
    endpoint: 'Eureka Registry Lookup: lb://QUIZ-SERVICE',
    payload: {
      routeId: 'quiz-service',
      predicate: 'Path(/quiz/**)',
      discoveredInstance: 'http://192.168.1.10:8082'
    },
    responsePreview: 'Instance Resolved. Traffic load-balanced.'
  },
  {
    step: 3,
    badge: 'STAGE 3: INTER-SERVICE RPC VIA OPENFEIGN',
    title: 'Quiz Service Invokes Question Service via Declarative OpenFeign',
    explanation: 'The Quiz Service does not store questions. Instead, it injects `@FeignClient("QUESTION-SERVICE")` and calls `getQuestionsForQuiz("Java", 5)`. Eureka provides the Question Service network coordinates (Port 8081).',
    actors: [
      { role: 'Caller', name: 'Quiz Service (Port 8082)' },
      { role: 'RPC Client', name: 'Spring Cloud OpenFeign (declarative interface)' },
      { role: 'Callee', name: 'Question Service (Port 8081)' }
    ],
    method: 'GET',
    endpoint: 'http://localhost:8081/question/generate?category=Java&numOfQuestions=5',
    payload: {
      category: 'Java',
      numOfQuestions: 5
    },
    responsePreview: '[ 14, 8, 22, 3, 19 ]  // Native SQL: ORDER BY RAND() LIMIT 5'
  },
  {
    step: 4,
    badge: 'STAGE 4: DB STORAGE & DATA MASKING (DTO PATTERN)',
    title: 'Quiz Stored in MySQL & Answers Masked via QuestionWrapper',
    explanation: 'Quiz Service persists the quiz entity with the question IDs in `microQuizdb` (Zero DB cross-joins). When client requests quiz questions (`GET /quiz/get/1`), Question Service packages data into `QuestionWrapper` DTOs, strictly stripping `rightAnswer` to guarantee quiz integrity and zero data leakage!',
    actors: [
      { role: 'Database 1', name: 'microQuizdb (Stores Quiz ID + Question IDs)' },
      { role: 'Database 2', name: 'microQuestiondb (Stores Question Bank)' },
      { role: 'Security Layer', name: 'QuestionWrapper DTO (Answers Masked)' }
    ],
    method: 'GET',
    endpoint: 'http://localhost:8765/quiz/get/1',
    payload: {
      quizId: 1,
      quizTitle: 'Spring Cloud Microservices Assessment'
    },
    responsePreview: [
      {
        id: 14,
        questionTitle: 'What is the role of Spring Cloud Gateway in microservices?',
        option1: 'Database clustering',
        option2: 'Single entry point reverse proxy & routing',
        option3: 'Code compilation',
        option4: 'Static asset hosting'
        // Notice: rightAnswer is NEVER sent to client!
      },
      {
        id: 8,
        questionTitle: 'Which Netflix component handles dynamic service registration?',
        option1: 'Eureka Server',
        option2: 'Zuul',
        option3: 'Ribbon',
        option4: 'Hystrix'
      }
    ]
  },
  {
    step: 5,
    badge: 'STAGE 5: SECURE SERVER-SIDE EVALUATION',
    title: 'Client Submits Answers: Server-Side Grading via Question Service',
    explanation: 'Client sends an array of responses to `POST /quiz/submit/1`. The Quiz Service delegates the grading to Question Service (`POST /question/getScore`). Question Service compares each selection with its private `right_answer` column in MySQL and returns the exact score. Total score: 5 / 5!',
    actors: [
      { role: 'Client Action', name: 'Submits user responses' },
      { role: 'Evaluation Service', name: 'Question Service (/question/getScore)' },
      { role: 'Final Result', name: 'Score: 5 (HTTP 200 OK)' }
    ],
    method: 'POST',
    endpoint: 'http://localhost:8765/quiz/submit/1',
    payload: [
      { id: 14, response: 'Single entry point reverse proxy & routing' },
      { id: 8, response: 'Eureka Server' },
      { id: 22, response: 'Spring Boot' },
      { id: 3, response: 'Java 17' },
      { id: 19, response: 'OpenFeign' }
    ],
    responsePreview: {
      status: 200,
      score: 5,
      totalQuestions: 5,
      percentage: '100%',
      verdict: 'Excellent! Microservices concepts mastered.'
    }
  }
];

let currentSimStep = 1;
let simAutoPlayInterval = null;

function initFlowSimulator() {
  renderSimStage(currentSimStep);

  const prevBtn = document.getElementById('simPrevBtn');
  const nextBtn = document.getElementById('simNextBtn');
  const autoPlayBtn = document.getElementById('simAutoPlayBtn');
  const stepItems = document.querySelectorAll('.sim-step-item');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentSimStep > 1) {
        currentSimStep--;
        renderSimStage(currentSimStep);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSimStep < simulationStages.length) {
        currentSimStep++;
        renderSimStage(currentSimStep);
      }
    });
  }

  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      const step = parseInt(item.getAttribute('data-step'), 10);
      if (step) {
        currentSimStep = step;
        renderSimStage(currentSimStep);
      }
    });
  });

  if (autoPlayBtn) {
    autoPlayBtn.addEventListener('click', () => {
      if (simAutoPlayInterval) {
        clearInterval(simAutoPlayInterval);
        simAutoPlayInterval = null;
        autoPlayBtn.innerHTML = '▶ Auto-Play Flow';
        showToast('Simulation paused');
      } else {
        autoPlayBtn.innerHTML = '⏸ Pause';
        showToast('Auto-playing simulation flow...');
        simAutoPlayInterval = setInterval(() => {
          if (currentSimStep < simulationStages.length) {
            currentSimStep++;
          } else {
            currentSimStep = 1;
          }
          renderSimStage(currentSimStep);
        }, 3200);
      }
    });
  }
}

function renderSimStage(stepNumber) {
  const stage = simulationStages.find(s => s.step === stepNumber) || simulationStages[0];

  // Update Stepper Visuals
  const stepItems = document.querySelectorAll('.sim-step-item');
  stepItems.forEach(item => {
    const step = parseInt(item.getAttribute('data-step'), 10);
    item.classList.remove('active', 'completed');
    if (step === stepNumber) {
      item.classList.add('active');
    } else if (step < stepNumber) {
      item.classList.add('completed');
    }
  });

  // Update Narrative Text
  const badgeEl = document.getElementById('simPhaseBadge');
  const titleEl = document.getElementById('simStageTitle');
  const expEl = document.getElementById('simStageExp');
  const actorsEl = document.getElementById('simActorsBox');

  if (badgeEl) badgeEl.textContent = stage.badge;
  if (titleEl) titleEl.textContent = stage.title;
  if (expEl) expEl.textContent = stage.explanation;

  if (actorsEl) {
    actorsEl.innerHTML = stage.actors.map(actor => `
      <div class="sim-actor-row">
        <span class="sim-actor-role">${actor.role}:</span>
        <span class="sim-actor-name">${actor.name}</span>
      </div>
    `).join('');
  }

  // Update Code & Payload
  const methodEl = document.getElementById('simMethodBadge');
  const endpointEl = document.getElementById('simEndpointText');
  const codeContentEl = document.getElementById('simCodeContent');

  if (methodEl) {
    methodEl.textContent = stage.method;
    methodEl.className = `code-badge-method method-${stage.method.toLowerCase()}`;
  }
  if (endpointEl) endpointEl.textContent = stage.endpoint;

  if (codeContentEl) {
    const formattedData = {
      Request: {
        Method: stage.method,
        URL: stage.endpoint,
        Body: stage.payload
      },
      ServiceResponsePreview: stage.responsePreview
    };
    codeContentEl.textContent = JSON.stringify(formattedData, null, 2);
  }

  // Update prev/next button states
  const prevBtn = document.getElementById('simPrevBtn');
  const nextBtn = document.getElementById('simNextBtn');
  if (prevBtn) prevBtn.disabled = (stepNumber === 1);
  if (nextBtn) nextBtn.disabled = (stepNumber === simulationStages.length);
}

/* =========================================
   3. ARCHITECTURE INSPECTOR
   ========================================= */
const serviceData = {
  registry: {
    title: 'Service Registry (Netflix Eureka Server)',
    port: '8761',
    role: 'Central Service Directory & Instance Health Tracker',
    tech: 'Spring Cloud Netflix Eureka Server, Spring Boot',
    points: [
      'Acts as the distributed phonebook for all microservices in the cluster.',
      'Eliminates hardcoded hostnames and IP addresses across all service clients.',
      'Receives heartbeat signals every 30s to detect healthy vs failing instances.',
      'Configured with registerWithEureka: false and fetchRegistry: false (standalone server).'
    ],
    endpoints: [
      'Eureka Web Dashboard: http://localhost:8761/',
      'Apps API: GET /eureka/apps (XML/JSON)'
    ]
  },
  gateway: {
    title: 'API Gateway (Spring Cloud Gateway)',
    port: '8765',
    role: 'Unified Reverse Proxy & Reactive Load Balancer',
    tech: 'Spring Cloud Gateway, Spring WebFlux, Project Reactor Netty, Eureka Client',
    points: [
      'Single entry point for all client traffic, frontend applications, and Postman tests.',
      'Built on high-performance non-blocking Reactor Netty architecture.',
      'Dynamic client-side load balancing via Spring Cloud LoadBalancer (lb:// prefix).',
      'Configured with RouteLocatorBuilder DSL with prefix stripping (/quiz-service/** -> /quiz/**).'
    ],
    endpoints: [
      'GET  http://localhost:8765/quiz/get/{id}',
      'POST http://localhost:8765/quiz/create',
      'POST http://localhost:8765/quiz/submit/{id}',
      'GET  http://localhost:8765/question/allQuestions',
      'POST http://localhost:8765/question/add'
    ]
  },
  quiz: {
    title: 'Quiz Orchestrator Microservice',
    port: '8082',
    role: 'Quiz Lifecycle & Domain Orchestrator',
    tech: 'Spring Boot, Spring Data JPA, OpenFeign, MySQL (microQuizdb)',
    points: [
      'Owns the Quiz domain model. Stores only quiz metadata and question IDs.',
      'Zero cross-database dependencies: Does NOT query or join question tables.',
      'Uses declarative Spring Cloud OpenFeign interface (@FeignClient("QUESTION-SERVICE")).',
      'Handles end-to-end quiz creation, question aggregation, and score forwarding.'
    ],
    endpoints: [
      'POST /quiz/create (Creates quiz with random questions)',
      'GET  /quiz/get/{id} (Returns quiz with safe QuestionWrapper DTOs)',
      'POST /quiz/submit/{id} (Calculates candidate score)'
    ]
  },
  question: {
    title: 'Question Microservice (Domain Owner)',
    port: '8081',
    role: 'Question Bank Data Owner & Grading Engine',
    tech: 'Spring Boot, Spring Data JPA, MySQL (microQuestiondb), Hibernate',
    points: [
      'Owns the Question entity and the private microQuestiondb database schema.',
      'Executes native SQL ORDER BY RAND() queries for true random question sampling.',
      'Data Isolation: Exposes QuestionWrapper DTOs to strip correct answers from clients.',
      'Automated grading engine: Compares user selections server-side and tallies scores.'
    ],
    endpoints: [
      'GET  /question/allQuestions',
      'GET  /question/category/{category}',
      'POST /question/add',
      'GET  /question/generate?category={c}&numOfQuestions={n} (Internal RPC)',
      'POST /question/getQuetion (Internal RPC - returns QuestionWrapper)',
      'POST /question/getScore (Internal RPC - evaluates response list)'
    ]
  },
  dbQuiz: {
    title: 'MySQL Database (microQuizdb)',
    port: '3306',
    role: 'Dedicated Quiz Persistence Store',
    tech: 'MySQL 8.x, Hibernate DDL Auto, InnoDB',
    points: [
      'Database-per-service architecture ensures strict microservice independence.',
      'Stores the quiz table and quiz_question_ids collection table.',
      'No foreign key constraints to the question database.',
      'Can be backed up, migrated, or scaled independently of question service.'
    ],
    endpoints: [
      'JDBC URL: jdbc:mysql://localhost:3306/microQuizdb'
    ]
  },
  dbQuestion: {
    title: 'MySQL Database (microQuestiondb)',
    port: '3306',
    role: 'Dedicated Question Bank Store',
    tech: 'MySQL 8.x, Hibernate DDL Auto, Native SQL',
    points: [
      'Stores full question records including question_title, options, and right_answer.',
      'Supports high-performance indexed queries by category and ID lookups.',
      'Completely isolated: Quiz service has zero direct network access to this database.'
    ],
    endpoints: [
      'JDBC URL: jdbc:mysql://localhost:3306/microQuestiondb'
    ]
  }
};

function initArchitectureInspector() {
  const nodes = document.querySelectorAll('.arch-service-node, .arch-db-node');
  const panel = document.getElementById('serviceInspectorPanel');
  const closeBtn = document.getElementById('inspectorCloseBtn');

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const serviceKey = node.getAttribute('data-service');
      if (serviceKey && serviceData[serviceKey]) {
        nodes.forEach(n => n.classList.remove('active-inspect'));
        node.classList.add('active-inspect');
        renderInspectorData(serviceData[serviceKey]);
        if (panel) {
          panel.classList.add('show');
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  });

  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('show');
      nodes.forEach(n => n.classList.remove('active-inspect'));
    });
  }
}

function renderInspectorData(data) {
  const titleEl = document.getElementById('inspectorTitle');
  const roleEl = document.getElementById('inspectorRole');
  const techEl = document.getElementById('inspectorTech');
  const portEl = document.getElementById('inspectorPort');
  const pointsList = document.getElementById('inspectorPoints');
  const endpointsList = document.getElementById('inspectorEndpoints');

  if (titleEl) titleEl.textContent = data.title;
  if (roleEl) roleEl.textContent = data.role;
  if (techEl) techEl.textContent = data.tech;
  if (portEl) portEl.textContent = `Port ${data.port}`;

  if (pointsList) {
    pointsList.innerHTML = data.points.map(pt => `<li>${pt}</li>`).join('');
  }

  if (endpointsList) {
    endpointsList.innerHTML = data.endpoints.map(ep => `
      <li style="font-family: var(--font-mono); font-size: 0.8rem; color: #38bdf8;">${ep}</li>
    `).join('');
  }
}

/* =========================================
   4. API EXPLORER & FILTERING
   ========================================= */
const apiData = [
  {
    service: 'gateway',
    serviceName: 'API Gateway',
    method: 'POST',
    path: '/quiz/create',
    fullUrl: 'http://localhost:8765/quiz/create',
    desc: 'Create a new quiz by delegating question generation to Question Service',
    body: {
      categoryName: 'Java',
      numQuestions: 5,
      title: 'Java Core Concepts Quiz'
    },
    curl: `curl -X POST http://localhost:8765/quiz/create \\\n  -H "Content-Type: application/json" \\\n  -d '{"categoryName":"Java","numQuestions":5,"title":"Java Core Concepts Quiz"}'`
  },
  {
    service: 'gateway',
    serviceName: 'API Gateway',
    method: 'GET',
    path: '/quiz/get/{id}',
    fullUrl: 'http://localhost:8765/quiz/get/1',
    desc: 'Fetch quiz questions with correct answers stripped out (QuestionWrapper DTO)',
    body: null,
    curl: `curl -X GET http://localhost:8765/quiz/get/1`
  },
  {
    service: 'gateway',
    serviceName: 'API Gateway',
    method: 'POST',
    path: '/quiz/submit/{id}',
    fullUrl: 'http://localhost:8765/quiz/submit/1',
    desc: 'Submit user answers for automatic evaluation and receive score',
    body: [
      { id: 1, response: 'Java Virtual Machine' },
      { id: 2, response: '32 bit' }
    ],
    curl: `curl -X POST http://localhost:8765/quiz/submit/1 \\\n  -H "Content-Type: application/json" \\\n  -d '[{"id":1,"response":"Java Virtual Machine"},{"id":2,"response":"32 bit"}]'`
  },
  {
    service: 'question',
    serviceName: 'Question Service',
    method: 'GET',
    path: '/question/allQuestions',
    fullUrl: 'http://localhost:8081/question/allQuestions',
    desc: 'Fetch all questions from question repository (Admin view)',
    body: null,
    curl: `curl -X GET http://localhost:8081/question/allQuestions`
  },
  {
    service: 'question',
    serviceName: 'Question Service',
    method: 'GET',
    path: '/question/category/{category}',
    fullUrl: 'http://localhost:8081/question/category/Java',
    desc: 'Retrieve questions filtered by category',
    body: null,
    curl: `curl -X GET http://localhost:8081/question/category/Java`
  },
  {
    service: 'question',
    serviceName: 'Question Service',
    method: 'POST',
    path: '/question/add',
    fullUrl: 'http://localhost:8081/question/add',
    desc: 'Add a new question with options and correct answer to database',
    body: {
      questionTitle: 'What is the default port of Eureka Server?',
      option1: '8080',
      option2: '8761',
      option3: '8765',
      option4: '3306',
      rightAnswer: '8761',
      difficultylevel: 'Easy',
      category: 'Microservices'
    },
    curl: `curl -X POST http://localhost:8081/question/add \\\n  -H "Content-Type: application/json" \\\n  -d '{"questionTitle":"What is the default port of Eureka Server?","option1":"8080","option2":"8761","option3":"8765","option4":"3306","rightAnswer":"8761","difficultylevel":"Easy","category":"Microservices"}'`
  },
  {
    service: 'question',
    serviceName: 'Question Service',
    method: 'GET',
    path: '/question/generate',
    fullUrl: 'http://localhost:8081/question/generate?category=Java&numOfQuestions=5',
    desc: 'Internal RPC: Random question IDs via native SQL ORDER BY RAND()',
    body: null,
    curl: `curl -X GET "http://localhost:8081/question/generate?category=Java&numOfQuestions=5"`
  }
];

function initApiExplorer() {
  const container = document.getElementById('apiEndpointsList');
  const tabs = document.querySelectorAll('.api-tab-btn');

  renderApiItems('all');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');
      renderApiItems(filter);
    });
  });
}

function renderApiItems(filter) {
  const container = document.getElementById('apiEndpointsList');
  if (!container) return;

  const filtered = (filter === 'all')
    ? apiData
    : apiData.filter(item => item.service === filter);

  container.innerHTML = filtered.map((item, idx) => `
    <div class="api-item" data-index="${idx}">
      <div class="api-item-header" onclick="toggleApiItem(this)">
        <div class="api-left">
          <span class="api-badge ${item.method.toLowerCase()}">${item.method}</span>
          <span class="api-path">${item.path}</span>
          <span class="api-service-tag">${item.serviceName}</span>
        </div>
        <div class="api-item-right">
          <span class="api-desc-short">${item.desc}</span>
          <span class="api-toggle-icon">▼</span>
        </div>
      </div>
      <div class="api-item-body">
        <div class="api-grid-details">
          <div class="api-detail-col">
            <h5>Endpoint URL:</h5>
            <code style="color:#38bdf8; font-size:0.85rem;">${item.fullUrl}</code>
            ${item.body ? `
              <h5 style="margin-top:14px;">Request Payload:</h5>
              <pre class="code-pre" style="padding:12px; font-size:0.775rem;">${JSON.stringify(item.body, null, 2)}</pre>
            ` : '<p style="color:var(--text-dim); font-size:0.85rem; margin-top:12px;">No request body required.</p>'}
          </div>
          <div class="api-detail-col">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h5>cURL Command:</h5>
              <button class="copy-snippet-btn" onclick="copyTextToClipboard(\`${item.curl.replace(/`/g, '\\`')}\`)">Copy cURL</button>
            </div>
            <pre class="code-pre" style="padding:12px; font-size:0.75rem; color:#a5b4fc;">${item.curl}</pre>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

window.toggleApiItem = function (headerElement) {
  const item = headerElement.parentElement;
  item.classList.toggle('open');
};

/* =========================================
   5. COPY HELPERS & TOASTS
   ========================================= */
function initCopyHelpers() {
  const copyButtons = document.querySelectorAll('.copy-btn-action');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        copyTextToClipboard(textToCopy);
      }
    });
  });

  const simCopyBtn = document.getElementById('simCopyCodeBtn');
  if (simCopyBtn) {
    simCopyBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('simCodeContent');
      if (codeEl) {
        copyTextToClipboard(codeEl.textContent);
      }
    });
  }
}

window.copyTextToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    showToast('Failed to copy text');
  });
};

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* =========================================
   6. SCROLL SPY & NAVIGATION
   ========================================= */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* =========================================
   7. GITHUB REPOSITORIES EXPLORER (26 REPOS)
   ========================================= */
const githubReposData = [
  {
    name: 'Micro-Frontend-devpulse-workspace',
    category: 'frontend',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Enterprise Micro-Frontend (MFE) platform built on Angular 19 and Native Federation, orchestrating an independent Shell Host (:4200) with HR (:4201) and DEV (:4202) remotes via decoupled CustomEvent EventBus.',
    tags: ['Angular 19', 'Micro-Frontends', 'Native Federation', 'TypeScript 5.7', 'EventBus', 'Signals', 'Monorepo'],
    url: 'https://github.com/jayakrishna9655/Micro-Frontend-devpulse-workspace'
  },
  {
    name: 'Microservices-Quiz',
    category: 'microservices',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Distributed Microservices Quiz platform featuring Spring Cloud Gateway, Netflix Eureka discovery, OpenFeign RPC, and database-per-service isolation.',
    tags: ['Java 17', 'Spring Boot', 'Spring Cloud Gateway', 'Eureka', 'OpenFeign', 'MySQL'],
    url: 'https://github.com/jayakrishna9655/Microservices-Quiz'
  },
  {
    name: 'Microservice-API-GATEWAY',
    category: 'microservices',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'High-throughput reverse proxy & ingress gateway built on Spring WebFlux, Project Reactor, Netty, with dynamic Java DSL RouteLocator routing.',
    tags: ['Spring Cloud Gateway', 'WebFlux', 'Reactor Netty', 'LoadBalancer'],
    url: 'https://github.com/jayakrishna9655/Microservice-API-GATEWAY'
  },
  {
    name: 'Microservices-QuetionService',
    category: 'microservices',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Standalone Question domain microservice with native SQL random sampling, DTO projections (QuestionWrapper), and server-side scoring.',
    tags: ['Spring Boot', 'Spring Data JPA', 'MySQL', 'DTO Pattern'],
    url: 'https://github.com/jayakrishna9655/Microservices-QuetionService'
  },
  {
    name: 'Ecommerce-MicroService',
    category: 'microservices',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Modular microservices architecture decomposing e-commerce workflows into autonomous catalog, cart, and order processing services.',
    tags: ['Microservices', 'Spring Boot', 'REST APIs', 'MySQL'],
    url: 'https://github.com/jayakrishna9655/Ecommerce-MicroService'
  },
  {
    name: 'Ecommerce-Backend-Service',
    category: 'fullstack',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Full-stack E-Commerce backend using Spring Boot (Java) with MySQL, integrated with Python OCR service and Angular frontend. Features authentication, REST APIs, and text extraction.',
    tags: ['Spring Boot', 'MySQL', 'Python OCR', 'Angular', 'REST APIs'],
    url: 'https://github.com/jayakrishna9655/Ecommerce-Backend-Service'
  },
  {
    name: 'warehouse-management-system',
    category: 'fullstack',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Production-ready inventory portal with RBAC, password encryption, DTOs, database-backed sessions with automated 30-min timeout, and Chart.js analytics.',
    tags: ['Angular', 'Spring Boot 3', 'Spring Security', 'Chart.js', 'MySQL'],
    url: 'https://github.com/jayakrishna9655/warehouse-management-system'
  },
  {
    name: 'Task-Manager-Springboot-Angular',
    category: 'fullstack',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Full-stack Task & To-Do management application built with Angular, Java Spring Boot, and MySQL. Features task editing, state filtering, and responsive UI.',
    tags: ['Angular', 'Java Spring Boot', 'MySQL', 'Full-Stack CRUD'],
    url: 'https://github.com/jayakrishna9655/Task-Manager-Springboot-Angular'
  },
  {
    name: 'fullstack-lead-scraper',
    category: 'fullstack',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Full-stack browser extension to collect leads and tabular data from websites, built with Angular, Spring Boot, HTML, and JavaScript.',
    tags: ['Browser Extension', 'Angular', 'Spring Boot', 'Lead Scraper'],
    url: 'https://github.com/jayakrishna9655/fullstack-lead-scraper'
  },
  {
    name: 'Java-Full-stack-with-Angular--E-commerce-Site',
    category: 'fullstack',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Complete end-to-end full-stack shopping portal featuring Spring Boot REST APIs, JPA persistence, and a modern Angular frontend.',
    tags: ['Angular', 'Spring Boot', 'Full Stack', 'Shopping Cart'],
    url: 'https://github.com/jayakrishna9655/Java-Full-stack-with-Angular--E-commerce-Site'
  },
  {
    name: 'Spring-Ecommerce',
    category: 'fullstack',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Spring Boot e-commerce core engine handling product catalogs, inventory management, customer orders, and transaction processing.',
    tags: ['Spring Boot', 'Spring Data JPA', 'MySQL', 'REST APIs'],
    url: 'https://github.com/jayakrishna9655/Spring-Ecommerce'
  },
  {
    name: 'E-Commerce-with-Angular-18',
    category: 'frontend',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Modern Angular 18 e-commerce application with standalone components, router link optimization improving loading speed by 50%, and streamlined checkout.',
    tags: ['Angular 18', 'TypeScript', 'Router Links', 'Performance Optimization'],
    url: 'https://github.com/jayakrishna9655/E-Commerce-with-Angular-18'
  },
  {
    name: 'SpringSecurityOAuth2',
    category: 'security',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Enterprise OAuth2 and OpenID Connect (OIDC) integration demonstrating federated social logins and token-based API authorization.',
    tags: ['Spring Security', 'OAuth2', 'OIDC', 'JWT / Tokens'],
    url: 'https://github.com/jayakrishna9655/SpringSecurityOAuth2'
  },
  {
    name: 'Spring-Security-',
    category: 'security',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Comprehensive Spring Security implementation with custom UserDetailsService, BCrypt password hashing, and Role-Based Access Control (RBAC).',
    tags: ['Spring Security', 'RBAC', 'BCrypt', 'Session Management'],
    url: 'https://github.com/jayakrishna9655/Spring-Security-'
  },
  {
    name: 'SpringJPA',
    category: 'core',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Object-Relational Mapping (ORM) repository demonstrating entity relationships (@OneToMany, @ManyToMany), JPQL queries, and pagination.',
    tags: ['Spring Data JPA', 'Hibernate', 'JPQL', 'MySQL'],
    url: 'https://github.com/jayakrishna9655/SpringJPA'
  },
  {
    name: 'SpringMVC',
    category: 'core',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Spring MVC Web Application featuring a comprehensive 47-test JUnit 5 suite covering isolated controller unit tests, @WebMvcTest MockMvc slice integration tests, and @ParameterizedTest boundary validations.',
    tags: ['Spring MVC', 'JUnit 5', 'MockMvc', 'Parameterized Tests', 'TDD', 'AssertJ'],
    url: 'https://github.com/jayakrishna9655/SpringMVC'
  },
  {
    name: 'SpringJDBC',
    category: 'core',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Low-level database access using Spring JdbcTemplate, RowMapper, connection pooling, and optimized batch updates.',
    tags: ['Spring JDBC', 'JdbcTemplate', 'RowMapper', 'Connection Pool'],
    url: 'https://github.com/jayakrishna9655/SpringJDBC'
  },
  {
    name: 'Java-MySQL-Database-Connection',
    category: 'core',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'JDBC database connectivity implementation in Eclipse for MySQL, featuring parameterized statements and transaction handling.',
    tags: ['JDBC', 'MySQL', 'Eclipse', 'CRUD'],
    url: 'https://github.com/jayakrishna9655/Java-MySQL-Database-Connection'
  },
  {
    name: 'LOGIN-FORM',
    category: 'frontend',
    lang: 'TypeScript',
    langClass: 'lang-typescript',
    desc: 'Angular user authentication forms demonstrating Reactive Forms (FormBuilder, Validators) and Template-Driven forms with real-time feedback.',
    tags: ['Angular', 'Reactive Forms', 'Validators', 'TypeScript'],
    url: 'https://github.com/jayakrishna9655/LOGIN-FORM'
  },
  {
    name: 'Jai-store',
    category: 'frontend',
    lang: 'HTML',
    langClass: 'lang-html',
    desc: 'Pure frontend e-commerce storefront crafted with semantic HTML5, modern CSS3 animations, and vanilla JavaScript shopping cart logic.',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Cart Engine'],
    url: 'https://github.com/jayakrishna9655/Jai-store'
  },
  {
    name: 'JS_Programs',
    category: 'frontend',
    lang: 'JavaScript',
    langClass: 'lang-javascript',
    desc: 'Collection of JavaScript algorithm implementations, asynchronous promises, closures, and interactive DOM manipulation scripts.',
    tags: ['JavaScript', 'ES6+', 'Async/Await', 'DOM'],
    url: 'https://github.com/jayakrishna9655/JS_Programs'
  },
  {
    name: 'Power_BI_project',
    category: 'data',
    lang: 'Power BI',
    langClass: 'lang-powerbi',
    desc: 'Sales Analyst dashboard leveraging Power BI to deliver actionable business intelligence on revenue metrics, demographics, and regional growth.',
    tags: ['Power BI', 'Data Analytics', 'Dashboards', 'Business Intelligence'],
    url: 'https://github.com/jayakrishna9655/Power_BI_project'
  },
  {
    name: 'Lead-Code-Programs-',
    category: 'data',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'LeetCode algorithmic challenges solved in Java 17 focusing on arrays, strings, two-pointers, sliding window, and binary trees.',
    tags: ['Java 17', 'Data Structures', 'Algorithms', 'LeetCode'],
    url: 'https://github.com/jayakrishna9655/Lead-Code-Programs-'
  },
  {
    name: 'Java-program-',
    category: 'core',
    lang: 'Java',
    langClass: 'lang-java',
    desc: 'Deep-dive into core Java principles: Object-Oriented Programming (Polymorphism, Inheritance), Collections Framework, and Multithreading.',
    tags: ['Core Java', 'OOP', 'Collections Framework', 'Multithreading'],
    url: 'https://github.com/jayakrishna9655/Java-program-'
  },
  {
    name: 'MySql-Programs',
    category: 'data',
    lang: 'SQL',
    langClass: 'lang-default',
    desc: 'Complex SQL queries, multi-table joins, subqueries, indexing benchmarks, and stored procedures for relational database management.',
    tags: ['MySQL', 'SQL Joins', 'Indexing', 'Query Optimization'],
    url: 'https://github.com/jayakrishna9655/MySql-Programs'
  },
  {
    name: 'jayakrishna9655',
    category: 'core',
    lang: 'Markdown',
    langClass: 'lang-default',
    desc: 'Personal GitHub developer profile configuration showcasing technical stack, credentials, and open-source contributions.',
    tags: ['GitHub Profile', 'README', 'Markdown'],
    url: 'https://github.com/jayakrishna9655/jayakrishna9655'
  }
];

let activeRepoFilter = 'all';
let repoSearchQuery = '';

function initGithubRepos() {
  const container = document.getElementById('reposGrid');
  const searchInput = document.getElementById('repoSearchInput');
  const filterBtns = document.querySelectorAll('.repo-filter-btn');

  if (!container) return;

  renderReposList();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      repoSearchQuery = e.target.value.toLowerCase().trim();
      renderReposList();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRepoFilter = btn.getAttribute('data-category') || 'all';
      renderReposList();
    });
  });
}

function renderReposList() {
  const container = document.getElementById('reposGrid');
  const countEl = document.getElementById('reposCountBadge');
  if (!container) return;

  const filtered = githubReposData.filter(repo => {
    const matchesCategory = (activeRepoFilter === 'all') || (repo.category === activeRepoFilter);
    const matchesSearch = !repoSearchQuery ||
      repo.name.toLowerCase().includes(repoSearchQuery) ||
      repo.desc.toLowerCase().includes(repoSearchQuery) ||
      repo.tags.some(tag => tag.toLowerCase().includes(repoSearchQuery)) ||
      repo.lang.toLowerCase().includes(repoSearchQuery);

    return matchesCategory && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${githubReposData.length} Repositories`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No matching repositories found</p>
        <p style="font-size: 0.875rem; color: var(--text-dim);">Try adjusting your search terms or selecting 'All Repositories'.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(repo => `
    <div class="repo-card" data-category="${repo.category}">
      <div class="repo-card-header">
        <h4 class="repo-card-title">
          <span>📂</span>
          <a href="${repo.url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
        </h4>
        <span class="repo-lang-badge ${repo.langClass}">${repo.lang}</span>
      </div>

      <p class="repo-card-desc">${repo.desc}</p>

      <div class="repo-card-tags">
        ${repo.tags.map(tag => `<span class="repo-tag">${tag}</span>`).join('')}
      </div>

      <div class="repo-card-footer">
        <button class="copy-snippet-btn" style="background:var(--bg-tertiary); color:var(--text-muted);" onclick="copyTextToClipboard('${repo.url}')" title="Copy repository URL">
          Copy URL
        </button>
        <a href="${repo.url}" target="_blank" rel="noopener noreferrer" class="repo-link-action">
          <span>View on GitHub</span> ↗
        </a>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initFlowSimulator();
  initArchitectureInspector();
  initApiExplorer();
  initScrollSpy();
  initCopyHelpers();
  initGithubRepos();
  initProfileModal(); // <--- ADD THIS LINE
});

/* =========================================
   3. PROFILE PHOTO POPUP MODAL
   ========================================= */
function initProfileModal() {
  const trigger = document.getElementById('profilePhotoTrigger');
  const modal = document.getElementById('profileModal');
  const closeBtn = document.getElementById('profileModalClose');
  const viewResumeBtn = document.getElementById('modalViewResumeBtn');

  // Open modal when clicking the navbar avatar
  if (trigger && modal) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal when clicking the close button
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close modal when clicking outside the card
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Close modal when clicking "View Resume" button
  if (viewResumeBtn && modal) {
    viewResumeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

