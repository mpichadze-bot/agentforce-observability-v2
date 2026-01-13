import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Bell,
  HelpCircle,
  Settings,
  Grid3x3,
  Star,
  Plus,
  User,
  ListFilter,
  Network,
  BarChart3,
  RefreshCw,
  Filter,
  ChevronRight,
  Sparkles,
  Phone,
} from 'lucide-react';
import {
  traces,
  formatDuration,
  formatTimestamp,
} from './mockData';
import TraceDetailPanel from './components/TraceDetailPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AgentNetworkGraph from './components/AgentNetworkGraph';

function App() {
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'analytics' | 'supervisor' | 'network'
  const [viewMode, setViewMode] = useState('browse'); // 'browse' | 'session'

  const handleTraceClick = (trace) => {
    setSelectedTrace(trace);
    setViewMode('session');
  };

  const handleBackToList = () => {
    setViewMode('browse');
    setSelectedTrace(null);
  };

  // If in session view mode, show full-screen session view
  if (viewMode === 'session' && selectedTrace) {
    const sessionDate = formatSessionDate(selectedTrace.timestamp);
    const sessionId = selectedTrace.id;

  return (
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedTrace.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-white flex flex-col"
        >
          {/* Salesforce Header */}
          <header className="bg-white border-b border-gray-200">
            {/* Top Bar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
              {/* Left: Salesforce Cloud Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
              </div>

              {/* Center: Global Search */}
              <div className="flex-1 max-w-2xl mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Right: User Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Star className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Grid3x3 className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Bell className="w-4 h-4 text-gray-600" />
                </button>
                <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Studio Header */}
            <div className="px-6 py-3 flex items-center gap-4">
              <Grid3x3 className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900">Agentforce Studio</h1>
            </div>

            {/* Tabs */}
            <div className="px-6 flex gap-6 border-b border-gray-200">
            <TabButton 
              label="Sessions & Intents" 
              active={false}
              onClick={handleBackToList}
            />
              <TabButton 
                label={sessionId.slice(0, 12) + "..."} 
                active 
                highlight
                />
            </div>
          </header>

          {/* Session Content */}
          <div className="flex-1">
            <TraceDetailPanel trace={selectedTrace} onClose={handleBackToList} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Landing page view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Salesforce Header */}
      <header className="bg-white border-b border-gray-200">
        {/* Top Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
              </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Star className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Grid3x3 className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <HelpCircle className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
            </button>
            <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Studio Header */}
        <div className="px-6 py-3 flex items-center gap-4">
          <Grid3x3 className="w-5 h-5 text-gray-600" />
          <h1 className="text-xl font-semibold text-gray-900">Agentforce Studio</h1>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-6 border-b border-gray-200">
            <TabButton
            label="Sessions & Intents" 
              icon={ListFilter}
            active={activeView === 'list'} 
            onClick={() => setActiveView('list')} 
            />
            <TabButton
            label="Network Graph" 
            icon={Network}
            active={activeView === 'network'} 
            onClick={() => setActiveView('network')} 
            />
            <TabButton
            label="Analytics" 
            icon={BarChart3}
            active={activeView === 'analytics'} 
            onClick={() => setActiveView('analytics')}
            highlight
            />
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {activeView === 'analytics' && <AnalyticsDashboard />}
        {activeView === 'list' && (
          <SessionsList 
            traces={traces} 
            onTraceClick={handleTraceClick}
            selectedTrace={selectedTrace}
          />
        )}
        {activeView === 'network' && <AgentNetworkGraph traces={traces} />}
      </div>
          </div>
  );
}

// Sessions List Component
function SessionsList({ traces, onTraceClick, selectedTrace }) {
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [sessionModality, setSessionModality] = useState('all');
  const [dateRange, setDateRange] = useState('90d');
  const [activeTab, setActiveTab] = useState('processed');
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get unique agents
  const agents = ['all', ...new Set(traces.map(t => t.rootAgent))];

  // Sort traces based on selected column
  const sortedTraces = useMemo(() => {
    const sorted = [...traces];
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'id':
          aValue = a.trace_id || a.id;
          bValue = b.trace_id || b.id;
          break;
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'intent':
          aValue = a.intentSummary || a.theme || '';
          bValue = b.intentSummary || b.theme || '';
          break;
        case 'response':
          aValue = a.responseSummary || '';
          bValue = b.responseSummary || '';
          break;
        case 'quality':
          const aQuality = a.qualityScore || (a.status === 'success' ? 'High' : a.status === 'failed' ? 'Low' : 'Medium');
          const bQuality = b.qualityScore || (b.status === 'success' ? 'High' : b.status === 'failed' ? 'Low' : 'Medium');
          const qualityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = qualityOrder[aQuality] || 0;
          bValue = qualityOrder[bQuality] || 0;
          break;
        case 'orgType':
          aValue = a.trustBoundary?.type || 'SOMA';
          bValue = b.trustBoundary?.type || 'SOMA';
          const orgOrder = { 'SOMA': 1, 'MOMA': 2, '3P': 3 };
          aValue = orgOrder[aValue] || 0;
          bValue = orgOrder[bValue] || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [traces, sortColumn, sortDirection]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select an Agent:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {agents.map(agent => (
                <option key={agent} value={agent}>
                  {agent === 'all' ? 'All Agents' : agent}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Modality</label>
          <select
              value={sessionModality}
              onChange={(e) => setSessionModality(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
              <option value="all">All</option>
              <option value="chat">Chat</option>
              <option value="voice">Voice</option>
          </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
          </select>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Sessions & Intents</h2>
          <HelpCircle className="w-5 h-5 text-blue-500" />
        </div>
          
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 -mb-px">
          <button
            onClick={() => setActiveTab('processed')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'processed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Processed Sessions
          </button>
          <button
            onClick={() => setActiveTab('unprocessed')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'unprocessed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Unprocessed Sessions
          </button>
          </div>
      </div>

      {/* Filter Info and Search */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{sortedTraces.length}</span> of <span className="font-medium">{traces.length}</span> processed sessions
          {selectedAgent !== 'all' && (
            <span className="ml-1">
              | Filtered by: Agent = <span className="font-medium">{selectedAgent}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
    </div>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4 text-gray-600" />
    </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortableHeader label="Session ID" column="id" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Timestamp" column="timestamp" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Session Duration" column="duration" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Intent Summary" column="intent" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Response Summary" column="response" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Topics</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Actions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Intent Tag</th>
              <SortableHeader label="Org Type" column="orgType" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader label="Quality Score" column="quality" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Quality Score Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedTraces.map((trace, index) => (
              <SessionRow
                key={trace.id}
                trace={trace}
                index={index}
                isSelected={selectedTrace?.id === trace.id}
                onClick={() => onTraceClick(trace)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sortable Header Component
function SortableHeader({ label, column, sortColumn, sortDirection, onSort }) {
  const isActive = sortColumn === column;
  
    return (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronRight 
            className={`w-3 h-3 transform -rotate-90 ${isActive && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
          <ChevronRight 
            className={`w-3 h-3 transform rotate-90 -mt-1 ${isActive && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
        </div>
      </div>
    </th>
    );
  }
  
// Session Row Component
function SessionRow({ trace, index, isSelected, onClick }) {
  // Extract topics and actions from spans
  const topics = trace.topics || extractTopics(trace);
  const actions = trace.actions || extractActions(trace);
  const intentSummary = trace.intentSummary || trace.theme || 'Agent interaction request';
  const responseSummary = trace.responseSummary || generateResponseSummary(trace);
  const intentTag = trace.intentTag || trace.rootAgent || 'General Inquiry';
  const qualityScore = trace.qualityScore || (trace.status === 'success' ? 'High' : trace.status === 'failed' ? 'Low' : 'Medium');
  const qualityScoreReason = trace.qualityScoreReason || generateQualityReason(trace, qualityScore);

    return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-blue-50 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Session ID */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-blue-600 hover:underline font-mono">{trace.trace_id || trace.id}</p>
        </div>
      </td>
      
      {/* Timestamp */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{formatTableTimestamp(trace.timestamp)}</span>
      </td>
      
      {/* Session Duration */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{formatTableDuration(trace.duration)}</span>
      </td>
      
      {/* Intent Summary */}
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-gray-900 line-clamp-2">
          {intentSummary}
        </p>
      </td>
      
      {/* Response Summary */}
      <td className="px-4 py-3 max-w-sm">
        <p className="text-sm text-gray-600 line-clamp-3">
          {responseSummary}
        </p>
      </td>
      
      {/* Topics */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {topics.slice(0, 2).map((topic, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
              {topic}
            </span>
          ))}
          {topics.length > 2 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500">
              +{topics.length - 2}
            </span>
          )}
        </div>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {actions.slice(0, 2).map((action, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded border border-purple-200">
              {action}
            </span>
          ))}
          {actions.length > 2 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500">
              +{actions.length - 2}
            </span>
          )}
        </div>
      </td>
      
      {/* Intent Tag */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{intentTag}</span>
      </td>
      
      {/* Org Type */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded ${
          trace.trustBoundary?.type === 'SOMA' ? 'bg-blue-100 text-blue-800' :
          trace.trustBoundary?.type === 'MOMA' ? 'bg-purple-100 text-purple-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {trace.trustBoundary?.type || 'SOMA'}
        </span>
      </td>
      
      {/* Quality Score */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
          qualityScore === 'High' ? 'bg-green-100 text-green-800' :
          qualityScore === 'Low' ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {qualityScore}
        </span>
      </td>
      
      {/* Quality Score Reason */}
      <td className="px-4 py-3 max-w-sm">
        <p className="text-sm text-gray-600 line-clamp-2">
          {qualityScoreReason}
        </p>
      </td>
    </motion.tr>
    );
  }
  
// Helper: Extract topics from trace
function extractTopics(trace) {
  const topics = [];
  if (trace.spans) {
    trace.spans.forEach(span => {
      if (span.attributes?.['topic.name']) {
        topics.push(span.attributes['topic.name']);
      }
      if (span.children) {
        span.children.forEach(child => {
          if (child.attributes?.['topic.name']) {
            topics.push(child.attributes['topic.name']);
          }
        });
      }
    });
  }
  return [...new Set(topics)].slice(0, 5); // Unique topics, max 5
}

// Helper: Extract actions from trace
function extractActions(trace) {
  const actions = [];
  if (trace.spans) {
    trace.spans.forEach(span => {
      if (span.attributes?.['mcp.operation']) {
        actions.push(`${span.attributes['mcp.tool.name']}_${span.attributes['mcp.operation']}`);
      }
      if (span.attributes?.['rpc.method']) {
        actions.push(span.attributes['rpc.method']);
      }
      if (span.children) {
        span.children.forEach(child => {
          if (child.attributes?.['mcp.operation']) {
            actions.push(`${child.attributes['mcp.tool.name']}_${child.attributes['mcp.operation']}`);
          }
        });
      }
    });
  }
  return [...new Set(actions)].slice(0, 5); // Unique actions, max 5
}

// Helper: Generate response summary
function generateResponseSummary(trace) {
  if (trace.status === 'success') {
    const agentCount = trace.agents?.length || 0;
    const mcpCount = trace.mcpCalls?.length || 0;
    return `The agent successfully processed the request${agentCount > 0 ? ` using ${agentCount} agent${agentCount > 1 ? 's' : ''}` : ''}${mcpCount > 0 ? ` and ${mcpCount} tool call${mcpCount > 1 ? 's' : ''}` : ''}. ${trace.rootAgent} completed the workflow and provided a comprehensive response.`;
  } else {
    return `The agent encountered issues during execution. ${trace.failureDescription || 'An error occurred that prevented successful completion of the request.'} The workflow was ${trace.failingComponent ? `interrupted at ${trace.failingComponent}` : 'not completed'}.`;
  }
}

// Helper: Generate quality score reason
function generateQualityReason(trace, qualityScore) {
  if (qualityScore === 'High') {
    return `The agent successfully resolved the user's request${trace.agents?.length ? ` by coordinating ${trace.agents.length} agent${trace.agents.length > 1 ? 's' : ''}` : ''}. All operations completed successfully and the response was comprehensive.`;
  } else if (qualityScore === 'Low') {
    return `The agent encountered errors during execution${trace.failingComponent ? ` at ${trace.failingComponent}` : ''}. ${trace.failureDescription || 'The request could not be fully processed.'}`;
  } else {
    return `The agent processed the request with partial success. Some operations completed successfully, but the workflow encountered issues${trace.failingComponent ? ` at ${trace.failingComponent}` : ''}.`;
  }
}

// Helper: Format timestamp for table (MM/DD/YYYY, HH:MM:SS AM/PM)
function formatTableTimestamp(timestamp) {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
}

// Helper: Format duration for table (X sec, X min X sec)
function formatTableDuration(durationMs) {
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
  }
  
// Tab Button Component
function TabButton({ label, active, highlight, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative whitespace-nowrap ${
        active
          ? 'border-blue-500 text-gray-900 bg-blue-50/50'
          : highlight
          ? 'border-transparent text-purple-600 hover:bg-purple-50'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {highlight && !active && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
          NEW
        </span>
      )}
    </button>
  );
}

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

export default App;
