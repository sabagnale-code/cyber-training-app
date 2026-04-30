const questions = [
    {
        category: "Social Engineering",
        stage: "Stage 1",
        question: "You receive an urgent email asking for your password. What should you do?",
        options: [
            "Reply quickly with your password",
            "Ignore policy and click the link",
            "Report as phishing and verify with IT"
        ],
        correctAnswer: 2,
        reason: "Never share credentials by email. Report suspicious messages and verify through trusted channels."
    },
    {
        category: "Device Safety",
        stage: "Stage 1",
        question: "A USB drive is found in the office parking lot. Best action?",
        options: [
            "Plug it in to identify the owner",
            "Turn it in to IT/security without opening it",
            "Take it home and check later"
        ],
        correctAnswer: 1,
        reason: "Unknown removable media may contain malware. Security teams should handle and analyze it safely."
    },
    {
        category: "Password Security",
        stage: "Stage 2",
        question: "You must create a new account password. Which option is strongest?",
        options: [
            "Summer2026",
            "P@ssword123",
            "A long unique passphrase with symbols"
        ],
        correctAnswer: 2,
        reason: "Long, unique passphrases are harder to crack and safer than predictable or reused passwords."
    },
    {
        category: "Secure Data Handling",
        stage: "Stage 2",
        question: "You need to send customer records to a partner. What is the safest method?",
        options: [
            "Send as plain email attachment",
            "Use approved encrypted transfer portal",
            "Upload to a public file-sharing link"
        ],
        correctAnswer: 1,
        reason: "Sensitive data should be shared only through approved encrypted channels with access control."
    },
    {
        category: "Physical Security",
        stage: "Stage 3",
        question: "Someone without a badge asks you to hold the secure door open. What should you do?",
        options: [
            "Let them in to be polite",
            "Ask them to sign in through proper access process",
            "Ignore and walk away"
        ],
        correctAnswer: 1,
        reason: "Prevent tailgating by enforcing badge and visitor procedures to protect controlled areas."
    }
];

let currentQuestion = 0;
let score = 0;
let streak = 0;
let lives = 3;
let timerId = null;
let timeLeft = 12;
let correctAnswers = 0;
let timeoutCount = 0;
let maxStreak = 0;
let runnerPosition = 22;
let badgePopupQueue = [];
let badgePopupActive = false;
let risk = 0;
let missionStarted = false;
let missionPaused = false;
let currentRole = "admin";
let cloudSaveTimer = null;
let canShowBadgeMaster = false;
let missionResults = [];

// Cloud sync toggle (for shared leaderboard across devices/users).
// 1) Set CLOUD_SYNC_ENABLED = true
// 2) Put your Firebase Realtime Database URL in CLOUD_DB_URL
const CLOUD_SYNC_ENABLED = false;
const CLOUD_DB_URL = "";
const playerName = "You";
const leaderboard = [
    { name: "BlueFalcon-17", score: 520 },
    { name: "CipherMango-04", score: 470 },
    { name: "NovaKey-88", score: 410 },
    { name: "ShadowByte-22", score: 360 },
    { name: "VectorPanda-61", score: 330 },
    { name: playerName, score: 0 }
];

const savedLeaderboard = localStorage.getItem("leaderboard");
if (savedLeaderboard) {
    leaderboard.splice(0, leaderboard.length, ...JSON.parse(savedLeaderboard));
}

const savedScore = localStorage.getItem("score");
if (savedScore) {
    score = parseInt(savedScore, 10);
}

const savedRisk = localStorage.getItem("risk");
if (savedRisk) {
    risk = parseInt(savedRisk, 10);
}

let username = localStorage.getItem("username");
if (!username) {
    username = prompt("Enter your name:") || "Operator";
    localStorage.setItem("username", username);
}

const AVATAR_PRESET_KEY = "userAvatarPreset";
const AVATAR_MODE_KEY = "userAvatarMode";
const AVATAR_CUSTOM_KEY = "userAvatarCustom";

const AVATAR_PRESETS = [
    { id: "1", label: "Sentinel Bot",  style: "bottts",    seed: "sentinel"  },
    { id: "2", label: "Cipher Bot",    style: "bottts",    seed: "cipher"    },
    { id: "3", label: "Analyst Bot",   style: "bottts",    seed: "analyst"   },
    { id: "4", label: "Amber Ops",     style: "bottts",    seed: "amber-ops" },
    { id: "5", label: "Stealth Slate", style: "identicon", seed: "stealth"   },
];

function dicebearUrl(style, seed, size) {
    const params = new URLSearchParams({ seed });
    if (size) params.set("size", String(size));
    return `https://api.dicebear.com/9.x/${style}/svg?${params}`;
}

function findAvatarPreset(id) {
    return AVATAR_PRESETS.find((p) => p.id === id) || AVATAR_PRESETS[0];
}

let userAvatarPreset = localStorage.getItem(AVATAR_PRESET_KEY) || "1";
let userAvatarMode = localStorage.getItem(AVATAR_MODE_KEY) || "preset";
let userAvatarCustomData = localStorage.getItem(AVATAR_CUSTOM_KEY) || "";
if (userAvatarMode === "custom" && !userAvatarCustomData) {
    userAvatarMode = "preset";
}

const sectionTitles = {
    dashboard: "Dashboard",
    courses: "Training courses",
    reports: "Reports",
    settings: "Settings"
};

const badges = [
    { id: "mission-complete", icon: "MC", title: "Mission Complete", description: "Finish all scenarios in one run.", tone: "blue", unlocked: false },
    { id: "perfect-guard", icon: "PG", title: "Perfect Guard", description: "Finish with full integrity (3/3).", tone: "green", unlocked: false },
    { id: "combo-hacker", icon: "CH", title: "Combo Hacker", description: "Reach a streak of 3 or more.", tone: "purple", unlocked: false },
    { id: "speed-sentinel", icon: "SS", title: "Speed Sentinel", description: "Complete with zero timeouts.", tone: "orange", unlocked: false },
    { id: "policy-pro", icon: "PP", title: "Policy Pro", description: "Get at least 4 answers correct.", tone: "slate", unlocked: false }
];

const savedBadges = localStorage.getItem("badges");
if (savedBadges) {
    const unlockedBadgeIds = JSON.parse(savedBadges);
    badges.forEach((badge) => {
        badge.unlocked = unlockedBadgeIds.includes(badge.id);
    });
}

const settingsInfo = {
    users: {
        title: "Users",
        summary: "Manage identity lifecycle and access risk from one place.",
        points: [
            "Enforce MFA enrollment and reset onboarding flags.",
            "Disable dormant accounts older than policy threshold.",
            "Review privileged roles with quarterly certification."
        ]
    },
    "user-groups": {
        title: "User Groups",
        summary: "Organize users by department and apply security controls at scale.",
        points: [
            "Map groups to least-privilege access templates.",
            "Auto-assign awareness courses by risk group.",
            "Audit inherited permissions before publishing changes."
        ]
    },
    curriculum: {
        title: "Curriculum",
        summary: "Build risk-based learning paths aligned to real attack vectors.",
        points: [
            "Prioritize phishing and credential theft modules first.",
            "Require completion of incident response basics for managers.",
            "Schedule refresher modules after policy updates."
        ]
    },
    coursework: {
        title: "Coursework",
        summary: "Track training quality, not just completion percentages.",
        points: [
            "Flag users with repeated unsafe choices in simulations.",
            "Compare pass rates by department and location.",
            "Export remediation lists for high-risk users."
        ]
    },
    "new-courses": {
        title: "New Courses",
        summary: "Publish new security scenarios with clear rollout controls.",
        points: [
            "Set launch windows and mandatory audience scope.",
            "Attach policy references and expected response behavior.",
            "Pilot modules with security champions before full release."
        ]
    },
    "account-settings": {
        title: "My Account Settings",
        summary: "Secure your admin account and notification preferences.",
        points: [
            "Use phishing-resistant MFA where available.",
            "Enable login alerts for new device or location.",
            "Rotate recovery methods and backup codes periodically."
        ]
    },
    "company-settings": {
        title: "Company Settings",
        summary: "Define organization-level defaults for security posture.",
        points: [
            "Set minimum password and session timeout policies.",
            "Require managers to approve high-risk exceptions.",
            "Standardize escalation contacts for incident handling."
        ]
    },
    broadcasts: {
        title: "Broadcasts",
        summary: "Send urgent notices with actionable security instructions.",
        points: [
            "Use templates for phishing, malware, and outage events.",
            "Include exact reporting channel and SLA expectations.",
            "Log delivery status for compliance evidence."
        ]
    },
    "reports-center": {
        title: "Reports",
        summary: "Generate decision-ready reports for leadership and compliance.",
        points: [
            "Create monthly risk trend and completion scorecards.",
            "Export incident simulation outcomes by team.",
            "Track policy acknowledgment and overdue training."
        ]
    },
    "incident-policies": {
        title: "Incident Policies",
        summary: "Maintain playbooks for consistent and fast response.",
        points: [
            "Define severity levels and mandatory escalation steps.",
            "Document evidence capture and chain-of-custody guidance.",
            "Review lessons learned after each simulation cycle."
        ]
    }
};

const settingsModulePages = {
    "user-groups": {
        title: "Settings > Learn IT > User Groups",
        summary: "Manage group-based access and training assignments.",
        actions: ["+ Add Group", "Sync Directory Groups", "Review Privileged Groups", "Export Group Matrix"],
        items: [
            { title: "Finance-Privileged", text: "12 users | MFA required | Last reviewed 14 days ago." },
            { title: "HR-DataHandlers", text: "9 users | Data handling module mandatory." },
            { title: "IT-Administrators", text: "6 users | Elevated role review pending." }
        ]
    },
    curriculum: {
        title: "Settings > Learn IT > Curriculum",
        summary: "Sequence security modules by role and risk exposure.",
        actions: ["+ New Path", "Reorder Modules", "Assign by Department", "Publish Changes"],
        items: [
            { title: "Default Employee Path", text: "Phishing Basics -> Password Safety -> Data Handling." },
            { title: "Manager Path", text: "Incident Escalation added before certification." },
            { title: "IT Path", text: "Endpoint Security and Privilege Abuse scenarios enabled." }
        ]
    },
    coursework: {
        title: "Settings > Learn IT > Coursework",
        summary: "Monitor training completion and risk reduction impact.",
        actions: ["Generate Report", "Filter by Department", "Export Non-Compliant Users", "Send Reminder Batch"],
        items: [
            { title: "Completion Status", text: "74% completed current cycle." },
            { title: "At-Risk Learners", text: "18 users failed two or more scenario checks." },
            { title: "Top Improvement", text: "Sales team phishing pass-rate improved by 23%." }
        ]
    },
    "new-courses": {
        title: "Settings > Learn IT > New Courses",
        summary: "Create and launch new security modules safely.",
        actions: ["+ Create Course", "Upload Scenarios", "Pilot with Security Team", "Schedule Launch"],
        items: [
            { title: "Ransomware First Response", text: "Draft | 8 scenarios | Awaiting legal review." },
            { title: "Deepfake Social Engineering", text: "Pilot stage | Assigned to 20 users." },
            { title: "Third-Party Risk Awareness", text: "Ready to publish next Monday." }
        ]
    },
    "account-settings": {
        title: "Settings > General > My Account Settings",
        summary: "Secure your own administrator profile and notifications.",
        actions: ["Update Profile", "Manage MFA", "Rotate Recovery Codes", "Configure Alerts"],
        items: [
            { title: "MFA Status", text: "Enabled with authenticator app and backup method." },
            { title: "Session Security", text: "Auto-logout after 20 minutes of inactivity." },
            { title: "Alert Routing", text: "Critical incident alerts via email and mobile push." }
        ]
    },
    "company-settings": {
        title: "Settings > General > Company Settings",
        summary: "Set organization-wide security defaults.",
        actions: ["Password Policy", "Session Timeout", "Risk Thresholds", "Save Configuration"],
        items: [
            { title: "Password Standard", text: "Minimum 14 characters with complexity enforcement." },
            { title: "Device Compliance", text: "Require endpoint protection for admin access." },
            { title: "Risk Escalation", text: "High-risk users require manager approval." }
        ]
    },
    broadcasts: {
        title: "Settings > Manage IT > Broadcasts",
        summary: "Create security notifications for all employees.",
        actions: ["+ New Broadcast", "Use Incident Template", "Preview Audience", "Send Test Message"],
        items: [
            { title: "Phishing Warning", text: "Scheduled for 3:00 PM to all staff." },
            { title: "Policy Reminder", text: "Password manager compliance notice pending approval." },
            { title: "Incident Drill", text: "Simulation briefing set for Friday morning." }
        ]
    },
    "reports-center": {
        title: "Settings > Manage IT > Reports",
        summary: "Generate leadership and compliance-ready output.",
        actions: ["Generate Monthly Risk Report", "Export CSV", "Share to Leadership", "Archive Snapshot"],
        items: [
            { title: "Risk Trend", text: "Medium-risk population decreased by 11% this quarter." },
            { title: "Training Effectiveness", text: "Average mission score increased from 220 to 287 XP." },
            { title: "Compliance Gap", text: "14 users overdue for annual policy acknowledgment." }
        ]
    },
    "incident-policies": {
        title: "Settings > Manage IT > Incident Policies",
        summary: "Define response playbooks and escalation controls.",
        actions: ["Edit Severity Matrix", "Update Escalation Tree", "Run Policy Audit", "Publish Playbook"],
        items: [
            { title: "Severity Definitions", text: "Critical incidents now require SOC + Legal alert in 15 minutes." },
            { title: "Containment Rules", text: "Auto-isolate endpoints after confirmed malware execution." },
            { title: "Post-Incident Review", text: "Mandatory 48-hour lessons-learned completion." }
        ]
    }
};

function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach((section) => {
        section.classList.toggle("hidden", section.id !== sectionId);
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.section === sectionId);
    });

    document.getElementById("page-title").textContent = sectionTitles[sectionId] || sectionTitles.dashboard;

    if (sectionId === "courses" && !missionStarted) {
        setCourseIdleState();
    } else if (sectionId === "courses" && missionPaused) {
        document.querySelectorAll(".option").forEach((button) => {
            button.disabled = true;
        });
    }
}

function setCourseIdleState() {
    stopTimer();
    document.getElementById("startCourseBtn").classList.remove("hidden");
    document.getElementById("question").textContent = "Press Start Training Mission to begin.";
    document.getElementById("dramatic").textContent = "";
    document.getElementById("explain").textContent = "";
    document.getElementById("timer").textContent = "12s";
    document.querySelectorAll(".option").forEach((button) => {
        button.disabled = true;
    });
}

function switchMode(mode) {
    currentRole = mode;
    applyRoleView();
    if (mode === "user") {
        showSection("dashboard");
    } else {
        showSection("dashboard");
    }
}

function applyRoleView() {
    const isUser = currentRole === "user";
    document.getElementById("nav-reports").classList.toggle("hidden", isUser);
    document.querySelector(".users-panel").classList.toggle("hidden", isUser);
    document.getElementById("adminDashboardContent").classList.toggle("hidden", isUser);
    document.getElementById("userDashboardContent").classList.toggle("hidden", !isUser);
    document.getElementById("learnItGroup").classList.toggle("hidden", isUser);
    document.querySelectorAll(".admin-setting").forEach((tile) => {
        tile.classList.toggle("hidden", isUser);
    });
    if (isUser) {
        applyUserAvatarUI();
    }
}

function renderSettingDetail(settingKey) {
    const info = settingsInfo[settingKey];
    if (!info) {
        return;
    }
    document.getElementById("setting-detail-title").textContent = info.title;
    document.getElementById("setting-detail-summary").textContent = info.summary;
    const list = document.getElementById("setting-detail-points");
    list.innerHTML = "";
    info.points.forEach((point) => {
        const item = document.createElement("li");
        item.textContent = point;
        list.appendChild(item);
    });
}

function toggleUsersManagement(showUsersPage) {
    document.getElementById("settings-overview").classList.toggle("hidden", showUsersPage);
    document.getElementById("users-management").classList.toggle("hidden", !showUsersPage);
    document.getElementById("generic-management").classList.add("hidden");
}

function openGenericSettingsPage(settingKey) {
    const page = settingsModulePages[settingKey];
    if (!page) {
        return;
    }
    document.getElementById("settings-overview").classList.add("hidden");
    document.getElementById("users-management").classList.add("hidden");
    document.getElementById("generic-management").classList.remove("hidden");

    document.getElementById("generic-title").textContent = page.title;
    document.getElementById("generic-summary").textContent = page.summary;

    const actionsWrap = document.getElementById("generic-actions");
    actionsWrap.innerHTML = "";
    page.actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.className = "settings-action-btn";
        btn.textContent = action;
        actionsWrap.appendChild(btn);
    });

    const contentWrap = document.getElementById("generic-content");
    contentWrap.innerHTML = "";
    page.items.forEach((item) => {
        const block = document.createElement("article");
        block.className = "generic-item";
        block.innerHTML = `<h4>${item.title}</h4><p>${item.text}</p>`;
        contentWrap.appendChild(block);
    });
}

function dramaticLine(correct, currentStreak) {
    if (correct && currentStreak >= 3) {
        return "TRIPLE DEFENSE STREAK! You are locking down the company.";
    }
    if (correct) {
        return "Threat neutralized. System integrity stabilized.";
    }
    return "Security breach risk rising! Regain control next round.";
}

function updateEscapeGame() {
    const clamped = Math.max(6, Math.min(94, runnerPosition));
    runnerPosition = clamped;
    document.getElementById("runner-token").style.left = `${runnerPosition}%`;

    const gap = runnerPosition - 12;
    const status = document.getElementById("escape-status");
    const courseCard = document.getElementById("courses");
    courseCard.classList.remove("burn-low", "burn-medium", "burn-high");

    if (gap <= 12) {
        status.textContent = "Critical danger. One mistake can cost the mission.";
        status.style.color = "#b91c1c";
        courseCard.classList.add("burn-high");
    } else if (gap <= 28) {
        status.textContent = "Stay sharp. You are creating distance.";
        status.style.color = "#92400e";
        courseCard.classList.add("burn-medium");
    } else {
        status.textContent = "Good buffer. Keep pressure and maintain distance.";
        status.style.color = "#166534";
        courseCard.classList.add("burn-low");
    }
}

function updateHud() {
    document.getElementById("score").textContent = `Score: ${score} XP`;
    document.getElementById("streak").textContent = `Streak: ${streak}`;
    document.getElementById("lives").textContent = `${lives}/3`;
    document.getElementById("threat-level").textContent = lives === 3 ? "LOW" : lives === 2 ? "MEDIUM" : "CRITICAL";
    document.getElementById("progress-bar").style.width = `${(currentQuestion / questions.length) * 100}%`;
    document.getElementById("missionProgress").textContent = `Mission Progress: ${Math.round((currentQuestion / questions.length) * 100)}%`;
    localStorage.setItem("score", score);
    localStorage.setItem("risk", risk);
    document.getElementById("userScoreLabel").textContent = `${score} XP`;
    document.getElementById("userCompletionLabel").textContent = `${Math.round((currentQuestion / questions.length) * 100)}%`;
    document.getElementById("userRiskLabel").textContent = risk >= 40 ? "High" : risk >= 20 ? "Medium" : "Low";
    document.getElementById("userBadgeCount").textContent = badges.filter((badge) => badge.unlocked).length;
    updateDashboardRiskVisuals();
    updateLeaderboard();
}

function updateLeaderboard() {
    const myEntry = leaderboard.find((entry) => entry.name === playerName);
    myEntry.score = score;
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";
    const userList = document.getElementById("user-leaderboard-list");
    if (userList) {
        userList.innerHTML = "";
    }

    leaderboard.forEach((entry, index) => {
        const row = document.createElement("li");
        row.className = `leaderboard-row${entry.name === playerName ? " you" : ""}`;
        row.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="points">${entry.score} XP</span>
        `;
        list.appendChild(row);
        if (userList) {
            userList.appendChild(row.cloneNode(true));
        }
    });

    if (CLOUD_SYNC_ENABLED) {
        scheduleCloudSave();
    }
}

function normalizeCloudLeaderboard(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .filter((item) => item && typeof item.name === "string" && typeof item.score === "number")
        .map((item) => ({ name: item.name, score: item.score }));
}

async function loadCloudLeaderboard() {
    if (!CLOUD_SYNC_ENABLED || !CLOUD_DB_URL) {
        return;
    }
    try {
        const response = await fetch(`${CLOUD_DB_URL}/leaderboard.json`);
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        const cloudEntries = normalizeCloudLeaderboard(data);
        if (cloudEntries.length > 0) {
            leaderboard.splice(0, leaderboard.length, ...cloudEntries);
            if (!leaderboard.find((entry) => entry.name === playerName)) {
                leaderboard.push({ name: playerName, score: score });
            }
            updateLeaderboard();
        }
    } catch (error) {
        // Keep local mode if cloud read fails.
    }
}

async function saveCloudLeaderboard() {
    if (!CLOUD_SYNC_ENABLED || !CLOUD_DB_URL) {
        return;
    }
    try {
        await fetch(`${CLOUD_DB_URL}/leaderboard.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leaderboard)
        });
    } catch (error) {
        // Keep app working even if cloud write fails.
    }
}

function scheduleCloudSave() {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
        saveCloudLeaderboard();
    }, 500);
}

function updateDashboardRiskVisuals() {
    const high = Math.min(40, Math.max(10, Math.round(risk / 2.5)));
    const med = Math.min(50, Math.max(20, Math.round(30 + risk / 4)));
    const low = Math.max(10, 100 - high - med);

    document.getElementById("risk-low-bar").style.width = `${low}%`;
    document.getElementById("risk-med-bar").style.width = `${med}%`;
    document.getElementById("risk-high-bar").style.width = `${high}%`;

    const highAlerts = Math.max(2, Math.round(risk / 12));
    const medAlerts = Math.max(5, Math.round(risk / 6));
    const lowAlerts = Math.max(8, 12 - Math.round(risk / 20));

    document.getElementById("alert-high-pill").textContent = `${highAlerts} High`;
    document.getElementById("alert-med-pill").textContent = `${medAlerts} Medium`;
    document.getElementById("alert-low-pill").textContent = `${lowAlerts} Low`;
}

function renderBadges() {
    const unlockedCount = badges.filter((badge) => badge.unlocked).length;
    const buildBadgesInto = (targetId) => {
        const grid = document.getElementById(targetId);
        if (!grid) {
            return;
        }
        grid.innerHTML = "";
        badges.forEach((badge) => {
            const card = document.createElement("div");
            card.className = `badge-card${badge.unlocked ? "" : " locked"}`;
            card.setAttribute("data-requirement", badge.description);
            card.innerHTML = `
                <span class="badge-title"><span class="badge-icon badge-${badge.tone}">${badge.icon}</span>${badge.title}</span>
                <span class="badge-note">${badge.unlocked ? "Unlocked" : badge.description}</span>
            `;
            grid.appendChild(card);
        });
    };

    document.getElementById("badge-count").textContent = `${unlockedCount} unlocked`;
    const userBadgeCount = document.getElementById("user-badge-count");
    if (userBadgeCount) {
        userBadgeCount.textContent = `${unlockedCount} unlocked`;
    }
    buildBadgesInto("badges-grid");
    buildBadgesInto("user-badges-grid");
    localStorage.setItem("badges", JSON.stringify(badges.filter((badge) => badge.unlocked).map((badge) => badge.id)));
}

function showBadgeMasterOverlay() {
    const overlay = document.getElementById("badge-master-overlay");
    overlay.classList.remove("hidden");
    overlay.classList.add("show");

    setTimeout(() => {
        overlay.classList.remove("show");
        overlay.classList.add("hidden");
    }, 3900);
}

function showBadgeUnlockPopup(badge) {
    const popup = document.getElementById("badge-unlock-popup");
    document.getElementById("badge-unlock-title").textContent = badge.title;
    document.getElementById("badge-unlock-text").textContent = badge.description;
    popup.classList.remove("hidden");
    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
        popup.classList.add("hidden");
        badgePopupActive = false;
        playNextBadgePopup();
    }, 2600);
}

function playNextBadgePopup() {
    if (badgePopupActive || badgePopupQueue.length === 0) {
        return;
    }
    badgePopupActive = true;
    const nextBadge = badgePopupQueue.shift();
    showBadgeUnlockPopup(nextBadge);
}

const cyberLessons = {
    "Social Engineering": {
        lesson: "Attackers manipulate people through urgency, authority, or fear to extract info or access — the easiest way around any security system is to ask the human nicely (or scarily).",
        daily: "Pause before you act on urgent emails, calls, or messages. If something feels rushed or unusual, verify it through a separate channel — call the person back on a known number before clicking, sharing, or paying.",
        fact: "Roughly 98% of cyberattacks involve some form of social engineering. The cheapest tool in an attacker's kit isn't malware — it's a convincing email."
    },
    "Device Safety": {
        lesson: "Unknown USB drives, public chargers, and unverified devices can install malware in seconds. Physical access often means full access.",
        daily: "Treat any USB you didn't buy yourself as suspicious — hand it to IT instead of plugging it in. Lock your screen even for short coffee breaks, and use your own charger or a USB data blocker in public.",
        fact: "In a famous study, researchers dropped 297 USB drives around a university campus — 48% were plugged in, often within minutes, no questions asked."
    },
    "Password Security": {
        lesson: "Strong, unique passphrases plus a password manager defeat the vast majority of account takeover attempts. Reuse is the real vulnerability.",
        daily: "Reusing one password across accounts means one breach unlocks them all. Use a password manager, turn on multi-factor authentication everywhere it's offered, and never share codes — not even with 'IT'.",
        fact: "\"123456\" and \"password\" still top global breach lists every single year — and password-cracking tools always try those first. A 12-character random passphrase, by contrast, would take centuries to crack."
    },
    "Secure Data Handling": {
        lesson: "Sensitive data needs to be encrypted in transit and at rest, and shared only through approved channels with the right people.",
        daily: "Don't email customer data to personal accounts or paste it into random chatbots. Use approved cloud links with expiry, double-check the recipient list before hitting Send, and shred (don't bin) printed sensitive docs.",
        fact: "A single misconfigured cloud storage bucket exposed 533 million Facebook user records in 2021 — no hacking required, the data was simply left publicly readable."
    },
    "Physical Security": {
        lesson: "Tailgating, badge cloning, shoulder surfing, and unattended laptops bypass every digital control you have. The perimeter is wherever a person is.",
        daily: "Don't hold the door for unbadged strangers — politely ask them to use reception. Lock your laptop when you step away (Win+L), and use a privacy screen on trains, planes, and cafes.",
        fact: "Penetration testers report a >90% success rate getting into 'secure' offices just by carrying coffee, a laptop, and looking like they belong there."
    }
};

const generalCyberFact = "The first computer worm — the Morris Worm in 1988 — infected an estimated 10% of the entire internet at the time… which was about 6,000 machines. Today, that's a fraction of one office building.";

function buildLearningPopupContent(success) {
    const mistakes = missionResults.filter((r) => !r.correct);
    const strengths = missionResults.filter((r) => r.correct);
    const categoriesMissed = [...new Set(mistakes.map((r) => r.category))];
    const categoriesMastered = [...new Set(strengths.map((r) => r.category))];

    const focusCategory = categoriesMissed[0] || categoriesMastered[0] || "Social Engineering";
    const lesson = cyberLessons[focusCategory] || cyberLessons["Social Engineering"];

    const takeawayList = document.getElementById("learning-popup-takeaways");
    if (takeawayList) {
        takeawayList.innerHTML = "";
        const lines = [];
        lines.push(success
            ? "You completed the mission and practiced making safe calls under pressure."
            : "You ran the mission and saw exactly where attackers gain ground when defenders hesitate.");
        if (categoriesMastered.length) {
            lines.push(`Strong areas today: ${categoriesMastered.join(", ")}.`);
        }
        if (categoriesMissed.length) {
            lines.push(`Worth reviewing: ${categoriesMissed.join(", ")}.`);
        }
        lines.push(`Today's focus — ${focusCategory}: ${lesson.lesson}`);
        lines.forEach((line) => {
            const li = document.createElement("li");
            li.textContent = line;
            takeawayList.appendChild(li);
        });
    }

    const dailyEl = document.getElementById("learning-popup-daily");
    if (dailyEl) {
        dailyEl.textContent = lesson.daily;
    }

    const factEl = document.getElementById("learning-popup-fact");
    if (factEl) {
        const useGeneral = !categoriesMissed.length && !categoriesMastered.length;
        factEl.textContent = useGeneral ? generalCyberFact : lesson.fact;
    }
}

function showLearningPopup(success) {
    buildLearningPopupContent(success);
    const popup = document.getElementById("learning-popup");
    if (!popup) {
        return;
    }
    popup.classList.remove("hidden");
    requestAnimationFrame(() => popup.classList.add("show"));
    popup.setAttribute("aria-hidden", "false");
    const cta = document.getElementById("learningPopupCta");
    if (cta) {
        cta.focus();
    }
}

function hideLearningPopup() {
    const popup = document.getElementById("learning-popup");
    if (!popup) {
        return;
    }
    popup.classList.remove("show");
    popup.classList.add("hidden");
    popup.setAttribute("aria-hidden", "true");
}

function initLearningPopup() {
    const close = document.getElementById("learningPopupClose");
    const cta = document.getElementById("learningPopupCta");
    const backdrop = document.getElementById("learningPopupBackdrop");
    if (close) close.addEventListener("click", hideLearningPopup);
    if (cta) cta.addEventListener("click", hideLearningPopup);
    if (backdrop) backdrop.addEventListener("click", hideLearningPopup);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const popup = document.getElementById("learning-popup");
            if (popup && popup.classList.contains("show")) {
                hideLearningPopup();
            }
        }
    });
}

function showFailureOverlay() {
    const overlay = document.getElementById("failure-overlay");
    overlay.classList.remove("hidden");
    overlay.classList.add("show");

    setTimeout(() => {
        overlay.classList.remove("show");
        overlay.classList.add("hidden");
    }, 3700);
}

function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function unlockBadge(id) {
    const badge = badges.find((item) => item.id === id);
    if (badge && !badge.unlocked) {
        badge.unlocked = true;
        badgePopupQueue.push(badge);
        return true;
    }
    return false;
}

function evaluateBadges(success) {
    if (success) {
        unlockBadge("mission-complete");
    }
    if (success && lives === 3) {
        unlockBadge("perfect-guard");
    }
    if (maxStreak >= 3) {
        unlockBadge("combo-hacker");
    }
    if (success && timeoutCount === 0) {
        unlockBadge("speed-sentinel");
    }
    if (correctAnswers >= 4) {
        unlockBadge("policy-pro");
    }
    renderBadges();
    playNextBadgePopup();
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startTimer(reset = true) {
    stopTimer();
    if (reset) {
        timeLeft = 12;
    }
    const timer = document.getElementById("timer");
    timer.textContent = `${timeLeft}s`;

    timerId = setInterval(() => {
        timeLeft -= 1;
        timer.textContent = `${timeLeft}s`;
        if (timeLeft <= 4) {
            timer.style.color = "#dc2626";
        }
        if (timeLeft <= 0) {
            stopTimer();
            timer.style.color = "";
            resolveAnswer(-1, true);
        }
    }, 1000);
}

function loadQuestion() {
    const q = questions[currentQuestion];
    document.getElementById("question").textContent = q.question;
    document.getElementById("scenario-tag").textContent = q.category;
    document.getElementById("scenario-stage").textContent = `${q.stage} - ${currentQuestion + 1}/${questions.length}`;

    const buttons = document.querySelectorAll(".option");
    buttons.forEach((button, index) => {
        button.textContent = q.options[index];
        button.disabled = false;
    });

    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "";
    document.getElementById("dramatic").textContent = "";
    document.getElementById("explain").textContent = "";
    document.getElementById("timer").style.color = "";
    missionPaused = false;
    updateTrainingButtonLabels();
    updateHud();
    updateEscapeGame();
    startTimer(true);
}

function renderLearningSummary(success) {
    const summaryBox = document.getElementById("learning-summary");
    const summaryList = document.getElementById("learning-list");
    if (!summaryBox || !summaryList) {
        return;
    }

    summaryList.innerHTML = "";
    const mistakes = missionResults.filter((result) => !result.correct);
    const strengths = missionResults.filter((result) => result.correct);
    const categoriesMissed = [...new Set(mistakes.map((result) => result.category))];
    const categoriesMastered = [...new Set(strengths.map((result) => result.category))];
    const dailyTipsByCategory = {
        "Social Engineering": "Pause before you click: verify urgent requests in Teams/Slack or by phone before sharing anything.",
        "Device Safety": "Do not plug in unknown USB devices. Hand them to IT/security so they can inspect safely.",
        "Password Security": "Use a password manager and unique passphrases so one breach cannot unlock multiple accounts.",
        "Secure Data Handling": "Share sensitive files only through approved encrypted tools, never open public links.",
        "Physical Security": "Do not tailgate people into secure areas. Ask for badge check or send them to reception."
    };

    const lines = [];
    lines.push(
        success
            ? "You completed the mission and practiced decision-making under pressure."
            : "You practiced real incident choices and saw where attackers can gain ground."
    );
    lines.push("Daily habit: if something feels urgent, unusual, or secretive, verify it before you act.");
    if (categoriesMastered.length) {
        lines.push(`Strong areas: ${categoriesMastered.join(", ")}.`);
    }
    if (categoriesMissed.length) {
        lines.push(`Review next: ${categoriesMissed.join(", ")}.`);
    }
    categoriesMissed.slice(0, 2).forEach((category) => {
        if (dailyTipsByCategory[category]) {
            lines.push(`Everyday tip (${category}): ${dailyTipsByCategory[category]}`);
        }
    });
    mistakes.slice(0, 2).forEach((result) => {
        lines.push(`${result.category}: ${result.reason}`);
    });
    if (timeoutCount > 0) {
        lines.push("Speed matters too: quick, safe responses prevent avoidable security gaps.");
    }
    lines.push("Current threat watch: AI-assisted phishing and fake login pages are common, so always verify sender, URL, and context.");

    lines.forEach((line) => {
        const item = document.createElement("li");
        item.textContent = line;
        summaryList.appendChild(item);
    });

    summaryBox.classList.remove("hidden");
}

function finishMission(success) {
    stopTimer();
    const feedback = document.getElementById("feedback");
    const dramatic = document.getElementById("dramatic");
    const explain = document.getElementById("explain");
    const options = document.getElementById("course-options");
    const restart = document.getElementById("restart-btn");
    const progress = document.getElementById("progress-bar");

    progress.style.width = "100%";
    options.innerHTML = "";

    let learningPopupDelay = 2200;
    if (success) {
        const rank = score >= 340 ? "Elite Defender" : score >= 220 ? "Security Analyst" : "Rookie Responder";
        document.getElementById("question").textContent = "Mission Accomplished";
        feedback.textContent = `Final score: ${score} XP - Rank: ${rank}`;
        feedback.className = "correct";
        dramatic.textContent = "All attack waves contained. Organization secured.";
        explain.textContent = "Great work. You completed structured scenario progression across key cyber risk areas.";
        document.getElementById("escape-status").textContent = "You escaped the threat zone. Mission secured.";
        document.getElementById("escape-status").style.color = "#166534";
        document.getElementById("courses").classList.remove("burn-low", "burn-medium", "burn-high");

        const perfectTimelyRun = correctAnswers === questions.length && timeoutCount === 0 && lives === 3;
        if (perfectTimelyRun && canShowBadgeMaster) {
            showBadgeMasterOverlay();
            learningPopupDelay = 4100;
        }
    } else {
        document.getElementById("question").textContent = "Mission Failed";
        feedback.textContent = `Systems compromised at ${score} XP.`;
        feedback.className = "incorrect";
        dramatic.textContent = "Too many security breaks. Relaunch and defend better.";
        explain.textContent = "Review each scenario rationale to reinforce safe responses in real incidents.";
        document.getElementById("escape-status").textContent = "Threat caught up. Retrain and relaunch.";
        document.getElementById("escape-status").style.color = "#b91c1c";
        document.getElementById("courses").classList.add("burn-high");
        showFailureOverlay();
        learningPopupDelay = 3900;
    }

    restart.classList.remove("hidden");
    renderLearningSummary(success);
    evaluateBadges(success);
    updateHud();
    missionStarted = false;
    missionPaused = false;
    canShowBadgeMaster = false;
    updateTrainingButtonLabels();

    setTimeout(() => {
        showSection("dashboard");
        showToast();
    }, 2000);

    setTimeout(() => {
        showLearningPopup(success);
    }, learningPopupDelay);
}

function resolveAnswer(selected, isTimeout) {
    const q = questions[currentQuestion];
    const feedback = document.getElementById("feedback");
    const buttons = document.querySelectorAll(".option");
    const dramatic = document.getElementById("dramatic");
    const explain = document.getElementById("explain");
    const card = document.querySelector("#courses");
    const timer = document.getElementById("timer");

    stopTimer();
    timer.style.color = "";

    buttons.forEach((button) => {
        button.disabled = true;
    });

    const wasCorrect = !isTimeout && selected === q.correctAnswer;
    missionResults.push({
        category: q.category,
        correct: wasCorrect,
        reason: q.reason
    });

    if (wasCorrect) {
        correctAnswers++;
        streak++;
        maxStreak = Math.max(maxStreak, streak);
        runnerPosition += 14;
        risk = Math.max(0, risk - 3);
        score += 100 + streak * 20;
        feedback.textContent = `Correct. +${100 + streak * 20} XP`;
        feedback.className = "correct";
        dramatic.textContent = dramaticLine(true, streak);
        explain.textContent = q.reason;
        card.classList.remove("pulse-bad");
        card.classList.add("pulse-good");
    } else {
        if (isTimeout) {
            timeoutCount++;
        }
        streak = 0;
        lives--;
        runnerPosition -= 10;
        risk += 10;
        feedback.textContent = isTimeout ? "Too slow. Response timeout." : "Not quite. 0 XP this round.";
        feedback.className = "incorrect";
        dramatic.textContent = isTimeout ? "Timeout breach! Attackers gained ground." : dramaticLine(false, streak);
        explain.textContent = q.reason;
        card.classList.remove("pulse-good");
        card.classList.add("pulse-bad");
        card.classList.add("screen-shake");
    }

    updateHud();
    updateEscapeGame();

    setTimeout(() => {
        card.classList.remove("pulse-good", "pulse-bad", "screen-shake");
        currentQuestion++;

        if (lives <= 0) {
            finishMission(false);
        } else if (currentQuestion < questions.length) {
            loadQuestion();
        } else {
            finishMission(true);
        }
    }, 950);
}

function answer(selected) {
    resolveAnswer(selected, false);
}

function restartGame() {
    stopTimer();
    currentQuestion = 0;
    score = 0;
    streak = 0;
    lives = 3;
    correctAnswers = 0;
    timeoutCount = 0;
    maxStreak = 0;
    runnerPosition = 22;
    risk = 0;
    missionStarted = true;
    missionPaused = false;
    canShowBadgeMaster = true;
    missionResults = [];
    const myEntry = leaderboard.find((entry) => entry.name === playerName);
    myEntry.score = 0;
    document.getElementById("course-options").innerHTML = `
        <button class="option" onclick="answer(0)"></button>
        <button class="option" onclick="answer(1)"></button>
        <button class="option" onclick="answer(2)"></button>
    `;
    document.getElementById("restart-btn").classList.add("hidden");
    document.getElementById("learning-summary").classList.add("hidden");
    document.getElementById("learning-list").innerHTML = "";
    updateTrainingButtonLabels();
    loadQuestion();
}

function startTrainingMission() {
    showSection("courses");
    restartGame();
}

function updateTrainingButtonLabels() {
    const label = !missionStarted ? "Start Training Mission" : missionPaused ? "Resume Training Mission" : "Pause Training Mission";
    document.getElementById("startTrainingBtn").textContent = label;
    document.getElementById("startCourseBtn").textContent = label;
    const userBtn = document.getElementById("userStartTrainingBtn");
    if (userBtn) {
        userBtn.textContent = label;
    }
}

function toggleTrainingState() {
    if (!missionStarted) {
        startTrainingMission();
        return;
    }

    if (missionPaused) {
        missionPaused = false;
        document.querySelectorAll(".option").forEach((button) => {
            button.disabled = false;
        });
        startTimer(false);
    } else {
        missionPaused = true;
        stopTimer();
        document.querySelectorAll(".option").forEach((button) => {
            button.disabled = true;
        });
        document.getElementById("timer").textContent = "Paused";
    }
    updateTrainingButtonLabels();
}

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

document.querySelectorAll(".setting-action").forEach((tile) => {
    tile.addEventListener("click", () => {
        document.querySelectorAll(".setting-action").forEach((node) => node.classList.remove("active"));
        tile.classList.add("active");
        if (tile.dataset.setting === "users") {
            toggleUsersManagement(true);
        } else {
            openGenericSettingsPage(tile.dataset.setting);
        }
    });
});

document.getElementById("users-back-btn").addEventListener("click", () => {
    toggleUsersManagement(false);
});

document.getElementById("generic-back-btn").addEventListener("click", () => {
    toggleUsersManagement(false);
});

document.getElementById("logout-btn").addEventListener("click", () => {
    const shouldLogout = window.confirm("Do you want to securely end this training session?");
    if (shouldLogout) {
        alert("You have been logged out.");
        window.location.reload();
    }
});

document.getElementById("startTrainingBtn").addEventListener("click", () => {
    toggleTrainingState();
});

document.getElementById("startCourseBtn").addEventListener("click", () => {
    toggleTrainingState();
});

document.getElementById("userStartTrainingBtn").addEventListener("click", () => {
    toggleTrainingState();
});

function applyUserAvatarUI() {
    const display = document.getElementById("userAvatarDisplay");
    const photo = document.getElementById("userAvatarPhoto");
    const scene = document.getElementById("userAvatarPresetScene");
    const presetImg = document.getElementById("userAvatarPresetImg");
    const clearBtn = document.getElementById("userAvatarClearPhoto");
    if (!display || !photo || !scene) {
        return;
    }

    const preset = findAvatarPreset(userAvatarPreset);
    if (presetImg) {
        presetImg.src = dicebearUrl(preset.style, preset.seed);
        presetImg.alt = `${preset.label} avatar`;
    }

    const usingPhoto = userAvatarMode === "custom" && userAvatarCustomData;
    display.classList.toggle("has-custom-photo", !!usingPhoto);

    if (usingPhoto) {
        photo.src = userAvatarCustomData;
        photo.classList.remove("hidden");
        photo.alt = `${username} profile photo`;
        scene.classList.add("hidden");
        if (clearBtn) {
            clearBtn.classList.remove("hidden");
        }
    } else {
        photo.removeAttribute("src");
        photo.classList.add("hidden");
        photo.alt = "";
        scene.classList.remove("hidden");
        if (clearBtn) {
            clearBtn.classList.add("hidden");
        }
    }

    document.querySelectorAll(".avatar-preset-btn").forEach((btn) => {
        const id = btn.dataset.preset;
        const on = userAvatarMode !== "custom" && id === userAvatarPreset;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
}

function persistUserAvatar() {
    try {
        localStorage.setItem(AVATAR_PRESET_KEY, userAvatarPreset);
        localStorage.setItem(AVATAR_MODE_KEY, userAvatarMode);
        if (userAvatarCustomData) {
            localStorage.setItem(AVATAR_CUSTOM_KEY, userAvatarCustomData);
        } else {
            localStorage.removeItem(AVATAR_CUSTOM_KEY);
        }
    } catch {
        userAvatarCustomData = "";
        userAvatarMode = "preset";
        localStorage.removeItem(AVATAR_CUSTOM_KEY);
        alert("Not enough local storage for that image. Try a smaller file.");
    }
}

function setUserAvatarPreset(id) {
    userAvatarPreset = id;
    userAvatarMode = "preset";
    persistUserAvatar();
    applyUserAvatarUI();
}

function clearUserCustomAvatar() {
    userAvatarCustomData = "";
    userAvatarMode = "preset";
    localStorage.removeItem(AVATAR_CUSTOM_KEY);
    persistUserAvatar();
    applyUserAvatarUI();
    const fi = document.getElementById("userAvatarFileInput");
    if (fi) {
        fi.value = "";
    }
}

function resizeImageToDataUrl(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
            const maxDim = 220;
            let w = img.width;
            let h = img.height;
            const scale = Math.min(maxDim / w, maxDim / h, 1);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            try {
                callback(canvas.toDataURL("image/jpeg", 0.85));
            } catch {
                callback(null);
            }
        };
        img.onerror = () => callback(null);
        img.src = dataUrl;
    };
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
}

function initUserAvatarControls() {
    const row = document.getElementById("userAvatarPresetRow");
    if (row) {
        row.innerHTML = AVATAR_PRESETS.map((p) => `
            <button type="button" class="avatar-preset-btn" data-preset="${p.id}"
                    aria-pressed="false" aria-label="Preset: ${p.label}" title="${p.label}">
                <img src="${dicebearUrl(p.style, p.seed, 48)}" alt="" />
            </button>`).join("");
        row.querySelectorAll(".avatar-preset-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                setUserAvatarPreset(btn.dataset.preset);
            });
        });
    }

    const fileInput = document.getElementById("userAvatarFileInput");
    if (fileInput) {
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                return;
            }
            if (!file.type.startsWith("image/")) {
                fileInput.value = "";
                return;
            }
            resizeImageToDataUrl(file, (dataUrl) => {
                if (!dataUrl) {
                    alert("Could not read that image. Try a JPG or PNG.");
                    fileInput.value = "";
                    return;
                }
                userAvatarCustomData = dataUrl;
                userAvatarMode = "custom";
                persistUserAvatar();
                applyUserAvatarUI();
                if (userAvatarMode !== "custom") {
                    fileInput.value = "";
                }
            });
        });
    }

    const clearBtn = document.getElementById("userAvatarClearPhoto");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearUserCustomAvatar);
    }
}

async function initializeApp() {
    document.getElementById("badge-master-overlay").classList.remove("show");
    document.getElementById("badge-master-overlay").classList.add("hidden");
    await loadCloudLeaderboard();
    setCourseIdleState();
    renderBadges();
    renderSettingDetail("users");
    toggleUsersManagement(false);
    updateDashboardRiskVisuals();
    document.getElementById("welcomeText").textContent = `Welcome, ${username}`;
    applyUserAvatarUI();
    applyRoleView();
    updateTrainingButtonLabels();
}

const THEME_KEY = "appTheme";

function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
        btn.textContent = theme === "dark" ? "Light" : "Dark";
        btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
}

function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch {}
    applyTheme(next);
}

function initThemeToggle() {
    applyTheme(getCurrentTheme());
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
        btn.addEventListener("click", toggleTheme);
    }
}

initThemeToggle();
initLearningPopup();
initializeApp();
initUserAvatarControls();