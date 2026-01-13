// Enhanced Mock Data for Multi-Agent Orchestration Dashboard
// Based on PRD: SOMA, MOMA, 3P patterns with Supervisor architecture

// Agent type constants
export const AGENT_TYPES = {
  NATIVE: 'native',      // Created and owned within the organization
  SHARED: 'shared',      // From trusted partners within trust boundary
  THIRD_PARTY: '3p',     // External 3P/vendor-created agents
};

// Trust boundary types
export const TRUST_BOUNDARY_TYPES = {
  SOMA: 'SOMA',   // Single Org Multi-Agent
  MOMA: 'MOMA',   // Multi-Org Multi-Agent (DC1 trust boundary)
  EXTERNAL: '3P', // Third-party external agents
};

// Identity resolution methods
export const IDENTITY_METHODS = {
  VERIFIED_EMAIL: 'verified-email',
  OAUTH: 'oauth',
  GUEST: 'guest',
  B2C_AUTH: 'b2c-auth',
  B2B_AUTH: 'b2b-auth',
};

// Status enum mapping
const STATUS_ENUM = {
  'OK': 'SUCCESS',
  'ERROR': 'FAILURE',
  'SKIPPED': 'SKIPPED',
};

// Utility: Get standardized span name
function getStandardSpanName(span) {
  const attrs = span.attributes || {};
  
  // Agent operations
  if (span.kind === 'INTERNAL' && attrs['operation.type'] === 'input') {
    return 'agent.run';
  }
  
  // A2A handoffs
  if (span.kind === 'SERVER' && (span.name.includes('A2A') || span.name === 'agent.handoff')) {
    return 'agent.handoff';
  }
  
  // MCP tool execution
  if (attrs['mcp.tool.name']) {
    return 'MCP.tool.execution';
  }
  
  // RAG retrieval
  if (attrs['operation.type'] === 'rag') {
    return 'knowledge.retrieve';
  }
  
  // Tool execution (non-MCP)
  if (attrs['tool.name'] && !attrs['mcp.tool.name']) {
    return 'tool.execution';
  }
  
  return span.name; // Fallback to original
}

// Utility: Get error code from error details
function getErrorCode(error, errorType) {
  if (!error && !errorType) return null;
  
  const errorMessage = error?.message || error || '';
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorType === 'ConnectionTimeout' || errorType === 'Timeout') {
    return 'TIMEOUT';
  }
  
  // Connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('refused') || errorMessage.includes('unreachable')) {
    return 'CONNECTION_REFUSED';
  }
  
  // Schema errors
  if (errorMessage.includes('schema') || errorType === 'SchemaViolation') {
    return 'SCHEMA_VIOLATION';
  }
  
  // Loop errors
  if (errorMessage.includes('loop') || errorMessage.includes('circular')) {
    return 'LOOP_DETECTED';
  }
  
  // HTTP errors (if status code available)
  if (error?.http_status_code) {
    return `HTTP_${error.http_status_code}`;
  }
  
  return 'UNKNOWN_ERROR';
}

// Utility: Get agent origin enum
function getAgentOrigin(agentType, external) {
  if (external || agentType === '3p') return 'THIRD_PARTY';
  if (agentType === 'shared') return 'SHARED';
  return 'NATIVE';
}

// Utility: Get trust boundary enum
function getTrustBoundaryEnum(trace) {
  const tb = trace.trustBoundary;
  if (!tb) return 'INTERNAL';
  if (tb.type === '3P' || tb.type === 'EXTERNAL') return 'UNTRUSTED';
  if (tb.type === 'MOMA') return 'TRUSTED_ZONE';
  return 'INTERNAL';
}

// Utility: Calculate handoff quality score
function calculateHandoffQualityScore(span) {
  let score = 1.0;
  
  // Penalize errors
  if (span.status === 'ERROR') {
    score *= 0.3; // 70% penalty for errors
  }
  
  // Penalize high latency (normalize to 0-1, then penalize)
  const latency = span.duration || 0;
  const normalizedLatency = Math.min(latency / 5000, 1); // 5s = max
  score *= (1 - normalizedLatency * 0.3); // Up to 30% penalty
  
  // Bonus for low turn count
  const turns = span.attributes?.turns || 1;
  if (turns === 1) {
    score *= 1.1; // 10% bonus for single turn
  } else if (turns > 3) {
    score *= (1 - (turns - 3) * 0.05); // Penalty for many turns
  }
  
  return Math.max(0, Math.min(1, score)); // Clamp to 0-1
}

// Multi-Agent Orchestration Traces
export const traces = [
  // ⚠️ SOMA WARNING - Financial Portfolio Analysis (External Connection Failed)
  {
    id: 'mao-001',
    trace_id: '762976bf-e2dc-4101-aa5f-31438b364353', // OpenTelemetry trace ID
    friendlyName: 'Portfolio-Eagle-7721',
    processId: 'proc-rbc-portfolio-2024-001', // Business Process UUID
    processAlias: 'Portfolio-Eagle-7721', // Human-readable alias
    description: 'User requested portfolio analysis with real-time market data, risk assessment, and investment recommendations',
    priority: 'HIGH', // LOW/MEDIUM/HIGH/CRITICAL
    pattern: 'supervisor',
    rootAgent: 'Portfolio Orchestrator',
    rootOrgId: 'org-rbc-001', // Explicit root org ID
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    duration: 8200,
    turnCount: 8,
    status: 'failed',
    statusEnum: 'FAILURE', // SUCCESS/FAILURE/SKIPPED
    errorCode: 'TIMEOUT', // Standardized error code
    theme: 'Tool Error',
    flowDepth: 4,
    totalLatency: 8200,
    failingComponent: 'Booking.com (via Market Data Agent)',
    failingComponentLatency: 5000,
    failureDescription: 'External MCP connection failed - Booking.com service unreachable',
    failureLayer: 'Tool', // Infrastructure/Logic/Tool
    intentSummary: 'I need portfolio analysis with current market data and risk assessment.',
    responseSummary: 'The agent attempted to retrieve market data from multiple sources but encountered a connection timeout with Booking.com. Partial data was retrieved from Eventbrite, Yelp, and Reservations services. Risk scoring was completed using available data, and recommendations were generated.',
    topics: ['Financial_Portfolio_Analysis', 'Market_Data_Retrieval', 'Risk_Assessment', 'Portfolio_Recommendation'],
    actions: ['GetMarketData', 'CalculateRisk', 'GenerateRecommendations', 'search_events', 'business_search', 'table_reservation'],
    intentTag: 'Portfolio Analysis',
    qualityScore: 'Low',
    qualityScoreReason: 'The agent encountered errors during execution at Booking.com (via Market Data Agent). External MCP connection failed - Booking.com service unreachable. The request could not be fully processed.',
    trustBoundary: {
      type: 'SOMA',
      enum: 'INTERNAL', // INTERNAL/TRUSTED_ZONE/UNTRUSTED
      primaryOrg: 'RBC Financial',
      orgId: 'org-rbc-001',
      orgs: ['RBC Financial'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'Route to Market Data Agent for real-time quotes', confidence: 0.95 },
      { step: 2, decision: 'Market Data Agent connecting to external services...', confidence: 0.90 },
      { step: 3, decision: 'FAILED: Booking.com MCP connection timed out', confidence: 0 },
      { step: 4, decision: 'Parallel call to Risk Scoring Agent (partial data)', confidence: 0.72 },
      { step: 5, decision: 'Synthesize results with incomplete hotel data', confidence: 0.65 },
    ],
    // OpenTelemetry-compliant span structure - ALIGNED WITH GRAPH + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-001',
        parent_span_id: null,
        name: 'Portfolio Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 8200,
        status: 'OK',
        attributes: {
          'service.name': 'portfolio-orchestrator',
          'agent.id': 'agent-orch',
          'agent.role': 'supervisor',
          'agent.type': 'native',
          'trust_boundary': 'SOMA',
        },
        children: [
          // Salesforce Agentforce Pattern: User Input → Action Selection → Topic Selection → Topic → Actions
          {
            span_id: 'span-001-input',
            parent_span_id: 'span-001',
            name: getStandardSpanName({ kind: 'INTERNAL', attributes: { 'operation.type': 'input' } }), // Standardized: agent.run
            kind: 'INTERNAL',
            start_time: 0,
            duration: 1,
            status: 'OK',
            statusEnum: 'SUCCESS',
            attributes: { 'operation.type': 'input' },
          },
          {
            span_id: 'span-001-r1',
            parent_span_id: 'span-001',
            name: 'Action Selection',
            kind: 'INTERNAL',
            start_time: 1,
            duration: 1000,
            status: 'OK',
            attributes: { 'operation.type': 'action-selection' },
          },
          {
            span_id: 'span-001-r2',
            parent_span_id: 'span-001',
            name: 'Topic Selection',
            kind: 'INTERNAL',
            start_time: 1001,
            duration: 1,
            status: 'OK',
            attributes: { 'operation.type': 'topic-selection' },
          },
          {
            span_id: 'span-001-topic',
            parent_span_id: 'span-001',
            name: 'Financial_Portfolio_Analysis',
            kind: 'INTERNAL',
            start_time: 1002,
            duration: 1,
            status: 'OK',
            attributes: { 'operation.type': 'topic', 'topic.name': 'Financial_Portfolio_Analysis' },
          },
          {
            span_id: 'span-001-r3',
            parent_span_id: 'span-001',
            name: 'Routing Reasoning: Invoke Market Data Agent',
            kind: 'INTERNAL',
            start_time: 1003,
            duration: 1000,
            status: 'OK',
            attributes: { 
              'operation.type': 'action-selection', 
              'action.target': 'Market Data Agent',
              'routing.reason': 'User requested portfolio analysis. Need current market data (prices, trends, volatility) before risk assessment can be performed.',
              'routing.strategy': 'serial',
              'routing.priority': 1,
            },
          },
          {
            span_id: 'span-001-r4',
            parent_span_id: 'span-001',
            name: 'Routing Reasoning: Invoke Risk Scoring Agent',
            kind: 'INTERNAL',
            start_time: 3400,
            duration: 100,
            status: 'OK',
            attributes: { 
              'operation.type': 'action-selection', 
              'action.target': 'Risk Scoring Agent',
              'routing.reason': 'Market Data Agent completed. Received current prices and volatility metrics. Now need to calculate portfolio risk score using this market data.',
              'routing.trigger': 'Market Data Agent response received',
              'routing.strategy': 'serial',
              'routing.priority': 2,
            },
          },
          {
            span_id: 'span-001-r5',
            parent_span_id: 'span-001',
            name: 'Routing Reasoning: Invoke Recommendation Agent',
            kind: 'INTERNAL',
            start_time: 5300,
            duration: 100,
            status: 'OK',
            attributes: { 
              'operation.type': 'action-selection', 
              'action.target': 'Recommendation Agent',
              'routing.reason': 'Risk Scoring Agent completed with score 72/100 (Moderate-High). Now have both market data and risk assessment. Can generate personalized investment recommendations.',
              'routing.trigger': 'Risk Scoring Agent response received',
              'routing.strategy': 'serial',
              'routing.priority': 3,
            },
          },
          {
            span_id: 'span-001-reasoning',
            parent_span_id: 'span-001',
            name: 'Reasoning: Workflow Complete',
            kind: 'INTERNAL',
            start_time: 6800,
            duration: 200,
            status: 'OK',
            attributes: { 
              'operation.type': 'reasoning', 
              'reasoning.summary': 'Sequential workflow completed: Market Data → Risk Scoring → Recommendations. All agents returned successfully.',
              'workflow.pattern': 'serial-chain',
              'agents.invoked': 3,
            },
          },
        ],
      },
      {
        span_id: 'span-002',
        parent_span_id: 'span-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: Market Data Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 1200,
        duration: 2100,
        status: 'ERROR',
        statusEnum: 'FAILURE', // SUCCESS/FAILURE/SKIPPED
        attributes: {
          'service.name': 'market-data-agent',
          'agent.id': 'agent-market',
          'agent.role': 'specialist',
          'agent.type': 'native',
          'agent.origin': getAgentOrigin('native', false), // NATIVE/SHARED/THIRD_PARTY
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'GetMarketData',
          'peer.service': 'portfolio-orchestrator',
          'turns': 2, // Request + Response = 2 turns with supervisor
          
          // A2A Handoff Attributes
          'sender.agent': 'Portfolio Orchestrator',
          'sender.agent.id': 'agent-orch',
          'handoff.target': 'Market Data Agent',
          'handoff.target.id': 'agent-market',
          'handoff.status': 'SUCCESS', // SUCCESS/UNREACHABLE/DOWN (handoff succeeded, but agent failed internally)
          'handoff.latency': 50, // Network latency (ms)
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'ERROR', duration: 2100, attributes: { turns: 2 } }),
          'transferred.data.size': 2048, // Bytes sent
          'transferred.tokens': 512, // Token count
          'preceding.tool.name': null, // Tool called before this handoff
          'repetitive.handoff.count': 0, // Loop detection
          'target.org.id': 'org-rbc-001', // For cross-org handoffs
          'trust.boundary': 'INTERNAL', // INTERNAL/TRUSTED_ZONE/UNTRUSTED
          'vendor.name': null, // For 3P agents
          
          // Error details
          'error': true,
          'error.code': getErrorCode({ message: 'External connection to Booking.com failed' }, 'ConnectionTimeout'),
          'error.type': 'ConnectionTimeout',
          'error.message': 'External connection to Booking.com failed',
        },
        children: [
          { span_id: 'span-002-input', parent_span_id: 'span-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 1200, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-002-a1', parent_span_id: 'span-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1201, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-002-t1', parent_span_id: 'span-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1251, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-002-topic', parent_span_id: 'span-002', name: 'Market_Data_Retrieval', kind: 'INTERNAL', start_time: 1252, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Market_Data_Retrieval' } },
          { span_id: 'span-002-a2', parent_span_id: 'span-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1253, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Eventbrite MCP' } },
          { span_id: 'span-002-a3', parent_span_id: 'span-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1303, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Booking.com MCP' } },
          { span_id: 'span-002-a4', parent_span_id: 'span-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1353, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Yelp MCP' } },
          { span_id: 'span-002-a5', parent_span_id: 'span-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1403, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Reservations MCP' } },
          {
            span_id: 'span-002-mcp1',
            parent_span_id: 'span-002',
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'eventbrite' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT',
            start_time: 1453,
            duration: 450,
            status: 'OK',
            statusEnum: 'SUCCESS',
            attributes: { 
              'service.name': 'eventbrite-mcp', 
              'mcp.tool.name': 'eventbrite', 
              'mcp.provider': 'external', 
              'mcp.operation': 'search_events', 
              'turns': 1,
              'tokens.input': 128,
              'tokens.output': 512,
              
              // MCP/Tool Attributes
              'tool.type': 'MCP', // MCP/Apex/Flow/Prompt Template/API/Predictive Model
              'tool.name': 'eventbrite', // Tool name
              'tool.error.rate': 0.02, // Percentage (2% error rate)
              'input.size': 512, // Bytes sent
              'input.tokens': 128, // Token count
              'output.size': 2048, // Bytes received
              'output.tokens': 512, // Token count
              'repetitive.tool.count': 0, // Loop detection
              'http.method': 'GET',
              'http.status_code': 200,
              'http.url': 'https://api.eventbrite.com/v3/events/search',
              'tool.latency': 450,
              'tool.response.time': 'Fast', // Fast/Normal/Slow
            },
          },
          {
            span_id: 'span-002-mcp2',
            parent_span_id: 'span-002',
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'booking.com' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT',
            start_time: 1903,
            duration: 800,
            status: 'ERROR',
            statusEnum: 'FAILURE',
            attributes: { 
              'service.name': 'booking-com-mcp', 
              'mcp.tool.name': 'booking.com', 
              'mcp.provider': 'external', 
              'error': true, 
              'error.code': getErrorCode({ message: 'MCP connection timed out' }, 'ConnectionTimeout'),
              'error.type': 'ConnectionTimeout',
              'error.message': 'MCP connection timed out', 
              'turns': 3,
              'retry.count': 2,
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'booking.com',
              'tool.error.rate': 1.0, // 100% error rate (failed)
              'input.size': 512,
              'input.tokens': 128,
              'output.size': 0, // No output due to error
              'output.tokens': 0,
              'repetitive.tool.count': 0,
              'http.method': 'POST',
              'http.status_code': 504,
              'http.url': 'https://api.booking.com/v1/search',
              'tool.latency': 800,
              'tool.response.time': 'Slow',
            },
          },
          {
            span_id: 'span-002-mcp3',
            parent_span_id: 'span-002',
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'yelp' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT',
            start_time: 2703,
            duration: 380,
            status: 'OK',
            statusEnum: 'SUCCESS',
            attributes: { 
              'service.name': 'yelp-mcp', 
              'mcp.tool.name': 'yelp', 
              'mcp.provider': 'external', 
              'mcp.operation': 'business_search', 
              'turns': 1,
              'tokens.input': 180,
              'tokens.output': 2450,
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'yelp',
              'tool.error.rate': 0.01,
              'input.size': 380,
              'input.tokens': 180,
              'output.size': 2450,
              'output.tokens': 2450,
              'repetitive.tool.count': 0,
              'http.method': 'GET',
              'http.status_code': 200,
              'http.url': 'https://api.yelp.com/v3/businesses/search',
              'tool.latency': 380,
              'tool.response.time': 'Fast',
            },
          },
          {
            span_id: 'span-002-mcp4',
            parent_span_id: 'span-002',
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'opentable' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT',
            start_time: 3083,
            duration: 290,
            status: 'OK',
            statusEnum: 'SUCCESS',
            attributes: { 
              'service.name': 'reservations-mcp', 
              'mcp.tool.name': 'opentable', 
              'mcp.provider': 'external', 
              'mcp.operation': 'table_reservation',
              'turns': 1,
              'tokens.input': 320,
              'tokens.output': 890,
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'opentable',
              'tool.error.rate': 0.01,
              'input.size': 320,
              'input.tokens': 320,
              'output.size': 890,
              'output.tokens': 890,
              'repetitive.tool.count': 0,
              'http.method': 'POST',
              'http.status_code': 201,
              'http.url': 'https://api.opentable.com/v1/reservations',
              'tool.latency': 290,
              'tool.response.time': 'Fast',
            },
          },
          { span_id: 'span-002-reasoning', parent_span_id: 'span-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 3373, duration: 27, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Retrieved market data from 3/4 sources (Booking.com failed)' } },
        ],
      },
      {
        span_id: 'span-003',
        parent_span_id: 'span-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: Risk Scoring Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 1200,
        duration: 1800,
        status: 'OK',
        statusEnum: 'SUCCESS',
        attributes: {
          'service.name': 'risk-scoring-agent',
          'agent.id': 'agent-risk',
          'agent.role': 'specialist',
          'agent.type': 'native',
          'agent.origin': getAgentOrigin('native', false),
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'CalculateRisk',
          'peer.service': 'portfolio-orchestrator',
          'parallel': true,
          'turns': 2, // Request + Response
          
          // A2A Handoff Attributes
          'sender.agent': 'Portfolio Orchestrator',
          'sender.agent.id': 'agent-orch',
          'handoff.target': 'Risk Scoring Agent',
          'handoff.target.id': 'agent-risk',
          'handoff.status': 'SUCCESS',
          'handoff.latency': 45,
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'OK', duration: 1800, attributes: { turns: 2 } }),
          'transferred.data.size': 3072,
          'transferred.tokens': 768,
          'preceding.tool.name': 'Eventbrite',
          'repetitive.handoff.count': 0,
          'target.org.id': 'org-rbc-001',
          'trust.boundary': 'INTERNAL',
          'vendor.name': null,
        },
        children: [
          { span_id: 'span-003-input', parent_span_id: 'span-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 1200, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-003-a1', parent_span_id: 'span-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 1201, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-003-t1', parent_span_id: 'span-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1251, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-003-topic', parent_span_id: 'span-003', name: 'Risk_Assessment', kind: 'INTERNAL', start_time: 1252, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Risk_Assessment' } },
          { span_id: 'span-003-a2', parent_span_id: 'span-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 1253, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Risk Calculation' } },
          { span_id: 'span-003-calc', parent_span_id: 'span-003', name: 'Risk Calculation', kind: 'INTERNAL', start_time: 1303, duration: 1400, status: 'OK', attributes: { 'operation.type': 'calculation' } },
          { span_id: 'span-003-reasoning', parent_span_id: 'span-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 2703, duration: 97, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Portfolio risk score: 72/100 (Moderate-High)' } },
        ],
      },
      {
        span_id: 'span-004',
        parent_span_id: 'span-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: Recommendation Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 3300,
        duration: 1500,
        status: 'OK',
        statusEnum: 'SUCCESS',
        attributes: {
          'service.name': 'recommendation-agent',
          'agent.id': 'agent-recommend',
          'agent.role': 'specialist',
          'agent.type': 'native',
          'agent.origin': getAgentOrigin('native', false),
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'GenerateRecommendations',
          'peer.service': 'portfolio-orchestrator',
          'turns': 2, // Request + Response
          
          // A2A Handoff Attributes
          'sender.agent': 'Portfolio Orchestrator',
          'sender.agent.id': 'agent-orch',
          'handoff.target': 'Recommendation Agent',
          'handoff.target.id': 'agent-recommend',
          'handoff.status': 'SUCCESS',
          'handoff.latency': 40,
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'OK', duration: 1500, attributes: { turns: 2 } }),
          'transferred.data.size': 4096,
          'transferred.tokens': 1024,
          'preceding.tool.name': 'Risk Model',
          'repetitive.handoff.count': 0,
          'target.org.id': 'org-rbc-001',
          'trust.boundary': 'INTERNAL',
          'vendor.name': null,
        },
        children: [
          { span_id: 'span-004-input', parent_span_id: 'span-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 3300, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-004-a1', parent_span_id: 'span-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 3301, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-004-t1', parent_span_id: 'span-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 3351, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-004-topic', parent_span_id: 'span-004', name: 'Portfolio_Recommendation', kind: 'INTERNAL', start_time: 3352, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Portfolio_Recommendation' } },
          { span_id: 'span-004-a2', parent_span_id: 'span-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 3353, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Generate Recommendations' } },
          { span_id: 'span-004-gen', parent_span_id: 'span-004', name: 'Generate Portfolio Recommendations', kind: 'INTERNAL', start_time: 3403, duration: 900, status: 'OK', attributes: { 'operation.type': 'generation' } },
          { span_id: 'span-004-reasoning', parent_span_id: 'span-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 4303, duration: 497, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Generated 3 buy recommendations, 2 hold, 1 sell' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-orch',
        span_id: 'span-001',
        type: AGENT_TYPES.NATIVE,
        name: 'Portfolio Orchestrator',
        role: 'supervisor',
        orgId: 'org-rbc-001',
        orgName: 'RBC Financial',
        status: 'success',
        latency: 1200,
        capabilities: ['orchestration', 'reasoning', 'synthesis'],
        isRoot: true,
      },
      {
        id: 'agent-market',
        span_id: 'span-002',
        parent_span_id: 'span-001',
        type: AGENT_TYPES.NATIVE,
        name: 'Market Data Agent',
        role: 'specialist',
        orgId: 'org-rbc-001',
        orgName: 'RBC Financial',
        status: 'warning',
        latency: 2100,
        capabilities: ['real-time-data', 'trend-analysis'],
        errorMessage: 'External connection to Booking.com failed',
        mcps: ['booking-com'], // MCPs invoked by this agent
      },
      {
        id: 'agent-risk',
        span_id: 'span-003',
        parent_span_id: 'span-001',
        type: AGENT_TYPES.NATIVE,
        name: 'Risk Scoring Agent',
        role: 'specialist',
        orgId: 'org-rbc-001',
        orgName: 'RBC Financial',
        status: 'success',
        latency: 1800,
        capabilities: ['risk-calculation', 'compliance-check'],
      },
      {
        id: 'agent-recommend',
        span_id: 'span-004',
        parent_span_id: 'span-001',
        type: AGENT_TYPES.NATIVE,
        name: 'Recommendation Agent',
        role: 'specialist',
        orgId: 'org-rbc-001',
        orgName: 'RBC Financial',
        status: 'success',
        latency: 1500,
        capabilities: ['portfolio-optimization', 'client-matching'],
      },
      // External 3P agents connected to Market Data Agent
      {
        id: 'agent-eventbrite',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Eventbrite',
        role: 'external',
        vendorName: 'Eventbrite',
        status: 'success',
        latency: 450,
        capabilities: ['event-search', 'ticket-booking'],
      },
      {
        id: 'agent-booking',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Booking.com',
        role: 'external',
        vendorName: 'Booking.com',
        status: 'unreachable',
        latency: 0,
        capabilities: ['hotel-search', 'booking-management'],
        errorMessage: 'Connection timeout',
      },
      {
        id: 'agent-yelp',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Yelp',
        role: 'external',
        vendorName: 'Yelp',
        status: 'success',
        latency: 380,
        capabilities: ['restaurant-search', 'reviews'],
      },
      {
        id: 'agent-reservations',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Reservations MCP',
        role: 'external',
        vendorName: 'OpenTable',
        status: 'success',
        latency: 290,
        capabilities: ['table-reservation'],
      },
    ],
    edges: [
      { from: 'agent-orch', to: 'agent-market', status: 'success', dataSize: '2.1 KB' },
      { from: 'agent-orch', to: 'agent-risk', status: 'success', dataSize: '1.8 KB', parallel: true },
      { from: 'agent-market', to: 'agent-orch', status: 'success', dataSize: '45.2 KB' },
      { from: 'agent-risk', to: 'agent-orch', status: 'success', dataSize: '12.4 KB' },
      { from: 'agent-orch', to: 'agent-recommend', status: 'success', dataSize: '58.1 KB' },
      { from: 'agent-recommend', to: 'agent-orch', status: 'success', dataSize: '8.2 KB' },
      // External connections from Market Data Agent
      { from: 'agent-market', to: 'agent-eventbrite', status: 'success', dataSize: '1.2 KB', external: true },
      { from: 'agent-market', to: 'agent-booking', status: 'error', dataSize: '0.8 KB', external: true },
      { from: 'agent-market', to: 'agent-yelp', status: 'success', dataSize: '1.5 KB', external: true },
      { from: 'agent-market', to: 'agent-reservations', status: 'success', dataSize: '0.9 KB', external: true },
    ],
    identityFlow: {
      sourceUser: 'advisor@rbc.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.B2B_AUTH,
      crossOrgResolutions: [],
    },
    latencyBreakdown: {
      gatewayOverhead: 0,
      supervisorReasoning: 1200,
      parallelAgentCalls: 2100,
      serialAgentCalls: 3400,
      totalDuration: 8200,
      },
    governancePolicies: ['PCI-DSS', 'RBC-Internal', 'Financial-Regulations'],
    mcpCalls: [
      {
        toolName: 'GetMarketQuotes',
        toolProvider: 'Bloomberg-MCP',
        agentId: 'agent-market',
        responseStatus: 200,
        toolLatency: 1200,
        inputPayloadSize: '0.5 KB',
        outputPayloadSize: '42.1 KB',
      },
      {
        toolName: 'CalculateVaR',
        toolProvider: 'Risk-Engine-MCP',
        agentId: 'agent-risk',
        responseStatus: 200,
        toolLatency: 980,
        inputPayloadSize: '12.3 KB',
        outputPayloadSize: '4.2 KB',
      },
    ],
    ragCalls: [],
  },

  // ✅ MOMA SUCCESS - Cross-Org Employee Onboarding
  {
    id: 'mao-002',
    trace_id: 'a8f3b1c2-d4e5-6789-abcd-ef0123456789',
    friendlyName: 'Onboard-Phoenix-3392',
    processId: 'proc-acme-onboarding-2024-002',
    processAlias: 'Onboard-Phoenix-3392',
    description: 'New employee onboarding workflow: HR profile creation, IT provisioning, and security badge setup across multiple organizations',
    priority: 'HIGH',
    pattern: 'supervisor',
    rootAgent: 'HR Orchestrator',
    rootOrgId: 'org-acme-hq',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    duration: 15400,
    turnCount: 12,
    status: 'success',
    statusEnum: 'SUCCESS',
    errorCode: null,
    theme: null,
    flowDepth: 5,
    totalLatency: 15400,
    failingComponent: null,
    failingComponentLatency: null,
    failureDescription: null,
    failureLayer: null,
    intentSummary: 'I need to onboard a new employee with HR profile, IT access, and security badge.',
    responseSummary: 'The agent successfully created the HR profile, then coordinated with IT Provisioning Agent to set up email, Slack, and VPN access. Security Badge Agent ran background check and created badge. All onboarding tasks completed successfully.',
    topics: ['Employee_Onboarding', 'Employee_Profile_Setup', 'IT_Provisioning', 'Security_Badge_Provisioning'],
    actions: ['CreateEmailAccount', 'ProvisionSlackUser', 'CreateBadgeRequest', 'Profile Creation', 'Benefits Enrollment'],
    intentTag: 'Employee Onboarding',
    qualityScore: 'High',
    qualityScoreReason: 'The agent successfully resolved the user\'s request by coordinating 3 agents. All operations completed successfully and the response was comprehensive.',
    trustBoundary: {
      type: 'MOMA',
      enum: 'TRUSTED_ZONE', // INTERNAL/TRUSTED_ZONE/UNTRUSTED
      primaryOrg: 'Acme Corp HQ',
      orgId: 'org-acme-hq',
      orgs: ['Acme Corp HQ', 'Acme IT Services', 'Acme Security'],
      boundaryId: 'DC1-ACME-001',
    },
    supervisorDecisions: [
      { step: 1, decision: 'Create user profile in HR system', confidence: 0.98 },
      { step: 2, decision: 'Delegate to IT Agent for system access setup', confidence: 0.94 },
      { step: 3, decision: 'Delegate to Security Agent for badge provisioning', confidence: 0.96 },
      { step: 4, decision: 'All parallel tasks complete - synthesize onboarding package', confidence: 0.91 },
    ],
    // OpenTelemetry spans - aligned with agents/edges + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-hr-001',
        parent_span_id: null,
        name: 'HR Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 15400,
        status: 'OK',
        attributes: { 'agent.id': 'agent-hr-orch', 'agent.role': 'supervisor', 'trust_boundary': 'MOMA' },
        children: [
          { span_id: 'span-hr-001-input', parent_span_id: 'span-hr-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-hr-001-r1', parent_span_id: 'span-hr-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-hr-001-r2', parent_span_id: 'span-hr-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-hr-001-topic', parent_span_id: 'span-hr-001', name: 'Employee_Onboarding', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Employee_Onboarding' } },
          { span_id: 'span-hr-001-r3', parent_span_id: 'span-hr-001', name: 'Routing Reasoning: Invoke HR Profile Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'HR Profile Agent', 'routing.reason': 'New employee onboarding initiated. Must create HR profile first - this provides employee ID required by downstream systems.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-hr-001-r4', parent_span_id: 'span-hr-001', name: 'Routing Reasoning: Invoke IT Provisioning Agent', kind: 'INTERNAL', start_time: 3950, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'IT Provisioning Agent', 'routing.reason': 'HR Profile Agent completed. Employee ID EMP-2024-8891 created. Now can provision IT accounts (email, Slack, VPN) using this employee ID.', 'routing.trigger': 'HR Profile Agent response received', 'routing.strategy': 'parallel', 'routing.priority': 2 } },
          { span_id: 'span-hr-001-r5', parent_span_id: 'span-hr-001', name: 'Routing Reasoning: Invoke Security Badge Agent', kind: 'INTERNAL', start_time: 3950, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Security Badge Agent', 'routing.reason': 'HR Profile Agent completed. Can run parallel to IT Provisioning - both only need employee ID. Badge provisioning includes background check.', 'routing.trigger': 'HR Profile Agent response received', 'routing.strategy': 'parallel', 'routing.priority': 2 } },
          { span_id: 'span-hr-001-reasoning', parent_span_id: 'span-hr-001', name: 'Reasoning: Workflow Complete', kind: 'INTERNAL', start_time: 8100, duration: 200, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Onboarding completed: HR Profile (serial) → IT + Security (parallel). Employee ready for Day 1.', 'workflow.pattern': 'serial-then-parallel', 'agents.invoked': 3 } },
        ],
      },
      {
        span_id: 'span-hr-002',
        parent_span_id: 'span-hr-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: HR Profile Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 2100,
        duration: 1800,
        status: 'OK',
        statusEnum: 'SUCCESS',
        attributes: { 
          'agent.id': 'agent-hr-profile', 
          'agent.role': 'specialist',
          'agent.type': 'native',
          'agent.origin': getAgentOrigin('native', false),
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'CreateProfile',
          'peer.service': 'hr-orchestrator',
          'turns': 2,
          
          // A2A Handoff Attributes
          'sender.agent': 'HR Orchestrator',
          'sender.agent.id': 'agent-hr-orch',
          'handoff.target': 'HR Profile Agent',
          'handoff.target.id': 'agent-hr-profile',
          'handoff.status': 'SUCCESS',
          'handoff.latency': 35,
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'OK', duration: 1800, attributes: { turns: 2 } }),
          'transferred.data.size': 1536,
          'transferred.tokens': 384,
          'preceding.tool.name': null,
          'repetitive.handoff.count': 0,
          'target.org.id': 'org-acme-hq',
          'trust.boundary': 'TRUSTED_ZONE',
          'vendor.name': null,
        },
        children: [
          { span_id: 'span-hr-002-input', parent_span_id: 'span-hr-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 2100, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-hr-002-a1', parent_span_id: 'span-hr-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2101, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-hr-002-t1', parent_span_id: 'span-hr-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 2151, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-hr-002-topic', parent_span_id: 'span-hr-002', name: 'Employee_Profile_Setup', kind: 'INTERNAL', start_time: 2152, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Employee_Profile_Setup' } },
          { span_id: 'span-hr-002-a2', parent_span_id: 'span-hr-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2153, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Profile Creation' } },
          { span_id: 'span-hr-002-a3', parent_span_id: 'span-hr-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2203, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Benefits Enrollment' } },
          { span_id: 'span-hr-002-create', parent_span_id: 'span-hr-002', name: 'Profile Creation', kind: 'INTERNAL', start_time: 2253, duration: 1000, status: 'OK', attributes: { 'operation.type': 'create' } },
          { span_id: 'span-hr-002-enroll', parent_span_id: 'span-hr-002', name: 'Benefits Enrollment', kind: 'INTERNAL', start_time: 3253, duration: 600, status: 'OK', attributes: { 'operation.type': 'enrollment' } },
          { span_id: 'span-hr-002-reasoning', parent_span_id: 'span-hr-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 3853, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Profile created and benefits enrollment completed' } },
        ],
      },
      {
        span_id: 'span-hr-003',
        parent_span_id: 'span-hr-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: IT Provisioning Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 3900,
        duration: 4200,
        status: 'OK',
        statusEnum: 'SUCCESS',
        attributes: { 
          'agent.id': 'agent-it', 
          'agent.role': 'specialist', 
          'agent.type': 'shared',
          'agent.origin': getAgentOrigin('shared', false),
          'cross_org': true, 
          'source_org': 'Acme IT Services',
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'ProvisionIT',
          'peer.service': 'hr-orchestrator',
          'turns': 2,
          
          // A2A Handoff Attributes
          'sender.agent': 'HR Orchestrator',
          'sender.agent.id': 'agent-hr-orch',
          'handoff.target': 'IT Provisioning Agent',
          'handoff.target.id': 'agent-it',
          'handoff.status': 'SUCCESS',
          'handoff.latency': 60,
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'OK', duration: 4200, attributes: { turns: 2 } }),
          'transferred.data.size': 3072,
          'transferred.tokens': 768,
          'preceding.tool.name': null,
          'repetitive.handoff.count': 0,
          'target.org.id': 'org-acme-it',
          'trust.boundary': 'TRUSTED_ZONE',
          'vendor.name': null,
        },
        children: [
          { span_id: 'span-hr-003-input', parent_span_id: 'span-hr-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 3900, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-hr-003-a1', parent_span_id: 'span-hr-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 3901, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-hr-003-t1', parent_span_id: 'span-hr-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 3951, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-hr-003-topic', parent_span_id: 'span-hr-003', name: 'IT_Provisioning', kind: 'INTERNAL', start_time: 3952, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'IT_Provisioning' } },
          { span_id: 'span-hr-003-a2', parent_span_id: 'span-hr-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 3953, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Google Workspace MCP' } },
          { span_id: 'span-hr-003-a3', parent_span_id: 'span-hr-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 4003, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Slack MCP' } },
          { span_id: 'span-hr-003-a4', parent_span_id: 'span-hr-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 4053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'VPN Configuration' } },
          { 
            span_id: 'span-hr-003-mcp1', 
            parent_span_id: 'span-hr-003', 
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'google-workspace' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT', 
            start_time: 4103, 
            duration: 2100, 
            status: 'OK', 
            statusEnum: 'SUCCESS',
            attributes: { 
              'mcp.tool.name': 'google-workspace', 
              'mcp.operation': 'CreateEmailAccount', 
              'turns': 1,
              'service.name': 'google-workspace-mcp',
              'mcp.provider': 'external',
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'google-workspace',
              'tool.error.rate': 0.01,
              'input.size': 1200,
              'input.tokens': 300,
              'output.size': 800,
              'output.tokens': 200,
              'repetitive.tool.count': 0,
              'http.method': 'POST',
              'http.status_code': 201,
              'http.url': 'https://admin.googleapis.com/admin/directory/v1/users',
              'tool.latency': 2100,
              'tool.response.time': 'Normal',
            } 
          },
          { 
            span_id: 'span-hr-003-mcp2', 
            parent_span_id: 'span-hr-003', 
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'slack' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT', 
            start_time: 6203, 
            duration: 1400, 
            status: 'OK', 
            statusEnum: 'SUCCESS',
            attributes: { 
              'mcp.tool.name': 'slack', 
              'mcp.operation': 'ProvisionSlackUser', 
              'turns': 1,
              'service.name': 'slack-mcp',
              'mcp.provider': 'external',
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'slack',
              'tool.error.rate': 0.01,
              'input.size': 600,
              'input.tokens': 150,
              'output.size': 400,
              'output.tokens': 100,
              'repetitive.tool.count': 0,
              'http.method': 'POST',
              'http.status_code': 201,
              'http.url': 'https://api.slack.com/api/users.admin.invite',
              'tool.latency': 1400,
              'tool.response.time': 'Normal',
            } 
          },
          { span_id: 'span-hr-003-vpn', parent_span_id: 'span-hr-003', name: 'VPN Configuration', kind: 'INTERNAL', start_time: 7603, duration: 400, status: 'OK', attributes: { 'operation.type': 'config' } },
          { span_id: 'span-hr-003-reasoning', parent_span_id: 'span-hr-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 8003, duration: 97, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Email, Slack, and VPN provisioned successfully' } },
        ],
      },
      {
        span_id: 'span-hr-004',
        parent_span_id: 'span-hr-001',
        name: getStandardSpanName({ kind: 'SERVER', name: 'A2A: Security Badge Agent' }), // Standardized: agent.handoff
        kind: 'SERVER',
        start_time: 3900,
        duration: 3100,
        status: 'OK',
        statusEnum: 'SUCCESS',
        attributes: { 
          'agent.id': 'agent-security', 
          'agent.role': 'specialist', 
          'agent.type': 'shared',
          'agent.origin': getAgentOrigin('shared', false),
          'cross_org': true, 
          'source_org': 'Acme Security', 
          'parallel': true,
          'rpc.system': 'agentforce_a2a',
          'rpc.method': 'CreateBadge',
          'peer.service': 'hr-orchestrator',
          'turns': 2,
          
          // A2A Handoff Attributes
          'sender.agent': 'HR Orchestrator',
          'sender.agent.id': 'agent-hr-orch',
          'handoff.target': 'Security Badge Agent',
          'handoff.target.id': 'agent-security',
          'handoff.status': 'SUCCESS',
          'handoff.latency': 55,
          'handoff.quality_score': calculateHandoffQualityScore({ status: 'OK', duration: 3100, attributes: { turns: 2 } }),
          'transferred.data.size': 2048,
          'transferred.tokens': 512,
          'preceding.tool.name': null,
          'repetitive.handoff.count': 0,
          'target.org.id': 'org-acme-sec',
          'trust.boundary': 'TRUSTED_ZONE',
          'vendor.name': null,
        },
        children: [
          { span_id: 'span-hr-004-input', parent_span_id: 'span-hr-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 3900, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-hr-004-a1', parent_span_id: 'span-hr-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 3901, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-hr-004-t1', parent_span_id: 'span-hr-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 3951, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-hr-004-topic', parent_span_id: 'span-hr-004', name: 'Security_Badge_Provisioning', kind: 'INTERNAL', start_time: 3952, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Security_Badge_Provisioning' } },
          { span_id: 'span-hr-004-a2', parent_span_id: 'span-hr-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 3953, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Background Check' } },
          { span_id: 'span-hr-004-a3', parent_span_id: 'span-hr-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 4003, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Badge System MCP' } },
          { span_id: 'span-hr-004-a4', parent_span_id: 'span-hr-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 4053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Access Control Setup' } },
          { span_id: 'span-hr-004-check', parent_span_id: 'span-hr-004', name: 'Background Check', kind: 'INTERNAL', start_time: 4103, duration: 1000, status: 'OK', attributes: { 'operation.type': 'verification' } },
          { 
            span_id: 'span-hr-004-mcp1', 
            parent_span_id: 'span-hr-004', 
            name: getStandardSpanName({ attributes: { 'mcp.tool.name': 'badge-system' } }), // Standardized: MCP.tool.execution
            kind: 'CLIENT', 
            start_time: 5103, 
            duration: 1800, 
            status: 'OK', 
            statusEnum: 'SUCCESS',
            attributes: { 
              'mcp.tool.name': 'badge-system', 
              'mcp.operation': 'CreateBadgeRequest', 
              'turns': 1,
              'service.name': 'badge-system-mcp',
              'mcp.provider': 'internal',
              
              // MCP/Tool Attributes
              'tool.type': 'MCP',
              'tool.name': 'badge-system',
              'tool.error.rate': 0.01,
              'input.size': 800,
              'input.tokens': 200,
              'output.size': 600,
              'output.tokens': 150,
              'repetitive.tool.count': 0,
              'http.method': 'POST',
              'http.status_code': 201,
              'http.url': 'https://api.acme.com/badge-system/v1/create',
              'tool.latency': 1800,
              'tool.response.time': 'Normal',
            } 
          },
          { span_id: 'span-hr-004-access', parent_span_id: 'span-hr-004', name: 'Access Control Setup', kind: 'INTERNAL', start_time: 6903, duration: 100, status: 'OK', attributes: { 'operation.type': 'access_control' } },
          { span_id: 'span-hr-004-reasoning', parent_span_id: 'span-hr-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 7003, duration: 97, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Background check passed, badge created, access control configured' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-hr-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'HR Orchestrator',
        role: 'supervisor',
        orgId: 'org-acme-hq',
        orgName: 'Acme Corp HQ',
        status: 'success',
        latency: 2100,
        capabilities: ['orchestration', 'hr-workflows', 'compliance'],
        isRoot: true,
      },
      {
        id: 'agent-it',
        type: AGENT_TYPES.SHARED,
        name: 'IT Provisioning Agent',
        role: 'specialist',
        orgId: 'org-acme-it',
        orgName: 'Acme IT Services',
        sourceOrg: 'Acme IT Services',
        sharedVia: 'DC1-ACME-001',
        status: 'success',
        latency: 4200,
        capabilities: ['email-setup', 'slack-access', 'vpn-config'],
      },
      {
        id: 'agent-security',
        type: AGENT_TYPES.SHARED,
        name: 'Security Badge Agent',
        role: 'specialist',
        orgId: 'org-acme-sec',
        orgName: 'Acme Security',
        sourceOrg: 'Acme Security',
        sharedVia: 'DC1-ACME-001',
        status: 'success',
        latency: 3100,
        capabilities: ['badge-provisioning', 'access-control', 'background-check'],
      },
      {
        id: 'agent-hr-profile',
        type: AGENT_TYPES.NATIVE,
        name: 'HR Profile Agent',
        role: 'specialist',
        orgId: 'org-acme-hq',
        orgName: 'Acme Corp HQ',
        status: 'success',
        latency: 1800,
        capabilities: ['profile-creation', 'benefits-enrollment'],
      },
    ],
    edges: [
      { from: 'agent-hr-orch', to: 'agent-hr-profile', status: 'success', dataSize: '4.2 KB' },
      { from: 'agent-hr-profile', to: 'agent-hr-orch', status: 'success', dataSize: '8.1 KB' },
      { from: 'agent-hr-orch', to: 'agent-it', status: 'success', dataSize: '12.3 KB', crossOrg: true },
      { from: 'agent-hr-orch', to: 'agent-security', status: 'success', dataSize: '6.8 KB', crossOrg: true, parallel: true },
      { from: 'agent-it', to: 'agent-hr-orch', status: 'success', dataSize: '3.2 KB', crossOrg: true },
      { from: 'agent-security', to: 'agent-hr-orch', status: 'success', dataSize: '2.1 KB', crossOrg: true },
    ],
    identityFlow: {
      sourceUser: 'hr-admin@acme.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.VERIFIED_EMAIL,
      crossOrgResolutions: [
        { org: 'Acme IT Services', orgId: 'org-acme-it', status: 'resolved', method: 'verified-email', latency: 45 },
        { org: 'Acme Security', orgId: 'org-acme-sec', status: 'resolved', method: 'verified-email', latency: 52 },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 380,
      supervisorReasoning: 2100,
      parallelAgentCalls: 4200,
      serialAgentCalls: 5800,
      totalDuration: 15400,
      },
    governancePolicies: ['GDPR', 'SOC2', 'Acme-HR-Policy'],
    mcpCalls: [
      {
        toolName: 'CreateEmailAccount',
        toolProvider: 'Google-Workspace-MCP',
        agentId: 'agent-it',
        responseStatus: 201,
        toolLatency: 2100,
        inputPayloadSize: '1.2 KB',
        outputPayloadSize: '0.8 KB',
      },
      {
        toolName: 'ProvisionSlackUser',
        toolProvider: 'Slack-MCP',
        agentId: 'agent-it',
        responseStatus: 201,
        toolLatency: 1400,
        inputPayloadSize: '0.6 KB',
        outputPayloadSize: '0.4 KB',
      },
      {
        toolName: 'CreateBadgeRequest',
        toolProvider: 'Badge-System-MCP',
        agentId: 'agent-security',
        responseStatus: 201,
        toolLatency: 1800,
        inputPayloadSize: '2.1 KB',
        outputPayloadSize: '1.2 KB',
      },
    ],
    ragCalls: [],
  },

  // ✅ 3P SUCCESS - RFP Response with Box Integration
  {
    id: 'mao-003',
    trace_id: 'b9c4d2e3-f5a6-7890-bcde-f12345678901',
    friendlyName: 'RFP-Hawk-8891',
    processId: 'proc-deloitte-rfp-2024-003',
    processAlias: 'RFP-Hawk-8891',
    description: 'RFP response generation workflow: document analysis, knowledge base search, proposal draft generation, and DocuSign approval',
    priority: 'HIGH',
    pattern: 'supervisor',
    rootAgent: 'Sales Orchestrator',
    rootOrgId: 'org-deloitte-sales',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    duration: 22100,
    turnCount: 15,
    status: 'success',
    statusEnum: 'SUCCESS',
    errorCode: null,
    theme: null,
    flowDepth: 6,
    totalLatency: 22100,
    failingComponent: null,
    failingComponentLatency: null,
    failureDescription: null,
    failureLayer: null,
    intentSummary: 'I need to generate an RFP response proposal for a client.',
    responseSummary: 'The agent analyzed the RFP document using Box integration, searched past proposals in the knowledge base, generated a comprehensive 32-page proposal draft, and routed it to DocuSign for executive approval. The proposal was successfully created and sent to 3 approvers.',
    topics: ['RFP_Response_Generation', 'Document_Processing', 'Knowledge_Retrieval', 'Proposal_Generation', 'Document_Approval'],
    actions: ['RunQuery', 'search_events', 'SendBulkSMS', 'Document Analysis', 'OCR Processing', 'Content Extraction', 'Past Proposals Search'],
    intentTag: 'RFP Response',
    qualityScore: 'High',
    qualityScoreReason: 'The agent successfully resolved the user\'s request by coordinating 4 agents including 3P integrations. All operations completed successfully and the response was comprehensive.',
    trustBoundary: {
      type: '3P',
      primaryOrg: 'Deloitte Sales',
      orgId: 'org-deloitte-sales',
      orgs: ['Deloitte Sales'],
      externalVendors: ['Box Inc', 'DocuSign'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'Extract RFP requirements from uploaded document', confidence: 0.97 },
      { step: 2, decision: 'Call Box Agent for document analysis (3P)', confidence: 0.93 },
      { step: 3, decision: 'Search internal knowledge base for past proposals', confidence: 0.95 },
      { step: 4, decision: 'Generate response draft', confidence: 0.89 },
      { step: 5, decision: 'Route to approval workflow', confidence: 0.94 },
    ],
    // OpenTelemetry spans - aligned with agents/edges + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-rfp-001',
        parent_span_id: null,
        name: 'Sales Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 22100,
        status: 'OK',
        attributes: { 'agent.id': 'agent-sales-orch', 'agent.role': 'supervisor', 'trust_boundary': '3P' },
        children: [
          { span_id: 'span-rfp-001-input', parent_span_id: 'span-rfp-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-rfp-001-r1', parent_span_id: 'span-rfp-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-rfp-001-r2', parent_span_id: 'span-rfp-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-rfp-001-topic', parent_span_id: 'span-rfp-001', name: 'RFP_Response_Generation', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'RFP_Response_Generation' } },
          { span_id: 'span-rfp-001-r3', parent_span_id: 'span-rfp-001', name: 'Routing Reasoning: Invoke Box Document Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Box Document Agent', 'routing.reason': 'RFP document received. Need to extract and analyze document content before searching knowledge base. Box 3P agent provides OCR and content extraction.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-rfp-001-r4', parent_span_id: 'span-rfp-001', name: 'Routing Reasoning: Invoke Knowledge Base Agent', kind: 'INTERNAL', start_time: 8100, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Knowledge Base Agent', 'routing.reason': 'Box Document Agent extracted 47 pages, identified 12 key requirements. Now search past proposals for similar requirements to inform response.', 'routing.trigger': 'Box Document Agent response received', 'routing.strategy': 'serial', 'routing.priority': 2 } },
          { span_id: 'span-rfp-001-r5', parent_span_id: 'span-rfp-001', name: 'Routing Reasoning: Invoke Draft Generator Agent', kind: 'INTERNAL', start_time: 11200, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Draft Generator Agent', 'routing.reason': 'Knowledge Base found 12 similar proposals with 3 at 90%+ match. Have sufficient context to generate proposal draft using retrieved templates.', 'routing.trigger': 'Knowledge Base Agent response received', 'routing.strategy': 'serial', 'routing.priority': 3 } },
          { span_id: 'span-rfp-001-r6', parent_span_id: 'span-rfp-001', name: 'Routing Reasoning: Invoke DocuSign Approval Agent', kind: 'INTERNAL', start_time: 16000, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'DocuSign Approval Agent', 'routing.reason': 'Draft Generator created 32-page proposal. Document ready for executive approval. Route to DocuSign 3P agent for signature workflow.', 'routing.trigger': 'Draft Generator Agent response received', 'routing.strategy': 'serial', 'routing.priority': 4 } },
          { span_id: 'span-rfp-001-reasoning', parent_span_id: 'span-rfp-001', name: 'Reasoning: Workflow Complete', kind: 'INTERNAL', start_time: 18500, duration: 200, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'RFP response completed: Document Analysis → Knowledge Search → Draft Generation → Approval Routing. Proposal sent to 3 approvers.', 'workflow.pattern': 'serial-pipeline', 'agents.invoked': 4 } },
        ],
      },
      {
        span_id: 'span-rfp-002',
        parent_span_id: 'span-rfp-001',
        name: 'A2A: Box Document Agent',
        kind: 'SERVER',
        start_time: 2800,
        duration: 5200,
        status: 'OK',
        attributes: { 'agent.id': 'agent-box', 'agent.type': '3p', 'vendor': 'Box Inc', 'external': true },
        children: [
          { span_id: 'span-rfp-002-input', parent_span_id: 'span-rfp-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 2800, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-rfp-002-a1', parent_span_id: 'span-rfp-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2801, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-rfp-002-t1', parent_span_id: 'span-rfp-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 2851, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-rfp-002-topic', parent_span_id: 'span-rfp-002', name: 'Document_Processing', kind: 'INTERNAL', start_time: 2852, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Document_Processing' } },
          { span_id: 'span-rfp-002-a2', parent_span_id: 'span-rfp-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2853, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Document Analysis' } },
          { span_id: 'span-rfp-002-a3', parent_span_id: 'span-rfp-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2903, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'OCR Processing' } },
          { span_id: 'span-rfp-002-a4', parent_span_id: 'span-rfp-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2953, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Content Extraction' } },
          { span_id: 'span-rfp-002-doc', parent_span_id: 'span-rfp-002', name: 'Document Analysis', kind: 'INTERNAL', start_time: 3003, duration: 2000, status: 'OK', attributes: { 'operation.type': 'analysis' } },
          { span_id: 'span-rfp-002-ocr', parent_span_id: 'span-rfp-002', name: 'OCR Processing', kind: 'INTERNAL', start_time: 5003, duration: 1800, status: 'OK', attributes: { 'operation.type': 'ocr' } },
          { span_id: 'span-rfp-002-extract', parent_span_id: 'span-rfp-002', name: 'Content Extraction', kind: 'INTERNAL', start_time: 6803, duration: 1100, status: 'OK', attributes: { 'operation.type': 'extraction' } },
          { span_id: 'span-rfp-002-reasoning', parent_span_id: 'span-rfp-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 7903, duration: 97, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Extracted 47 pages, 12 tables, 8 images from RFP document' } },
        ],
      },
      {
        span_id: 'span-rfp-003',
        parent_span_id: 'span-rfp-001',
        name: 'A2A: Knowledge Base Agent',
        kind: 'SERVER',
        start_time: 8000,
        duration: 3100,
        status: 'OK',
        attributes: { 'agent.id': 'agent-knowledge', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-rfp-003-input', parent_span_id: 'span-rfp-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 8000, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-rfp-003-a1', parent_span_id: 'span-rfp-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 8001, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-rfp-003-t1', parent_span_id: 'span-rfp-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 8051, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-rfp-003-topic', parent_span_id: 'span-rfp-003', name: 'Knowledge_Retrieval', kind: 'INTERNAL', start_time: 8052, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Knowledge_Retrieval' } },
          { span_id: 'span-rfp-003-a2', parent_span_id: 'span-rfp-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 8053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Past Proposals Search' } },
          { span_id: 'span-rfp-003-a3', parent_span_id: 'span-rfp-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 8103, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Semantic Matching' } },
          { span_id: 'span-rfp-003-rag', parent_span_id: 'span-rfp-003', name: 'RAG: Past Proposals Search', kind: 'INTERNAL', start_time: 8153, duration: 2100, status: 'OK', attributes: { 'operation.type': 'rag', 'documents_returned': 12 } },
          { span_id: 'span-rfp-003-match', parent_span_id: 'span-rfp-003', name: 'Semantic Matching', kind: 'INTERNAL', start_time: 10253, duration: 700, status: 'OK', attributes: { 'operation.type': 'matching' } },
          { span_id: 'span-rfp-003-reasoning', parent_span_id: 'span-rfp-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 10953, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Found 12 similar proposals, 3 with 90%+ match' } },
        ],
      },
      {
        span_id: 'span-rfp-004',
        parent_span_id: 'span-rfp-001',
        name: 'A2A: Draft Generator Agent',
        kind: 'SERVER',
        start_time: 11100,
        duration: 4800,
        status: 'OK',
        attributes: { 'agent.id': 'agent-draft', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-rfp-004-input', parent_span_id: 'span-rfp-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 11100, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-rfp-004-a1', parent_span_id: 'span-rfp-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 11101, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-rfp-004-t1', parent_span_id: 'span-rfp-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 11151, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-rfp-004-topic', parent_span_id: 'span-rfp-004', name: 'Proposal_Generation', kind: 'INTERNAL', start_time: 11152, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Proposal_Generation' } },
          { span_id: 'span-rfp-004-a2', parent_span_id: 'span-rfp-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 11153, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Template Selection' } },
          { span_id: 'span-rfp-004-a3', parent_span_id: 'span-rfp-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 11203, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Content Generation' } },
          { span_id: 'span-rfp-004-a4', parent_span_id: 'span-rfp-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 11253, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Formatting' } },
          { span_id: 'span-rfp-004-template', parent_span_id: 'span-rfp-004', name: 'Template Selection', kind: 'INTERNAL', start_time: 11303, duration: 600, status: 'OK', attributes: { 'operation.type': 'selection' } },
          { span_id: 'span-rfp-004-gen', parent_span_id: 'span-rfp-004', name: 'Content Generation', kind: 'INTERNAL', start_time: 11903, duration: 3000, status: 'OK', attributes: { 'operation.type': 'generation' } },
          { span_id: 'span-rfp-004-format', parent_span_id: 'span-rfp-004', name: 'Formatting', kind: 'INTERNAL', start_time: 14903, duration: 700, status: 'OK', attributes: { 'operation.type': 'formatting' } },
          { span_id: 'span-rfp-004-reasoning', parent_span_id: 'span-rfp-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 15603, duration: 97, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Generated 32-page proposal using Enterprise template' } },
        ],
      },
      {
        span_id: 'span-rfp-005',
        parent_span_id: 'span-rfp-001',
        name: 'A2A: DocuSign Approval Agent',
        kind: 'SERVER',
        start_time: 15900,
        duration: 2400,
        status: 'OK',
        attributes: { 'agent.id': 'agent-docusign', 'agent.type': '3p', 'vendor': 'DocuSign', 'external': true },
        children: [
          { span_id: 'span-rfp-005-input', parent_span_id: 'span-rfp-005', name: 'Agent Input', kind: 'INTERNAL', start_time: 15900, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-rfp-005-a1', parent_span_id: 'span-rfp-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 15901, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-rfp-005-t1', parent_span_id: 'span-rfp-005', name: 'Topic Selection', kind: 'INTERNAL', start_time: 15951, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-rfp-005-topic', parent_span_id: 'span-rfp-005', name: 'Document_Approval', kind: 'INTERNAL', start_time: 15952, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Document_Approval' } },
          { span_id: 'span-rfp-005-a2', parent_span_id: 'span-rfp-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 15953, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Approval Routing' } },
          { span_id: 'span-rfp-005-a3', parent_span_id: 'span-rfp-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 16003, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Signature Request' } },
          { span_id: 'span-rfp-005-route', parent_span_id: 'span-rfp-005', name: 'Approval Routing', kind: 'INTERNAL', start_time: 16053, duration: 1100, status: 'OK', attributes: { 'operation.type': 'routing' } },
          { span_id: 'span-rfp-005-sign', parent_span_id: 'span-rfp-005', name: 'Signature Request', kind: 'INTERNAL', start_time: 17153, duration: 1100, status: 'OK', attributes: { 'operation.type': 'signature' } },
          { span_id: 'span-rfp-005-reasoning', parent_span_id: 'span-rfp-005', name: 'Reasoning', kind: 'INTERNAL', start_time: 18253, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Routed to 3 approvers, signature envelope created' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-sales-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'Sales Orchestrator',
        role: 'supervisor',
        orgId: 'org-deloitte-sales',
        orgName: 'Deloitte Sales',
        status: 'success',
        latency: 2800,
        capabilities: ['orchestration', 'sales-workflows', 'proposal-generation'],
        isRoot: true,
      },
      {
        id: 'agent-box',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Box Document Agent',
        role: 'specialist',
        vendorName: 'Box Inc',
        agentCardUrl: 'https://api.box.com/.well-known/agent.json',
        registeredAt: '2025-01-15',
        registrationStatus: 'verified',
        status: 'success',
        latency: 5200,
        capabilities: ['document-analysis', 'ocr', 'content-extraction'],
      },
      {
        id: 'agent-knowledge',
        type: AGENT_TYPES.NATIVE,
        name: 'Knowledge Base Agent',
        role: 'specialist',
        orgId: 'org-deloitte-sales',
        orgName: 'Deloitte Sales',
        status: 'success',
        latency: 3100,
        capabilities: ['semantic-search', 'proposal-retrieval'],
      },
  {
        id: 'agent-draft',
        type: AGENT_TYPES.NATIVE,
        name: 'Draft Generator Agent',
        role: 'specialist',
        orgId: 'org-deloitte-sales',
        orgName: 'Deloitte Sales',
        status: 'success',
        latency: 4800,
        capabilities: ['content-generation', 'template-filling'],
      },
      {
        id: 'agent-docusign',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'DocuSign Approval Agent',
        role: 'specialist',
        vendorName: 'DocuSign',
        agentCardUrl: 'https://api.docusign.com/.well-known/agent.json',
        registeredAt: '2025-02-01',
        registrationStatus: 'verified',
        status: 'success',
        latency: 2400,
        capabilities: ['approval-routing', 'signature-collection'],
      },
    ],
    edges: [
      { from: 'agent-sales-orch', to: 'agent-box', status: 'success', dataSize: '2.4 MB', external: true },
      { from: 'agent-box', to: 'agent-sales-orch', status: 'success', dataSize: '156 KB', external: true },
      { from: 'agent-sales-orch', to: 'agent-knowledge', status: 'success', dataSize: '8.2 KB' },
      { from: 'agent-knowledge', to: 'agent-sales-orch', status: 'success', dataSize: '245 KB' },
      { from: 'agent-sales-orch', to: 'agent-draft', status: 'success', dataSize: '312 KB' },
      { from: 'agent-draft', to: 'agent-sales-orch', status: 'success', dataSize: '89 KB' },
      { from: 'agent-sales-orch', to: 'agent-docusign', status: 'success', dataSize: '92 KB', external: true },
      { from: 'agent-docusign', to: 'agent-sales-orch', status: 'success', dataSize: '4.1 KB', external: true },
    ],
    identityFlow: {
      sourceUser: 'sales-rep@deloitte.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.OAUTH,
      crossOrgResolutions: [
        { org: 'Box Inc', orgId: 'vendor-box', status: 'oauth-verified', method: 'oauth', latency: 120 },
        { org: 'DocuSign', orgId: 'vendor-docusign', status: 'oauth-verified', method: 'oauth', latency: 95 },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 480,
      supervisorReasoning: 2800,
      parallelAgentCalls: 0,
      serialAgentCalls: 15500,
      externalAgentCalls: 7600,
      totalDuration: 22100,
    },
    governancePolicies: ['SOC2', 'Deloitte-Data-Policy', 'Client-Confidentiality'],
    mcpCalls: [],
    ragCalls: [
      {
        ragLatency: 2200,
        retrievalStatus: 'success',
        documentsReturned: 12,
        queryText: 'past RFP responses for cloud migration services',
        agentId: 'agent-knowledge',
      },
    ],
  },

  // ❌ MOMA FAILURE - Cross-Org Agent Unreachable
  {
    id: 'mao-004',
    trace_id: 'c0d5e3f4-a6b7-8901-cdef-234567890abc',
    friendlyName: 'Broken-Raven-5501',
    processId: 'proc-insureco-claims-2024-004',
    processAlias: 'Broken-Raven-5501',
    description: 'Insurance claim processing: validation, fraud detection, and manual review fallback',
    priority: 'CRITICAL',
    pattern: 'supervisor',
    rootAgent: 'Insurance Claims Orchestrator',
    rootOrgId: 'org-insureco-claims',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    duration: 35000,
    turnCount: 6,
    status: 'failed',
    statusEnum: 'FAILURE',
    errorCode: 'CONNECTION_REFUSED',
    theme: 'Silent Drop',
    flowDepth: 3,
    totalLatency: 35000,
    failingComponent: 'Fraud Detection Agent',
    failingComponentLatency: 30000,
    failureDescription: 'Cross-org agent unreachable - Trust boundary connection failed',
    failureLayer: 'Infrastructure',
    intentSummary: 'I need to process an insurance claim and check for fraud.',
    responseSummary: 'The agent validated the claim data and verified policy coverage. However, the Fraud Detection Agent (cross-org) was unreachable after 30 seconds. The workflow was escalated to manual review queue for human evaluation.',
    topics: ['Insurance_Claim_Processing', 'Claim_Validation', 'Fraud_Detection', 'Human_Escalation'],
    actions: ['Data Validation', 'Policy Lookup', 'Connection Attempt', 'Human Handoff', 'Queue Assignment'],
    intentTag: 'Claim Processing',
    qualityScore: 'Low',
    qualityScoreReason: 'The agent encountered errors during execution at Fraud Detection Agent. Cross-org agent unreachable - Trust boundary connection failed. The request could not be fully processed.',
    trustBoundary: {
      type: 'MOMA',
      primaryOrg: 'InsureCo Claims',
      orgId: 'org-insureco-claims',
      orgs: ['InsureCo Claims', 'InsureCo Fraud Unit'],
      boundaryId: 'DC1-INSURECO-001',
    },
    supervisorDecisions: [
      { step: 1, decision: 'Validate claim details', confidence: 0.96 },
      { step: 2, decision: 'Route to Fraud Detection Agent for risk assessment', confidence: 0.92 },
      { step: 3, decision: 'FAILED: Agent unreachable after 30s timeout', confidence: 0 },
    ],
    // OpenTelemetry spans - aligned with agents/edges + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-ins-001',
        parent_span_id: null,
        name: 'Claims Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 35000,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-claims-orch', 'agent.role': 'supervisor', 'trust_boundary': 'MOMA', 'error': true },
        children: [
          { span_id: 'span-ins-001-input', parent_span_id: 'span-ins-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-ins-001-r1', parent_span_id: 'span-ins-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-ins-001-r2', parent_span_id: 'span-ins-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-ins-001-topic', parent_span_id: 'span-ins-001', name: 'Insurance_Claim_Processing', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Insurance_Claim_Processing' } },
          { span_id: 'span-ins-001-r3', parent_span_id: 'span-ins-001', name: 'Routing Reasoning: Invoke Claim Validator Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Claim Validator Agent', 'routing.reason': 'Insurance claim submitted. Must validate claim data and verify policy coverage before fraud check can proceed.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-ins-001-r4', parent_span_id: 'span-ins-001', name: 'Routing Reasoning: Invoke Fraud Detection Agent', kind: 'INTERNAL', start_time: 4000, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Fraud Detection Agent', 'routing.reason': 'Claim Validator confirmed valid claim and active policy. Claim amount $15,000 exceeds threshold. Must run fraud detection before approval.', 'routing.trigger': 'Claim Validator Agent response received', 'routing.strategy': 'serial', 'routing.priority': 2 } },
          { span_id: 'span-ins-001-error', parent_span_id: 'span-ins-001', name: 'Error: Cross-org agent unreachable', kind: 'INTERNAL', start_time: 34000, duration: 100, status: 'ERROR', attributes: { 'operation.type': 'error', 'error': true, 'error.message': 'Fraud Detection Agent (cross-org) connection timeout after 30s. Agent instance not responding.' } },
          { span_id: 'span-ins-001-r5', parent_span_id: 'span-ins-001', name: 'Routing Reasoning: Invoke Manual Review Queue (Fallback)', kind: 'INTERNAL', start_time: 34100, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Manual Review Queue (Fallback)', 'routing.reason': 'Fraud Detection Agent failed (timeout). Claim cannot be auto-approved without fraud check. Escalating to human reviewer per policy requirement.', 'routing.trigger': 'Fraud Detection Agent error', 'routing.strategy': 'fallback', 'routing.priority': 3 } },
          { span_id: 'span-ins-001-reasoning', parent_span_id: 'span-ins-001', name: 'Reasoning: Workflow Completed with Fallback', kind: 'INTERNAL', start_time: 35000, duration: 200, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Claim processing failed at fraud detection. Fallback triggered: routed to manual review queue #247. Human escalation required.', 'workflow.pattern': 'serial-with-fallback', 'agents.invoked': 3, 'fallback.triggered': true } },
        ],
      },
      {
        span_id: 'span-ins-002',
        parent_span_id: 'span-ins-001',
        name: 'A2A: Claim Validator Agent',
        kind: 'SERVER',
        start_time: 1800,
        duration: 2200,
        status: 'OK',
        attributes: { 'agent.id': 'agent-validator', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-ins-002-input', parent_span_id: 'span-ins-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 1800, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-ins-002-a1', parent_span_id: 'span-ins-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1801, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-ins-002-t1', parent_span_id: 'span-ins-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1851, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-ins-002-topic', parent_span_id: 'span-ins-002', name: 'Claim_Validation', kind: 'INTERNAL', start_time: 1852, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Claim_Validation' } },
          { span_id: 'span-ins-002-a2', parent_span_id: 'span-ins-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1853, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Data Validation' } },
          { span_id: 'span-ins-002-a3', parent_span_id: 'span-ins-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1903, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Policy Lookup' } },
          { span_id: 'span-ins-002-val', parent_span_id: 'span-ins-002', name: 'Data Validation', kind: 'INTERNAL', start_time: 1953, duration: 1000, status: 'OK', attributes: { 'operation.type': 'validation' } },
          { span_id: 'span-ins-002-lookup', parent_span_id: 'span-ins-002', name: 'Policy Lookup', kind: 'INTERNAL', start_time: 2953, duration: 900, status: 'OK', attributes: { 'operation.type': 'lookup' } },
          { span_id: 'span-ins-002-reasoning', parent_span_id: 'span-ins-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 3853, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Claim validated, policy coverage confirmed' } },
        ],
      },
      {
        span_id: 'span-ins-003',
        parent_span_id: 'span-ins-001',
        name: 'A2A: Fraud Detection Agent',
        kind: 'SERVER',
        start_time: 4000,
        duration: 30000,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-fraud', 'agent.role': 'specialist', 'cross_org': true, 'source_org': 'InsureCo Fraud Unit', 'error': true, 'error.message': 'Connection refused - Agent instance not responding after 30s' },
        children: [
          { span_id: 'span-ins-003-input', parent_span_id: 'span-ins-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 4000, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-ins-003-a1', parent_span_id: 'span-ins-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 4001, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-ins-003-t1', parent_span_id: 'span-ins-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 4051, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-ins-003-topic', parent_span_id: 'span-ins-003', name: 'Fraud_Detection', kind: 'INTERNAL', start_time: 4052, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Fraud_Detection' } },
          { span_id: 'span-ins-003-a2', parent_span_id: 'span-ins-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 4053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Connection Attempt' } },
          { span_id: 'span-ins-003-conn', parent_span_id: 'span-ins-003', name: 'Connection Attempt', kind: 'CLIENT', start_time: 4103, duration: 29800, status: 'ERROR', attributes: { 'operation.type': 'connection', 'error': true, 'error.type': 'ConnectionTimeout' } },
          { span_id: 'span-ins-003-reasoning', parent_span_id: 'span-ins-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 33903, duration: 97, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Connection timeout after 30s - external service unreachable' } },
        ],
      },
      {
        span_id: 'span-ins-004',
        parent_span_id: 'span-ins-001',
        name: 'A2A: Manual Review Queue (Fallback)',
        kind: 'SERVER',
        start_time: 34000,
        duration: 800,
        status: 'OK',
        attributes: { 'agent.id': 'agent-fallback', 'agent.role': 'fallback', 'is_fallback': true },
        children: [
          { span_id: 'span-ins-004-input', parent_span_id: 'span-ins-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 34000, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-ins-004-a1', parent_span_id: 'span-ins-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 34001, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-ins-004-t1', parent_span_id: 'span-ins-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 34051, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-ins-004-topic', parent_span_id: 'span-ins-004', name: 'Human_Escalation', kind: 'INTERNAL', start_time: 34052, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Human_Escalation' } },
          { span_id: 'span-ins-004-a2', parent_span_id: 'span-ins-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 34053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Human Handoff' } },
          { span_id: 'span-ins-004-a3', parent_span_id: 'span-ins-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 34103, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Queue Assignment' } },
          { span_id: 'span-ins-004-handoff', parent_span_id: 'span-ins-004', name: 'Human Handoff', kind: 'INTERNAL', start_time: 34153, duration: 400, status: 'OK', attributes: { 'operation.type': 'handoff' } },
          { span_id: 'span-ins-004-queue', parent_span_id: 'span-ins-004', name: 'Queue Assignment', kind: 'INTERNAL', start_time: 34553, duration: 200, status: 'OK', attributes: { 'operation.type': 'queue' } },
          { span_id: 'span-ins-004-reasoning', parent_span_id: 'span-ins-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 34753, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Escalated to human reviewer - queue #247' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-claims-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'Claims Orchestrator',
        role: 'supervisor',
        orgId: 'org-insureco-claims',
        orgName: 'InsureCo Claims',
        status: 'success',
        latency: 1800,
        capabilities: ['claims-processing', 'orchestration'],
        isRoot: true,
      },
      {
        id: 'agent-validator',
        type: AGENT_TYPES.NATIVE,
        name: 'Claim Validator Agent',
        role: 'specialist',
        orgId: 'org-insureco-claims',
        orgName: 'InsureCo Claims',
        status: 'success',
        latency: 2200,
        capabilities: ['data-validation', 'policy-lookup'],
      },
      {
        id: 'agent-fraud',
        type: AGENT_TYPES.SHARED,
        name: 'Fraud Detection Agent',
        role: 'specialist',
        orgId: 'org-insureco-fraud',
        orgName: 'InsureCo Fraud Unit',
        sourceOrg: 'InsureCo Fraud Unit',
        sharedVia: 'DC1-INSURECO-001',
        status: 'unreachable',
        latency: 30000,
        capabilities: ['fraud-scoring', 'pattern-detection'],
        errorMessage: 'Connection refused - Agent instance not responding after 30s',
      },
      {
        id: 'agent-fallback',
        type: AGENT_TYPES.NATIVE,
        name: 'Manual Review Queue',
        role: 'fallback',
        orgId: 'org-insureco-claims',
        orgName: 'InsureCo Claims',
        status: 'success',
        latency: 800,
        capabilities: ['human-handoff', 'queue-management'],
      },
    ],
    edges: [
      { from: 'agent-claims-orch', to: 'agent-validator', status: 'success', dataSize: '8.2 KB' },
      { from: 'agent-validator', to: 'agent-claims-orch', status: 'success', dataSize: '12.1 KB' },
      { from: 'agent-claims-orch', to: 'agent-fraud', status: 'error', dataSize: '0 KB', crossOrg: true },
      { from: 'agent-claims-orch', to: 'agent-fallback', status: 'success', dataSize: '15.2 KB', isFallback: true },
    ],
    identityFlow: {
      sourceUser: 'claims-adjuster@insureco.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.VERIFIED_EMAIL,
      crossOrgResolutions: [
        { org: 'InsureCo Fraud Unit', orgId: 'org-insureco-fraud', status: 'failed', method: 'verified-email', latency: 30000, error: 'Connection timeout' },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 420,
      supervisorReasoning: 1800,
      parallelAgentCalls: 0,
      serialAgentCalls: 3000,
      failedAgentTimeout: 30000,
      totalDuration: 35000,
    },
    governancePolicies: ['HIPAA', 'Insurance-Regulations', 'Fraud-Prevention'],
    mcpCalls: [],
    ragCalls: [],
    impactAnalysis: {
      brokenWorkflows: ['Auto-Fraud-Check', 'High-Value-Claims'],
      affectedAgents: ['Fraud Detection Agent'],
      suggestedActions: ['Enable human-in-the-loop fallback', 'Contact Fraud Unit admin'],
    },
  },

  // ❌ 3P FAILURE - External Agent Schema Violation
  {
    id: 'mao-005',
    trace_id: 'd1e6f4a5-b7c8-9012-def0-345678901bcd',
    friendlyName: 'Schema-Wolf-2234',
    processId: 'proc-techsupport-ticket-2024-005',
    processAlias: 'Schema-Wolf-2234',
    description: 'Customer support ticket workflow: issue analysis, knowledge base search, and Zendesk ticket creation',
    priority: 'MEDIUM',
    pattern: 'supervisor',
    rootAgent: 'Support Orchestrator',
    rootOrgId: 'org-techsupport',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    duration: 12500,
    turnCount: 7,
    status: 'failed',
    statusEnum: 'FAILURE',
    errorCode: 'SCHEMA_VIOLATION',
    theme: 'Tool Error',
    flowDepth: 4,
    totalLatency: 12500,
    failingComponent: 'Zendesk Ticket Agent',
    failingComponentLatency: 180,
    failureDescription: '3P Agent A2A schema violation - Invalid response format',
    failureLayer: 'Logic',
    intentSummary: 'I need help with a billing issue on my account.',
    responseSummary: 'The agent analyzed the issue, detected negative sentiment and classified it as a billing dispute. Knowledge base search found resolution procedures. However, when attempting to create a Zendesk ticket, the 3P agent returned an invalid response format missing the required ticket_id field. Workflow terminated.',
    topics: ['Customer_Support_Ticket', 'Issue_Analysis', 'Knowledge_Search', 'Ticket_Creation'],
    actions: ['Sentiment Analysis', 'Issue Classification', 'Troubleshooting Search', 'Solution Matching', 'Ticket Creation', 'Schema Validation'],
    intentTag: 'Billing Support',
    qualityScore: 'Low',
    qualityScoreReason: 'The agent encountered errors during execution at Zendesk Ticket Agent. 3P Agent A2A schema violation - Invalid response format. The request could not be fully processed.',
    trustBoundary: {
      type: '3P',
      primaryOrg: 'TechSupport Inc',
      orgId: 'org-techsupport',
      orgs: ['TechSupport Inc'],
      externalVendors: ['Zendesk'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'Analyze customer issue from chat', confidence: 0.94 },
      { step: 2, decision: 'Search knowledge base for solutions', confidence: 0.91 },
      { step: 3, decision: 'Create ticket in Zendesk via 3P agent', confidence: 0.88 },
      { step: 4, decision: 'FAILED: 3P agent returned invalid schema', confidence: 0 },
    ],
    // OpenTelemetry spans - aligned with agents/edges + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-sup-001',
        parent_span_id: null,
        name: 'Support Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 12500,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-support-orch', 'agent.role': 'supervisor', 'trust_boundary': '3P', 'error': true },
        children: [
          { span_id: 'span-sup-001-input', parent_span_id: 'span-sup-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-sup-001-r1', parent_span_id: 'span-sup-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-sup-001-r2', parent_span_id: 'span-sup-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-sup-001-topic', parent_span_id: 'span-sup-001', name: 'Customer_Support_Ticket', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Customer_Support_Ticket' } },
          { span_id: 'span-sup-001-r3', parent_span_id: 'span-sup-001', name: 'Routing Reasoning: Invoke Issue Analyzer Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Issue Analyzer Agent', 'routing.reason': 'Customer support ticket received. First analyze sentiment and classify issue type to determine appropriate resolution path.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-sup-001-r4', parent_span_id: 'span-sup-001', name: 'Routing Reasoning: Invoke Knowledge Agent', kind: 'INTERNAL', start_time: 3600, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Knowledge Agent', 'routing.reason': 'Issue Analyzer detected negative sentiment, classified as billing dispute. Search knowledge base for billing issue resolution procedures.', 'routing.trigger': 'Issue Analyzer Agent response received', 'routing.strategy': 'serial', 'routing.priority': 2 } },
          { span_id: 'span-sup-001-r5', parent_span_id: 'span-sup-001', name: 'Routing Reasoning: Invoke Zendesk Ticket Agent', kind: 'INTERNAL', start_time: 5400, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Zendesk Ticket Agent', 'routing.reason': 'Knowledge Agent found resolution: apply billing credit. Create Zendesk ticket to track resolution and notify customer.', 'routing.trigger': 'Knowledge Agent response received', 'routing.strategy': 'serial', 'routing.priority': 3 } },
          { span_id: 'span-sup-001-error', parent_span_id: 'span-sup-001', name: 'Error: A2A Schema Violation', kind: 'INTERNAL', start_time: 5730, duration: 100, status: 'ERROR', attributes: { 'operation.type': 'error', 'error': true, 'error.message': 'Zendesk 3P agent response missing required field "ticket_id". Schema validation failed.' } },
          { span_id: 'span-sup-001-reasoning', parent_span_id: 'span-sup-001', name: 'Reasoning: Workflow Failed', kind: 'INTERNAL', start_time: 5830, duration: 200, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Workflow terminated: Zendesk 3P agent returned invalid A2A schema. Missing ticket_id field. Cannot confirm ticket creation.', 'workflow.pattern': 'serial-pipeline', 'agents.invoked': 3, 'schema.violation': true } },
        ],
      },
      {
        span_id: 'span-sup-002',
        parent_span_id: 'span-sup-001',
        name: 'A2A: Issue Analyzer Agent',
        kind: 'SERVER',
        start_time: 1500,
        duration: 2100,
        status: 'OK',
        attributes: { 'agent.id': 'agent-analyzer', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-sup-002-input', parent_span_id: 'span-sup-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 1500, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-sup-002-a1', parent_span_id: 'span-sup-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1501, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-sup-002-t1', parent_span_id: 'span-sup-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1551, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-sup-002-topic', parent_span_id: 'span-sup-002', name: 'Issue_Analysis', kind: 'INTERNAL', start_time: 1552, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Issue_Analysis' } },
          { span_id: 'span-sup-002-a2', parent_span_id: 'span-sup-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1553, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Sentiment Analysis' } },
          { span_id: 'span-sup-002-a3', parent_span_id: 'span-sup-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 1603, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Issue Classification' } },
          { span_id: 'span-sup-002-sent', parent_span_id: 'span-sup-002', name: 'Sentiment Analysis', kind: 'INTERNAL', start_time: 1653, duration: 800, status: 'OK', attributes: { 'operation.type': 'analysis' } },
          { span_id: 'span-sup-002-class', parent_span_id: 'span-sup-002', name: 'Issue Classification', kind: 'INTERNAL', start_time: 2453, duration: 1000, status: 'OK', attributes: { 'operation.type': 'classification' } },
          { span_id: 'span-sup-002-reasoning', parent_span_id: 'span-sup-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 3453, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Negative sentiment detected, classified as billing issue' } },
        ],
      },
      {
        span_id: 'span-sup-003',
        parent_span_id: 'span-sup-001',
        name: 'A2A: Knowledge Agent',
        kind: 'SERVER',
        start_time: 3600,
        duration: 1800,
        status: 'OK',
        attributes: { 'agent.id': 'agent-kb', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-sup-003-input', parent_span_id: 'span-sup-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 3600, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-sup-003-a1', parent_span_id: 'span-sup-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 3601, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-sup-003-t1', parent_span_id: 'span-sup-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 3651, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-sup-003-topic', parent_span_id: 'span-sup-003', name: 'Knowledge_Search', kind: 'INTERNAL', start_time: 3652, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Knowledge_Search' } },
          { span_id: 'span-sup-003-a2', parent_span_id: 'span-sup-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 3653, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'RAG Search' } },
          { span_id: 'span-sup-003-a3', parent_span_id: 'span-sup-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 3703, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Solution Matching' } },
          { span_id: 'span-sup-003-rag', parent_span_id: 'span-sup-003', name: 'RAG: Troubleshooting Search', kind: 'INTERNAL', start_time: 3753, duration: 1000, status: 'OK', attributes: { 'operation.type': 'rag', 'documents_returned': 5 } },
          { span_id: 'span-sup-003-match', parent_span_id: 'span-sup-003', name: 'Solution Matching', kind: 'INTERNAL', start_time: 4753, duration: 500, status: 'OK', attributes: { 'operation.type': 'matching' } },
          { span_id: 'span-sup-003-reasoning', parent_span_id: 'span-sup-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 5253, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Found 5 relevant articles, best match 87%' } },
        ],
      },
      {
        span_id: 'span-sup-004',
        parent_span_id: 'span-sup-001',
        name: 'A2A: Zendesk Ticket Agent',
        kind: 'SERVER',
        start_time: 5400,
        duration: 180,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-zendesk', 'agent.type': '3p', 'vendor': 'Zendesk', 'external': true, 'error': true, 'error.type': 'SchemaViolation', 'error.message': 'A2A Schema Violation: Response missing required field "ticket_id"' },
        children: [
          { span_id: 'span-sup-004-input', parent_span_id: 'span-sup-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 5400, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-sup-004-a1', parent_span_id: 'span-sup-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 5401, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-sup-004-t1', parent_span_id: 'span-sup-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 5451, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-sup-004-topic', parent_span_id: 'span-sup-004', name: 'Ticket_Creation', kind: 'INTERNAL', start_time: 5452, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Ticket_Creation' } },
          { span_id: 'span-sup-004-a2', parent_span_id: 'span-sup-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 5453, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Ticket Creation' } },
          { span_id: 'span-sup-004-a3', parent_span_id: 'span-sup-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 5503, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Schema Validation' } },
          { span_id: 'span-sup-004-create', parent_span_id: 'span-sup-004', name: 'Ticket Creation', kind: 'CLIENT', start_time: 5553, duration: 100, status: 'OK', attributes: { 'operation.type': 'create' } },
          { span_id: 'span-sup-004-validate', parent_span_id: 'span-sup-004', name: 'Schema Validation', kind: 'INTERNAL', start_time: 5653, duration: 30, status: 'ERROR', attributes: { 'operation.type': 'validation', 'error': true, 'missing_fields': ['ticket_id'] } },
          { span_id: 'span-sup-004-reasoning', parent_span_id: 'span-sup-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 5683, duration: 47, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Schema validation failed - missing ticket_id field' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-support-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'Support Orchestrator',
        role: 'supervisor',
        orgId: 'org-techsupport',
        orgName: 'TechSupport Inc',
        status: 'success',
        latency: 1500,
        capabilities: ['orchestration', 'support-workflows'],
        isRoot: true,
      },
      {
        id: 'agent-analyzer',
        type: AGENT_TYPES.NATIVE,
        name: 'Issue Analyzer Agent',
        role: 'specialist',
        orgId: 'org-techsupport',
        orgName: 'TechSupport Inc',
        status: 'success',
        latency: 2100,
        capabilities: ['sentiment-analysis', 'issue-classification'],
      },
      {
        id: 'agent-kb',
        type: AGENT_TYPES.NATIVE,
        name: 'Knowledge Agent',
        role: 'specialist',
        orgId: 'org-techsupport',
        orgName: 'TechSupport Inc',
        status: 'success',
        latency: 1800,
        capabilities: ['knowledge-retrieval', 'solution-matching'],
      },
      {
        id: 'agent-zendesk',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Zendesk Ticket Agent',
        role: 'specialist',
        vendorName: 'Zendesk',
        agentCardUrl: 'https://api.zendesk.com/.well-known/agent.json',
        registeredAt: '2025-01-20',
        registrationStatus: 'verified',
        status: 'error',
        latency: 180,
        capabilities: ['ticket-creation', 'ticket-update'],
        errorMessage: 'A2A Schema Violation: Response missing required field "ticket_id"',
        schemaViolation: {
          expected: { ticket_id: 'string', status: 'string', url: 'string' },
          received: { status: 'created', url: 'https://zendesk.com/ticket/...' },
          missingFields: ['ticket_id'],
        },
      },
    ],
    edges: [
      { from: 'agent-support-orch', to: 'agent-analyzer', status: 'success', dataSize: '4.2 KB' },
      { from: 'agent-analyzer', to: 'agent-support-orch', status: 'success', dataSize: '2.1 KB' },
      { from: 'agent-support-orch', to: 'agent-kb', status: 'success', dataSize: '1.8 KB' },
      { from: 'agent-kb', to: 'agent-support-orch', status: 'success', dataSize: '28.4 KB' },
      { from: 'agent-support-orch', to: 'agent-zendesk', status: 'error', dataSize: '6.2 KB', external: true },
    ],
    identityFlow: {
      sourceUser: 'support-agent@techsupport.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.OAUTH,
      crossOrgResolutions: [
        { org: 'Zendesk', orgId: 'vendor-zendesk', status: 'oauth-verified', method: 'oauth', latency: 85 },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 320,
      supervisorReasoning: 1500,
      parallelAgentCalls: 0,
      serialAgentCalls: 5900,
      externalAgentCalls: 180,
      totalDuration: 12500,
      },
    governancePolicies: ['SOC2', 'Data-Privacy'],
    mcpCalls: [],
    ragCalls: [
      {
        ragLatency: 1200,
        retrievalStatus: 'success',
        documentsReturned: 5,
        queryText: 'network connectivity issues troubleshooting steps',
        agentId: 'agent-kb',
      },
    ],
  },

  // ❌ SOMA FAILURE - Logic Loop Between Agents
  {
    id: 'mao-006',
    trace_id: 'e2f7a5b6-c8d9-0123-ef01-456789012cde',
    friendlyName: 'Loop-Cobra-9912',
    processId: 'proc-retailco-order-2024-006',
    processAlias: 'Loop-Cobra-9912',
    description: 'Order processing workflow: inventory check and dynamic pricing calculation',
    priority: 'HIGH',
    pattern: 'supervisor',
    rootAgent: 'Order Orchestrator',
    rootOrgId: 'org-retailco',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    duration: 145000,
    turnCount: 52,
    status: 'failed',
    statusEnum: 'FAILURE',
    errorCode: 'LOOP_DETECTED',
    theme: 'Logic Loop',
    flowDepth: 52,
    totalLatency: 145000,
    failingComponent: 'Inventory Agent ↔ Pricing Agent',
    failingComponentLatency: null,
    failureDescription: 'Supervisor failed to detect circular dependency between specialists',
    failureLayer: 'Logic',
    intentSummary: 'I need to check inventory and get pricing for SKU-8891.',
    responseSummary: 'The agent attempted to check inventory and calculate dynamic pricing, but a circular dependency was detected between Inventory Agent and Pricing Agent. The agents kept requesting updates from each other, resulting in 26 iterations before the loop was detected and terminated.',
    topics: ['Order_Processing', 'Inventory_Check', 'Dynamic_Pricing'],
    actions: ['CheckInventory', 'GetDynamicPrice', 'Stock Check Logic', 'Discount Calculation'],
    intentTag: 'Order Processing',
    qualityScore: 'Low',
    qualityScoreReason: 'The agent encountered errors during execution. Supervisor failed to detect circular dependency between specialists. The request could not be fully processed.',
    trustBoundary: {
      type: 'SOMA',
      enum: 'INTERNAL',
      primaryOrg: 'RetailCo',
      orgId: 'org-retailco',
      orgs: ['RetailCo'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'Validate order items', confidence: 0.95 },
      { step: 2, decision: 'Check inventory levels', confidence: 0.92 },
      { step: 3, decision: 'Get dynamic pricing (inventory affects price)', confidence: 0.88 },
      { step: 4, decision: 'Re-check inventory (price affects allocation)', confidence: 0.85 },
      { step: 5, decision: '... (loop detected after 26 iterations)', confidence: 0.12 },
    ],
    // OpenTelemetry spans - showing loop pattern + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-loop-001',
        parent_span_id: null,
        name: 'Order Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 145000,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-order-orch', 'agent.role': 'supervisor', 'trust_boundary': 'SOMA', 'error': true, 'loop_detected': true, 'loop_count': 26 },
        children: [
          { span_id: 'span-loop-001-input', parent_span_id: 'span-loop-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-loop-001-r1', parent_span_id: 'span-loop-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-loop-001-r2', parent_span_id: 'span-loop-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-loop-001-topic', parent_span_id: 'span-loop-001', name: 'Order_Processing', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Order_Processing' } },
          { span_id: 'span-loop-001-r3', parent_span_id: 'span-loop-001', name: 'Routing Reasoning: Invoke Inventory Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Inventory Agent', 'routing.reason': 'Order placed for SKU-8891. Check inventory availability before calculating price.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-loop-001-r4', parent_span_id: 'span-loop-001', name: 'Routing Reasoning: Invoke Pricing Agent', kind: 'INTERNAL', start_time: 2003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Pricing Agent', 'routing.reason': 'Inventory Agent reports 47 units available. Calculate dynamic price based on current stock levels and demand.', 'routing.trigger': 'Inventory Agent response received', 'routing.strategy': 'serial', 'routing.priority': 2 } },
          { span_id: 'span-loop-001-r5', parent_span_id: 'span-loop-001', name: 'Routing Reasoning: Re-invoke Inventory Agent', kind: 'INTERNAL', start_time: 3003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Inventory Agent', 'routing.reason': 'Pricing Agent calculated $149.99 but requested inventory recheck due to price tier change. This triggered a loop...', 'routing.trigger': 'Pricing Agent requested inventory recheck', 'routing.strategy': 'serial', 'routing.iteration': 2 } },
          { span_id: 'span-loop-001-error', parent_span_id: 'span-loop-001', name: 'Error: Logic Loop Detected', kind: 'INTERNAL', start_time: 39000, duration: 100, status: 'ERROR', attributes: { 'operation.type': 'error', 'error': true, 'error.message': 'Circular dependency detected: Inventory ↔ Pricing after 26 iterations. Each agent requests update from the other.', 'loop.count': 26, 'loop.agents': ['Inventory Agent', 'Pricing Agent'] } },
          { span_id: 'span-loop-001-reasoning', parent_span_id: 'span-loop-001', name: 'Reasoning: Loop Terminated', kind: 'INTERNAL', start_time: 39100, duration: 200, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Workflow terminated: Circular dependency between Inventory and Pricing agents. Price changes trigger inventory recheck, which changes price tier. Loop breaker activated at 26 iterations.', 'workflow.pattern': 'circular-dependency', 'agents.invoked': 52, 'loop.detected': true } },
        ],
      },
      {
        span_id: 'span-loop-002',
        parent_span_id: 'span-loop-001',
        name: 'A2A: Inventory Agent (Loop x26)',
        kind: 'SERVER',
        start_time: 2000,
        duration: 36000,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-inventory', 'agent.role': 'specialist', 'loop_count': 26, 'is_loop': true },
        children: [
          { span_id: 'span-loop-002-input', parent_span_id: 'span-loop-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 2000, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-loop-002-a1', parent_span_id: 'span-loop-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2001, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-loop-002-t1', parent_span_id: 'span-loop-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 2051, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-loop-002-topic', parent_span_id: 'span-loop-002', name: 'Inventory_Check', kind: 'INTERNAL', start_time: 2052, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Inventory_Check' } },
          { span_id: 'span-loop-002-a2', parent_span_id: 'span-loop-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Inventory System MCP' } },
          { span_id: 'span-loop-002-a3', parent_span_id: 'span-loop-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 2103, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Stock Check Logic' } },
          { span_id: 'span-loop-002-mcp', parent_span_id: 'span-loop-002', name: 'MCP: Inventory System (x26)', kind: 'CLIENT', start_time: 2153, duration: 11500, status: 'OK', attributes: { 'mcp.tool.name': 'inventory-system', 'mcp.operation': 'CheckInventory', 'repetitive_count': 26, 'turns': 26 } },
          { span_id: 'span-loop-002-check', parent_span_id: 'span-loop-002', name: 'Stock Check Logic (x26)', kind: 'INTERNAL', start_time: 13653, duration: 22000, status: 'OK', attributes: { 'operation.type': 'check', 'repetitive_count': 26 } },
          { span_id: 'span-loop-002-reasoning', parent_span_id: 'span-loop-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 35653, duration: 347, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Loop detected - 26 iterations with Pricing Agent' } },
        ],
      },
      {
        span_id: 'span-loop-003',
        parent_span_id: 'span-loop-001',
        name: 'A2A: Pricing Agent (Loop x26)',
        kind: 'SERVER',
        start_time: 2000,
        duration: 37000,
        status: 'ERROR',
        attributes: { 'agent.id': 'agent-pricing', 'agent.role': 'specialist', 'loop_count': 26, 'is_loop': true, 'parallel': true },
        children: [
          { span_id: 'span-loop-003-input', parent_span_id: 'span-loop-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 2000, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-loop-003-a1', parent_span_id: 'span-loop-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 2001, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-loop-003-t1', parent_span_id: 'span-loop-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 2051, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-loop-003-topic', parent_span_id: 'span-loop-003', name: 'Dynamic_Pricing', kind: 'INTERNAL', start_time: 2052, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Dynamic_Pricing' } },
          { span_id: 'span-loop-003-a2', parent_span_id: 'span-loop-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 2053, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Pricing Engine MCP' } },
          { span_id: 'span-loop-003-a3', parent_span_id: 'span-loop-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 2103, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Discount Calculation' } },
          { span_id: 'span-loop-003-mcp', parent_span_id: 'span-loop-003', name: 'MCP: Pricing Engine (x26)', kind: 'CLIENT', start_time: 2153, duration: 9700, status: 'OK', attributes: { 'mcp.tool.name': 'pricing-engine', 'mcp.operation': 'GetDynamicPrice', 'repetitive_count': 26, 'turns': 26 } },
          { span_id: 'span-loop-003-calc', parent_span_id: 'span-loop-003', name: 'Discount Calculation (x26)', kind: 'INTERNAL', start_time: 11853, duration: 27000, status: 'OK', attributes: { 'operation.type': 'calculation', 'repetitive_count': 26 } },
          { span_id: 'span-loop-003-reasoning', parent_span_id: 'span-loop-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 38853, duration: 147, status: 'ERROR', attributes: { 'operation.type': 'reasoning', 'error': true, 'reasoning.summary': 'Loop detected - 26 iterations with Inventory Agent' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-order-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'Order Orchestrator',
        role: 'supervisor',
        orgId: 'org-retailco',
        orgName: 'RetailCo',
        status: 'warning',
        latency: 72000,
        capabilities: ['order-processing', 'orchestration'],
        isRoot: true,
        loopCount: 26,
      },
      {
        id: 'agent-inventory',
        type: AGENT_TYPES.NATIVE,
        name: 'Inventory Agent',
        role: 'specialist',
        orgId: 'org-retailco',
        orgName: 'RetailCo',
        status: 'warning',
        latency: 36000,
        capabilities: ['stock-check', 'allocation'],
        loopCount: 26,
      },
      {
        id: 'agent-pricing',
        type: AGENT_TYPES.NATIVE,
        name: 'Pricing Agent',
        role: 'specialist',
        orgId: 'org-retailco',
        orgName: 'RetailCo',
        status: 'warning',
        latency: 37000,
        capabilities: ['dynamic-pricing', 'discount-calculation'],
        loopCount: 26,
      },
    ],
    edges: [
      { from: 'agent-order-orch', to: 'agent-inventory', status: 'warning', isLoop: true, loopCount: 26 },
      { from: 'agent-inventory', to: 'agent-order-orch', status: 'warning', isLoop: true, loopCount: 26 },
      { from: 'agent-order-orch', to: 'agent-pricing', status: 'warning', isLoop: true, loopCount: 26 },
      { from: 'agent-pricing', to: 'agent-order-orch', status: 'warning', isLoop: true, loopCount: 26 },
    ],
    identityFlow: {
      sourceUser: 'customer@email.com',
      sourceUserType: 'B2C Authenticated',
      resolutionMethod: IDENTITY_METHODS.B2C_AUTH,
      crossOrgResolutions: [],
    },
    latencyBreakdown: {
      gatewayOverhead: 0,
      supervisorReasoning: 72000,
      parallelAgentCalls: 0,
      serialAgentCalls: 73000,
      totalDuration: 145000,
    },
    governancePolicies: ['PCI-DSS', 'Retail-Operations'],
    mcpCalls: [
      {
        toolName: 'CheckInventory',
        toolProvider: 'Inventory-System',
        agentId: 'agent-inventory',
        responseStatus: 200,
        toolLatency: 450,
        repetitiveToolCount: 26,
      },
      {
        toolName: 'GetDynamicPrice',
        toolProvider: 'Pricing-Engine',
        agentId: 'agent-pricing',
        responseStatus: 200,
        toolLatency: 380,
        repetitiveToolCount: 26,
      },
    ],
    ragCalls: [],
  },

  // ✅ 3P SUCCESS - Product Recall with External Vendors
  {
    id: 'mao-007',
    trace_id: 'f3a8b6c7-d9e0-1234-f012-567890123def',
    friendlyName: 'Recall-Tiger-4456',
    processId: 'proc-sonos-recall-2024-007',
    processAlias: 'Recall-Tiger-4456',
    description: 'Product recall crisis management: complaint aggregation, batch identification, and customer notification via SMS and email',
    priority: 'CRITICAL',
    pattern: 'supervisor',
    rootAgent: 'Crisis Response Orchestrator',
    rootOrgId: 'org-sonos',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    duration: 45200,
    turnCount: 18,
    status: 'success',
    statusEnum: 'SUCCESS',
    errorCode: null,
    theme: null,
    flowDepth: 7,
    totalLatency: 45200,
    failingComponent: null,
    failingComponentLatency: null,
    failureDescription: null,
    failureLayer: null,
    intentSummary: 'I need to initiate a product recall for defective Sonos speakers.',
    responseSummary: 'The agent successfully aggregated 47 customer complaints, identified common defect patterns, queried production data via BigQuery to identify affected batches (B2024-1147 to B2024-1152), calculated 1250 affected units, generated customer notification lists and recall messages, and sent bulk SMS and email notifications via Twilio to all affected customers.',
    topics: ['Product_Recall_Management', 'Complaint_Aggregation', 'Data_Analysis', 'Batch_Identification', 'Notification_Preparation', 'Notification_Delivery'],
    actions: ['Ticket Aggregation', 'Pattern Analysis', 'RunQuery', 'Data Correlation', 'Batch Number Extraction', 'Affected Units Calculation', 'Customer List Generation', 'Message Templating', 'SendBulkSMS', 'SendBulkEmail'],
    intentTag: 'Product Recall',
    qualityScore: 'High',
    qualityScoreReason: 'The agent successfully resolved the user\'s request by coordinating 5 agents including 3P integrations. All operations completed successfully and 1250 customers were notified. The response was comprehensive.',
    trustBoundary: {
      type: '3P',
      enum: 'UNTRUSTED',
      primaryOrg: 'Sonos',
      orgId: 'org-sonos',
      orgs: ['Sonos'],
      externalVendors: ['Google Cloud', 'Twilio'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'Aggregate customer complaints from support tickets', confidence: 0.96 },
      { step: 2, decision: 'Correlate with manufacturing data via Google Cloud agent', confidence: 0.91 },
      { step: 3, decision: 'Identify affected batch numbers', confidence: 0.94 },
      { step: 4, decision: 'Generate recall notification list', confidence: 0.97 },
      { step: 5, decision: 'Initiate customer notification via Twilio agent', confidence: 0.93 },
    ],
    // OpenTelemetry spans - aligned with agents/edges + AGENTFORCE REASONING
    spans: [
      {
        span_id: 'span-crisis-001',
        parent_span_id: null,
        name: 'Crisis Response Orchestrator',
        kind: 'INTERNAL',
        start_time: 0,
        duration: 45200,
        status: 'OK',
        attributes: { 'agent.id': 'agent-crisis-orch', 'agent.role': 'supervisor', 'trust_boundary': '3P' },
        children: [
          { span_id: 'span-crisis-001-input', parent_span_id: 'span-crisis-001', name: 'User Input', kind: 'INTERNAL', start_time: 0, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-001-r1', parent_span_id: 'span-crisis-001', name: 'Action Selection', kind: 'INTERNAL', start_time: 1, duration: 1000, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-001-r2', parent_span_id: 'span-crisis-001', name: 'Topic Selection', kind: 'INTERNAL', start_time: 1001, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-001-topic', parent_span_id: 'span-crisis-001', name: 'Product_Recall_Management', kind: 'INTERNAL', start_time: 1002, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Product_Recall_Management' } },
          { span_id: 'span-crisis-001-r3', parent_span_id: 'span-crisis-001', name: 'Routing Reasoning: Invoke Complaint Aggregator Agent', kind: 'INTERNAL', start_time: 1003, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Complaint Aggregator Agent', 'routing.reason': 'Product recall initiated for Sonos speaker defect. First aggregate all related customer complaints to identify scope and affected customers.', 'routing.strategy': 'serial', 'routing.priority': 1 } },
          { span_id: 'span-crisis-001-r4', parent_span_id: 'span-crisis-001', name: 'Routing Reasoning: Invoke Google BigQuery Agent', kind: 'INTERNAL', start_time: 7300, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Google BigQuery Agent', 'routing.reason': 'Complaint Aggregator identified 47 complaints with common defect pattern. Need to query production data to identify affected manufacturing batches.', 'routing.trigger': 'Complaint Aggregator Agent response received', 'routing.strategy': 'serial', 'routing.priority': 2 } },
          { span_id: 'span-crisis-001-r5', parent_span_id: 'span-crisis-001', name: 'Routing Reasoning: Invoke Batch Identifier Agent', kind: 'INTERNAL', start_time: 14100, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Batch Identifier Agent', 'routing.reason': 'BigQuery returned production records. Now extract specific batch numbers and calculate total affected units for recall scope.', 'routing.trigger': 'Google BigQuery Agent response received', 'routing.strategy': 'serial', 'routing.priority': 3 } },
          { span_id: 'span-crisis-001-r6', parent_span_id: 'span-crisis-001', name: 'Routing Reasoning: Invoke Notification Generator Agent', kind: 'INTERNAL', start_time: 17300, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Notification Generator Agent', 'routing.reason': 'Batch Identifier found batches B2024-1147 to B2024-1152 with 1250 affected units. Generate customer notification list and recall messages.', 'routing.trigger': 'Batch Identifier Agent response received', 'routing.strategy': 'serial', 'routing.priority': 4 } },
          { span_id: 'span-crisis-001-r7', parent_span_id: 'span-crisis-001', name: 'Routing Reasoning: Invoke Twilio Notification Agent', kind: 'INTERNAL', start_time: 21800, duration: 100, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Twilio Notification Agent', 'routing.reason': 'Notification Generator prepared 1250 customer contacts and recall message templates. Send bulk SMS and email notifications via Twilio.', 'routing.trigger': 'Notification Generator Agent response received', 'routing.strategy': 'serial', 'routing.priority': 5 } },
          { span_id: 'span-crisis-001-reasoning', parent_span_id: 'span-crisis-001', name: 'Reasoning: Workflow Complete', kind: 'INTERNAL', start_time: 30000, duration: 200, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Product recall completed successfully: 47 complaints analyzed → 6 batches identified → 1250 customers notified (SMS + Email). Recall documented.', 'workflow.pattern': 'serial-pipeline', 'agents.invoked': 5, 'customers.notified': 1250 } },
        ],
      },
      {
        span_id: 'span-crisis-002',
        parent_span_id: 'span-crisis-001',
        name: 'A2A: Complaint Aggregator Agent',
        kind: 'SERVER',
        start_time: 3200,
        duration: 4100,
        status: 'OK',
        attributes: { 'agent.id': 'agent-complaints', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-crisis-002-input', parent_span_id: 'span-crisis-002', name: 'Agent Input', kind: 'INTERNAL', start_time: 3200, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-002-a1', parent_span_id: 'span-crisis-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 3201, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-002-t1', parent_span_id: 'span-crisis-002', name: 'Topic Selection', kind: 'INTERNAL', start_time: 3251, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-002-topic', parent_span_id: 'span-crisis-002', name: 'Complaint_Aggregation', kind: 'INTERNAL', start_time: 3252, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Complaint_Aggregation' } },
          { span_id: 'span-crisis-002-a2', parent_span_id: 'span-crisis-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 3253, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Ticket Aggregation' } },
          { span_id: 'span-crisis-002-a3', parent_span_id: 'span-crisis-002', name: 'Action Selection', kind: 'INTERNAL', start_time: 3303, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Pattern Analysis' } },
          { span_id: 'span-crisis-002-agg', parent_span_id: 'span-crisis-002', name: 'Ticket Aggregation', kind: 'INTERNAL', start_time: 3353, duration: 2200, status: 'OK', attributes: { 'operation.type': 'aggregation' } },
          { span_id: 'span-crisis-002-pattern', parent_span_id: 'span-crisis-002', name: 'Pattern Analysis', kind: 'INTERNAL', start_time: 5553, duration: 1500, status: 'OK', attributes: { 'operation.type': 'analysis' } },
          { span_id: 'span-crisis-002-reasoning', parent_span_id: 'span-crisis-002', name: 'Reasoning', kind: 'INTERNAL', start_time: 7053, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Identified 47 complaints with common defect pattern' } },
        ],
      },
      {
        span_id: 'span-crisis-003',
        parent_span_id: 'span-crisis-001',
        name: 'A2A: Google BigQuery Agent',
        kind: 'SERVER',
        start_time: 7300,
        duration: 6800,
        status: 'OK',
        attributes: { 'agent.id': 'agent-bigquery', 'agent.type': '3p', 'vendor': 'Google Cloud', 'external': true },
        children: [
          { span_id: 'span-crisis-003-input', parent_span_id: 'span-crisis-003', name: 'Agent Input', kind: 'INTERNAL', start_time: 7300, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-003-a1', parent_span_id: 'span-crisis-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 7301, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-003-t1', parent_span_id: 'span-crisis-003', name: 'Topic Selection', kind: 'INTERNAL', start_time: 7351, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-003-topic', parent_span_id: 'span-crisis-003', name: 'Data_Analysis', kind: 'INTERNAL', start_time: 7352, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Data_Analysis' } },
          { span_id: 'span-crisis-003-a2', parent_span_id: 'span-crisis-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 7353, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'BigQuery MCP' } },
          { span_id: 'span-crisis-003-a3', parent_span_id: 'span-crisis-003', name: 'Action Selection', kind: 'INTERNAL', start_time: 7403, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Data Correlation' } },
          { span_id: 'span-crisis-003-mcp', parent_span_id: 'span-crisis-003', name: 'MCP: BigQuery', kind: 'CLIENT', start_time: 7453, duration: 4300, status: 'OK', attributes: { 'mcp.tool.name': 'bigquery', 'mcp.operation': 'RunQuery', 'turns': 2 } },
          { span_id: 'span-crisis-003-corr', parent_span_id: 'span-crisis-003', name: 'Data Correlation', kind: 'INTERNAL', start_time: 11753, duration: 2200, status: 'OK', attributes: { 'operation.type': 'correlation' } },
          { span_id: 'span-crisis-003-reasoning', parent_span_id: 'span-crisis-003', name: 'Reasoning', kind: 'INTERNAL', start_time: 13953, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Correlated production data with affected batches' } },
        ],
      },
      {
        span_id: 'span-crisis-004',
        parent_span_id: 'span-crisis-001',
        name: 'A2A: Batch Identifier Agent',
        kind: 'SERVER',
        start_time: 14100,
        duration: 3200,
        status: 'OK',
        attributes: { 'agent.id': 'agent-batch', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-crisis-004-input', parent_span_id: 'span-crisis-004', name: 'Agent Input', kind: 'INTERNAL', start_time: 14100, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-004-a1', parent_span_id: 'span-crisis-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 14101, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-004-t1', parent_span_id: 'span-crisis-004', name: 'Topic Selection', kind: 'INTERNAL', start_time: 14151, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-004-topic', parent_span_id: 'span-crisis-004', name: 'Batch_Identification', kind: 'INTERNAL', start_time: 14152, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Batch_Identification' } },
          { span_id: 'span-crisis-004-a2', parent_span_id: 'span-crisis-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 14153, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Batch Number Extraction' } },
          { span_id: 'span-crisis-004-a3', parent_span_id: 'span-crisis-004', name: 'Action Selection', kind: 'INTERNAL', start_time: 14203, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Affected Units Calculation' } },
          { span_id: 'span-crisis-004-extract', parent_span_id: 'span-crisis-004', name: 'Batch Number Extraction', kind: 'INTERNAL', start_time: 14253, duration: 1600, status: 'OK', attributes: { 'operation.type': 'extraction' } },
          { span_id: 'span-crisis-004-calc', parent_span_id: 'span-crisis-004', name: 'Affected Units Calculation', kind: 'INTERNAL', start_time: 15853, duration: 1300, status: 'OK', attributes: { 'operation.type': 'calculation' } },
          { span_id: 'span-crisis-004-reasoning', parent_span_id: 'span-crisis-004', name: 'Reasoning', kind: 'INTERNAL', start_time: 17153, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Identified batches B2024-1147 to B2024-1152, 1250 units affected' } },
        ],
      },
      {
        span_id: 'span-crisis-005',
        parent_span_id: 'span-crisis-001',
        name: 'A2A: Notification Generator Agent',
        kind: 'SERVER',
        start_time: 17300,
        duration: 4500,
        status: 'OK',
        attributes: { 'agent.id': 'agent-notify-gen', 'agent.role': 'specialist' },
        children: [
          { span_id: 'span-crisis-005-input', parent_span_id: 'span-crisis-005', name: 'Agent Input', kind: 'INTERNAL', start_time: 17300, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-005-a1', parent_span_id: 'span-crisis-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 17301, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-005-t1', parent_span_id: 'span-crisis-005', name: 'Topic Selection', kind: 'INTERNAL', start_time: 17351, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-005-topic', parent_span_id: 'span-crisis-005', name: 'Notification_Preparation', kind: 'INTERNAL', start_time: 17352, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Notification_Preparation' } },
          { span_id: 'span-crisis-005-a2', parent_span_id: 'span-crisis-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 17353, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Customer List Generation' } },
          { span_id: 'span-crisis-005-a3', parent_span_id: 'span-crisis-005', name: 'Action Selection', kind: 'INTERNAL', start_time: 17403, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Message Templating' } },
          { span_id: 'span-crisis-005-list', parent_span_id: 'span-crisis-005', name: 'Customer List Generation', kind: 'INTERNAL', start_time: 17453, duration: 2300, status: 'OK', attributes: { 'operation.type': 'generation' } },
          { span_id: 'span-crisis-005-template', parent_span_id: 'span-crisis-005', name: 'Message Templating', kind: 'INTERNAL', start_time: 19753, duration: 1800, status: 'OK', attributes: { 'operation.type': 'templating' } },
          { span_id: 'span-crisis-005-reasoning', parent_span_id: 'span-crisis-005', name: 'Reasoning', kind: 'INTERNAL', start_time: 21553, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Generated notification list for 1250 customers' } },
        ],
      },
      {
        span_id: 'span-crisis-006',
        parent_span_id: 'span-crisis-001',
        name: 'A2A: Twilio Notification Agent',
        kind: 'SERVER',
        start_time: 21800,
        duration: 8200,
        status: 'OK',
        attributes: { 'agent.id': 'agent-twilio', 'agent.type': '3p', 'vendor': 'Twilio', 'external': true },
        children: [
          { span_id: 'span-crisis-006-input', parent_span_id: 'span-crisis-006', name: 'Agent Input', kind: 'INTERNAL', start_time: 21800, duration: 1, status: 'OK', attributes: { 'operation.type': 'input' } },
          { span_id: 'span-crisis-006-a1', parent_span_id: 'span-crisis-006', name: 'Action Selection', kind: 'INTERNAL', start_time: 21801, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection' } },
          { span_id: 'span-crisis-006-t1', parent_span_id: 'span-crisis-006', name: 'Topic Selection', kind: 'INTERNAL', start_time: 21851, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic-selection' } },
          { span_id: 'span-crisis-006-topic', parent_span_id: 'span-crisis-006', name: 'Notification_Delivery', kind: 'INTERNAL', start_time: 21852, duration: 1, status: 'OK', attributes: { 'operation.type': 'topic', 'topic.name': 'Notification_Delivery' } },
          { span_id: 'span-crisis-006-a2', parent_span_id: 'span-crisis-006', name: 'Action Selection', kind: 'INTERNAL', start_time: 21853, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Twilio SMS MCP' } },
          { span_id: 'span-crisis-006-a3', parent_span_id: 'span-crisis-006', name: 'Action Selection', kind: 'INTERNAL', start_time: 21903, duration: 50, status: 'OK', attributes: { 'operation.type': 'action-selection', 'action.target': 'Twilio Email MCP' } },
          { span_id: 'span-crisis-006-sms', parent_span_id: 'span-crisis-006', name: 'MCP: Twilio SMS', kind: 'CLIENT', start_time: 21953, duration: 4600, status: 'OK', attributes: { 'mcp.tool.name': 'twilio', 'mcp.operation': 'SendBulkSMS', 'messages_sent': 1250, 'turns': 1 } },
          { span_id: 'span-crisis-006-email', parent_span_id: 'span-crisis-006', name: 'MCP: Twilio Email', kind: 'CLIENT', start_time: 26553, duration: 3200, status: 'OK', attributes: { 'mcp.tool.name': 'twilio-sendgrid', 'mcp.operation': 'SendBulkEmail', 'emails_sent': 1250, 'turns': 1 } },
          { span_id: 'span-crisis-006-reasoning', parent_span_id: 'span-crisis-006', name: 'Reasoning', kind: 'INTERNAL', start_time: 29753, duration: 47, status: 'OK', attributes: { 'operation.type': 'reasoning', 'reasoning.summary': 'Sent 1250 SMS + 1250 email notifications successfully' } },
        ],
      },
    ],
    agents: [
      {
        id: 'agent-crisis-orch',
        type: AGENT_TYPES.NATIVE,
        name: 'Crisis Response Orchestrator',
        role: 'supervisor',
        orgId: 'org-sonos',
        orgName: 'Sonos',
        status: 'success',
        latency: 3200,
        capabilities: ['crisis-management', 'orchestration', 'decision-making'],
        isRoot: true,
      },
      {
        id: 'agent-support-agg',
        type: AGENT_TYPES.NATIVE,
        name: 'Support Aggregator Agent',
        role: 'specialist',
        orgId: 'org-sonos',
        orgName: 'Sonos',
        status: 'success',
        latency: 4500,
        capabilities: ['ticket-analysis', 'pattern-detection'],
      },
      {
        id: 'agent-gcp',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'GCP Manufacturing Data Agent',
        role: 'specialist',
        vendorName: 'Google Cloud',
        agentCardUrl: 'https://cloud.google.com/.well-known/agent.json',
        registeredAt: '2024-12-01',
        registrationStatus: 'verified',
        status: 'success',
        latency: 8200,
        capabilities: ['bigquery-analysis', 'manufacturing-data'],
      },
      {
        id: 'agent-recall',
        type: AGENT_TYPES.NATIVE,
        name: 'Recall Manager Agent',
        role: 'specialist',
        orgId: 'org-sonos',
        orgName: 'Sonos',
        status: 'success',
        latency: 5100,
        capabilities: ['recall-generation', 'compliance-check'],
      },
      {
        id: 'agent-twilio',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Twilio Notification Agent',
        role: 'specialist',
        vendorName: 'Twilio',
        agentCardUrl: 'https://api.twilio.com/.well-known/agent.json',
        registeredAt: '2025-01-10',
        registrationStatus: 'verified',
        status: 'success',
        latency: 12400,
        capabilities: ['sms-notification', 'email-blast', 'voice-call'],
      },
    ],
    edges: [
      { from: 'agent-crisis-orch', to: 'agent-support-agg', status: 'success', dataSize: '2.1 KB' },
      { from: 'agent-support-agg', to: 'agent-crisis-orch', status: 'success', dataSize: '156 KB' },
      { from: 'agent-crisis-orch', to: 'agent-gcp', status: 'success', dataSize: '12.4 KB', external: true },
      { from: 'agent-gcp', to: 'agent-crisis-orch', status: 'success', dataSize: '2.4 MB', external: true },
      { from: 'agent-crisis-orch', to: 'agent-recall', status: 'success', dataSize: '2.5 MB' },
      { from: 'agent-recall', to: 'agent-crisis-orch', status: 'success', dataSize: '890 KB' },
      { from: 'agent-crisis-orch', to: 'agent-twilio', status: 'success', dataSize: '920 KB', external: true },
      { from: 'agent-twilio', to: 'agent-crisis-orch', status: 'success', dataSize: '45 KB', external: true },
    ],
    identityFlow: {
      sourceUser: 'crisis-team@sonos.com',
      sourceUserType: 'B2B Authenticated',
      resolutionMethod: IDENTITY_METHODS.OAUTH,
      crossOrgResolutions: [
        { org: 'Google Cloud', orgId: 'vendor-gcp', status: 'oauth-verified', method: 'oauth', latency: 145 },
        { org: 'Twilio', orgId: 'vendor-twilio', status: 'oauth-verified', method: 'oauth', latency: 92 },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 520,
      supervisorReasoning: 3200,
      parallelAgentCalls: 0,
      serialAgentCalls: 21700,
      externalAgentCalls: 20600,
      totalDuration: 45200,
    },
    governancePolicies: ['CPSC-Compliance', 'Data-Privacy', 'Sonos-Crisis-Protocol'],
    mcpCalls: [],
    ragCalls: [],
  },

  // ✅ 3P SUCCESS - Hotel Concierge with External Services
  {
    id: 'mao-009',
    friendlyName: 'Concierge-Falcon-8847',
    pattern: 'supervisor',
    rootAgent: 'Hotel Concierge Agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    duration: 6800,
    turnCount: 6,
    status: 'success',
    theme: null,
    flowDepth: 3,
    totalLatency: 6800,
    failingComponent: null,
    trustBoundary: {
      type: '3P',
      primaryOrg: 'Grand Hotel Corp',
      orgId: 'org-grandhotel',
      orgs: ['Grand Hotel Corp'],
      externalVendors: ['Eventbrite', 'Booking.com', 'Yelp', 'Reservations MCP'],
      boundaryId: null,
    },
    supervisorDecisions: [
      { step: 1, decision: 'User requesting local event recommendations', confidence: 0.95 },
      { step: 2, decision: 'Query Eventbrite for nearby events', confidence: 0.92 },
      { step: 3, decision: 'Check Yelp for restaurant recommendations', confidence: 0.94 },
      { step: 4, decision: 'Book restaurant via Reservations MCP', confidence: 0.91 },
    ],
    agents: [
      {
        id: 'agent-concierge',
        type: AGENT_TYPES.NATIVE,
        name: 'Hotel Concierge Agent',
        role: 'supervisor',
        orgId: 'org-grandhotel',
        orgName: 'Grand Hotel Corp',
        status: 'success',
        latency: 1100,
        capabilities: ['orchestration', 'guest-services', 'recommendations'],
        isRoot: true,
        description: 'The Hotel Concierge Agent is an intelligent virtual assistant designed to enhance guest experiences by providing personalized recommendations and assistance.',
        connections: 8,
      },
      {
        id: 'agent-eventbrite',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Eventbrite',
        role: 'specialist',
        vendorName: 'Eventbrite',
        agentCardUrl: 'https://api.eventbrite.com/.well-known/agent.json',
        registeredAt: '2025-02-01',
        registrationStatus: 'verified',
        status: 'success',
        latency: 980,
        capabilities: ['event-search', 'ticket-booking'],
        description: 'Search and book local events, concerts, and activities.',
        connections: 4,
      },
      {
        id: 'agent-booking',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Booking.com',
        role: 'specialist',
        vendorName: 'Booking.com',
        agentCardUrl: 'https://api.booking.com/.well-known/agent.json',
        registeredAt: '2025-01-15',
        registrationStatus: 'verified',
        status: 'unreachable',
        latency: 0,
        capabilities: ['hotel-search', 'booking-management'],
        description: 'Search hotels and manage accommodation bookings.',
        connections: 3,
        errorMessage: 'Connection timeout - service temporarily unavailable',
      },
      {
        id: 'agent-yelp',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Yelp',
        role: 'specialist',
        vendorName: 'Yelp',
        agentCardUrl: 'https://api.yelp.com/.well-known/agent.json',
        registeredAt: '2025-02-10',
        registrationStatus: 'verified',
        status: 'success',
        latency: 1250,
        capabilities: ['restaurant-search', 'reviews', 'ratings'],
        description: 'Find restaurants, read reviews, and discover local businesses.',
        connections: 5,
      },
      {
        id: 'agent-reservations',
        type: AGENT_TYPES.THIRD_PARTY,
        name: 'Reservations MCP',
        role: 'specialist',
        vendorName: 'OpenTable',
        agentCardUrl: 'https://api.opentable.com/.well-known/agent.json',
        registeredAt: '2025-02-05',
        registrationStatus: 'verified',
        status: 'success',
        latency: 890,
        capabilities: ['table-reservation', 'availability-check'],
        description: 'Make restaurant reservations and check table availability.',
        connections: 4,
      },
    ],
    edges: [
      { from: 'agent-concierge', to: 'agent-eventbrite', status: 'success', dataSize: '2.1 KB', external: true },
      { from: 'agent-eventbrite', to: 'agent-concierge', status: 'success', dataSize: '18.5 KB', external: true },
      { from: 'agent-concierge', to: 'agent-booking', status: 'error', dataSize: '1.2 KB', external: true },
      { from: 'agent-concierge', to: 'agent-yelp', status: 'success', dataSize: '1.8 KB', external: true },
      { from: 'agent-yelp', to: 'agent-concierge', status: 'success', dataSize: '45.2 KB', external: true },
      { from: 'agent-concierge', to: 'agent-reservations', status: 'success', dataSize: '2.4 KB', external: true },
      { from: 'agent-reservations', to: 'agent-concierge', status: 'success', dataSize: '3.8 KB', external: true },
    ],
    identityFlow: {
      sourceUser: 'guest@grandhotel.com',
      sourceUserType: 'B2C Authenticated',
      resolutionMethod: IDENTITY_METHODS.OAUTH,
      crossOrgResolutions: [
        { org: 'Eventbrite', orgId: 'vendor-eventbrite', status: 'oauth-verified', method: 'oauth', latency: 78 },
        { org: 'Booking.com', orgId: 'vendor-booking', status: 'failed', method: 'oauth', latency: 5000, error: 'Connection timeout' },
        { org: 'Yelp', orgId: 'vendor-yelp', status: 'oauth-verified', method: 'oauth', latency: 95 },
        { org: 'OpenTable', orgId: 'vendor-opentable', status: 'oauth-verified', method: 'oauth', latency: 82 },
      ],
    },
    latencyBreakdown: {
      gatewayOverhead: 280,
      supervisorReasoning: 1100,
      parallelAgentCalls: 0,
      serialAgentCalls: 3120,
      externalAgentCalls: 3120,
      totalDuration: 6800,
    },
    governancePolicies: ['Guest-Privacy', 'PCI-DSS', 'Data-Retention'],
    mcpCalls: [
      {
        mcpServer: 'reservations-mcp',
        tool: 'make_reservation',
        latency: 890,
        status: 'success',
        agentId: 'agent-reservations',
      },
    ],
    ragCalls: [],
  },
];

// Network dependency data for visualization
export const agentNetworkDependencies = {
  orgs: [
    {
      id: 'org-rbc-001',
      name: 'RBC Financial',
      type: 'primary',
      agents: ['Portfolio Orchestrator', 'Market Data Agent', 'Risk Scoring Agent', 'Recommendation Agent'],
    },
    {
      id: 'org-acme-hq',
      name: 'Acme Corp HQ',
      type: 'primary',
      trustBoundary: 'DC1-ACME-001',
      agents: ['HR Orchestrator', 'HR Profile Agent'],
    },
    {
      id: 'org-acme-it',
      name: 'Acme IT Services',
      type: 'shared',
      trustBoundary: 'DC1-ACME-001',
      agents: ['IT Provisioning Agent'],
    },
    {
      id: 'org-acme-sec',
      name: 'Acme Security',
      type: 'shared',
      trustBoundary: 'DC1-ACME-001',
      agents: ['Security Badge Agent'],
        },
  ],
  externalVendors: [
    { id: 'vendor-box', name: 'Box Inc', agents: ['Box Document Agent'], protocol: 'A2A' },
    { id: 'vendor-docusign', name: 'DocuSign', agents: ['DocuSign Approval Agent'], protocol: 'A2A' },
    { id: 'vendor-zendesk', name: 'Zendesk', agents: ['Zendesk Ticket Agent'], protocol: 'A2A' },
    { id: 'vendor-gcp', name: 'Google Cloud', agents: ['GCP Manufacturing Data Agent'], protocol: 'A2A' },
    { id: 'vendor-twilio', name: 'Twilio', agents: ['Twilio Notification Agent'], protocol: 'A2A' },
    { id: 'vendor-eventbrite', name: 'Eventbrite', agents: ['Eventbrite'], protocol: 'A2A' },
    { id: 'vendor-booking', name: 'Booking.com', agents: ['Booking.com'], protocol: 'A2A' },
    { id: 'vendor-yelp', name: 'Yelp', agents: ['Yelp'], protocol: 'A2A' },
    { id: 'vendor-opentable', name: 'OpenTable', agents: ['Reservations MCP'], protocol: 'MCP' },
  ],
  brokenConnections: [
    {
      from: 'InsureCo Claims',
      to: 'InsureCo Fraud Unit',
      agent: 'Fraud Detection Agent',
      reason: 'Agent instance not responding',
      affectedWorkflows: ['Auto-Fraud-Check', 'High-Value-Claims'],
      since: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
};

// Filter options
export const themes = [
  { value: 'all', label: 'All Themes' },
  { value: 'tool-error', label: 'Tool Error' },
  { value: 'logic-loop', label: 'Logic Loop' },
  { value: 'silent-drop', label: 'Silent Drop' },
  { value: 'high-latency', label: 'High Latency' },
];

export const timeframes = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
];

export const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

export const boundaryTypes = [
  { value: 'all', label: 'All Boundaries' },
  { value: 'SOMA', label: 'SOMA (Single Org)' },
  { value: 'MOMA', label: 'MOMA (Multi-Org)' },
  { value: '3P', label: '3P (External)' },
];

export const agentTypes = [
  { value: 'all', label: 'All Agent Types' },
  { value: 'native', label: 'Native AF' },
  { value: 'shared', label: 'Shared AF' },
  { value: '3p', label: '3P External' },
];

// Utility functions
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

export const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} min ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)} hours ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getThemeBadgeClass = (theme) => {
  switch (theme) {
    case 'Tool Error':
      return 'sf-badge-error';
    case 'Logic Loop':
      return 'sf-badge-warning';
    case 'Silent Drop':
      return 'sf-badge-error';
    case 'High Latency':
      return 'sf-badge-warning';
    default:
      return 'sf-badge-neutral';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'success':
      return 'sf-badge-success';
    case 'failed':
      return 'sf-badge-error';
    case 'warning':
      return 'sf-badge-warning';
    case 'unreachable':
      return 'sf-badge-error';
    case 'error':
      return 'sf-badge-error';
    default:
      return 'sf-badge-neutral';
  }
};

export const getBoundaryBadgeClass = (type) => {
  switch (type) {
    case 'SOMA':
      return 'sf-badge-info';
    case 'MOMA':
      return 'sf-badge-success';
    case '3P':
      return 'sf-badge-warning';
    default:
      return 'sf-badge-neutral';
  }
};

export const getAgentTypeBadgeClass = (type) => {
  switch (type) {
    case 'native':
      return 'sf-badge-info';
    case 'shared':
      return 'sf-badge-success';
    case '3p':
      return 'sf-badge-warning';
    default:
      return 'sf-badge-neutral';
  }
};

export const getLatencySLAStatus = (latency, type = 'standard') => {
  if (type === 'simple' && latency > 3000) return 'exceeded';
  if (type === 'standard' && latency > 10000) return 'exceeded';
  if (type === 'gateway' && latency > 500) return 'exceeded';
  if (type === 'simple' && latency > 2000) return 'warning';
  if (type === 'standard' && latency > 7000) return 'warning';
  if (type === 'gateway' && latency > 350) return 'warning';
  return 'ok';
};
