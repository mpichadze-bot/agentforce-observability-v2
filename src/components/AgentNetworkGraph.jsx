import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Share2,
  Bot,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Network,
  Link2,
  Unlink,
  ExternalLink,
  ChevronRight,
  Info,
  Shield,
  RefreshCw,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { agentNetworkDependencies, formatTimestamp, AGENT_TYPES } from '../mockData';

function AgentNetworkGraph({ traces }) {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showBrokenOnly, setShowBrokenOnly] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'dependencies' | 'impact'

  // Aggregate data from traces and network dependencies
  const networkData = useMemo(() => {
    const orgs = new Map();
    const vendors = new Map();
    const connections = [];
    const brokenConnections = agentNetworkDependencies.brokenConnections || [];

    // Build org/vendor data from traces
    traces.forEach(trace => {
      const trustBoundary = trace.trustBoundary;
      
      trace.agents?.forEach(agent => {
        if (agent.type === AGENT_TYPES.THIRD_PARTY) {
          if (!vendors.has(agent.vendorName)) {
            vendors.set(agent.vendorName, {
              id: `vendor-${agent.vendorName}`,
              name: agent.vendorName,
              type: '3p',
              agents: [],
              status: agent.status === 'error' || agent.status === 'unreachable' ? 'error' : 'healthy',
            });
          }
          vendors.get(agent.vendorName).agents.push(agent);
        } else {
          const orgKey = agent.orgId || agent.orgName;
          if (!orgs.has(orgKey)) {
            orgs.set(orgKey, {
              id: orgKey,
              name: agent.orgName,
              type: agent.type,
              trustBoundary: trustBoundary?.boundaryId,
              agents: [],
              status: 'healthy',
            });
          }
          orgs.get(orgKey).agents.push(agent);
          if (agent.status === 'error' || agent.status === 'unreachable') {
            orgs.get(orgKey).status = 'error';
          }
        }
      });

      // Track connections
      trace.edges?.forEach(edge => {
        const fromAgent = trace.agents?.find(a => a.id === edge.from);
        const toAgent = trace.agents?.find(a => a.id === edge.to);
        if (fromAgent && toAgent) {
          connections.push({
            from: fromAgent.orgName || fromAgent.vendorName,
            to: toAgent.orgName || toAgent.vendorName,
            status: edge.status,
            external: edge.external || edge.crossOrg,
          });
        }
      });
    });

    return {
      orgs: Array.from(orgs.values()),
      vendors: Array.from(vendors.values()),
      connections,
      brokenConnections,
    };
  }, [traces]);

  // Calculate impact analysis for broken connections
  const impactAnalysis = useMemo(() => {
    const impacts = [];
    
    networkData.brokenConnections.forEach(broken => {
      const affectedTraces = traces.filter(trace => 
        trace.agents?.some(a => 
          a.orgName === broken.to || a.name === broken.agent
        ) && trace.status === 'failed'
      );
      
      impacts.push({
        ...broken,
        affectedTraces,
        severity: affectedTraces.length > 2 ? 'critical' : affectedTraces.length > 0 ? 'high' : 'medium',
      });
    });
    
    return impacts;
  }, [networkData.brokenConnections, traces]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="sf-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-sf-gray-800 flex items-center gap-2">
              <Network className="w-5 h-5 text-sf-blue-500" />
              Agent Network Dependencies
            </h3>
            
            {/* View Mode Tabs */}
            <div className="flex bg-sf-gray-100 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'dependencies', label: 'Dependencies' },
                { id: 'impact', label: 'Impact Analysis' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === tab.id
                      ? 'bg-white text-sf-blue-500 shadow-sm'
                      : 'text-sf-gray-600 hover:text-sf-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-sf-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showBrokenOnly}
                onChange={(e) => setShowBrokenOnly(e.target.checked)}
                className="rounded border-sf-gray-300"
              />
              Show broken connections only
            </label>
            
            <button className="sf-button-neutral flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Broken Connections Alert */}
      {networkData.brokenConnections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Unlink className="w-5 h-5 text-sf-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sf-red-600 mb-1">
                {networkData.brokenConnections.length} Broken Connection{networkData.brokenConnections.length > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Some agents in your network are unreachable. This may affect running workflows.
              </p>
              <div className="space-y-2">
                {networkData.brokenConnections.map((broken, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-red-800">{broken.from}</span>
                    <ArrowRight className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-red-800 line-through">{broken.to}</span>
                    <span className="text-xs text-red-600">({broken.agent})</span>
                    <span className="text-xs px-2 py-0.5 bg-red-200 text-red-700 rounded">
                      {broken.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Organizations */}
            <div className="sf-card">
              <div className="p-4 border-b border-sf-gray-200">
                <h4 className="font-semibold text-sf-gray-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sf-blue-500" />
                  Salesforce Organizations ({networkData.orgs.length})
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {networkData.orgs.map((org, index) => (
                  <OrgCard 
                    key={org.id} 
                    org={org} 
                    index={index}
                    isSelected={selectedOrg === org.id}
                    onSelect={() => setSelectedOrg(selectedOrg === org.id ? null : org.id)}
                    brokenConnections={networkData.brokenConnections}
                  />
                ))}
                {networkData.orgs.length === 0 && (
                  <p className="text-sf-gray-400 text-sm text-center py-4">No organizations found</p>
                )}
              </div>
            </div>

            {/* External Vendors */}
            <div className="sf-card">
              <div className="p-4 border-b border-sf-gray-200">
                <h4 className="font-semibold text-sf-gray-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  3P External Vendors ({networkData.vendors.length})
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {networkData.vendors.map((vendor, index) => (
                  <VendorCard 
                    key={vendor.id} 
                    vendor={vendor} 
                    index={index}
                    isSelected={selectedOrg === vendor.id}
                    onSelect={() => setSelectedOrg(selectedOrg === vendor.id ? null : vendor.id)}
                  />
                ))}
                {networkData.vendors.length === 0 && (
                  <p className="text-sf-gray-400 text-sm text-center py-4">No external vendors</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'dependencies' && (
          <motion.div
            key="dependencies"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DependencyGraph 
              networkData={networkData} 
              showBrokenOnly={showBrokenOnly}
            />
          </motion.div>
        )}

        {viewMode === 'impact' && (
          <motion.div
            key="impact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImpactAnalysisView 
              impacts={impactAnalysis}
              traces={traces}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        <NetworkStatCard
          icon={Building2}
          label="Organizations"
          value={networkData.orgs.length}
          color="blue"
        />
        <NetworkStatCard
          icon={Globe}
          label="3P Vendors"
          value={networkData.vendors.length}
          color="amber"
        />
        <NetworkStatCard
          icon={Link2}
          label="Total Connections"
          value={networkData.connections.length}
          color="emerald"
        />
        <NetworkStatCard
          icon={Unlink}
          label="Broken Connections"
          value={networkData.brokenConnections.length}
          color="red"
          alert={networkData.brokenConnections.length > 0}
        />
      </div>
    </div>
  );
}

// Organization Card Component
function OrgCard({ org, index, isSelected, onSelect, brokenConnections }) {
  const hasBrokenConnection = brokenConnections.some(
    b => b.from === org.name || b.to === org.name
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        hasBrokenConnection 
          ? 'border-red-300 bg-red-50'
          : isSelected
          ? 'border-sf-blue-400 bg-blue-50'
          : org.type === AGENT_TYPES.SHARED
          ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
          : 'border-sf-gray-200 bg-sf-gray-50 hover:border-sf-blue-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            hasBrokenConnection ? 'bg-red-100' :
            org.type === AGENT_TYPES.SHARED ? 'bg-emerald-100' : 'bg-blue-100'
          }`}>
            {org.type === AGENT_TYPES.SHARED 
              ? <Share2 className={`w-5 h-5 ${hasBrokenConnection ? 'text-sf-red-500' : 'text-emerald-600'}`} />
              : <Building2 className={`w-5 h-5 ${hasBrokenConnection ? 'text-sf-red-500' : 'text-sf-blue-600'}`} />
            }
          </div>
          <div>
            <p className="font-semibold text-sf-gray-800">{org.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                org.type === AGENT_TYPES.SHARED 
                  ? 'bg-emerald-200 text-emerald-700'
                  : 'bg-blue-200 text-blue-700'
              }`}>
                {org.type === AGENT_TYPES.SHARED ? 'Shared' : 'Native'}
              </span>
              {org.trustBoundary && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {org.trustBoundary}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-sf-gray-600">
            {org.agents.length} agent{org.agents.length !== 1 ? 's' : ''}
          </span>
          {hasBrokenConnection ? (
            <XCircle className="w-5 h-5 text-sf-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-sf-green-500" />
          )}
        </div>
      </div>
      
      {/* Agent list (collapsed) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-sf-gray-200"
          >
            <div className="space-y-2">
              {org.agents.map((agent, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Bot className="w-4 h-4 text-sf-gray-400" />
                  <span className="text-sf-gray-700">{agent.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    agent.status === 'success' ? 'bg-green-100 text-green-700' :
                    agent.status === 'error' || agent.status === 'unreachable' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Vendor Card Component
function VendorCard({ vendor, index, isSelected, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        vendor.status === 'error'
          ? 'border-red-300 bg-red-50'
          : isSelected
          ? 'border-amber-400 bg-amber-50'
          : 'border-amber-200 bg-amber-50 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${vendor.status === 'error' ? 'bg-red-100' : 'bg-amber-100'}`}>
            <Globe className={`w-5 h-5 ${vendor.status === 'error' ? 'text-sf-red-500' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="font-semibold text-sf-gray-800">{vendor.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-700 rounded">
                A2A Protocol
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                External
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-sf-gray-600">
            {vendor.agents.length} agent{vendor.agents.length !== 1 ? 's' : ''}
          </span>
          {vendor.status === 'error' ? (
            <XCircle className="w-5 h-5 text-sf-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-sf-green-500" />
          )}
        </div>
      </div>
      
      {/* Agent list (collapsed) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-amber-200"
          >
            <div className="space-y-2">
              {vendor.agents.map((agent, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                  <span className="text-sf-gray-700">{agent.name}</span>
                  {agent.registrationStatus && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                      {agent.registrationStatus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Dependency Graph Visualization
function DependencyGraph({ networkData, showBrokenOnly }) {
  const allNodes = [...networkData.orgs, ...networkData.vendors];
  const filteredConnections = showBrokenOnly 
    ? networkData.connections.filter(c => c.status === 'error')
    : networkData.connections;

  return (
    <div className="sf-card p-6">
      <h4 className="font-semibold text-sf-gray-800 mb-4 flex items-center gap-2">
        <Network className="w-5 h-5 text-sf-blue-500" />
        Network Topology
      </h4>
      
      <div className="relative h-[400px] bg-gradient-to-br from-sf-gray-50 to-white rounded-lg border border-sf-gray-200 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Render connections */}
          {filteredConnections.map((conn, index) => {
            const fromIdx = allNodes.findIndex(n => n.name === conn.from);
            const toIdx = allNodes.findIndex(n => n.name === conn.to);
            if (fromIdx === -1 || toIdx === -1) return null;
            
            const fromX = 150 + (fromIdx % 3) * 200;
            const fromY = 100 + Math.floor(fromIdx / 3) * 120;
            const toX = 150 + (toIdx % 3) * 200;
            const toY = 100 + Math.floor(toIdx / 3) * 120;
            
            return (
              <motion.line
                key={index}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={conn.status === 'error' ? '#EA001E' : conn.external ? '#10b981' : '#0176d3'}
                strokeWidth={2}
                strokeDasharray={conn.external ? "6,3" : "0"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            );
          })}
        </svg>
        
        {/* Render nodes */}
        <div className="absolute inset-0">
          {allNodes.map((node, index) => {
            const x = 100 + (index % 3) * 200;
            const y = 60 + Math.floor(index / 3) * 120;
            
            return (
              <motion.div
                key={node.id}
                className={`absolute w-[120px] p-3 rounded-lg border-2 text-center ${
                  node.type === '3p'
                    ? 'bg-amber-50 border-amber-300'
                    : node.type === AGENT_TYPES.SHARED
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-blue-50 border-blue-300'
                }`}
                style={{ left: x, top: y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {node.type === '3p' ? (
                  <Globe className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                ) : node.type === AGENT_TYPES.SHARED ? (
                  <Share2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                ) : (
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-sf-blue-600" />
                )}
                <p className="text-xs font-medium text-sf-gray-800 truncate">{node.name}</p>
                <p className="text-[10px] text-sf-gray-500">{node.agents.length} agents</p>
              </motion.div>
            );
          })}
        </div>
        
        {allNodes.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sf-gray-400">No network data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Impact Analysis View
function ImpactAnalysisView({ impacts, traces }) {
  if (impacts.length === 0) {
    return (
      <div className="sf-card p-12 text-center">
        <CheckCircle className="w-12 h-12 text-sf-green-500 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-sf-gray-800 mb-2">No Impact Detected</h4>
        <p className="text-sf-gray-500">All agent connections are healthy</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {impacts.map((impact, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`sf-card overflow-hidden border-l-4 ${
            impact.severity === 'critical' ? 'border-l-red-500' :
            impact.severity === 'high' ? 'border-l-orange-500' :
            'border-l-yellow-500'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  impact.severity === 'critical' ? 'bg-red-100' :
                  impact.severity === 'high' ? 'bg-orange-100' :
                  'bg-yellow-100'
                }`}>
                  <Unlink className={`w-5 h-5 ${
                    impact.severity === 'critical' ? 'text-sf-red-500' :
                    impact.severity === 'high' ? 'text-sf-orange-500' :
                    'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-sf-gray-800">
                    {impact.agent} Unreachable
                  </h4>
                  <p className="text-sm text-sf-gray-500">
                    {impact.from} → {impact.to}
                  </p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                impact.severity === 'critical' ? 'bg-red-100 text-red-700' :
                impact.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {impact.severity}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-sf-gray-50 rounded-lg">
                <p className="text-xs text-sf-gray-500 mb-1">Reason</p>
                <p className="text-sm font-medium text-sf-gray-800">{impact.reason}</p>
              </div>
              <div className="p-3 bg-sf-gray-50 rounded-lg">
                <p className="text-xs text-sf-gray-500 mb-1">Since</p>
                <p className="text-sm font-medium text-sf-gray-800">{formatTimestamp(impact.since)}</p>
              </div>
            </div>
            
            {impact.affectedWorkflows?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-sf-gray-500 mb-2">Affected Workflows</p>
                <div className="flex flex-wrap gap-2">
                  {impact.affectedWorkflows.map((workflow, i) => (
                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                      {workflow}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {impact.affectedTraces?.length > 0 && (
              <div>
                <p className="text-xs text-sf-gray-500 mb-2">
                  Failed Traces ({impact.affectedTraces.length})
                </p>
                <div className="space-y-2">
                  {impact.affectedTraces.slice(0, 3).map((trace, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-red-50 rounded">
                      <XCircle className="w-4 h-4 text-sf-red-500" />
                      <span className="font-medium text-sf-gray-800">{trace.friendlyName}</span>
                      <span className="text-xs text-sf-gray-500">{formatTimestamp(trace.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggested Actions */}
            <div className="mt-4 pt-4 border-t border-sf-gray-200">
              <p className="text-xs text-sf-gray-500 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Suggested Actions
              </p>
              <div className="flex gap-2">
                <button className="sf-button-primary text-sm">
                  Enable Human Fallback
                </button>
                <button className="sf-button-neutral text-sm">
                  Contact Admin
                </button>
                <button className="sf-button-neutral text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Network Stat Card
function NetworkStatCard({ icon: Icon, label, value, color, alert }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sf-card p-4 border ${alert ? 'animate-pulse' : ''} ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-75">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default AgentNetworkGraph;

