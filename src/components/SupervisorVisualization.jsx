import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Wrench,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
  Crown,
  ExternalLink,
  Share2,
  Building2,
  Shield,
  Repeat,
  Radio,
  Zap,
  ArrowRight,
  User,
  Network,
  Globe,
  Lock,
} from 'lucide-react';
import { 
  formatDuration, 
  getStatusBadgeClass, 
  getThemeBadgeClass, 
  getBoundaryBadgeClass,
  getAgentTypeBadgeClass,
  AGENT_TYPES,
} from '../mockData';

function SupervisorVisualization({ traces, onTraceSelect, selectedTrace }) {
  const [animationKey, setAnimationKey] = useState(0);
  const [showIdentityFlow, setShowIdentityFlow] = useState(true);

  return (
    <div className="h-full w-full">
      {traces.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No multi-agent flows to visualize</p>
            </div>
      ) : (
        traces.map((trace, index) => (
          <div key={trace.id} className="h-full w-full">
            {/* Hub and Spoke Visualization - Direct, No Wrappers */}
                    <HubAndSpokeVisualization 
                      trace={trace} 
                      key={`${trace.id}-${animationKey}`}
                      showIdentityFlow={showIdentityFlow}
                    />
                    </div>
        ))
      )}
    </div>
  );
}


// Hub and Spoke Visualization Component
function HubAndSpokeVisualization({ trace, showIdentityFlow }) {
  const [expandedAgents, setExpandedAgents] = useState(new Set());
  const agents = trace.agents || [];
  const edges = trace.edges || [];
  
  // Toggle agent expansion
  const handleAgentExpand = (agentId) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };
  
  // Get child agents for a given agent (connected external 3P agents)
  const getChildAgents = (agentId) => {
    // Find edges where this agent connects to external agents
    const connectedEdges = edges.filter(e => e.from === agentId && e.external);
    const childIds = connectedEdges.map(edge => edge.to);
    // Return the external agents that are connected
    return agents.filter(a => childIds.includes(a.id) && (a.role === 'external' || a.type === AGENT_TYPES.THIRD_PARTY));
  };
  
  // Find supervisor (root) agent
  const supervisor = agents.find(a => a.role === 'supervisor' || a.isRoot);
  // Filter out external agents - they'll be shown when parent is expanded
  const specialists = agents.filter(a => a.role !== 'supervisor' && !a.isRoot && a.role !== 'external');
  
  // Node dimensions
  // Figma-style node dimensions
  const nodeWidth = 260;
  const nodeHeight = 150;
  
  // Calculate layout based on number of specialists
  const numSpecialists = specialists.length;
  const horizontalSpacing = nodeWidth + 80; // Gap between nodes
  const verticalSpacing = nodeHeight + 120;
  
  // Calculate container size based on layout
  const cols = Math.min(numSpecialists, 3);
  const rows = Math.ceil(numSpecialists / 3);
  
  const svgWidth = Math.max(900, cols * horizontalSpacing + 200);
  const svgHeight = Math.max(600, (rows + 1) * verticalSpacing + 180);
  
  const positionedAgents = useMemo(() => {
    const positioned = [];
    
    // Position supervisor at top center
    if (supervisor) {
      positioned.push({
        ...supervisor,
        x: svgWidth / 2 - nodeWidth / 2,
        y: 60,
      });
    }
    
    // Position specialists in a row(s) below the supervisor
    const startY = 220; // Below supervisor
    
    if (numSpecialists <= 3) {
      // Single row - center the specialists
      const totalWidth = numSpecialists * nodeWidth + (numSpecialists - 1) * 60;
      const startX = (svgWidth - totalWidth) / 2;
      
      specialists.forEach((agent, index) => {
        positioned.push({
          ...agent,
          x: startX + index * (nodeWidth + 60),
          y: startY,
        });
      });
    } else {
      // Multiple rows
      specialists.forEach((agent, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const itemsInRow = Math.min(3, numSpecialists - row * 3);
        const totalWidth = itemsInRow * nodeWidth + (itemsInRow - 1) * 60;
        const startX = (svgWidth - totalWidth) / 2;
        
        positioned.push({
          ...agent,
          x: startX + col * (nodeWidth + 60),
          y: startY + row * verticalSpacing,
        });
      });
    }
    
    return positioned;
  }, [supervisor, specialists, svgWidth, nodeWidth, nodeHeight, numSpecialists, verticalSpacing]);

  // Group agents by org for trust boundary visualization
  const agentsByOrg = useMemo(() => {
    const groups = {};
    agents.forEach(agent => {
      const orgKey = agent.type === AGENT_TYPES.THIRD_PARTY 
        ? agent.vendorName 
        : agent.orgName;
      if (!groups[orgKey]) {
        groups[orgKey] = {
          name: orgKey,
          type: agent.type,
          agents: [],
        };
      }
      groups[orgKey].agents.push(agent);
    });
    return groups;
  }, [agents]);

  return (
    <div className="relative overflow-x-auto pb-4">
      {/* Trust Boundary Labels */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(agentsByOrg).map(([orgName, org]) => (
          <div 
            key={orgName}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              org.type === AGENT_TYPES.NATIVE 
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : org.type === AGENT_TYPES.SHARED
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}
          >
            {org.type === AGENT_TYPES.NATIVE && <Building2 className="w-4 h-4" />}
            {org.type === AGENT_TYPES.SHARED && <Share2 className="w-4 h-4" />}
            {org.type === AGENT_TYPES.THIRD_PARTY && <Globe className="w-4 h-4" />}
            <span className="font-medium">{orgName}</span>
            <span className="text-xs opacity-70">({org.agents.length})</span>
          </div>
        ))}
      </div>

      <div className="relative mx-auto" style={{ width: svgWidth, height: svgHeight }}>
        {/* Trust boundary background */}
        <div 
          className={`absolute inset-4 rounded-2xl ${
            trace.trustBoundary?.type === 'MOMA' 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-dashed border-emerald-400'
              : trace.trustBoundary?.type === 'SOMA'
              ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-400'
              : trace.trustBoundary?.type === '3P'
              ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-dotted border-amber-400'
              : 'bg-slate-50 border border-slate-200'
          }`}
        />
        
        <svg 
          width={svgWidth} 
          height={svgHeight}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {/* Render edges */}
          {edges.map((edge, index) => {
            const fromAgent = positionedAgents.find(a => a.id === edge.from);
            const toAgent = positionedAgents.find(a => a.id === edge.to);
            if (!fromAgent || !toAgent) return null;
            
            return (
              <HubEdge
                key={`${edge.from}-${edge.to}-${index}`}
                from={fromAgent}
                to={toAgent}
                edge={edge}
                index={index}
                nodeWidth={nodeWidth}
                nodeHeight={nodeHeight}
              />
            );
          })}
        </svg>
        
        {/* Render agent nodes as absolute positioned divs */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {positionedAgents.map((agent, index) => {
            const isExpanded = expandedAgents.has(agent.id);
            const childAgents = getChildAgents(agent.id);
            
            return (
              <React.Fragment key={agent.id}>
                <AgentNode 
                  agent={agent} 
                  index={index}
                  isSupervisor={agent.role === 'supervisor' || agent.isRoot}
                  width={nodeWidth}
                  height={nodeHeight}
                  isExpanded={isExpanded}
                  hasChildren={childAgents.length > 0}
                  onExpand={() => handleAgentExpand(agent.id)}
                />
                
                {/* Render expanded child agents */}
                {isExpanded && childAgents.length > 0 && (
                  <ExpandedChildAgents
                    parentAgent={agent}
                    childAgents={childAgents}
                    parentWidth={nodeWidth}
                    parentHeight={nodeHeight}
                    nodeWidth={220}
                    nodeHeight={80}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hub Edge Component
// HubEdge - Figma-style curved connectors with junction dots
function HubEdge({ from, to, edge, index, nodeWidth = 260, nodeHeight = 140 }) {
  // Determine connection points based on relative positions
  let startX, startY, endX, endY;
  
  const fromCenterX = from.x + nodeWidth / 2;
  const fromCenterY = from.y + nodeHeight / 2;
  const toCenterX = to.x + nodeWidth / 2;
  const toCenterY = to.y + nodeHeight / 2;
  
  // Connect from bottom of 'from' node to top of 'to' node for downward flow
  if (fromCenterY < toCenterY) {
    startX = fromCenterX;
    startY = from.y + nodeHeight; // Bottom of from node
    endX = toCenterX;
    endY = to.y; // Top of to node
  } else if (fromCenterY > toCenterY) {
    startX = fromCenterX;
    startY = from.y; // Top of from node
    endX = toCenterX;
    endY = to.y + nodeHeight; // Bottom of to node
  } else {
    // Same Y level - connect sides
    if (fromCenterX < toCenterX) {
      startX = from.x + nodeWidth;
      startY = fromCenterY;
      endX = to.x;
      endY = toCenterY;
    } else {
      startX = from.x;
      startY = fromCenterY;
      endX = to.x + nodeWidth;
      endY = toCenterY;
    }
  }
  
  // Calculate control points for smooth Figma-style curve
  const midY = (startY + endY) / 2;
  const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
  
  // Figma style: gray lines with subtle styling for different states
  const getEdgeColor = () => {
    if (edge.status === 'error') return '#EF4444';
    if (edge.isLoop) return '#F97316';
    if (edge.external || edge.crossOrg) return '#10B981';
    return '#D1D5DB'; // Default gray matching Figma
  };

  return (
    <g>
      {/* Main curved path - Figma style */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={edge.status === 'error' ? "6,4" : "0"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      />
      
      {/* Junction dot at start */}
      <motion.circle
        cx={startX}
        cy={startY}
        r={4}
        fill="white"
        stroke={getEdgeColor()}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 + index * 0.1 }}
      />
      
      {/* Junction dot at end */}
      <motion.circle
        cx={endX}
        cy={endY}
        r={4}
        fill="white"
        stroke={getEdgeColor()}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 + index * 0.1 }}
      />
      
      {/* Data size label - subtle style */}
      {edge.dataSize && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <rect
            x={(startX + endX) / 2 - 20}
            y={midY - 8}
            width={40}
            height={16}
            rx={4}
            fill="white"
            stroke="#E5E7EB"
          />
          <text
            x={(startX + endX) / 2}
            y={midY + 3}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize={9}
          >
            {edge.dataSize}
          </text>
        </motion.g>
      )}
      
      {/* Loop count indicator */}
      {edge.loopCount && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <circle
            cx={(startX + endX) / 2}
            cy={midY}
            r={12}
            fill="#FEF3C7"
            stroke="#F97316"
            strokeWidth={2}
          />
          <text
            x={(startX + endX) / 2}
            y={midY + 4}
            textAnchor="middle"
            className="font-bold fill-orange-600"
            fontSize={9}
          >
            ×{edge.loopCount}
          </text>
        </motion.g>
      )}
      
      {/* Cross-org indicator */}
      {(edge.external || edge.crossOrg) && !edge.dataSize && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + index * 0.15 }}
        >
          <circle
            cx={midX}
            cy={midY}
            r={10}
            fill="#ecfdf5"
            stroke="#10b981"
            strokeWidth={1.5}
          />
          <Globe 
            x={midX - 5}
            y={midY - 5}
            width={10}
            height={10}
            className="text-emerald-600"
          />
        </motion.g>
      )}
    </g>
  );
}

// Expanded Child Agents Component - Shows connected services when parent is expanded
function ExpandedChildAgents({ parentAgent, childAgents, parentWidth, parentHeight, nodeWidth = 220, nodeHeight = 80 }) {
  const numChildren = childAgents.length;
  const spacing = 40;
  const totalWidth = numChildren * nodeWidth + (numChildren - 1) * spacing;
  const startX = parentAgent.x + parentWidth / 2 - totalWidth / 2;
  const startY = parentAgent.y + parentHeight + 80;

  // Get icon for vendor
  const getVendorIcon = (vendorName) => {
    switch (vendorName?.toLowerCase()) {
      case 'eventbrite':
        return '🎫';
      case 'booking.com':
        return '🅱️';
      case 'yelp':
        return '⭐';
      case 'opentable':
      case 'reservations mcp':
        return '🍽️';
      default:
        return '🔌';
    }
  };

  // Get icon background color for vendor
  const getVendorColor = (vendorName) => {
    switch (vendorName?.toLowerCase()) {
      case 'eventbrite':
        return '#F05537';
      case 'booking.com':
        return '#003580';
      case 'yelp':
        return '#D32323';
      case 'opentable':
      case 'reservations mcp':
        return '#DA3743';
      default:
        return '#6B7280';
    }
  };

  return (
    <>
      {/* SVG connectors from parent to children */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ zIndex: 1, width: '100%', height: '100%' }}
      >
        {childAgents.map((child, index) => {
          const childX = startX + index * (nodeWidth + spacing) + nodeWidth / 2;
          const childY = startY;
          const parentCenterX = parentAgent.x + parentWidth / 2;
          const parentBottomY = parentAgent.y + parentHeight;
          
          const midY = (parentBottomY + childY) / 2;
          const pathD = `M ${parentCenterX} ${parentBottomY} C ${parentCenterX} ${midY}, ${childX} ${midY}, ${childX} ${childY}`;
          
          return (
            <g key={child.id}>
              <motion.path
                d={pathD}
                fill="none"
                stroke={child.status === 'unreachable' || child.status === 'error' ? '#EF4444' : '#D1D5DB'}
                strokeWidth={2}
                strokeDasharray={child.status === 'unreachable' || child.status === 'error' ? '6,4' : '6,4'}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              />
              <motion.circle
                cx={childX}
                cy={childY}
                r={4}
                fill="white"
                stroke={child.status === 'unreachable' || child.status === 'error' ? '#EF4444' : '#D1D5DB'}
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Child agent cards */}
      {childAgents.map((child, index) => {
        const childX = startX + index * (nodeWidth + spacing);
        const childY = startY;
        const vendorColor = getVendorColor(child.vendorName || child.name);
        const isDisconnected = child.status === 'unreachable' || child.status === 'error';

        return (
          <motion.div
            key={child.id}
            className={`absolute bg-white rounded-lg shadow-md border-2 ${
              isDisconnected ? 'border-blue-400' : 'border-gray-200'
            }`}
            style={{
              width: nodeWidth,
              minHeight: nodeHeight,
              left: childX,
              top: childY,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="p-3">
              <div className="flex items-center gap-3">
                {/* Vendor Icon */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: vendorColor }}
                >
                  {getVendorIcon(child.vendorName || child.name)}
                </div>
                
                {/* Name & Status */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {child.name}
                  </h4>
                  {isDisconnected ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Disconnected
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Connected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Agent Node Component
// AgentNode - Figma-style design matching node 2136-24626
function AgentNode({ agent, index, isSupervisor, width = 260, height = 140, isExpanded = false, hasChildren = false, onExpand }) {
  // Get border color based on status
  const getBorderClass = () => {
    if (agent.status === 'error' || agent.status === 'unreachable') return 'border-red-400';
    if (agent.status === 'warning') return 'border-orange-400';
    return 'border-gray-200 hover:border-blue-300';
  };

  // Get icon color - Purple for agents, Orange for channels/supervisor
  const getIconColor = () => {
    if (isSupervisor) return '#8B5CF6'; // Purple for supervisor
    if (agent.type === AGENT_TYPES.THIRD_PARTY) return '#F97316'; // Orange
    if (agent.type === AGENT_TYPES.SHARED) return '#059669'; // Green
    return '#8B5CF6'; // Purple default
  };

  return (
    <motion.div
      className={`absolute bg-white rounded-xl shadow-md cursor-pointer transition-all hover:shadow-lg ${getBorderClass()} border ${
        agent.status === 'error' || agent.status === 'unreachable' ? 'animate-error-pulse' : ''
      }`}
      style={{ 
        width, 
        minHeight: height,
        left: agent.x,
        top: agent.y,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200
      }}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: getIconColor() + '20' }}
          >
            <Bot className="w-5 h-5" style={{ color: getIconColor() }} />
          </div>
          
          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate" title={agent.name}>
              {agent.name}
            </h3>
            {/* Connection Status - Figma style */}
            {agent.status === 'unreachable' || agent.status === 'error' ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Disconnected
              </p>
            ) : (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </p>
            )}
          </div>
          
          {/* Info Icon / Status */}
          <div className="flex-shrink-0">
            {agent.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            {agent.status === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
            {agent.status === 'unreachable' && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Radio className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
            {(agent.status === 'success' || !agent.status) && (
              <Info className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3">
          {agent.description || `${agent.name} handles specialized tasks within the agent network. It processes requests and coordinates with other agents as needed.`}
        </p>
        
        {/* Latency Badge - Keeping this as requested */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
            + {agent.connections || 8} relationships...
          </span>
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {formatDuration(agent.latency)}
          </span>
        </div>
        
        {/* Vendor badge for 3P agents */}
        {agent.vendorName && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              {agent.vendorName}
            </span>
          </div>
        )}
      </div>
      
      {/* Expand/Collapse Button - Figma style */}
      {(hasChildren || onExpand) && (
        <div className="flex justify-center -mb-3 relative z-10">
          <motion.div 
            onClick={(e) => {
              e.stopPropagation();
              onExpand && onExpand();
            }}
            className={`w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-colors cursor-pointer ${
              isExpanded 
                ? 'border-blue-500 text-blue-500 hover:bg-blue-50' 
                : 'border-gray-300 text-gray-400 hover:bg-gray-50 hover:border-gray-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg 
              className="w-3 h-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </motion.svg>
          </motion.div>
        </div>
      )}
      
      {/* Supervisor badge - Updated style */}
      {isSupervisor && (
        <motion.div
          className="absolute -top-3 left-4 px-2.5 py-1 bg-purple-600 text-white text-[10px] font-semibold rounded-md shadow flex items-center gap-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          <Crown className="w-3 h-3" />
          Supervisor
        </motion.div>
      )}
      
      {/* Loop indicator */}
      {agent.loopCount && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
        >
          <Repeat className="w-3 h-3" />
        </motion.div>
      )}
      
      {/* Error message */}
      {agent.errorMessage && (
        <motion.div 
          className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-10 shadow-lg"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + index * 0.1 }}
        >
          {agent.errorMessage}
        </motion.div>
      )}
    </motion.div>
  );
}

// Latency Breakdown Component
function LatencyBreakdown({ latency }) {
  if (!latency) return null;
  
  const items = [
    { label: 'Gateway', value: latency.gatewayOverhead, target: 500, type: 'gateway' },
    { label: 'Supervisor', value: latency.supervisorReasoning },
    { label: 'Parallel Calls', value: latency.parallelAgentCalls },
    { label: 'Serial Calls', value: latency.serialAgentCalls },
    { label: 'External', value: latency.externalAgentCalls },
  ].filter(item => item.value > 0);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1 text-xs">
          <span className="text-sf-gray-500">{item.label}:</span>
          <span className={`font-medium ${
            item.type === 'gateway' && item.value > 500 
              ? 'text-sf-red-500' 
              : item.value > 10000 
              ? 'text-sf-orange-500' 
              : 'text-sf-gray-700'
          }`}>
            {formatDuration(item.value)}
          </span>
          {item.type === 'gateway' && item.value > 500 && (
            <AlertTriangle className="w-3 h-3 text-sf-red-500" />
          )}
        </div>
      ))}
    </div>
  );
}

// Identity Flow Section
function IdentityFlowSection({ identityFlow }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200"
    >
      <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Identity Flow
      </h4>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-purple-200">
          <Lock className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-purple-600">Source User</p>
            <p className="text-sm font-medium text-purple-800">{identityFlow.sourceUser}</p>
          </div>
        </div>
        
        <ArrowRight className="w-4 h-4 text-purple-400" />
        
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-purple-200">
          <Shield className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-purple-600">Auth Type</p>
            <p className="text-sm font-medium text-purple-800">{identityFlow.sourceUserType}</p>
          </div>
        </div>
        
        {identityFlow.crossOrgResolutions?.length > 0 && (
          <>
            <ArrowRight className="w-4 h-4 text-purple-400" />
            <div className="flex gap-2 flex-wrap">
              {identityFlow.crossOrgResolutions.map((resolution, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    resolution.status === 'failed' || resolution.status === 'guest'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-purple-200'
                  }`}
                >
                  <Globe className={`w-4 h-4 ${
                    resolution.status === 'failed' ? 'text-sf-red-500' : 'text-purple-600'
                  }`} />
                  <div>
                    <p className="text-xs text-sf-gray-500">{resolution.org}</p>
                    <p className={`text-xs font-medium ${
                      resolution.status === 'failed' 
                        ? 'text-sf-red-600' 
                        : resolution.status === 'guest'
                        ? 'text-sf-orange-600'
                        : 'text-sf-green-600'
                    }`}>
                      {resolution.status} ({resolution.method})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Flow Status Icon
function FlowStatusIcon({ status, theme }) {
  if (status === 'success') {
    return (
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-sf-green-500" />
      </div>
    );
  }
  
  if (theme === 'Logic Loop') {
    return (
      <motion.div 
        className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <Repeat className="w-5 h-5 text-sf-orange-500" />
      </motion.div>
    );
  }
  
  if (theme === 'Silent Drop') {
    return (
      <motion.div 
        className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Radio className="w-5 h-5 text-sf-red-500" />
      </motion.div>
    );
  }
  
  if (theme === 'High Latency') {
    return (
      <motion.div 
        className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Clock className="w-5 h-5 text-sf-orange-500" />
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center animate-error-pulse"
    >
      <XCircle className="w-5 h-5 text-sf-red-500" />
    </motion.div>
  );
}

export default SupervisorVisualization;

