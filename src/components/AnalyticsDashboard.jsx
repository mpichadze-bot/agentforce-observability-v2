import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { traces, formatDuration } from '../mockData';

function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedAgent, setSelectedAgent] = useState('all');

  // Calculate metrics
  const metrics = useMemo(() => {
    // Count A2A invocations (agent-to-agent calls)
    let a2aCount = 0;
    let mcpCount = 0;
    let totalLatency = 0;
    let errorCount = 0;
    let successCount = 0;
    
    const agentMetrics = new Map();

    traces.forEach(trace => {
      if (trace.agents) {
        // Each secondary agent is an A2A invocation
        const secondaryAgents = trace.agents.filter(a => a.role !== 'supervisor');
        a2aCount += secondaryAgents.length;

        secondaryAgents.forEach(agent => {
          // Count MCPs (tools/external connections)
          if (agent.type === '3p' || agent.name.toLowerCase().includes('mcp') || 
              agent.name.toLowerCase().includes('booking') || 
              agent.name.toLowerCase().includes('yelp') ||
              agent.name.toLowerCase().includes('eventbrite')) {
            mcpCount++;
          }

          // Track per-agent metrics
          if (!agentMetrics.has(agent.name)) {
            agentMetrics.set(agent.name, {
              name: agent.name,
              type: agent.type,
              invocations: 0,
              totalLatency: 0,
              errors: 0,
              successes: 0,
              avgLatency: 0,
              errorRate: 0,
              qualityScore: 0,
            });
          }

          const metric = agentMetrics.get(agent.name);
          metric.invocations++;
          metric.totalLatency += agent.latency || 0;
          
          if (agent.status === 'error' || agent.status === 'unreachable' || agent.errorMessage) {
            metric.errors++;
            errorCount++;
          } else {
            metric.successes++;
            successCount++;
          }

          totalLatency += agent.latency || 0;
        });
      }
    });

    // Calculate averages and quality scores
    agentMetrics.forEach(metric => {
      metric.avgLatency = metric.totalLatency / metric.invocations;
      metric.errorRate = (metric.errors / metric.invocations) * 100;
      
      // Quality score: 100 - (error_rate * 0.5) - (normalized_latency * 0.5)
      const normalizedLatency = Math.min((metric.avgLatency / 5000) * 100, 100);
      metric.qualityScore = Math.max(0, 100 - (metric.errorRate * 0.5) - (normalizedLatency * 0.5));
    });

    const avgLatency = a2aCount > 0 ? totalLatency / a2aCount : 0;
    const overallErrorRate = a2aCount > 0 ? (errorCount / a2aCount) * 100 : 0;

    return {
      a2aCount,
      mcpCount,
      avgLatency,
      errorCount,
      successCount,
      overallErrorRate,
      agentMetrics: Array.from(agentMetrics.values()).sort((a, b) => b.invocations - a.invocations),
    };
  }, [traces, timeRange]);

  // Filter agent metrics
  const filteredAgentMetrics = selectedAgent === 'all' 
    ? metrics.agentMetrics 
    : metrics.agentMetrics.filter(a => a.name === selectedAgent);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-500" />
              Multi-Agent Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              A2A invocations, MCP calls, and agent performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Users}
          label="A2A Invocations"
          value={metrics.a2aCount}
          trend={+12.5}
          color="blue"
        />
        <MetricCard
          icon={Zap}
          label="MCP Calls"
          value={metrics.mcpCount}
          trend={+8.3}
          color="purple"
        />
        <MetricCard
          icon={Clock}
          label="Avg Latency"
          value={formatDuration(metrics.avgLatency)}
          trend={-5.2}
          color="green"
          isImprovement={true}
        />
        <MetricCard
          icon={AlertCircle}
          label="Error Rate"
          value={`${metrics.overallErrorRate.toFixed(1)}%`}
          trend={-2.1}
          color={metrics.overallErrorRate > 10 ? 'red' : 'green'}
          isImprovement={true}
        />
      </div>

      {/* Agent Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Agents</option>
            {metrics.agentMetrics.map(agent => (
              <option key={agent.name} value={agent.name}>{agent.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            Showing {filteredAgentMetrics.length} agent{filteredAgentMetrics.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Agent Metrics Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Agent Performance Breakdown</h2>
          <p className="text-sm text-gray-500 mt-1">Detailed metrics for each secondary agent</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Agent Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invocations
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Avg Latency
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quality Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAgentMetrics.map((agent, index) => (
                <motion.tr
                  key={agent.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.errorRate === 0 ? 'bg-green-500' :
                        agent.errorRate < 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AgentTypeBadge type={agent.type} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900">{agent.invocations}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-medium ${
                      agent.avgLatency < 1000 ? 'text-green-600' :
                      agent.avgLatency < 3000 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatDuration(agent.avgLatency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-medium ${
                      agent.errorRate === 0 ? 'text-green-600' :
                      agent.errorRate < 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {agent.errorRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(agent.successes / agent.invocations) * 100}%` }}
                          transition={{ delay: index * 0.05, duration: 0.5 }}
                          className="h-full bg-green-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {((agent.successes / agent.invocations) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <QualityScoreBadge score={agent.qualityScore} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SummaryCard
          icon={CheckCircle}
          label="Total Successful Calls"
          value={metrics.successCount}
          color="green"
        />
        <SummaryCard
          icon={AlertCircle}
          label="Total Failed Calls"
          value={metrics.errorCount}
          color="red"
        />
        <SummaryCard
          icon={Activity}
          label="Unique Agents"
          value={metrics.agentMetrics.length}
          color="blue"
        />
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, trend, color, isImprovement }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };

  const iconColors = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    red: 'text-red-500',
  };

  const trendPositive = isImprovement ? trend < 0 : trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorClasses[color]} border rounded-lg p-6`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-8 h-8 ${iconColors[color]}`} />
        {trend && (
          <div className={`flex items-center gap-1 ${
            trendPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trendPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </motion.div>
  );
}

// Summary Card Component
function SummaryCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 flex items-center gap-4`}>
      <Icon className="w-10 h-10" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

// Agent Type Badge Component
function AgentTypeBadge({ type }) {
  const badges = {
    native: { label: 'Native', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    shared: { label: 'Shared', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    '3p': { label: 'Third-Party', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };

  const badge = badges[type] || badges.native;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Quality Score Badge Component
function QualityScoreBadge({ score }) {
  const getColor = () => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getColor()}`}>
      {score.toFixed(0)}
    </span>
  );
}

export default AnalyticsDashboard;
