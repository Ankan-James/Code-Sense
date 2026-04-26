/**
 * CodeSense v2 — Frontend Script
 * Handles file upload, API calls, segment rendering, chatbox, and page transitions.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const state = {
    file: null,
    personality: "",
    filename: "",
    code: "",
    segments: [],
    chatHistory: {},   // keyed by segment name: [ { role, content } ]
    explanations: {},  // keyed by segment name: explanation string
};


// ═══════════════════════════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

const dom = {
    // Views
    landingView:     $("landing-view"),
    workingView:     $("working-view"),

    // Nav
    navbar:          $("navbar"),
    navLinks:        $("nav-links"),
    navFilename:     $("nav-filename"),

    // Upload
    uploadBox:       $("upload-box"),
    uploadIcon:      $("upload-icon"),
    uploadText:      $("upload-text"),
    uploadSuccess:   $("upload-success"),
    fileInput:       $("file-input"),
    successFilename: $("success-filename"),
    successFilesize: $("success-filesize"),
    personalityInput:$("personality-input"),
    analyzeBtn:      $("analyze-btn"),
    analyzeBtnText:  $("analyze-btn-text"),
    analyzeLoader:   $("analyze-loader"),
    errorMessage:    $("error-message"),

    // Working
    topbarFilename:  $("topbar-filename"),
    codeDisplay:     $("code-display"),
    panelLanguage:   $("panel-language"),
    panelCount:      $("panel-count"),
    segmentsList:    $("segments-list"),
    backBtn:         $("back-btn"),

    // Download
    downloadBtn:     $("download-btn"),
    dropdownMenu:    $("dropdown-menu"),
    downloadPdf:     $("download-pdf"),
    downloadDocx:    $("download-docx"),

    // Chatbox
    chatbox:         $("chatbox"),
    chatboxTitle:    $("chatbox-segment-name"),
    chatboxBody:     $("chatbox-body"),
    chatInput:       $("chat-input"),
    chatSendBtn:     $("chat-send-btn"),
    chatboxClose:    $("chatbox-close"),
};


// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getLanguageFromFilename(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const langMap = {
        py: "python", js: "javascript", ts: "typescript",
        html: "html", css: "css", java: "java",
        cpp: "cpp", c: "c", cs: "csharp",
        php: "php", rb: "ruby", go: "go",
        rs: "rust", swift: "swift"
    };
    return langMap[ext] || ext;
}

function showError(msg) {
    dom.errorMessage.textContent = msg;
    dom.errorMessage.style.display = "block";
    setTimeout(() => {
        dom.errorMessage.style.display = "none";
    }, 5000);
}

function renderMarkdown(text) {
    // Use marked.js to render markdown
    if (typeof marked !== "undefined") {
        return marked.parse(text);
    }
    // Fallback: basic escaping
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

function updateAnalyzeButton() {
    const hasFile = state.file !== null;
    const hasPersonality = dom.personalityInput.value.trim().length > 0;
    dom.analyzeBtn.disabled = !(hasFile && hasPersonality);
}


// ═══════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

function handleFile(file) {
    if (!file) return;

    // Validate extension
    const validExtensions = [
        "py", "js", "ts", "html", "css", "java",
        "cpp", "c", "cs", "php", "rb", "go", "rs", "swift"
    ];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
        showError("Unsupported file type. Please upload a programming file.");
        return;
    }

    state.file = file;
    state.filename = file.name;

    // Update UI
    dom.uploadText.style.display = "none";
    dom.uploadIcon.style.display = "none";
    dom.uploadSuccess.style.display = "flex";
    dom.successFilename.textContent = file.name;
    dom.successFilesize.textContent = formatFileSize(file.size);
    dom.uploadBox.classList.add("file-loaded");

    updateAnalyzeButton();
}

// Click to upload
dom.uploadBox.addEventListener("click", () => {
    dom.fileInput.click();
});

dom.fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files[0]);
});

// Drag and drop
dom.uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    dom.uploadBox.classList.add("dragover");
});

dom.uploadBox.addEventListener("dragleave", () => {
    dom.uploadBox.classList.remove("dragover");
});

dom.uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    dom.uploadBox.classList.remove("dragover");
    handleFile(e.dataTransfer.files[0]);
});

// Personality input
dom.personalityInput.addEventListener("input", () => {
    state.personality = dom.personalityInput.value.trim();
    updateAnalyzeButton();
});


// ═══════════════════════════════════════════════════════════════════════════════
// ANALYZE CODE (API CALL)
// ═══════════════════════════════════════════════════════════════════════════════

dom.analyzeBtn.addEventListener("click", async () => {
    if (!state.file || !state.personality) return;

    // Show loading state
    dom.analyzeBtnText.style.display = "none";
    dom.analyzeLoader.style.display = "flex";
    dom.analyzeBtn.disabled = true;
    dom.errorMessage.style.display = "none";

    try {
        const formData = new FormData();
        formData.append("file", state.file);
        formData.append("personality", state.personality);

        const response = await fetch("/analyze", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed");
        }

        // Save results
        state.segments = data.segments;
        state.code = data.code;
        state.filename = data.filename;
        state.chatHistory = {};
        state.explanations = {};

        // Switch to working view
        showWorkingView();

    } catch (error) {
        showError(error.message || "Something went wrong. Please try again.");
    } finally {
        // Reset button
        dom.analyzeBtnText.style.display = "inline";
        dom.analyzeLoader.style.display = "none";
        dom.analyzeBtn.disabled = false;
        updateAnalyzeButton();
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// WORKING VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function showWorkingView() {
    // Hide landing, show working
    dom.landingView.style.display = "none";
    dom.workingView.style.display = "flex";

    // Hide nav links, show filename
    dom.navLinks.style.display = "none";
    dom.navFilename.textContent = state.filename;
    dom.navFilename.classList.add("visible");

    // Set topbar filename
    dom.topbarFilename.textContent = state.filename;

    // Set language badge
    const lang = getLanguageFromFilename(state.filename);
    dom.panelLanguage.textContent = lang.toUpperCase();

    // Render code with syntax highlighting
    dom.codeDisplay.textContent = state.code;
    dom.codeDisplay.className = `hljs language-${lang}`;
    hljs.highlightElement(dom.codeDisplay);

    // Render segments
    renderSegments();

    // Scroll to top
    window.scrollTo(0, 0);
}

function showLandingView() {
    dom.workingView.style.display = "none";
    dom.landingView.style.display = "block";
    dom.navLinks.style.display = "flex";
    dom.navFilename.classList.remove("visible");
    window.scrollTo(0, 0);
}

// Back button
dom.backBtn.addEventListener("click", showLandingView);


// ═══════════════════════════════════════════════════════════════════════════════
// RENDER SEGMENTS (Recursive Tree)
// ═══════════════════════════════════════════════════════════════════════════════

// Flat list of all segments (parents + children) for chatbox indexing
let allSegments = [];

function countSegments(segments) {
    let count = 0;
    for (const seg of segments) {
        count++;
        if (seg.children && seg.children.length > 0) {
            count += countSegments(seg.children);
        }
    }
    return count;
}

function renderSegments() {
    dom.segmentsList.innerHTML = "";
    allSegments = [];

    // Build flat index of all segments (recursive)
    function flattenSegments(segments) {
        for (const seg of segments) {
            allSegments.push(seg);
            if (seg.children && seg.children.length > 0) {
                flattenSegments(seg.children);
            }
        }
    }
    flattenSegments(state.segments);

    const totalCount = countSegments(state.segments);
    dom.panelCount.textContent = `${totalCount} segments`;

    // Render top-level segments
    state.segments.forEach((segment) => {
        const el = renderSegmentCard(segment, 0);
        dom.segmentsList.appendChild(el);
    });
}

function renderSegmentCard(segment, depth) {
    const flatIndex = allSegments.indexOf(segment);
    const hasChildren = segment.children && segment.children.length > 0;

    const wrapper = document.createElement("div");
    wrapper.className = "segment-wrapper";

    // --- Card ---
    const card = document.createElement("div");
    card.className = `segment-card depth-${Math.min(depth, 3)}`;
    if (depth > 0) card.classList.add("is-child");

    let toggleHTML = "";
    if (hasChildren) {
        toggleHTML = `
            <button class="segment-toggle" title="Expand children">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        `;
    }

    card.innerHTML = `
        <div class="segment-left">
            ${toggleHTML}
            <div class="segment-info">
                <span class="segment-type">${segment.type}</span>
                <span class="segment-name">${segment.name}</span>
            </div>
        </div>
        <button class="segment-info-btn" data-index="${flatIndex}" title="Learn about this segment">
            ℹ️
        </button>
    `;

    // Info button → open chatbox
    const infoBtn = card.querySelector(".segment-info-btn");
    infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openChatbox(flatIndex);
    });

    wrapper.appendChild(card);

    // --- Children container ---
    if (hasChildren) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "segment-children collapsed";

        segment.children.forEach((child) => {
            const childEl = renderSegmentCard(child, depth + 1);
            childrenContainer.appendChild(childEl);
        });

        wrapper.appendChild(childrenContainer);

        // Toggle expand/collapse
        const toggleBtn = card.querySelector(".segment-toggle");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isCollapsed = childrenContainer.classList.contains("collapsed");
                childrenContainer.classList.toggle("collapsed");
                toggleBtn.classList.toggle("expanded", isCollapsed);
            });
        }
    }

    return wrapper;
}


// ═══════════════════════════════════════════════════════════════════════════════
// CHATBOX
// ═══════════════════════════════════════════════════════════════════════════════

let currentSegmentIndex = -1;

function openChatbox(index) {
    currentSegmentIndex = index;
    const segment = allSegments[index];
    if (!segment) return;

    // Set title
    dom.chatboxTitle.textContent = segment.name;

    // Clear body
    dom.chatboxBody.innerHTML = "";

    // Restore previous conversation if exists
    const key = segment.name;
    if (state.chatHistory[key] && state.chatHistory[key].length > 0) {
        // Re-render all messages
        state.chatHistory[key].forEach((msg) => {
            appendMessage(msg.role === "user" ? "user" : "ai", msg.content);
        });
    } else {
        // Auto-generate first explanation
        state.chatHistory[key] = [];
        fetchExplanation(index);
    }

    // Show chatbox, hide segments list
    dom.segmentsList.style.display = "none";
    dom.chatbox.style.display = "flex";
    dom.chatInput.focus();
}

function closeChatbox() {
    dom.chatbox.style.display = "none";
    dom.segmentsList.style.display = "flex";
    currentSegmentIndex = -1;
}

// Close chatbox
dom.chatboxClose.addEventListener("click", closeChatbox);

// Escape key to close
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.chatbox.style.display === "flex") {
        closeChatbox();
    }
});

function appendMessage(type, content) {
    const msg = document.createElement("div");
    msg.className = `chat-message ${type}`;

    if (type === "ai") {
        msg.innerHTML = renderMarkdown(content);
    } else {
        msg.textContent = content;
    }

    dom.chatboxBody.appendChild(msg);
    dom.chatboxBody.scrollTop = dom.chatboxBody.scrollHeight;
}

function showLoadingMessage() {
    const msg = document.createElement("div");
    msg.className = "chat-message loading";
    msg.id = "loading-message";
    msg.innerHTML = `
        <div class="loading-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    dom.chatboxBody.appendChild(msg);
    dom.chatboxBody.scrollTop = dom.chatboxBody.scrollHeight;
}

function removeLoadingMessage() {
    const el = document.getElementById("loading-message");
    if (el) el.remove();
}


// ─── Fetch Initial Explanation ────────────────────────────────────────────

async function fetchExplanation(index) {
    const segment = allSegments[index];
    const key = segment.name;

    showLoadingMessage();

    try {
        const response = await fetch("/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                segment_code: segment.code,
                segment_name: segment.name,
                segment_type: segment.type,
                personality: state.personality,
            }),
        });

        const data = await response.json();
        removeLoadingMessage();

        if (!response.ok) throw new Error(data.error);

        const explanation = data.explanation;
        state.explanations[key] = explanation;

        // Save to chat history
        state.chatHistory[key].push({
            role: "assistant",
            content: explanation,
        });

        appendMessage("ai", explanation);

    } catch (error) {
        removeLoadingMessage();
        appendMessage("ai", "Sorry, I couldn't generate an explanation. Please try again.");
    }
}


// ─── Send Chat Message ────────────────────────────────────────────────────

async function sendChatMessage() {
    const message = dom.chatInput.value.trim();
    if (!message || currentSegmentIndex < 0) return;

    const segment = allSegments[currentSegmentIndex];
    const key = segment.name;

    // Show user message
    appendMessage("user", message);
    dom.chatInput.value = "";

    // Save to history
    state.chatHistory[key].push({ role: "user", content: message });

    showLoadingMessage();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                segment_code: segment.code,
                history: state.chatHistory[key],
                personality: state.personality,
            }),
        });

        const data = await response.json();
        removeLoadingMessage();

        if (!response.ok) throw new Error(data.error);

        const reply = data.reply;

        // Save to history
        state.chatHistory[key].push({ role: "assistant", content: reply });

        appendMessage("ai", reply);

    } catch (error) {
        removeLoadingMessage();
        appendMessage("ai", "Sorry, something went wrong. Please try again.");
    }
}

// Send button click
dom.chatSendBtn.addEventListener("click", sendChatMessage);

// Enter key to send
dom.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD REPORT
// ═══════════════════════════════════════════════════════════════════════════════

// Toggle dropdown
dom.downloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dom.dropdownMenu.classList.toggle("open");
});

// Close dropdown on outside click
document.addEventListener("click", () => {
    dom.dropdownMenu.classList.remove("open");
});

async function downloadReport(format) {
    dom.dropdownMenu.classList.remove("open");

    // Prepare segments with explanations
    const segmentsWithExplanations = state.segments.map((seg) => ({
        ...seg,
        explanation: state.explanations[seg.name] || "No explanation generated yet.",
    }));

    try {
        const response = await fetch("/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                segments: segmentsWithExplanations,
                personality: state.personality,
                filename: state.filename,
                format: format,
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Download failed");
        }

        // Create download link
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CodeSense_Report_${state.filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        alert("Failed to download report: " + error.message);
    }
}

dom.downloadPdf.addEventListener("click", () => downloadReport("pdf"));
dom.downloadDocx.addEventListener("click", () => downloadReport("docx"));


// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION — Scroll Spy & Smooth Scroll
// ═══════════════════════════════════════════════════════════════════════════════

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// Scroll spy — highlight active nav link
const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".nav-link");

function updateActiveLink() {
    let current = "";
    sections.forEach((section) => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
}

window.addEventListener("scroll", updateActiveLink);


// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

// Configure marked.js
if (typeof marked !== "undefined") {
    marked.setOptions({
        breaks: true,
        gfm: true,
    });
}

// Initial button state
updateAnalyzeButton();
