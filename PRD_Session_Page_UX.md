# Product Requirements Document: Session Page Multi-Agent Visualization

**Feature Name:** Multi-Agent Session Visualization & Trace Analysis  
**Product:** Agentforce Studio - Observability Platform  
**Target Persona:** Agent Builder / Developer (Technical users debugging multi-agent flows)  
**Document Version:** 1.0  
**Date:** January 2026  
**Status:** Draft for UX Team Review

---

## 1. Problem & Opportunity

### Current State
The current observability framework is siloed, showcasing metrics for only a single agent or MCP server in isolation. As we scale to SOMA (Single-Org Multi-Agent) architectures, developers need a unified view to locate the root cause of failures or latency in flows that span multiple agents and trust boundaries.

### Problem Statement
When debugging multi-agent sessions, Agent Builders cannot:
- **Visualize the full conversation flow** across multiple agents in a single view
- **Understand the hierarchy** between supervisor agents and sub-agents
- **Identify which agents/MCPs were involved** in a session without drilling into details
- **See the "space between" agents** - the handoff points and routing decisions
- **Quickly identify failed or slow components** in complex multi-agent interactions

### Opportunity
By providing a unified, hierarchical view of multi-agent sessions with clear visual distinctions between supervisor agents, sub-agents, and MCP tools, we enable Agent Builders to:
- Debug multi-agent flows 50% faster (target metric)
- Identify root causes of failures without manual trace correlation
- Understand the complete execution path at a glance
- Share and reference specific sessions easily

---

## 2. User Stories

1. **As an Agent Builder**, I want to see a session list that clearly indicates which sessions involve multiple agents and MCPs, so I can prioritize debugging complex flows.

2. **As an Agent Builder**, I want to view the supervisor agent expanded by default with sub-agents collapsed underneath, so I can understand the hierarchy without manual expansion.

3. **As an Agent Builder**, I want to visually distinguish the supervisor agent from sub-agents in the trace view, so I can immediately identify the root orchestrator.

4. **As an Agent Builder**, I want to click on a collapsed sub-agent to expand and see its utterances and MCP invocations, so I can drill into specific agent behavior without information overload.

5. **As an Agent Builder**, I want to see orchestration metadata (sub-agents, MCPs) distributed across chat messages in the session log, so I can understand what happened during each user interaction.

6. **As an Agent Builder**, I want to view the entire graph topology of a session at the start, then filter to specific agents when clicking an utterance, so I can see both the big picture and focused details.

---

## 3. Functional Requirements

### 3.1 Session List View (Table) - P0

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **SES-001** | Display a "Multi-Agent" indicator badge/icon in the session list for sessions that involve 2+ agents | **P0** | Visual indicator (e.g., blue badge with "2+ Agents" text) |
| **SES-002** | Display an "MCP" indicator badge/icon in the session list for sessions that involve MCP tool calls | **P0** | Visual indicator (e.g., purple badge with "MCP" text) |
| **SES-003** | Show agent count and MCP count as separate columns or combined indicator | **P0** | Format: "2 agents, 3 MCPs" or separate columns |
| **SES-004** | Sessions with multiple agents should be sortable/filterable by agent count | **P1** | Enable filtering: "Multi-Agent Sessions" checkbox |
| **SES-005** | Clicking a session row opens the session detail view | **P0** | Standard navigation behavior |

**Implementation Priority:** Aligns with Phase 1 (SOMA GA) - Basic Connectivity

### 3.2 Session Detail View - Trace/Waterfall View - P0

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **TRACE-001** | Render supervisor agent (root span) as the top-level item, expanded by default | **P0** | Supervisor is the root orchestrator |
| **TRACE-002** | Render sub-agents as collapsed children under the supervisor, requiring click to expand | **P0** | Prevents information overload on initial load |
| **TRACE-003** | Visually distinguish supervisor agent from sub-agents using distinct styling | **P0** | UX team to define: color, icon, border, or typography difference |
| **TRACE-004** | When sub-agent is expanded, show its nested structure: utterances → MCPs → reasoning spans | **P0** | Maintain hierarchical nesting |
| **TRACE-005** | Support hierarchy depth of 2-3 agents for TDX milestone (Supervisor → Agent A → Agent B) | **P0** | Phase 1 scope limitation |
| **TRACE-006** | Group MCP invocations by server/provider when multiple MCPs from same server exist | **P0** | Collapsible MCP groups (already implemented) |
| **TRACE-007** | Show latency breakdown (R: routing overhead | S: response time (total)) for sub-agents | **P0** | Format: "R: 199ms \| S: 2.1s (2.3s)" |
| **TRACE-008** | Mark failed agents/MCPs with red error indicators | **P0** | Visual error state (red border, error icon) |
| **TRACE-009** | For failed supervisor sessions, show only what happened before failure | **P0** | Don't show non-existent sub-agents |

**Visual Distinction Requirements (for UX team):**
- **Supervisor Agent:** Must be visually distinct from sub-agents. Suggestions:
  - Different background color (e.g., light blue vs. white)
  - Different icon (e.g., Crown icon vs. Bot icon)
  - Bold typography or border highlight
  - Label prefix: "Supervisor:" or "Root Agent:"
- **Sub-Agents:** Standard styling with clear nesting/indentation

### 3.3 Chat Session Log (Utterance View) - P0

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **CHAT-001** | Display chat messages in chronological order (User → Agent → User → Agent) | **P0** | Standard chat UI pattern |
| **CHAT-002** | Show orchestration indicators (sub-agents, MCPs) distributed across messages based on timing | **P0** | Already implemented - maintain pattern |
| **CHAT-003** | Display "Response" icon with latency breakdown (R: X \| S: Y (Z)) for each agent message | **P0** | Format matches current implementation |
| **CHAT-004** | Mark agent responses in red if any orchestration event (sub-agent/MCP) has an error | **P0** | Visual error indication |
| **CHAT-005** | Collapse orchestration indicators when more than 1 agent/MCP per message | **P0** | Show summary: "X agents, Y MCPs" with expand option |
| **CHAT-006** | Show MCP latency breakdown in same format as sub-agents (R: X \| S: Y (Z)) | **P0** | Consistent pattern across all orchestration types |

**Post-MVP Enhancements (P1):**
- **CHAT-007** | Display agent name next to each agent message | **P1** | Format: "Agent: Merchant_Shopper_Agent"
- **CHAT-008** | Show detailed latency metrics on hover or expand | **P1** | Tooltip or expandable section

**Reference Pattern:** Follow the design pattern from [Agentforce Observability v2](https://mpichadze-bot.github.io/agentforce-observability-v2/)

### 3.4 Graph View (Phase 1.5) - P1

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **GRAPH-001** | Display entire session graph topology on initial load | **P1** | Phase 1.5: Graph Connectivity |
| **GRAPH-002** | Render agents and MCPs as nodes, handoffs as edges | **P1** | Visual "Relay Race" representation |
| **GRAPH-003** | When user clicks an utterance in chat log, filter graph to show only agents involved in that message | **P1** | Dynamic filtering based on message selection |
| **GRAPH-004** | Visually distinguish "Sender Agent" from "Handoff Target" on edges | **P1** | Directional arrows or labels |
| **GRAPH-005** | Show "Handshake Status" on connecting lines (Success / Unreachable / Down / Busy) | **P1** | Color-coded edges or status badges |
| **GRAPH-006** | Highlight critical path (chain contributing most to latency) | **P1** | Bold edges or different color |
| **GRAPH-007** | Supervisor agent should be visually distinct in graph (different node style/color) | **P1** | Consistent with trace view distinction |

**Implementation Timeline:** Phase 1.5 (Post Phase 1, Pre Phase 2)

### 3.5 Metadata Display - P0/P1

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **META-001** | Display agent metadata in trace view (agent name, handoff target, routing reason) | **P0** | Available in detail panel |
| **META-002** | Display agent name in chat log (post-MVP) | **P1** | See CHAT-007 |
| **META-003** | Display latency breakdown in both trace and chat views | **P0** | Consistent format |
| **META-004** | Show error messages with clickable navigation to error span | **P0** | Already implemented |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-001:** Session list page must load in < 2 seconds for 100 sessions
- **NFR-002:** Expanding a collapsed sub-agent must render in < 500ms
- **NFR-003:** Graph view must render initial topology in < 1 second for sessions with up to 10 agents

### 4.2 Data Handling
- **NFR-004:** Support sessions with up to 10 agents and 20 MCP invocations without performance degradation
- **NFR-005:** For long sessions (50+ agents/MCPs), implement virtualization or pagination
  - **Suggestion:** Use virtual scrolling for trace view when > 50 items
  - **Suggestion:** Implement "Load More" pagination for chat log when > 100 messages
- **NFR-006:** Support concurrent session views (multiple tabs/windows)
  - **Suggestion:** Each session view maintains independent state
  - **Suggestion:** Use session ID in URL for deep linking and bookmarking

### 4.3 Data Source
- **NFR-007:** All data must come from "Single JSON View" (OTEL spans) - no proprietary formats
- **NFR-008:** Support OpenTelemetry span structure with nested children

### 4.4 Error Handling
- **NFR-009:** Failed supervisor sessions must gracefully show partial data (what happened before failure)
- **NFR-010:** Missing span data should show placeholder with "Data unavailable" message

---

## 5. Edge Cases & Error States

### 5.1 Empty/Incomplete Sessions
| Scenario | Handling |
|---|---|
| **Empty Sessions** | **Out of Scope** - User confirmed empty sessions won't occur |
| **Failed Supervisor** | Show only spans that completed before failure. Don't render non-existent sub-agents. Display error banner: "Session failed at supervisor level" |
| **Partial Trace Data** | Show available spans with warning indicator: "Incomplete trace data" |

### 5.2 Large Sessions
| Scenario | Handling |
|---|---|
| **50+ Agents/MCPs** | Implement virtual scrolling for trace view. Show first 20 items, load more on scroll |
| **100+ Chat Messages** | Paginate chat log: Show last 50 messages by default, "Load Earlier" button at top |
| **Deep Nesting (4+ levels)** | Phase 1 supports 2-3 levels. Deeper nesting shows warning: "Deep nesting detected - some details may be collapsed" |

### 5.3 Concurrent Usage
| Scenario | Handling |
|---|---|
| **Multiple Session Tabs** | Each tab maintains independent state. Use session ID in URL for deep linking |
| **Session Updates During View** | Show "Session updated" notification with refresh option (future enhancement) |

### 5.4 Data Integrity
| Scenario | Handling |
|---|---|
| **Missing Parent Span** | Orphan spans shown at root level with warning icon |
| **Circular References** | Detect and break cycle, show warning: "Circular reference detected" |
| **Invalid Span Structure** | Validate OTEL structure, show error: "Invalid trace format" |

---

## 6. Success Metrics

### 6.1 Primary Metric (North Star)
- **Time to Identify Root Cause:** Reduce average time to identify root cause of multi-agent failures by 50%
  - **Baseline:** Current manual trace correlation: ~10 minutes
  - **Target:** Unified view: ~5 minutes
  - **Measurement:** Track time from session open to error identification

### 6.2 Counter-Metrics (Guardrails)
- **Page Load Time:** Maintain session list load time < 2 seconds (no degradation)
- **User Satisfaction:** Maintain or improve user satisfaction score (survey-based)
- **Error Rate:** Keep trace rendering errors < 1% of sessions

### 6.3 Adoption Metrics
- **Multi-Agent Session Views:** Track % of sessions that are multi-agent (target: 30%+)
- **Graph View Usage:** Track % of users who use graph view (Phase 1.5 target: 40%+)

---

## 7. Implementation Phases

### Phase 1: SOMA GA + Basic Connectivity (Target: mid-April) - P0
**Scope:** Single Org Multi-Agent (SOMA) + SF Tools/RAG

**Deliverables:**
1. Session list with multi-agent/MCP indicators (SES-001 to SES-005)
2. Trace/Waterfall view with supervisor/sub-agent hierarchy (TRACE-001 to TRACE-009)
3. Chat session log with orchestration indicators (CHAT-001 to CHAT-006)
4. Visual distinction between supervisor and sub-agents (UX team design)

**UX Focus:**
- Session tracing page (Waterfall): "list" view showing nesting of Agent → Agent → Tool
- Intent page: Identify A2A sessions by intent

### Phase 1.5: Graph Connectivity & Visualization (Post Phase 1) - P1
**Scope:** Moving beyond list/waterfall view to visualize "Relay Race" topology

**Deliverables:**
1. Graph view with full session topology (GRAPH-001 to GRAPH-007)
2. Dynamic filtering based on utterance selection
3. Critical path highlighting

**UX Focus:**
- Topology mapping: Visually distinguish "Sender Agent" and "Handoff Target"
- Critical path highlighting on graph

### Phase 2: MOMA & 3P (Post-TDX) - Out of Scope for This PRD
**Note:** MOMA and 3P agent visualization will be covered in a separate PRD

---

## 8. Out of Scope (Explicitly Excluded)

The following features are **explicitly out of scope** for this PRD:

- ❌ Mobile app version
- ❌ Session export functionality
- ❌ Real-time/live session monitoring
- ❌ Accessibility requirements (WCAG compliance)
- ❌ Internationalization (multi-language support)
- ❌ MOMA (Multi-Org) agent visualization
- ❌ 3P (Third-Party) agent visualization
- ❌ Process Intelligence (Process ID aggregation)
- ❌ Advanced MCP troubleshooting (error categorization, payload verification)
- ❌ Token usage/cost visualization
- ❌ Performance benchmarks beyond basic load times

---

## 9. UX Design Guidelines

### 9.1 Visual Hierarchy
- **Supervisor Agent:** Must be visually distinct (UX team to define exact styling)
- **Sub-Agents:** Standard styling with clear indentation/nesting
- **MCP Tools:** Purple-themed indicators (already established)

### 9.2 Interaction Patterns
- **Expand/Collapse:** Click to expand sub-agents, smooth animation
- **Click Utterance:** Filter graph view (Phase 1.5)
- **Hover States:** Show tooltips with detailed metadata

### 9.3 Color Coding
- **Success:** Green/teal (existing pattern)
- **Error:** Red (existing pattern)
- **Supervisor:** TBD by UX team (suggest: blue highlight)
- **Sub-Agent:** Standard gray/white
- **MCP:** Purple (existing pattern)

### 9.4 Reference Implementation
Follow the design patterns established in [Agentforce Observability v2](https://mpichadze-bot.github.io/agentforce-observability-v2/)

---

## 10. Acceptance Criteria

### Phase 1 (P0) Acceptance Criteria:
1. ✅ Session list displays multi-agent and MCP indicators
2. ✅ Supervisor agent is expanded by default, visually distinct from sub-agents
3. ✅ Sub-agents are collapsed by default, expandable on click
4. ✅ Chat log shows orchestration indicators distributed across messages
5. ✅ Latency breakdown (R: X | S: Y (Z)) displayed for sub-agents and MCPs
6. ✅ Error states are visually marked in red
7. ✅ Failed supervisor sessions show only completed spans
8. ✅ MCPs are grouped by server when multiple exist

### Phase 1.5 (P1) Acceptance Criteria:
1. ✅ Graph view displays full session topology on load
2. ✅ Clicking utterance filters graph to show involved agents
3. ✅ Critical path is highlighted
4. ✅ Handshake status shown on edges

---

## 11. Dependencies

- **Data Source:** Single JSON View (OTEL spans) must be available
- **Backend:** Trace data must include supervisor/sub-agent hierarchy
- **UX Team:** Visual distinction design for supervisor vs. sub-agents
- **Engineering:** Graph visualization library (e.g., D3.js, Cytoscape.js) for Phase 1.5

---

## 12. Open Questions for UX Team

1. **Supervisor Visual Distinction:** What specific visual treatment should distinguish supervisor from sub-agents? (Color, icon, typography, border?)
2. **Graph Library:** Which graph visualization library should we use for Phase 1.5? (D3.js, Cytoscape.js, vis.js, or other?)
3. **Collapse Animation:** What animation duration/style for expanding/collapsing sub-agents?
4. **Long Session Handling:** Preferred approach for 50+ items? (Virtual scrolling vs. pagination vs. "Show More" button?)
5. **Graph Node Styling:** How should supervisor nodes differ from sub-agent nodes in graph view?

---

## Appendix A: Data Dictionary Reference

This PRD aligns with the "Agentforce Observability: Unified A2A & MCP Tracing PRD" data dictionary:

- **Root Agent:** The supervisor agent that initiated the entire session
- **Sender Agent:** The agent delegating a task
- **Handoff Target:** The agent/MCP receiving the task
- **Routing Reasoning:** Semantic rationale for handoff decision
- **Step Type:** NATIVE_AGENT, SHARED_AGENT, 3P_AGENT, MCP_TOOL

---

## Appendix B: Reference Links

- [Agentforce Observability v2 - Live Demo](https://mpichadze-bot.github.io/agentforce-observability-v2/)
- [PRD Template Source](https://github.com/mpichadze-bot/prompt-MD/blob/main/prompts/product-management/prompt_create_prd.md)
- [Unified A2A & MCP Tracing PRD](./PRD_Unified_A2A_MCP_Tracing.md) (Reference document)

---

**Document Status:** Ready for UX Team Review  
**Next Steps:** 
1. UX team to review and provide design mockups for supervisor/sub-agent distinction
2. Engineering team to review technical feasibility
3. Product team to prioritize Phase 1.5 timeline
