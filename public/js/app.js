// MCP Manager Frontend Application
const socket = io();

let selectedService = null;
let services = [];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupSocketListeners();
    setupEventListeners();
});

// Socket.io listeners
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('service:registered', (service) => {
        console.log('New service registered:', service);
        services.push(service);
        renderServices();
    });

    socket.on('service:status', (data) => {
        updateServiceStatus(data.serviceId, data.status);
    });

    socket.on('metrics:update', (data) => {
        updateMetrics(data);
    });
}

// Load services from API
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        services = await response.json();
        renderServices();
        updateMetrics();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Render service list
function renderServices() {
    const serviceList = document.getElementById('serviceList');
    serviceList.innerHTML = '';

    if (services.length === 0) {
        serviceList.innerHTML = '<li style="text-align: center; color: #64748b; padding: 20px;">Brak usług. Dodaj pierwszą usługę!</li>';
        return;
    }

    services.forEach(service => {
        const li = document.createElement('li');
        li.className = 'service-item';
        li.dataset.serviceId = service.id;

        const statusClass = 
            service.status === 'active' ? 'status-online' :
            service.status === 'pending' ? 'status-pending' :
            'status-offline';

        li.innerHTML = `
            <span class="service-status ${statusClass}"></span>
            <strong>${service.name}</strong>
            <div style="font-size: 0.85em; color: #64748b; margin-top: 5px;">
                ${service.endpoint} • ${service.type}
            </div>
        `;

        li.addEventListener('click', () => selectService(service));
        serviceList.appendChild(li);
    });
}

// Select service
function selectService(service) {
    selectedService = service;
    
    // Update UI
    document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    document.getElementById('contentTitle').textContent = `⚙️ Konfiguracja: ${service.name}`;
    
    // Load service config
    loadServiceConfig(service);
}

// Load service configuration
function loadServiceConfig(service) {
    const configContent = document.getElementById('configContent');
    configContent.innerHTML = `
        <div class="config-section">
            <h3>Podstawowe ustawienia</h3>
            <div class="form-group">
                <label>Nazwa serwera</label>
                <input type="text" class="form-control" value="${service.name}" id="serviceName" />
            </div>
            <div class="form-group">
                <label>Endpoint URL</label>
                <input type="text" class="form-control" value="${service.endpoint}" id="serviceEndpoint" />
            </div>
            <div class="form-group">
                <label>Typ</label>
                <select class="form-control" id="serviceType">
                    <option ${service.type === 'server' ? 'selected' : ''}>server</option>
                    <option ${service.type === 'client' ? 'selected' : ''}>client</option>
                </select>
            </div>
        </div>

        <div class="config-section">
            <h3>Zaawansowane parametry</h3>
            <div class="form-group">
                <label>Timeout (ms)</label>
                <input type="number" class="form-control" value="30000" id="serviceTimeout" />
            </div>
            <div class="form-group">
                <label>Max Connections</label>
                <input type="number" class="form-control" value="10" id="serviceMaxConn" />
            </div>
        </div>

        <div class="btn-group">
            <button class="btn btn-success" onclick="saveServiceConfig()">💾 Zapisz zmiany</button>
            <button class="btn btn-danger" onclick="restartService()">🔄 Restart serwera</button>
        </div>
    `;

    // Load prompts content
    const promptsContent = document.getElementById('promptsContent');
    promptsContent.innerHTML = `
        <div class="config-section">
            <h3>System Prompt</h3>
            <div class="form-group">
                <textarea class="form-control" rows="8" id="systemPrompt">You are a helpful AI assistant integrated with MCP (Model Context Protocol). You have access to various tools and services through the MCP interface. Always be precise and helpful in your responses.</textarea>
            </div>
            <button class="btn btn-primary" onclick="savePrompt()">Zapisz prompt</button>
        </div>
    `;

    // Load test content
    const testContent = document.getElementById('testContent');
    testContent.innerHTML = `
        <div class="config-section">
            <h3>Test połączenia</h3>
            <div class="form-group">
                <label>Test Query</label>
                <input type="text" class="form-control" placeholder="Wpisz zapytanie testowe..." value="Hello, are you working?" id="testQuery" />
            </div>
            <button class="btn btn-primary" onclick="runTest()">🧪 Uruchom test</button>
            <div id="testResults" style="margin-top: 20px;"></div>
        </div>
    `;

    // Load logs
    loadServiceLogs(service.id);
}

// Load service logs
async function loadServiceLogs(serviceId) {
    const logsContent = document.getElementById('logsContent');
    logsContent.innerHTML = `
        <div class="config-section">
            <h3>Logi systemu</h3>
            <div style="max-height: 400px; overflow-y: auto; background: var(--light); padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.9em;">
                <div class="log-line log-info">[INFO] Service initialized: ${serviceId}</div>
                <div class="log-line log-info">[INFO] Health check passed</div>
                <div class="log-line log-info">[INFO] Ready to accept connections</div>
            </div>
            <button class="btn btn-primary" style="margin-top: 15px;" onclick="clearLogs()">Wyczyść logi</button>
        </div>
    `;
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    event.target.classList.add('active');

    // Special handling for network tab
    if (tabName === 'network') {
        renderNetworkMap();
    }
}

// Render network map
function renderNetworkMap() {
    const networkMap = document.getElementById('networkMap');
    networkMap.innerHTML = '';

    // Create connections (lines)
    const connections = [
        { from: { x: 80, y: 80 }, to: { x: 230, y: 230 }, length: 150, rotation: 45 },
        { from: { x: 80, y: 80 }, to: { x: 230, y: 20 }, length: 150, rotation: -20 },
        { from: { x: 250, y: 80 }, to: { x: 230, y: 230 }, length: 150, rotation: 100 }
    ];

    connections.forEach(conn => {
        const line = document.createElement('div');
        line.className = 'connection';
        line.style.width = conn.length + 'px';
        line.style.left = conn.from.x + 'px';
        line.style.top = conn.from.y + 'px';
        line.style.transform = `rotate(${conn.rotation}deg)`;
        networkMap.appendChild(line);
    });

    // Create nodes
    const nodes = [
        { x: 50, y: 50, label: 'MCP', color: '#667eea' },
        { x: 200, y: 200, label: 'File', color: '#764ba2' },
        { x: 200, y: 20, label: 'LLM', color: '#667eea' },
        { x: 80, y: 200, label: 'Web', color: '#764ba2' }
    ];

    nodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node';
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';
        div.textContent = node.label;
        div.title = `${node.label} Server`;
        networkMap.appendChild(div);
    });
}

// Update metrics
function updateMetrics(data) {
    const serverCount = services.filter(s => s.type === 'server').length;
    const clientCount = services.filter(s => s.type === 'client').length;
    const connectionCount = services.filter(s => s.status === 'active').length;

    document.getElementById('serverCount').textContent = serverCount;
    document.getElementById('clientCount').textContent = clientCount;
    document.getElementById('connectionCount').textContent = connectionCount;
}

// Update service status
function updateServiceStatus(serviceId, status) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        service.status = status;
        renderServices();
        updateMetrics();
    }
}

// Chat functions
function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (input.value.trim() === '') return;
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.innerHTML = `<div class="message-bubble">${input.value}</div>`;
    messages.appendChild(userMessage);
    
    const userQuery = input.value;
    input.value = '';
    
    // Send to AI assistant
    fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, context: selectedService })
    })
    .then(res => res.json())
    .then(data => {
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message ai';
        aiMessage.innerHTML = `<div class="message-bubble">${data.response}</div>`;
        messages.appendChild(aiMessage);
        messages.scrollTop = messages.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message ai';
        aiMessage.innerHTML = `<div class="message-bubble">Przepraszam, wystąpił błąd. Spróbuj ponownie.</div>`;
        messages.appendChild(aiMessage);
        messages.scrollTop = messages.scrollHeight;
    });
    
    messages.scrollTop = messages.scrollHeight;
}

// Setup event listeners
function setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

// Action functions
async function saveServiceConfig() {
    if (!selectedService) return;

    const config = {
        name: document.getElementById('serviceName').value,
        endpoint: document.getElementById('serviceEndpoint').value,
        type: document.getElementById('serviceType').value
    };

    try {
        await fetch(`/api/services/${selectedService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        alert('Konfiguracja zapisana!');
        loadServices();
    } catch (error) {
        alert('Błąd zapisu: ' + error.message);
    }
}

async function restartService() {
    if (!selectedService) return;
    
    try {
        await fetch(`/api/services/${selectedService.id}/restart`, {
            method: 'POST'
        });
        alert('Serwis został zrestartowany!');
    } catch (error) {
        alert('Błąd restartu: ' + error.message);
    }
}

async function runTest() {
    if (!selectedService) return;

    const query = document.getElementById('testQuery').value;
    const resultsDiv = document.getElementById('testResults');
    
    resultsDiv.innerHTML = '<div style="padding: 15px;">🔄 Testowanie...</div>';

    try {
        const response = await fetch(`/api/services/${selectedService.id}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        resultsDiv.innerHTML = `
            <div style="padding: 15px; background: #f0fdf4; border-radius: 8px; border: 2px solid #22c55e;">
                <strong style="color: #22c55e;">✓ Test zakończony pomyślnie!</strong>
                <div style="margin-top: 10px; font-family: monospace; font-size: 0.9em;">
                    Response: "${result.response}"<br>
                    Latency: ${result.latency}ms<br>
                    Status: ${result.status}
                </div>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="padding: 15px; background: #fef2f2; border-radius: 8px; border: 2px solid #ef4444;">
                <strong style="color: #ef4444;">✗ Test zakończony niepowodzeniem</strong>
                <div style="margin-top: 10px; font-family: monospace; font-size: 0.9em;">
                    Error: ${error.message}
                </div>
            </div>
        `;
    }
}

function showAddServiceModal() {
    const name = prompt('Nazwa usługi:');
    if (!name) return;
    
    const endpoint = prompt('Endpoint URL:', 'http://localhost:8080');
    if (!endpoint) return;
    
    const type = prompt('Typ (server/client):', 'server');
    
    fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, endpoint, type })
    })
    .then(res => res.json())
    .then(service => {
        services.push(service);
        renderServices();
        updateMetrics();
        alert('Usługa dodana!');
    })
    .catch(error => {
        alert('Błąd dodawania usługi: ' + error.message);
    });
}

function quickAction(action) {
    const actions = {
        'config': 'Generowanie konfiguracji...',
        'debug': 'Rozpoczynam debugowanie...',
        'analyze': 'Analizuję system...',
        'optimize': 'Optymalizuję wydajność...'
    };
    
    const messages = document.getElementById('chatMessages');
    const aiMessage = document.createElement('div');
    aiMessage.className = 'chat-message ai';
    aiMessage.innerHTML = `<div class="message-bubble">${actions[action]}</div>`;
    messages.appendChild(aiMessage);
    messages.scrollTop = messages.scrollHeight;
}

function clearLogs() {
    loadServiceLogs(selectedService ? selectedService.id : 'system');
}
