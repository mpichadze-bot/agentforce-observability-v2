import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Bot,
  Wrench,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Hash,
  MessageCircle,
  Zap,
  FileText,
  Search,
  Sparkles,
  User,
  Play,
  Download,
  Circle,
  Network,
  Brain,
  Loader2,
} from 'lucide-react';
import { 
  formatDuration, 
  formatTimestamp, 
} from '../mockData';
import SupervisorVisualization from './SupervisorVisualization';

// Helper function to format session date
function formatSessionDate(timestamp) {
  const date = new Date(timestamp);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${month} ${day}, ${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
}

function TraceDetailPanel({ trace, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState('intent'); // 'intent' | 'summary' | 'trace' | 'graph'
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when trace changes - expand root item by default
  useEffect(() => {
    setSelectedAction(null);
    // Expand the root span by default so user can see the trace
    const rootSpanId = trace?.spans?.[0]?.span_id || 'agent-interaction';
    setExpandedItems(new Set([rootSpanId]));
    setActiveTab('intent');
    setSearchQuery('');
  }, [trace?.id]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Generate trace items from the trace data
  const traceItems = useMemo(() => generateTraceItems(trace), [trace]);

  // Get session log data (mock or from trace)
  const sessionLog = useMemo(() => trace.sessionLog || generateMockSessionLog(trace), [trace]);

  // Format session date
  const sessionDate = useMemo(() => formatSessionDate(trace.timestamp), [trace.timestamp]);

  const content = (
    <div className="flex h-full bg-gray-50" key={trace.id}>
      {/* Left Panel - Session Log */}
      <div className="w-[420px] border-r border-gray-200 flex flex-col bg-white">
        <SessionLogPanel 
          sessionLog={sessionLog} 
          trace={trace}
          sessionDate={sessionDate}
          onMessageClick={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* Middle Panel - Intent Analysis or Interaction Summary/Trace/Graph */}
      {activeTab === 'intent' ? (
        <div className="flex-1 flex flex-col min-w-[500px] bg-white">
          <IntentAnalysisPanel trace={trace} />
        </div>
      ) : (
        <div className={`flex-1 flex flex-col min-w-[500px] bg-white ${activeTab === 'graph' ? 'max-w-none' : ''}`}>
          {/* Breadcrumbs */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setActiveTab('intent')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Intent
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 font-medium">
                {activeTab === 'summary' ? 'Interaction Summary' : 
                 activeTab === 'trace' ? 'Trace' : 
                 activeTab === 'graph' ? 'Graph View' : ''}
              </span>
            </div>
          </div>
          <InteractionSummaryPanel
            trace={trace}
            traceItems={traceItems}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      )}

      {/* Right Panel - Action Details (Hidden in Graph View and Intent View) */}
      {activeTab !== 'graph' && activeTab !== 'intent' && (
        <div className="w-[420px] flex flex-col bg-gray-50">
          <ActionDetailPanel
            selectedAction={selectedAction}
            onClose={() => setSelectedAction(null)}
            onClosePanel={null}
          />
        </div>
      )}
    </div>
  );

  return <div className="h-full">{content}</div>;
}

// Session Log Panel Component
function SessionLogPanel({ sessionLog, trace, sessionDate, onMessageClick }) {
  return (
    <div className="flex flex-col h-full" key={trace.id}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Chat Session Log</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>(4 min, 5 sec)</span>
          <button className="ml-auto text-blue-600 hover:text-blue-700">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Chat initiated */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-0.5 h-full bg-gray-200 absolute left-[38px] top-0" />
          <div className="relative z-10 w-5 h-5 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageCircle className="w-3 h-3 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Chat initiated by <span className="font-medium text-gray-700">User</span> • 11:00:00 AM</p>
          </div>
        </div>

        {/* Timeline Marker - Operational Optimization */}
        <div className="mb-4 pl-8">
          <div className="border-l-2 border-gray-300 pl-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-3 bg-gray-300" />
              <span className="text-xs text-gray-600 font-medium">Operational Optimization</span>
              <span className="text-xs text-gray-500">(4 min, 5 sec)</span>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">
                Quality: High
              </span>
            </div>

            {/* User Message */}
            <div className="mb-3">
              <div className="inline-block px-4 py-2 bg-gray-800 text-white rounded-2xl rounded-bl-sm max-w-[90%] text-sm">
                I need help with performance insights.
              </div>
              <p className="text-[10px] text-gray-400 mt-1">User • 11:00:00 AM</p>
            </div>

            {/* Agent Response */}
            <div 
              className="mb-3 flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onMessageClick && onMessageClick('trace')}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <div className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-gray-700 shadow-sm">
                  Hello! Thank you for reaching out to Pronto Food Delivery support. I'd be happy to assist you with performance insights. Can I start by getting your user ID, please?
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Agent (Complete: 5 sec)</p>
              </div>
            </div>

            {/* User ID */}
            <div className="mb-3">
              <div className="inline-block px-4 py-2 bg-gray-800 text-white rounded-2xl rounded-bl-sm max-w-[90%] text-sm">
                USER12345
              </div>
              <p className="text-[10px] text-gray-400 mt-1">User • 11:01:00 AM</p>
            </div>

            {/* Agent Response with clarification */}
            <div 
              className="mb-3 flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onMessageClick && onMessageClick('trace')}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <div className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-gray-700 shadow-sm">
                  Thank you for sharing your user ID, USER12345. Could you also let me know which Pronto product this inquiry is related to, or if it's a general issue?
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Agent (Complete: 5 sec)</p>
              </div>
            </div>

            {/* Product Selection */}
            <div className="mb-3">
              <div className="inline-block px-4 py-2 bg-gray-800 text-white rounded-2xl rounded-bl-sm max-w-[90%] text-sm">
                Restaurant Performance Analytics.
              </div>
              <p className="text-[10px] text-gray-400 mt-1">User • 11:02:00 AM</p>
            </div>

            {/* Final Agent Response */}
            <div 
              className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onMessageClick && onMessageClick('trace')}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <div className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-gray-700 shadow-sm">
                  Got it! I'll assist you with insights related to the Restaurant Performance Analytics product. Feel free to ask your questions, and I'll provide as much detail as possible!
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Agent (Complete: 8 sec)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat ended */}
        <div className="flex items-start gap-3 pl-8">
          <div className="relative z-10 w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Chat ended by <span className="font-medium text-gray-700">Agentforce</span> • Jan 8, 03:44 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to calculate total turns from trace items
function calculateTotalTurns(items) {
  let total = 0;
  const countTurns = (itemList) => {
    itemList.forEach(item => {
      if (item.data?.turns) {
        total += item.data.turns;
      }
      if (item.children && item.children.length > 0) {
        countTurns(item.children);
      }
    });
  };
  countTurns(items);
  return total;
}

// Helper to count agents and MCPs
function countAgentsAndMCPs(items) {
  let agents = 0;
  let mcps = 0;
  const count = (itemList) => {
    itemList.forEach(item => {
      if (item.type === 'agent') agents++;
      if (item.type === 'mcp') mcps++;
      if (item.children && item.children.length > 0) {
        count(item.children);
      }
    });
  };
  count(items);
  return { agents, mcps };
}

// Interaction Summary Panel Component
function InteractionSummaryPanel({ 
  trace, 
  traceItems, 
  expandedItems, 
  toggleExpand, 
  selectedAction, 
  setSelectedAction,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) {
  const sessionDate = useMemo(() => formatSessionDate(trace.timestamp), [trace.timestamp]);
  const totalTurns = useMemo(() => calculateTotalTurns(traceItems), [traceItems]);
  const { agents: agentCount, mcps: mcpCount } = useMemo(() => countAgentsAndMCPs(traceItems), [traceItems]);
  const [traceViewMode, setTraceViewMode] = useState('tree'); // 'tree' | 'waterfall'
  
  return (
    <div className="flex flex-col h-full" key={trace.id}>
      {/* Session Header - Only show when not in Intent view */}
      {activeTab !== 'intent' && (
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">Session: {sessionDate}</h2>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-gray-500">Session ID: {trace.id}</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                {totalTurns || trace.turnCount || 0} turns
              </span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">
                {agentCount} agents
              </span>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">
                {mcpCount} MCPs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Only show when not in Intent view */}
      {activeTab !== 'intent' && (
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Interaction Summary
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'trace'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trace
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'graph'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Network className="w-4 h-4" />
            Graph View
          </button>
        </div>
      )}

      {/* Content based on active tab - Only show when not in Intent view */}
      {activeTab !== 'intent' && (
        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === 'summary' && (
            <InteractionSummaryList items={traceItems} onItemClick={setSelectedAction} />
          )}
        
          {activeTab === 'trace' && (
            <>
              {/* Search + View Toggle */}
              <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setTraceViewMode('tree')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        traceViewMode === 'tree'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Tree View
                    </button>
                    <button
                      onClick={() => setTraceViewMode('waterfall')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        traceViewMode === 'waterfall'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Waterfall
                    </button>
                  </div>
                </div>
              </div>

              {/* Tree View */}
              {traceViewMode === 'tree' && (
                <div>
                  {traceItems.map((item, index) => (
                    <TraceItem
                      key={item.id}
                      item={item}
                      index={index}
                      isExpanded={expandedItems.has(item.id)}
                      isSelected={selectedAction?.id === item.id}
                      onToggle={() => toggleExpand(item.id)}
                      onSelect={() => setSelectedAction(item)}
                      depth={0}
                      expandedItems={expandedItems}
                      toggleExpand={toggleExpand}
                      setSelectedAction={setSelectedAction}
                      selectedAction={selectedAction}
                    />
                  ))}
                </div>
              )}

              {/* Waterfall View */}
              {traceViewMode === 'waterfall' && (
                <WaterfallView 
                  traceItems={traceItems} 
                  trace={trace}
                  onItemClick={setSelectedAction}
                  selectedAction={selectedAction}
                />
              )}
            </>
          )}

          {activeTab === 'graph' && (
            <GraphViewPanel trace={trace} />
          )}
        </div>
      )}
    </div>
  );
}

// Waterfall View Component
function WaterfallView({ traceItems, trace, onItemClick, selectedAction }) {
  // Flatten all items with their depth for waterfall visualization
  const flattenForWaterfall = (items, depth = 0, result = []) => {
    items.forEach(item => {
      result.push({ ...item, depth });
      if (item.children && item.children.length > 0) {
        flattenForWaterfall(item.children, depth + 1, result);
      }
    });
    return result;
  };

  const flatItems = useMemo(() => flattenForWaterfall(traceItems), [traceItems]);
  
  // Calculate total duration for scaling
  const totalDuration = trace.duration || 
    Math.max(...flatItems.map(item => (item.data?.start_time || 0) + (item.duration || 0)), 10000);

  const getBarColor = (item) => {
    if (item.status === 'error') return 'bg-red-500';
    if (item.type === 'agent') return 'bg-blue-500';
    if (item.type === 'mcp') return 'bg-purple-500';
    if (item.type === 'input') return 'bg-orange-400';
    if (item.type === 'reasoning' || item.type === 'action-selection' || item.type === 'topic-selection') return 'bg-amber-400';
    if (item.type === 'topic') return 'bg-green-400';
    return 'bg-gray-400';
  };

  const getIcon = (item) => {
    switch (item.type) {
      case 'agent-interaction': return '▶';
      case 'input': return '💬';
      case 'agent': return '🤖';
      case 'mcp': return '🔧';
      case 'topic': return '#';
      case 'error': return '⚠️';
      case 'action-selection':
        return item.data?.['routing.reason'] ? '🧠' : '◆';
      default: return '◆';
    }
  };

  return (
    <div className="p-4">
      {/* Timeline Header */}
      <div className="flex items-center mb-4 text-xs text-gray-500 border-b border-gray-200 pb-2">
        <div className="w-[250px] font-medium">Operation</div>
        <div className="flex-1 flex justify-between px-2">
          <span>0ms</span>
          <span>{Math.round(totalDuration / 4)}ms</span>
          <span>{Math.round(totalDuration / 2)}ms</span>
          <span>{Math.round(totalDuration * 3 / 4)}ms</span>
          <span>{totalDuration}ms</span>
        </div>
      </div>

      {/* Waterfall Rows */}
      <div className="space-y-1">
        {flatItems.map((item, index) => {
          const startTime = item.data?.start_time || 0;
          const duration = item.duration || 100;
          const leftPercent = (startTime / totalDuration) * 100;
          const widthPercent = Math.max((duration / totalDuration) * 100, 0.5);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex items-center cursor-pointer hover:bg-gray-50 rounded py-1.5 ${
                selectedAction?.id === item.id ? 'bg-blue-50' : ''
              }`}
              style={{ paddingLeft: item.depth * 12 }}
              onClick={() => onItemClick(item)}
            >
              {/* Label */}
              <div className="w-[250px] flex items-center gap-2 flex-shrink-0 pr-2">
                <span className="text-sm">{getIcon(item)}</span>
                <span className={`text-xs truncate ${item.status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {item.data?.turns && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">
                    {item.data.turns}t
                  </span>
                )}
              </div>

              {/* Timeline Bar */}
              <div className="flex-1 h-6 bg-gray-100 rounded relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ delay: index * 0.02, duration: 0.4 }}
                  className={`absolute h-full rounded ${getBarColor(item)}`}
                  style={{ left: `${leftPercent}%` }}
                />
                {/* Duration label */}
                <span 
                  className="absolute text-[10px] text-white font-medium px-1 top-1/2 -translate-y-1/2"
                  style={{ left: `calc(${leftPercent}% + 4px)` }}
                >
                  {formatDuration(duration)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-gray-600">MCP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span className="text-gray-600">Input</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-gray-600">Reasoning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600">Error</span>
        </div>
      </div>
    </div>
  );
}

// Graph View Panel Component
function GraphViewPanel({ trace }) {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Pure Graph Visualization - Full Space, No Legend, No Headers */}
      <SupervisorVisualization 
        traces={[trace]}
        onTraceSelect={(t) => {}}
        selectedTrace={trace}
      />
    </div>
  );
}

// Interaction Summary List Component (Salesforce Agentforce style)
function InteractionSummaryList({ items, onItemClick }) {
  // Flatten all items into a simple list (only supervisor reasoning items, not nested agent details)
  const flattenItems = (itemList, result = []) => {
    itemList.forEach(item => {
      // Include supervisor-level items
      if (item.type === 'agent-interaction' || 
          item.type === 'input' || 
          item.type === 'action-selection' || 
          item.type === 'topic-selection' || 
          item.type === 'topic' ||
          item.type === 'reasoning' ||
          item.type === 'error') {
        result.push(item);
      }
      // Recurse into children for supervisor reasoning
      if (item.children && item.children.length > 0) {
        flattenItems(item.children, result);
      }
    });
    return result;
  };

  let flatItems = flattenItems(items);
  
  // Filter out the root "agent-interaction" item, keep only the reasoning steps
  flatItems = flatItems.filter(item => item.type !== 'agent-interaction');

  const getIcon = (type) => {
    switch (type) {
      case 'input':
        return '💬';
      case 'topic-selection':
      case 'action-selection':
      case 'reasoning':
        return '◆';
      case 'topic':
        return '#';
      case 'error':
        return '🔍';
      default:
        return '◆';
    }
  };

  const getPrefix = (item) => {
    switch (item.type) {
      case 'input':
        return 'Input:';
      case 'topic':
        return 'Topic:';
      case 'topic-selection':
        return 'Reasoning:';
      case 'action-selection':
        // Check if this is a routing reasoning
        if (item.data?.['routing.reason']) {
          return 'Routing:';
        }
        return 'Reasoning:';
      case 'reasoning':
        return 'Reasoning:';
      default:
        return '';
    }
  };

  const getLabel = (item) => {
    if (item.type === 'input') {
      return 'User Input';
    }
    if (item.type === 'topic-selection') {
      return 'Topic Selection';
    }
    if (item.type === 'action-selection') {
      return 'Action Selection';
    }
    if (item.type === 'reasoning') {
      return item.label === 'Reasoning' ? 'Reasoning' : (item.label || 'Reasoning');
    }
    if (item.type === 'topic') {
      return item.data?.['topic.name'] || item.label;
    }
    if (item.type === 'error') {
      return item.label;
    }
    return item.label;
  };

  return (
    <div className="py-4 px-6 relative">
      {flatItems.map((item, index) => {
        const isError = item.status === 'error';
        const prefix = getPrefix(item);
        
        return (
          <div key={`${item.id}-${index}`} className="relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onItemClick(item)}
              className="flex items-start gap-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors group relative"
            >
              {/* Green Checkmark Circle */}
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isError ? 'bg-white border border-gray-300' : 'bg-teal-500'
              }`}>
                <CheckCircle className={`w-4 h-4 ${isError ? 'text-gray-400' : 'text-white'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {/* Prefix (Input:, Reasoning:, Topic:) */}
                  {prefix && (
                    <span className="text-sm text-gray-700 font-normal flex-shrink-0">
                      {prefix}
                    </span>
                  )}
                  
                  {/* Icon */}
                  <span className="text-sm flex-shrink-0 text-blue-600">{getIcon(item.type)}</span>
                  
                  {/* Label as link */}
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                    {getLabel(item)}
                  </span>
                </div>

                {/* Error details with search icon */}
                {isError && item.errorMessage && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-sm">
                    <span className="text-gray-600 flex-shrink-0">{item.label}:</span>
                    <span className="text-gray-500">🔍</span>
                    <span className="text-blue-600 hover:underline cursor-pointer">
                      {item.errorMessage}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Vertical dotted line connector */}
            {index < flatItems.length - 1 && (
              <div 
                className="absolute left-[9.5px] w-px border-l-2 border-dotted border-gray-300"
                style={{ top: '28px', height: '20px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Trace Item Component
function TraceItem({ item, index, isExpanded, isSelected, onToggle, onSelect, depth, expandedItems, toggleExpand, setSelectedAction, selectedAction }) {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = 12 + depth * 24;

  const getIcon = () => {
    switch (item.type) {
      case 'agent-interaction':
        return <Play className="w-3.5 h-3.5 text-gray-600" />;
      case 'input':
        return <Circle className="w-3 h-3 fill-orange-400 text-orange-400" />;
      case 'reasoning':
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'topic-selection':
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'topic':
        return <Hash className="w-3.5 h-3.5 text-gray-500" />;
      case 'action':
        return <Hash className="w-3.5 h-3.5 text-gray-500" />;
      case 'action-selection':
        // Check if this is a routing reasoning (has routing.reason attribute)
        if (item.data?.['routing.reason']) {
          return <span className="text-sm">🧠</span>; // Brain for routing reasoning
        }
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'agent':
        return <Bot className="w-3.5 h-3.5 text-blue-500" />;
      case 'mcp':
        return <Wrench className="w-3.5 h-3.5 text-purple-600" />;
      case 'grounded':
        return <FileText className="w-3.5 h-3.5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300" />;
    }
  };

  const getBarColor = () => {
    if (item.status === 'error') return 'bg-red-500';
    if (item.status === 'warning') return 'bg-amber-400';
    if (item.type === 'agent-interaction') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getBarWidth = () => {
    // For root (depth 0), always 100%
    if (depth === 0) return '100%';
    // For depth 1 (main agents/actions), calculate based on parent's total duration
    if (depth === 1) {
      const percentage = Math.min((item.duration / 5000) * 100, 100);
      return `${percentage}%`;
    }
    // For nested items (depth 2+), calculate relative to their parent
    const percentage = Math.min((item.duration / 2000) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`flex items-center gap-2 py-2.5 px-0 border-b border-gray-100 cursor-pointer transition-colors group ${
          isSelected ? 'bg-blue-50' : 
          depth === 0 ? 'hover:bg-gray-50 bg-white' :
          depth === 1 ? 'hover:bg-gray-50 bg-gray-50/30' :
          'hover:bg-gray-100 bg-gray-50/50'
        }`}
        style={{ paddingLeft }}
        onClick={onSelect}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>

        {/* Label */}
        <span className={`text-sm truncate ${
          item.status === 'error' ? 'text-red-600 font-medium' : 'text-gray-700'
        }`}>
          {item.label}
        </span>

        {/* Turns indicator */}
        {item.data?.turns && (
          <span className="text-xs text-blue-500 font-medium mr-2 flex-shrink-0 bg-blue-50 px-1.5 py-0.5 rounded">
            {item.data.turns} {item.data.turns === 1 ? 'turn' : 'turns'}
          </span>
        )}

        {/* Duration */}
        <span className="text-xs text-gray-400 font-mono ml-auto pr-3 flex-shrink-0">
          {formatDuration(item.duration)}
        </span>

        {/* Error indicator (red dot) */}
        {item.status === 'error' && (
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2 flex-shrink-0" />
        )}

        {/* Timeline Bar - Adjust width based on depth */}
        <div className={`h-1.5 rounded-full overflow-hidden flex-shrink-0 ${
          depth === 0 ? 'w-[500px]' : 
          depth === 1 ? 'w-[400px]' : 
          'w-[300px]'
        }`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: getBarWidth() }}
            transition={{ delay: index * 0.03, duration: 0.6, ease: 'easeOut' }}
            className={`h-full ${getBarColor()}`}
          />
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {item.children.map((child, childIndex) => (
              <TraceItem
                key={child.id}
                item={child}
                index={childIndex}
                isExpanded={expandedItems.has(child.id)}
                isSelected={selectedAction?.id === child.id}
                onToggle={() => toggleExpand(child.id)}
                onSelect={() => setSelectedAction(child)}
                depth={depth + 1}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                setSelectedAction={setSelectedAction}
                selectedAction={selectedAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Format JSON according to PRD structure
function formatJSONForPRD(selectedAction) {
  if (!selectedAction?.data) {
    return null;
  }

  const data = selectedAction.data;
  const type = selectedAction.type;
  
  // Base span metadata
  const spanMetadata = {
    span_id: data.span_id,
    parent_span_id: data.parent_span_id,
    name: selectedAction.label || data.name,
    kind: data.kind,
    start_time: data.start_time,
    duration: selectedAction.duration || data.duration,
    status: selectedAction.status || data.status,
    statusEnum: data.statusEnum || (selectedAction.status === 'error' ? 'FAILURE' : selectedAction.status === 'success' ? 'SUCCESS' : 'SKIPPED'),
  };

  // Organize by PRD categories
  const jsonStructure = {
    ...spanMetadata,
    attributes: {}
  };

  // Identity & Overview Attributes (for root traces and all spans)
  // Check for root trace attributes (may be in data directly or in nested attributes)
  const hasRootAttributes = data['processId'] || data['rootOrgId'] || data['priority'] || 
                           data['description'] || data['processAlias'] || !data['parent_span_id'];
  
  if (hasRootAttributes || type === 'agent-interaction') {
    const identityOverview = {
      processId: data['processId'],
      processAlias: data['processAlias'],
      rootOrgId: data['rootOrgId'],
      priority: data['priority'],
      description: data['description'],
      rootAgent: data['rootAgent'] || data['agent.id'] || data['agent.role'],
      routingReason: data['routing.reason'],
      totalLatency: data['totalLatency'] || selectedAction.duration,
      failingComponent: data['failingComponent'],
      failingComponentLatency: data['failingComponentLatency'],
      failureDescription: data['failureDescription'] || data['failure.description'],
      failureLayer: data['failureLayer'],
      errorCode: data['error.code'] || data['errorCode'],
      nodeType: data['node.type'] || 
                (type === 'agent' ? 'A2A_AGENT' : 
                 type === 'mcp' ? 'MCP_TOOL' : 
                 type === 'rag' ? 'RAG' : 
                 type === 'agent-interaction' ? 'NATIVE_AGENT' : 'NATIVE_AGENT'),
      nodeName: data['node.name'] || selectedAction.label,
    };
    
    // Only include if at least one attribute has a value
    const hasValues = Object.values(identityOverview).some(val => val !== undefined && val !== null);
    if (hasValues) {
      jsonStructure.attributes['identity_overview'] = identityOverview;
    }
  }

  // A2A Attributes (for agent spans)
  if (type === 'agent' || data['agent.id'] || data['rpc.system'] === 'agentforce_a2a') {
    const a2aAttributes = {
      senderAgent: data['sender.agent'],
      senderAgentId: data['sender.agent.id'],
      handoffTarget: data['handoff.target'],
      handoffTargetId: data['handoff.target.id'],
      handoffStatus: data['handoff.status'],
      agentLatency: selectedAction.duration || data.duration,
      handoffQualityScore: data['handoff.quality_score'],
      transferredDataSize: data['transferred.data.size'],
      transferredTokens: data['transferred.tokens'],
      precedingToolName: data['preceding.tool.name'],
      handoffLatency: data['handoff.latency'],
      repetitiveHandoffCount: data['repetitive.handoff.count'],
      vendorName: data['vendor.name'],
      agentOrigin: data['agent.origin'],
      targetOrgId: data['target.org.id'],
      trustBoundary: data['trust.boundary'],
      turns: data['turns'],
      agentId: data['agent.id'],
      agentRole: data['agent.role'],
      agentType: data['agent.type'],
      rpcSystem: data['rpc.system'],
      rpcMethod: data['rpc.method'],
      peerService: data['peer.service'],
    };
    
    // Only include if at least one attribute has a value
    const hasValues = Object.values(a2aAttributes).some(val => val !== undefined && val !== null);
    if (hasValues) {
      jsonStructure.attributes['a2a'] = a2aAttributes;
    }
  }

  // MCP/Tool Attributes (for MCP spans)
  if (type === 'mcp' || data['mcp.tool.name'] || data['tool.name']) {
    const mcpToolAttributes = {
      toolName: data['tool.name'] || data['mcp.tool.name'],
      toolType: data['tool.type'],
      toolErrorRate: data['tool.error.rate'],
      toolProvider: data['mcp.provider'] || data['tool.provider'],
      inputSize: data['input.size'],
      inputTokens: data['input.tokens'] || data['tokens.input'],
      outputSize: data['output.size'],
      outputTokens: data['output.tokens'] || data['tokens.output'],
      repetitiveToolCount: data['repetitive.tool.count'],
      httpMethod: data['http.method'],
      httpStatusCode: data['http.status_code'],
      httpUrl: data['http.url'],
      toolLatency: data['tool.latency'] || selectedAction.duration,
      toolResponseTime: data['tool.response.time'],
      mcpOperation: data['mcp.operation'],
      serviceName: data['service.name'],
      retryCount: data['retry.count'],
    };
    
    // Only include if at least one attribute has a value
    const hasValues = Object.values(mcpToolAttributes).some(val => val !== undefined && val !== null);
    if (hasValues) {
      jsonStructure.attributes['mcp_tool'] = mcpToolAttributes;
    }
  }

  // RAG Attributes (for RAG spans)
  if (type === 'rag' || data['operation.type'] === 'rag') {
    const ragAttributes = {
      ragLatency: selectedAction.duration || data.duration,
      contextPrecision: data['rag.context_precision'] || data['context_precision'],
      faithfulness: data['rag.faithfulness'] || data['faithfulness'],
      answerRelevance: data['rag.answer_relevance'] || data['answer_relevance'],
      documentsReturned: data['documents_returned'],
      queryText: data['query.text'] || data['queryText'],
    };
    
    // Only include if at least one attribute has a value
    const hasValues = Object.values(ragAttributes).some(val => val !== undefined && val !== null);
    if (hasValues) {
      jsonStructure.attributes['rag'] = ragAttributes;
    }
  }

  // Error Attributes (if present)
  if (data['error'] || data['error.message'] || data['error.code']) {
    jsonStructure.attributes['error'] = {
      error: data['error'],
      errorCode: data['error.code'] || data['errorCode'],
      errorType: data['error.type'],
      errorMessage: data['error.message'] || selectedAction.errorMessage,
    };
  }

  // Include all other attributes that don't fit into categories
  const categorizedKeys = new Set([
    'processId', 'processAlias', 'rootOrgId', 'priority', 'description', 'rootAgent', 'routing.reason',
    'totalLatency', 'failingComponent', 'failingComponentLatency', 'failureDescription', 'failure.description',
    'failureLayer', 'error.code', 'errorCode', 'node.type', 'node.name',
    'sender.agent', 'sender.agent.id', 'handoff.target', 'handoff.target.id', 'handoff.status',
    'handoff.quality_score', 'transferred.data.size', 'transferred.tokens', 'preceding.tool.name',
    'handoff.latency', 'repetitive.handoff.count', 'vendor.name', 'agent.origin', 'target.org.id',
    'trust.boundary', 'turns', 'agent.id', 'agent.role', 'agent.type', 'rpc.system', 'rpc.method', 'peer.service',
    'tool.name', 'mcp.tool.name', 'tool.type', 'tool.error.rate', 'mcp.provider', 'tool.provider',
    'input.size', 'input.tokens', 'tokens.input', 'output.size', 'output.tokens', 'tokens.output',
    'repetitive.tool.count', 'http.method', 'http.status_code', 'http.url', 'tool.latency', 'tool.response.time',
    'mcp.operation', 'service.name', 'retry.count',
    'rag.context_precision', 'rag.faithfulness', 'rag.answer_relevance', 'documents_returned', 'query.text',
    'error', 'error.code', 'error.type', 'error.message', 'span_id', 'parent_span_id', 'kind', 'start_time', 'duration', 'status', 'statusEnum'
  ]);

  const otherAttributes = {};
  Object.keys(data).forEach(key => {
    if (!categorizedKeys.has(key) && !key.startsWith('_')) {
      otherAttributes[key] = data[key];
    }
  });

  if (Object.keys(otherAttributes).length > 0) {
    jsonStructure.attributes['other'] = otherAttributes;
  }

  return jsonStructure;
}

// Intent Analysis Panel Component
function IntentAnalysisPanel({ trace }) {
  const totalTurns = trace.turnCount || 0;
  const avgLatency = trace.duration ? Math.round(trace.duration / (totalTurns || 1)) : 0;
  const intentElapsedTime = trace.duration ? formatDuration(trace.duration) : '00:00';
  const topics = trace.topics || [];
  const actions = trace.actions || [];
  const intentTag = trace.intentTag || 'N/A';
  const qualityScore = trace.qualityScore || 'Medium';
  const qualityScoreReason = trace.qualityScoreReason || 'No quality score available.';
  const intentSummary = trace.intentSummary || 'No intent summary available.';
  const rootAgent = trace.rootAgent || 'Unknown Agent';
  
  // Extract errors from trace
  const errors = useMemo(() => {
    const errorSet = new Set();
    if (trace.spans) {
      trace.spans.forEach(span => {
        // Check for error status
        if (span.status === 'ERROR' || span.status === 'FAILURE' || span.statusEnum === 'FAILURE') {
          const errorCode = span.attributes?.['error.code'] || span.attributes?.['errorCode'] || span.errorCode;
          const errorMessage = span.attributes?.['error.message'] || span.attributes?.['errorMessage'] || span.errorMessage;
          const httpStatus = span.attributes?.['http.status_code'] || span.attributes?.['http.statusCode'];
          const toolName = span.attributes?.['tool.name'] || span.attributes?.['mcp.tool.name'] || span.name;
          
          if (errorCode) {
            errorSet.add(errorCode);
          }
          if (httpStatus && httpStatus >= 400) {
            errorSet.add(`HTTP_${httpStatus}`);
          }
          if (errorMessage && !errorCode && !httpStatus) {
            // Extract error type from message
            const msg = errorMessage.toLowerCase();
            if (msg.includes('timeout')) errorSet.add('TIMEOUT');
            else if (msg.includes('connection') || msg.includes('refused')) errorSet.add('CONNECTION_REFUSED');
            else if (msg.includes('schema')) errorSet.add('SCHEMA_VIOLATION');
            else if (msg.includes('loop') || msg.includes('circular')) errorSet.add('LOOP_DETECTED');
            else if (toolName) errorSet.add(`${toolName}_ERROR`);
          }
        }
        // Check nested spans
        if (span.children) {
          span.children.forEach(child => {
            if (child.status === 'ERROR' || child.status === 'FAILURE' || child.statusEnum === 'FAILURE') {
              const errorCode = child.attributes?.['error.code'] || child.attributes?.['errorCode'] || child.errorCode;
              const httpStatus = child.attributes?.['http.status_code'] || child.attributes?.['http.statusCode'];
              if (errorCode) {
                errorSet.add(errorCode);
              }
              if (httpStatus && httpStatus >= 400) {
                errorSet.add(`HTTP_${httpStatus}`);
              }
            }
          });
        }
      });
    }
    // Also check trace-level errors
    if (trace.status === 'failed' || trace.status === 'error' || trace.statusEnum === 'FAILURE') {
      const traceErrorCode = trace.errorCode || trace.attributes?.['error.code'];
      if (traceErrorCode) {
        errorSet.add(traceErrorCode);
      }
    }
    return Array.from(errorSet);
  }, [trace]);
  
  // Generate intent moment ID from trace ID
  const intentMomentId = trace.trace_id || trace.id || 'N/A';
  const sessionDate = useMemo(() => formatSessionDate(trace.timestamp), [trace.timestamp]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Session Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900">Session: {sessionDate}</h2>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">Session ID: {trace.id}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {/* User's Full Intent - Prominently displayed at top */}
        <div className="mb-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed mb-2 break-words">
            {intentSummary}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Intent (Moment) ID: <span className="font-mono text-gray-600">{intentMomentId}</span>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8">
          {/* Left Column - Main Metadata */}
          <div className="flex-1 space-y-5">
            {/* Agent Name */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Agent Name</p>
              <p className="text-sm font-medium text-gray-900">{rootAgent}</p>
            </div>

            {/* Total Interactions */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Interactions</p>
              <p className="text-sm font-medium text-gray-900">{totalTurns} interaction{totalTurns !== 1 ? 's' : ''}</p>
            </div>

            {/* Topics Triggered */}
            {topics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Topics Triggered</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {topics.map((topic, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Intent Tag */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🏷️</span>
                <p className="text-xs text-gray-500">Intent Tag</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200">
                {intentTag}
              </span>
            </div>

            {/* Actions Triggered */}
            {actions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Actions Triggered</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {actions.map((action, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded border border-orange-200">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-gray-500">Errors</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {errors.map((error, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded border border-red-200">
                      {error}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quality Score */}
          <div className="w-80 flex-shrink-0">
            <div className="space-y-4">
              {/* Quality Score */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quality Score</p>
                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                  qualityScore === 'High' ? 'bg-green-100 text-green-800' :
                  qualityScore === 'Low' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {qualityScore}
                </span>
              </div>

              {/* Quality Score Reasoning */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quality Score Reasoning</p>
                <p className="text-sm text-gray-700 leading-relaxed">{qualityScoreReason}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Markdown Renderer Component
function MarkdownRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let inTable = false;
  let tableRows = [];
  let tableHeaders = [];

  const renderInlineMarkdown = (text) => {
    if (!text) return '';
    
    const parts = [];
    let currentIndex = 0;
    let lastIndex = 0;
    const matches = [];
    
    // Match **bold** (must be before *italic*)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'bold',
        content: match[1],
      });
    }
    
    // Match `code`
    const codeRegex = /`([^`]+)`/g;
    while ((match = codeRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'code',
        content: match[1],
      });
    }
    
    // Match *italic* (avoid conflicts with **bold**)
    // First, mark bold regions, then match italic outside them
    const boldRegions = [];
    const boldRegex2 = /\*\*(.*?)\*\*/g;
    while ((match = boldRegex2.exec(text)) !== null) {
      boldRegions.push({ start: match.index, end: match.index + match[0].length });
    }
    
    const italicRegex = /\*([^*\n]+)\*/g;
    while ((match = italicRegex.exec(text)) !== null) {
      // Check if this match is inside a bold region
      const isInBold = boldRegions.some(region => 
        match.index >= region.start && match.index < region.end
      );
      if (!isInBold) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'italic',
          content: match[1],
        });
      }
    }

    matches.sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      return text;
    }

    const result = [];
    matches.forEach((match) => {
      if (match.index > lastIndex) {
        result.push(text.substring(lastIndex, match.index));
      }
      
      if (match.type === 'bold') {
        result.push(<strong key={`bold-${currentIndex++}`} className="font-semibold text-gray-900">{match.content}</strong>);
      } else if (match.type === 'code') {
        result.push(<code key={`code-${currentIndex++}`} className="px-1 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-mono">{match.content}</code>);
      } else if (match.type === 'italic') {
        result.push(<em key={`italic-${currentIndex++}`} className="italic text-gray-600">{match.content}</em>);
      }
      
      lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result.length > 0 ? result : text;
  };

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${idx}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
            <code className="text-xs font-mono whitespace-pre">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle tables
    if (trimmedLine.includes('|') && trimmedLine.split('|').length >= 3) {
      const cells = trimmedLine.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells[0] === 'Metric' || cells[0] === '---') {
        // Header row or separator
        if (cells[0] === 'Metric') {
          tableHeaders = cells;
          inTable = true;
          tableRows = [];
        }
        return;
      }

      if (inTable) {
        tableRows.push(cells);
        return;
      }
    } else if (inTable && trimmedLine === '') {
      // End table
      elements.push(
        <div key={`table-${idx}`} className="my-3 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {tableHeaders.map((header, hIdx) => (
                  <th key={hIdx} className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    {renderInlineMarkdown(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-gray-300 px-3 py-2 text-xs text-gray-700">
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableRows = [];
      tableHeaders = [];
      return;
    }

    // Handle headers
    if (trimmedLine.startsWith('###')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-sm font-semibold text-gray-900 mt-4 mb-2">
          {renderInlineMarkdown(trimmedLine.replace('###', '').trim())}
        </h3>
      );
      return;
    }

    if (trimmedLine.startsWith('##')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="text-base font-bold text-gray-900 mt-5 mb-3 border-b border-gray-300 pb-1">
          {renderInlineMarkdown(trimmedLine.replace('##', '').trim())}
        </h2>
      );
      return;
    }

    // Handle horizontal rule
    if (trimmedLine.startsWith('---')) {
      elements.push(<hr key={`hr-${idx}`} className="my-4 border-gray-300" />);
      return;
    }

    // Handle empty lines
    if (trimmedLine === '') {
      elements.push(<br key={`br-${idx}`} />);
      return;
    }

    // Handle lists
    if (trimmedLine.match(/^[\d]+\./)) {
      // Numbered list
      const content = trimmedLine.replace(/^[\d]+\.\s*/, '');
      elements.push(
        <div key={`li-num-${idx}`} className="ml-4 mb-1 text-sm text-gray-700">
          {renderInlineMarkdown(content)}
        </div>
      );
      return;
    }

    if (trimmedLine.startsWith('-')) {
      const content = trimmedLine.replace(/^-\s*/, '');
      elements.push(
        <div key={`li-${idx}`} className="ml-4 mb-1 text-sm text-gray-700">
          • {renderInlineMarkdown(content)}
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-gray-700 mb-2 leading-relaxed">
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  // Handle remaining code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key="code-final" className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
        <code className="text-xs font-mono whitespace-pre">{codeBlockContent.join('\n')}</code>
      </pre>
    );
  }

  // Handle remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table-final" className="my-3 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {tableHeaders.map((header, hIdx) => (
                <th key={hIdx} className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  {renderInlineMarkdown(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="border border-gray-300 px-3 py-2 text-xs text-gray-700">
                    {renderInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="markdown-content">{elements}</div>;
}

// Action Detail Panel Component
function ActionDetailPanel({ selectedAction, onClose, onClosePanel }) {
  const [activeTab, setActiveTab] = useState('json'); // 'details' | 'json' | 'errors'
  const [copiedJson, setCopiedJson] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset explanation when action changes or tab switches
  useEffect(() => {
    setShowExplanation(false);
    setAiExplanation(null);
    setIsLoadingExplanation(false);
  }, [selectedAction?.id, activeTab]);

  const handleCopyJson = () => {
    const formattedJson = formatJSONForPRD(selectedAction);
    const jsonToCopy = formattedJson || selectedAction?.data || {};
    navigator.clipboard.writeText(JSON.stringify(jsonToCopy, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Check if there are errors in the selected action
  const hasErrors = () => {
    if (!selectedAction) return false;
    const data = selectedAction.data || {};
    const formattedJson = formatJSONForPRD(selectedAction);
    
    // Check for error indicators
    return (
      selectedAction.status === 'ERROR' ||
      data.statusEnum === 'FAILURE' ||
      data.errorCode ||
      formattedJson?.attributes?.error ||
      (formattedJson?.attributes?.error && Object.keys(formattedJson.attributes.error).length > 0) ||
      data['error.message'] ||
      data['error.type'] ||
      data['http.status_code'] >= 400
    );
  };

  // Generate AI explanation for errors
  const generateAIExplanation = async () => {
    if (!hasErrors()) {
      setAiExplanation("## Summary\n\nNo errors detected in this action. The operation completed successfully.");
      setShowExplanation(true);
      return;
    }

    setIsLoadingExplanation(true);
    setShowExplanation(true);

    try {
      // Extract error information
      const data = selectedAction.data || {};
      const formattedJson = formatJSONForPRD(selectedAction);
      const errorAttributes = formattedJson?.attributes?.error || {};
      
      // Build error context with all available metrics
      const errorContext = {
        status: selectedAction.status,
        statusEnum: data.statusEnum,
        errorCode: data.errorCode || errorAttributes['error.code'],
        errorMessage: data['error.message'] || errorAttributes['error.message'],
        errorType: data['error.type'] || errorAttributes['error.type'],
        httpStatusCode: data['http.status_code'],
        httpMethod: data['http.method'],
        httpUrl: data['http.url'],
        toolName: data['tool.name'] || selectedAction.label,
        toolType: data['tool.type'],
        agentId: data['agent.id'] || data['handoff.target'],
        latency: data['tool.latency'] || data['handoff.latency'] || data['tool.response.time'],
        duration: selectedAction.duration,
        failureLayer: data['failure.layer'],
        inputSize: data['input.size'] || data['input.tokens'],
        outputSize: data['output.size'] || data['output.tokens'],
        qualityScore: data['handoff.quality_score'] || data['quality.score'],
        retryCount: data['retry.count'] || data['repetitive.tool.count'] || data['repetitive.handoff.count'],
        turns: data.turns,
        timestamp: selectedAction.startTime || data.start_time,
      };

      // Simulate AI explanation (in production, this would call an actual AI API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let explanation = "";
      
      // Summary Section
      explanation += "## Summary\n\n";
      let summaryText = "";
      if (errorContext.errorCode) {
        summaryText = `A **${errorContext.errorCode}** error occurred`;
        if (errorContext.toolName) {
          summaryText += ` during execution of ${errorContext.toolName}`;
        }
        if (errorContext.agentId) {
          summaryText += ` by agent ${errorContext.agentId}`;
        }
        summaryText += ".";
      } else if (errorContext.httpStatusCode) {
        summaryText = `HTTP ${errorContext.httpStatusCode} error occurred`;
        if (errorContext.httpMethod && errorContext.httpUrl) {
          summaryText += ` on ${errorContext.httpMethod} ${errorContext.httpUrl}`;
        }
        summaryText += ".";
      } else {
        summaryText = "An error occurred during execution.";
      }
      explanation += summaryText + "\n\n";
      
      // Metrics Section
      explanation += "## Metrics\n\n";
      explanation += "| Metric | Value |\n";
      explanation += "|--------|-------|\n";
      
      if (errorContext.statusEnum) {
        explanation += `| Status | \`${errorContext.statusEnum}\` |\n`;
      }
      if (errorContext.errorCode) {
        explanation += `| Error Code | \`${errorContext.errorCode}\` |\n`;
      }
      if (errorContext.duration) {
        explanation += `| Duration | ${formatDuration(errorContext.duration)} |\n`;
      }
      if (errorContext.latency) {
        explanation += `| Latency | ${errorContext.latency}ms |\n`;
      }
      if (errorContext.httpStatusCode) {
        explanation += `| HTTP Status | ${errorContext.httpStatusCode} |\n`;
      }
      if (errorContext.httpMethod && errorContext.httpUrl) {
        explanation += `| HTTP Request | ${errorContext.httpMethod} ${errorContext.httpUrl} |\n`;
      }
      if (errorContext.toolName) {
        explanation += `| Component | ${errorContext.toolName}${errorContext.toolType ? ` (${errorContext.toolType})` : ''} |\n`;
      }
      if (errorContext.agentId) {
        explanation += `| Agent | ${errorContext.agentId} |\n`;
      }
      if (errorContext.failureLayer) {
        explanation += `| Failure Layer | ${errorContext.failureLayer} |\n`;
      }
      if (errorContext.inputSize) {
        explanation += `| Input Size | ${errorContext.inputSize}${errorContext.inputSize.toString().includes('token') ? '' : ' bytes'} |\n`;
      }
      if (errorContext.outputSize) {
        explanation += `| Output Size | ${errorContext.outputSize}${errorContext.outputSize.toString().includes('token') ? '' : ' bytes'} |\n`;
      }
      if (errorContext.qualityScore !== undefined) {
        explanation += `| Quality Score | ${errorContext.qualityScore} |\n`;
      }
      if (errorContext.retryCount) {
        explanation += `| Retry Count | ${errorContext.retryCount} |\n`;
      }
      if (errorContext.turns) {
        explanation += `| Turns | ${errorContext.turns} |\n`;
      }
      
      explanation += "\n";
      
      // Error Analysis Section
      explanation += "## Error Analysis\n\n";
      
      if (errorContext.errorCode) {
        explanation += `### Error Code: \`${errorContext.errorCode}\`\n\n`;
        
        // Provide specific explanations based on error codes
        switch (errorContext.errorCode) {
          case 'TIMEOUT':
            explanation += "**Root Cause:** This operation exceeded the maximum allowed execution time.\n\n";
            explanation += "**Possible Causes:**\n";
            explanation += "- Network latency or connectivity issues\n";
            explanation += "- Target service is overloaded or unresponsive\n";
            explanation += "- Operation requires more time than configured timeout\n";
            explanation += "- Resource contention or system bottlenecks\n\n";
            explanation += "**Impact:**\n";
            explanation += "- User experience degradation\n";
            explanation += "- Potential cascading failures in dependent operations\n";
            explanation += "- Resource waste from incomplete operations\n\n";
            explanation += "**Recommendations:**\n";
            explanation += "1. Check network connectivity and latency metrics\n";
            explanation += "2. Review and increase timeout settings if appropriate\n";
            explanation += "3. Investigate target service performance and capacity\n";
            explanation += "4. Implement retry logic with exponential backoff\n";
            explanation += "5. Consider breaking down the operation into smaller chunks\n";
            break;
          case 'CONNECTION_REFUSED':
            explanation += "**Root Cause:** The target service refused the connection attempt.\n\n";
            explanation += "**Possible Causes:**\n";
            explanation += "- Service is not running or not accessible\n";
            explanation += "- Firewall or network security rules blocking the connection\n";
            explanation += "- Incorrect hostname, port, or endpoint configuration\n";
            explanation += "- Service is binding to wrong interface or address\n\n";
            explanation += "**Impact:**\n";
            explanation += "- Complete failure of the operation\n";
            explanation += "- No data exchange possible\n";
            explanation += "- Potential service unavailability\n\n";
            explanation += "**Recommendations:**\n";
            explanation += "1. Verify the service is running and accessible\n";
            explanation += "2. Check network configuration and firewall rules\n";
            explanation += "3. Validate hostname, port, and endpoint URLs\n";
            explanation += "4. Review service logs for startup errors\n";
            explanation += "5. Test connectivity using network diagnostic tools\n";
            break;
          case 'SCHEMA_VIOLATION':
            explanation += "**Root Cause:** The request data structure doesn't match the expected schema.\n\n";
            explanation += "**Possible Causes:**\n";
            explanation += "- Missing required fields in the request payload\n";
            explanation += "- Incorrect data types or format validation failures\n";
            explanation += "- Version mismatch between client and server schemas\n";
            explanation += "- Malformed JSON or XML structure\n\n";
            explanation += "**Impact:**\n";
            explanation += "- Request rejection before processing\n";
            explanation += "- Data integrity concerns\n";
            explanation += "- Integration compatibility issues\n\n";
            explanation += "**Recommendations:**\n";
            explanation += "1. Review API documentation for required fields\n";
            explanation += "2. Validate request payload structure before sending\n";
            explanation += "3. Ensure schema version compatibility\n";
            explanation += "4. Implement request validation middleware\n";
            explanation += "5. Check for recent API schema changes\n";
            break;
          case 'LOOP_DETECTED':
            explanation += "**Root Cause:** A circular dependency or infinite loop detected in the agent workflow.\n\n";
            explanation += "**Possible Causes:**\n";
            explanation += "- Agents calling each other in a circular pattern\n";
            explanation += "- Routing logic creating infinite recursion\n";
            explanation += "- Missing exit conditions in workflow\n";
            explanation += "- Incorrect agent handoff configuration\n\n";
            explanation += "**Impact:**\n";
            explanation += "- Resource exhaustion\n";
            explanation += "- System performance degradation\n";
            explanation += "- Potential service unavailability\n";
            explanation += "- Increased costs from unnecessary operations\n\n";
            explanation += "**Recommendations:**\n";
            explanation += "1. Review agent routing logic and dependencies\n";
            explanation += "2. Implement loop detection mechanisms\n";
            explanation += "3. Add maximum iteration limits\n";
            explanation += "4. Ensure proper exit conditions in workflows\n";
            explanation += "5. Use directed acyclic graph (DAG) validation\n";
            break;
          default:
            explanation += "**Root Cause:** An execution error occurred during operation.\n\n";
            explanation += "**Impact:**\n";
            explanation += "- Operation failure\n";
            explanation += "- Potential data inconsistency\n";
            explanation += "- User experience disruption\n\n";
            explanation += "**Recommendations:**\n";
            explanation += "1. Review error details and logs\n";
            explanation += "2. Check system health and dependencies\n";
            explanation += "3. Verify configuration and permissions\n";
        }
      }

      if (errorContext.errorMessage) {
        explanation += `\n### Error Message\n\n\`\`\`\n${errorContext.errorMessage}\n\`\`\`\n\n`;
      }

      if (errorContext.httpStatusCode && errorContext.httpStatusCode >= 400) {
        explanation += `### HTTP Error: ${errorContext.httpStatusCode}\n\n`;
        
        if (errorContext.httpStatusCode === 404) {
          explanation += "**Meaning:** The requested resource was not found.\n\n";
          explanation += "**Actions:**\n";
          explanation += "- Verify the endpoint URL and resource ID\n";
          explanation += "- Check if the resource exists or was deleted\n";
          explanation += "- Review API versioning and routing configuration\n";
        } else if (errorContext.httpStatusCode === 401 || errorContext.httpStatusCode === 403) {
          explanation += "**Meaning:** Authentication or authorization failed.\n\n";
          explanation += "**Actions:**\n";
          explanation += "- Verify API credentials and tokens\n";
          explanation += "- Check user permissions and roles\n";
          explanation += "- Review authentication configuration\n";
          explanation += "- Ensure tokens haven't expired\n";
        } else if (errorContext.httpStatusCode === 429) {
          explanation += "**Meaning:** Rate limit exceeded.\n\n";
          explanation += "**Actions:**\n";
          explanation += "- Reduce request frequency\n";
          explanation += "- Implement exponential backoff retry logic\n";
          explanation += "- Review rate limit quotas and upgrade if needed\n";
          explanation += "- Consider request batching or queuing\n";
        } else if (errorContext.httpStatusCode >= 500) {
          explanation += "**Meaning:** Server-side error occurred.\n\n";
          explanation += "**Actions:**\n";
          explanation += "- This is likely a temporary service issue\n";
          explanation += "- Retry the request after a delay\n";
          explanation += "- Check service provider status page\n";
          explanation += "- Contact service support if issue persists\n";
        }
        explanation += "\n";
      }

      if (errorContext.failureLayer) {
        explanation += `### Failure Layer\n\nThe failure occurred at the **${errorContext.failureLayer}** layer, indicating where in the system stack the error originated.\n\n`;
      }

      // Additional Context
      if (errorContext.retryCount || errorContext.turns || errorContext.qualityScore !== undefined) {
        explanation += "## Additional Context\n\n";
        
        if (errorContext.retryCount) {
          explanation += `- **Retry Attempts:** ${errorContext.retryCount} retry(ies) were made before failure\n`;
        }
        if (errorContext.turns) {
          explanation += `- **Interaction Turns:** ${errorContext.turns} turn(s) occurred before this error\n`;
        }
        if (errorContext.qualityScore !== undefined) {
          explanation += `- **Quality Score:** ${errorContext.qualityScore} (lower scores may indicate issues)\n`;
        }
        explanation += "\n";
      }

      explanation += "---\n\n";
      explanation += "*This explanation was generated by analyzing error attributes and metrics from the trace data.*";

      setAiExplanation(explanation);
    } catch (error) {
      setAiExplanation("## Error\n\nFailed to generate explanation. Please review the error details manually.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Action</h3>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Minimize">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {onClosePanel && (
            <button 
              onClick={onClosePanel}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'json'
              ? 'text-blue-600 bg-blue-50 rounded-t-lg border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'errors'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Errors
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'json' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">JSON</span>
              <div className="flex items-center gap-2">
                {hasErrors() && (
                  <button
                    onClick={generateAIExplanation}
                    disabled={isLoadingExplanation}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Explain by AI"
                  >
                    {isLoadingExplanation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-3.5 h-3.5" />
                        <span>Explain by AI</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleCopyJson}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Copy JSON"
                >
                  {copiedJson ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* AI Explanation Panel */}
            {showExplanation && aiExplanation && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-purple-900">AI Explanation</h4>
                  </div>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="p-0.5 hover:bg-purple-100 rounded transition-colors"
                    title="Close explanation"
                  >
                    <X className="w-3.5 h-3.5 text-purple-600" />
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={aiExplanation} />
                </div>
              </div>
            )}
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {(() => {
                  const formattedJson = formatJSONForPRD(selectedAction);
                  if (formattedJson) {
                    return JSON.stringify(formattedJson, null, 2);
                  }
                  if (selectedAction?.data) {
                    return JSON.stringify(selectedAction.data, null, 2);
                  }
                  return JSON.stringify({
                    warnings: [],
                    inputText: "Action: DeliveryIssues_16jRZ0000009YfB.AnswerQuestionsWithKnowledge_179RZ0000000PEiWAnParameters:\\n  query: How to troubleshoot a delivery issue?\\n  mode: \"BASIC\"\\n  citationsEnabled: false\\n  ragFeatureConfigId: \"\"\\n  retrieverMode: \"SIMPLE\"\\n  citationsUrl: \"\"",
                    outputText: "{\\n  \"historyEntryType\": \"...\""
                  }, null, 2);
                })()}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            {selectedAction ? (
              <>
                <DetailRow label="Type" value={selectedAction.type} />
                <DetailRow label="Duration" value={formatDuration(selectedAction.duration)} />
                <DetailRow label="Status" value={selectedAction.status} />
                {selectedAction.label && (
                  <DetailRow label="Label" value={selectedAction.label} />
                )}

                {/* Agent Metrics (for A2A agents) */}
                {selectedAction.type === 'agent' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-blue-500">🤖</span> Agent Metrics
                    </h4>
                    
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">Latency</div>
                        <div className="text-lg font-bold text-blue-900">{formatDuration(selectedAction.duration)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${selectedAction.status === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className={`text-xs font-medium mb-1 ${selectedAction.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>Status</div>
                        <div className={`text-lg font-bold ${selectedAction.status === 'error' ? 'text-red-900' : 'text-green-900'}`}>
                          {selectedAction.status === 'error' ? 'Failed' : 'Success'}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-purple-600 font-medium mb-1">Quality Score</div>
                        <div className="text-lg font-bold text-purple-900">
                          {selectedAction.status === 'error' ? '0%' : `${Math.min(100, Math.round(100 - (selectedAction.duration / 100)))}%`}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <div className="text-xs text-amber-600 font-medium mb-1">Turns</div>
                        <div className="text-lg font-bold text-amber-900">{selectedAction.data?.turns || 1}</div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {selectedAction.data?.['agent.id'] && (
                      <DetailRow label="Agent ID" value={selectedAction.data['agent.id']} />
                    )}
                    {selectedAction.data?.['agent.role'] && (
                      <DetailRow label="Role" value={selectedAction.data['agent.role']} />
                    )}
                    {selectedAction.data?.['agent.type'] && (
                      <DetailRow label="Agent Type" value={selectedAction.data['agent.type']} />
                    )}
                    {selectedAction.data?.cross_org && (
                      <DetailRow label="Cross-Org" value="Yes" />
                    )}
                    {selectedAction.data?.source_org && (
                      <DetailRow label="Source Org" value={selectedAction.data.source_org} />
                    )}
                    {selectedAction.data?.['rpc.system'] && (
                      <DetailRow label="RPC System" value={selectedAction.data['rpc.system']} />
                    )}
                    {selectedAction.data?.['rpc.method'] && (
                      <DetailRow label="RPC Method" value={selectedAction.data['rpc.method']} />
                    )}
                  </div>
                )}

                {/* MCP Metrics (for MCP tools) */}
                {selectedAction.type === 'mcp' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-purple-500">🔧</span> MCP Tool Metrics
                    </h4>
                    
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-purple-600 font-medium mb-1">Latency</div>
                        <div className="text-lg font-bold text-purple-900">{formatDuration(selectedAction.duration)}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${selectedAction.status === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className={`text-xs font-medium mb-1 ${selectedAction.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>Status</div>
                        <div className={`text-lg font-bold ${selectedAction.status === 'error' ? 'text-red-900' : 'text-green-900'}`}>
                          {selectedAction.status === 'error' ? 'Failed' : 'Success'}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">Response Time</div>
                        <div className="text-lg font-bold text-blue-900">
                          {selectedAction.duration < 500 ? 'Fast' : selectedAction.duration < 2000 ? 'Normal' : 'Slow'}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <div className="text-xs text-amber-600 font-medium mb-1">Retries</div>
                        <div className="text-lg font-bold text-amber-900">{selectedAction.data?.['retry.count'] || 0}</div>
                      </div>
                    </div>

                    {/* MCP Details */}
                    {selectedAction.data?.['mcp.tool.name'] && (
                      <DetailRow label="Tool Name" value={selectedAction.data['mcp.tool.name']} />
                    )}
                    {selectedAction.data?.['mcp.operation'] && (
                      <DetailRow label="Operation" value={selectedAction.data['mcp.operation']} />
                    )}
                    {selectedAction.data?.['mcp.provider'] && (
                      <DetailRow label="Provider" value={selectedAction.data['mcp.provider']} />
                    )}
                    {selectedAction.data?.['service.name'] && (
                      <DetailRow label="Service" value={selectedAction.data['service.name']} />
                    )}
                    {selectedAction.data?.['http.method'] && (
                      <DetailRow label="HTTP Method" value={selectedAction.data['http.method']} />
                    )}
                    {selectedAction.data?.['http.status_code'] && (
                      <DetailRow label="HTTP Status" value={selectedAction.data['http.status_code']} />
                    )}
                    {selectedAction.data?.['http.url'] && (
                      <DetailRow label="URL" value={selectedAction.data['http.url']} />
                    )}
                  </div>
                )}
                
                {/* Turn Information */}
                {selectedAction.data?.turns && selectedAction.type !== 'agent' && selectedAction.type !== 'mcp' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Turn Information</h4>
                    <DetailRow label="Number of Turns" value={`${selectedAction.data.turns} ${selectedAction.data.turns === 1 ? 'turn' : 'turns'}`} />
                    {selectedAction.data['retry.count'] && (
                      <DetailRow label="Retry Count" value={selectedAction.data['retry.count']} />
                    )}
                  </div>
                )}
                
                {/* Token Usage (if available) */}
                {(selectedAction.data?.['tokens.input'] || selectedAction.data?.['tokens.output']) && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Token Usage</h4>
                    {selectedAction.data['tokens.input'] && (
                      <DetailRow label="Input Tokens" value={selectedAction.data['tokens.input'].toLocaleString()} />
                    )}
                    {selectedAction.data['tokens.output'] && (
                      <DetailRow label="Output Tokens" value={selectedAction.data['tokens.output'].toLocaleString()} />
                    )}
                  </div>
                )}

                {/* Routing Information (for reasoning) */}
                {selectedAction.data?.['topic.selected'] && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Routing Decision</h4>
                    <DetailRow label="Topic" value={selectedAction.data['topic.selected'].replace(/_/g, ' ')} />
                    {selectedAction.data['topic.confidence'] && (
                      <DetailRow label="Confidence" value={`${Math.round(selectedAction.data['topic.confidence'] * 100)}%`} />
                    )}
                  </div>
                )}

                {selectedAction.data?.['action.selected'] && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Action Decision</h4>
                    <DetailRow label="Action" value={selectedAction.data['action.selected']} />
                    {selectedAction.data['action.confidence'] && (
                      <DetailRow label="Confidence" value={`${Math.round(selectedAction.data['action.confidence'] * 100)}%`} />
                    )}
                    {selectedAction.data['cross_org'] && (
                      <DetailRow label="Cross-Org" value="Yes" />
                    )}
                    {selectedAction.data['external'] && (
                      <DetailRow label="External (3P)" value="Yes" />
                    )}
                  </div>
                )}

                {/* Routing Reasoning (Supervisor Decision) */}
                {selectedAction.data?.['routing.reason'] && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-orange-500">🧠</span> Supervisor Routing Reasoning
                    </h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-orange-800 leading-relaxed">
                        {selectedAction.data['routing.reason']}
                      </p>
                    </div>
                    {selectedAction.data['action.target'] && (
                      <DetailRow label="Target Agent" value={selectedAction.data['action.target']} />
                    )}
                    {selectedAction.data['routing.trigger'] && (
                      <DetailRow label="Trigger" value={selectedAction.data['routing.trigger']} />
                    )}
                    {selectedAction.data['routing.strategy'] && (
                      <DetailRow label="Strategy" value={selectedAction.data['routing.strategy'].charAt(0).toUpperCase() + selectedAction.data['routing.strategy'].slice(1)} />
                    )}
                    {selectedAction.data['routing.priority'] && (
                      <DetailRow label="Priority" value={`Step ${selectedAction.data['routing.priority']}`} />
                    )}
                  </div>
                )}

                {/* Workflow Summary (Final Reasoning) */}
                {selectedAction.data?.['reasoning.summary'] && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-blue-500">📋</span> Reasoning Summary
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {selectedAction.data['reasoning.summary']}
                      </p>
                    </div>
                    {selectedAction.data['workflow.pattern'] && (
                      <DetailRow label="Workflow Pattern" value={selectedAction.data['workflow.pattern'].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                    )}
                    {selectedAction.data['agents.invoked'] && (
                      <DetailRow label="Agents Invoked" value={selectedAction.data['agents.invoked']} />
                    )}
                    {selectedAction.data['fallback.triggered'] && (
                      <DetailRow label="Fallback Triggered" value="Yes" />
                    )}
                    {selectedAction.data['loop.detected'] && (
                      <DetailRow label="Loop Detected" value="Yes" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Select an action to view details
              </p>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="p-4">
            {selectedAction?.status === 'error' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Error Detected</p>
                    <p className="text-sm text-red-600 mt-1">
                      {selectedAction.errorMessage || 'An error occurred during execution'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No errors detected
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// Helper function to generate trace items from OpenTelemetry spans
function generateTraceItems(trace) {
  // If trace has OpenTelemetry spans structure, use it
  if (trace.spans && trace.spans.length > 0) {
    return buildItemsFromSpans(trace.spans, trace);
  }
  
  // Fallback to legacy structure
  return buildItemsFromAgents(trace);
}

// Build trace items from OpenTelemetry spans (new format)
function buildItemsFromSpans(spans, trace) {
  const items = [];
  
  // First, flatten all spans recursively to create a flat lookup map
  const flattenSpans = (spanList, result = []) => {
    spanList.forEach(span => {
      result.push(span);
      if (span.children && span.children.length > 0) {
        flattenSpans(span.children, result);
      }
    });
    return result;
  };
  
  const allSpansFlat = flattenSpans(spans);
  
  // Find root span (supervisor)
  const rootSpan = allSpansFlat.find(s => !s.parent_span_id);
  if (!rootSpan) return items;
  
  // Create root item
  const rootItem = {
    id: rootSpan.span_id,
    type: 'agent-interaction',
    label: rootSpan.name,
    duration: trace.duration,
    status: trace.status === 'failed' ? 'error' : 'success',
    children: [],
    data: {
      ...rootSpan.attributes,
      span_id: rootSpan.span_id,
      trace_id: trace.trace_id,
    },
  };
  
  // Get A2A agent spans (these have MCPs nested inside)
  // Filter by SERVER kind and agent attributes
  const agentSpans = allSpansFlat.filter(s => 
    s.parent_span_id === rootSpan.span_id &&
    s.kind === 'SERVER' &&
    (s.name.includes('A2A') || s.name === 'agent.handoff' || s.attributes?.['agent.id'] || s.attributes?.['rpc.system'] === 'agentforce_a2a')
  );
  
  // Build a map of agent names to their spans for matching with routing reasoning
  const agentMap = new Map();
  agentSpans.forEach(span => {
    // Extract agent name from attributes (handoff.target) or from name
    let agentName = span.attributes?.['handoff.target'];
    if (!agentName) {
      // Fallback: try to extract from name
      if (span.name.includes('A2A: ')) {
        agentName = span.name.replace('A2A: ', '');
      } else if (span.name === 'agent.handoff') {
        // Use handoff.target.id or agent.id as fallback
        agentName = span.attributes?.['handoff.target.id'] || span.attributes?.['agent.id'] || span.name;
      } else {
        agentName = span.name;
      }
    }
    agentMap.set(agentName, span);
  });
  
  // Process supervisor reasoning children in order
  const orderedChildren = [];
  
  if (rootSpan.children && rootSpan.children.length > 0) {
    // Sort supervisor children by start_time
    const sortedChildren = [...rootSpan.children].sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
    
    sortedChildren.forEach(child => {
      const item = buildSpanItem(child, allSpansFlat);
      orderedChildren.push(item);
      
      // If this is a routing reasoning, add the corresponding A2A agent right after it
      if (child.attributes?.['routing.reason'] && child.attributes?.['action.target']) {
        const targetAgent = child.attributes['action.target'];
        const agentSpan = agentMap.get(targetAgent);
        
        if (agentSpan) {
          const agentItem = buildSpanItem(agentSpan, allSpansFlat);
          orderedChildren.push(agentItem);
          // Remove from map so we don't add it again
          agentMap.delete(targetAgent);
        }
      }
    });
  }
  
  // Add any remaining agents that weren't matched with routing reasoning
  agentMap.forEach((span) => {
    const agentItem = buildSpanItem(span, allSpansFlat);
    orderedChildren.push(agentItem);
  });
  
  rootItem.children = orderedChildren;
  
  items.push(rootItem);
  return items;
}

// Recursively build span item with its children
function buildSpanItem(span, allSpansFlat) {
  const isError = span.status === 'ERROR' || span.attributes?.error;
  const isMCP = span.attributes?.['mcp.tool.name'];
  // Detect A2A agents: SERVER kind with agent attributes OR name includes 'A2A' or 'agent.handoff'
  const isAgent = span.kind === 'SERVER' && (
    span.name.includes('A2A') || 
    span.name === 'agent.handoff' ||
    span.attributes?.['agent.id'] ||
    span.attributes?.['rpc.system'] === 'agentforce_a2a'
  );
  const isTopicSelection = span.attributes?.['reasoning.type'] === 'topic_selection';
  const isActionSelection = span.attributes?.['reasoning.type'] === 'action_selection';
  const isReasoning = span.attributes?.['operation.type'] === 'reasoning';
  
  // Determine type with Agentforce-specific reasoning types
  let itemType = 'action';
  if (isMCP) itemType = 'mcp';
  else if (isAgent) itemType = 'agent';
  else if (isTopicSelection) itemType = 'topic-selection';
  else if (isActionSelection) itemType = 'action-selection';
  else if (isReasoning) itemType = 'reasoning';
  else if (span.attributes?.['operation.type']) itemType = span.attributes['operation.type'];
  
  // Determine label - for agents, show "A2A: Agent Name" format
  let label = span.name;
  if (isAgent && span.name === 'agent.handoff') {
    // Use handoff.target or reconstruct from attributes
    const agentName = span.attributes?.['handoff.target'] || span.attributes?.['agent.id'] || 'Agent';
    label = `A2A: ${agentName}`;
  }
  
  const item = {
    id: span.span_id,
    type: itemType,
    label: label,
    duration: span.duration,
    status: isError ? 'error' : 'success',
    errorMessage: span.attributes?.['error.message'],
    children: [],
    data: {
      ...span.attributes,
      span_id: span.span_id,
      parent_span_id: span.parent_span_id,
      name: span.name,
      kind: span.kind,
      start_time: span.start_time,
      duration: span.duration,
      status: span.status,
      statusEnum: span.statusEnum || (span.status === 'ERROR' ? 'FAILURE' : span.status === 'OK' ? 'SUCCESS' : 'SKIPPED'),
    },
  };
  
  // Find and add child spans (prioritize span.children, then fallback to flat lookup)
  let childSpans = [];
  if (span.children && span.children.length > 0) {
    // Use nested children if available
    childSpans = span.children;
  } else {
    // Fallback: find children from flat array by parent_span_id
    childSpans = allSpansFlat.filter(s => s.parent_span_id === span.span_id);
  }
  
  if (childSpans && childSpans.length > 0) {
    // Sort children by start_time
    childSpans = [...childSpans].sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
    item.children = childSpans.map(child => buildSpanItem(child, allSpansFlat));
  }
  
  return item;
}

// Legacy: Build from agents array (fallback)
function buildItemsFromAgents(trace) {
  const items = [];

  const agentInteraction = {
    id: 'agent-interaction',
    type: 'agent-interaction',
    label: 'Agent Interaction',
    duration: 5001,
    status: trace.status === 'failed' ? 'error' : 'success',
    children: [],
    data: {
      traceId: trace.id,
      friendlyName: trace.friendlyName,
      rootAgent: trace.rootAgent,
      duration: trace.duration,
      status: trace.status,
    },
  };

  // Add basic items for backward compatibility
  agentInteraction.children.push({
    id: 'input',
    type: 'input',
    label: 'User Input',
    duration: 1,
    status: 'success',
    data: {},
  });

  if (trace.agents) {
    trace.agents.slice(1).forEach((agent, index) => {
      const isError = agent.status === 'error' || agent.errorMessage;
      agentInteraction.children.push({
        id: `agent-${agent.id}`,
        type: 'agent',
        label: agent.name,
        duration: agent.latency || 1000,
        status: isError ? 'error' : 'success',
        errorMessage: agent.errorMessage,
        children: [],
        data: { ...agent },
      });
    });
  }

  items.push(agentInteraction);
  return items;
}

// Helper function to generate mock session log
function generateMockSessionLog(trace) {
  const userQuery = trace.theme === 'Tool Error' 
    ? "How can I troubleshoot a delivery issue?"
    : trace.theme === 'Silent Drop'
    ? "I need help with my insurance claim"
    : trace.theme === 'Logic Loop'
    ? "I'd like to place an order for 50 units"
    : "Can you help me with my request?";

  const agentResponse = trace.status === 'failed'
    ? "I'm unable to access the troubleshooting information directly right now. Could you provide more details about the delivery issue you're experiencing? I'll do my best to assist you!"
    : "I've found the relevant information for your request. Let me help you with that.";

  return {
    messages: [
      {
        role: 'user',
        content: userQuery,
        timestamp: formatTimestamp(trace.timestamp),
      },
      {
        role: 'agent',
        content: agentResponse,
        timestamp: formatTimestamp(trace.timestamp),
      },
    ],
  };
}

export default TraceDetailPanel;
