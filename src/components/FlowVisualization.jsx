import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Wrench,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Repeat,
  Radio,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatDuration, getStatusBadgeClass, getThemeBadgeClass } from '../mockData';

function FlowVisualization({ traces, onTraceSelect, selectedTrace }) {
  const [expandedTrace, setExpandedTrace] = useState(selectedTrace?.id || traces[0]?.id);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (selectedTrace) {
      setExpandedTrace(selectedTrace.id);
    }
  }, [selectedTrace]);

  const handleTraceExpand = (trace) => {
    setExpandedTrace(expandedTrace === trace.id ? null : trace.id);
    setAnimationKey(prev => prev + 1);
    onTraceSelect(trace);
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="sf-card p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm font-medium text-sf-gray-700">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sf-blue-100 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-sf-blue-500" />
            </div>
            <span className="text-sm text-sf-gray-600">Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span className="text-sm text-sf-gray-600">MCP Tool</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-sm text-sf-gray-600">RAG Retrieval</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-sf-green-500" />
            <span className="text-sm text-sf-gray-600">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-sf-red-500" style={{ borderStyle: 'dashed' }} />
            <span className="text-sm text-sf-gray-600">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-sf-orange-500" />
            <span className="text-sm text-sf-gray-600">Loop</span>
          </div>
        </div>
      </div>

      {/* Flow Cards */}
      <div className="space-y-3">
        {traces.map((trace, index) => (
          <motion.div
            key={trace.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="sf-card overflow-hidden"
          >
            {/* Header */}
            <div
              onClick={() => handleTraceExpand(trace)}
              className={`px-5 py-4 cursor-pointer transition-colors hover:bg-sf-gray-50 flex items-center justify-between ${
                trace.status === 'failed' ? 'border-l-4 border-sf-red-500' : 
                trace.status === 'success' ? 'border-l-4 border-sf-green-500' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: expandedTrace === trace.id ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5 text-sf-gray-400" />
                </motion.div>
                
                <FlowStatusIcon status={trace.status} theme={trace.theme} />
                
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sf-gray-800">{trace.friendlyName}</span>
                    <span className={getStatusBadgeClass(trace.status)}>
                      {trace.status}
                    </span>
                    {trace.theme && (
                      <span className={getThemeBadgeClass(trace.theme)}>
                        {trace.theme}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-sf-gray-500">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" />
                      {trace.rootAgent}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(trace.duration)}
                    </span>
                    <span>{trace.turnCount} turns</span>
                  </div>
                </div>
              </div>

              {trace.failingComponent && (
                <div className="text-right">
                  <p className="text-sm text-sf-red-500 font-medium">
                    Failed: {trace.failingComponent}
                  </p>
                  <p className="text-xs text-sf-gray-400">
                    {trace.failureDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Flow Graph */}
            <AnimatePresence>
              {expandedTrace === trace.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-sf-gray-100 overflow-hidden"
                >
                  <div className="p-6 bg-gradient-to-b from-sf-gray-50 to-white">
                    <FlowGraph 
                      trace={trace} 
                      key={`${trace.id}-${animationKey}`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {traces.length === 0 && (
        <div className="sf-card p-12 text-center">
          <Info className="w-12 h-12 text-sf-gray-300 mx-auto mb-4" />
          <p className="text-sf-gray-500">No traces to visualize</p>
        </div>
      )}
    </div>
  );
}

// Flow Graph Component
function FlowGraph({ trace }) {
  const { nodes, edges } = trace;
  
  // Calculate positions for nodes
  const nodeWidth = 180;
  const nodeHeight = 80;
  const horizontalGap = 80;
  const svgWidth = (nodes.length * (nodeWidth + horizontalGap)) + 100;
  const svgHeight = 280;
  
  // Recalculate positions to spread nodes horizontally
  const positionedNodes = nodes.map((node, index) => ({
    ...node,
    x: 60 + index * (nodeWidth + horizontalGap),
    y: node.type === 'mcp' || node.type === 'rag' ? 40 : 100,
  }));

  return (
    <div className="relative overflow-x-auto pb-4">
      <svg 
        width={svgWidth} 
        height={svgHeight}
        className="min-w-full"
      >
        {/* Render edges first (below nodes) */}
        {edges.map((edge, index) => {
          const fromNode = positionedNodes.find(n => n.id === edge.from);
          const toNode = positionedNodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <FlowEdge
              key={`${edge.from}-${edge.to}-${index}`}
              from={fromNode}
              to={toNode}
              edge={edge}
              nodeWidth={nodeWidth}
              nodeHeight={nodeHeight}
              index={index}
            />
          );
        })}
      </svg>
      
      {/* Render nodes as absolute positioned divs for better styling */}
      <div className="absolute top-0 left-0" style={{ width: svgWidth, height: svgHeight }}>
        {positionedNodes.map((node, index) => (
          <FlowNode 
            key={node.id} 
            node={node} 
            index={index}
            width={nodeWidth}
            height={nodeHeight}
          />
        ))}
      </div>
    </div>
  );
}

// Flow Edge Component
function FlowEdge({ from, to, edge, nodeWidth, nodeHeight, index }) {
  const startX = from.x + nodeWidth;
  const startY = from.y + nodeHeight / 2;
  const endX = to.x;
  const endY = to.y + nodeHeight / 2;
  
  // Calculate control points for curved path
  const midX = (startX + endX) / 2;
  
  // Determine if this is a loop (going backwards)
  const isBackward = from.x > to.x;
  
  let pathD;
  if (isBackward) {
    // Curved path going below for backward edges
    const curveY = Math.max(startY, endY) + 80;
    pathD = `M ${startX} ${startY} 
             Q ${startX + 40} ${curveY}, ${midX} ${curveY}
             Q ${endX - 40} ${curveY}, ${endX} ${endY}`;
  } else {
    // Curved path for forward edges
    pathD = `M ${startX} ${startY} 
             C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`;
  }
  
  const getEdgeColor = () => {
    if (edge.status === 'error') return '#EA001E';
    if (edge.isLoop) return '#FE9339';
    return '#45C65A';
  };

  return (
    <g>
      {/* Background path for glow effect */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={6}
        strokeOpacity={0.15}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: index * 0.2 }}
      />
      
      {/* Main path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={2}
        strokeDasharray={edge.status === 'error' || edge.isLoop ? "6,4" : "0"}
        className={edge.isLoop ? 'flow-edge' : ''}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: index * 0.2 }}
      />
      
      {/* Arrow head */}
      <motion.polygon
        points={`${endX},${endY} ${endX - 10},${endY - 5} ${endX - 10},${endY + 5}`}
        fill={getEdgeColor()}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 + index * 0.2 }}
      />
      
      {/* Data size label */}
      {edge.dataSize && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + index * 0.2 }}
        >
          <rect
            x={midX - 25}
            y={Math.min(startY, endY) - 20}
            width={50}
            height={18}
            rx={4}
            fill="white"
            stroke="#E5E5E4"
          />
          <text
            x={midX}
            y={Math.min(startY, endY) - 8}
            textAnchor="middle"
            className="text-xs fill-sf-gray-600"
            fontSize={10}
          >
            {edge.dataSize}
          </text>
        </motion.g>
      )}
      
      {/* Loop count label */}
      {edge.loopCount && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + index * 0.2 }}
        >
          <circle
            cx={midX}
            cy={isBackward ? Math.max(startY, endY) + 80 : (startY + endY) / 2}
            r={16}
            fill="#FEF3C7"
            stroke="#FE9339"
            strokeWidth={2}
          />
          <text
            x={midX}
            y={isBackward ? Math.max(startY, endY) + 85 : (startY + endY) / 2 + 4}
            textAnchor="middle"
            className="text-xs font-bold fill-orange-600"
            fontSize={11}
          >
            ×{edge.loopCount}
          </text>
        </motion.g>
      )}
    </g>
  );
}

// Flow Node Component
function FlowNode({ node, index, width, height }) {
  const getNodeStyles = () => {
    const baseStyles = {
      width,
      height,
      left: node.x,
      top: node.y,
    };
    
    return baseStyles;
  };
  
  const getNodeIcon = () => {
    switch (node.type) {
      case 'agent':
        return <Bot className="w-5 h-5" />;
      case 'mcp':
        return <Wrench className="w-5 h-5" />;
      case 'rag':
        return <Database className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };
  
  const getNodeColorClass = () => {
    if (node.status === 'error' || node.status === 'unreachable') {
      return 'bg-red-50 border-sf-red-400 text-sf-red-600';
    }
    if (node.status === 'warning') {
      return 'bg-orange-50 border-sf-orange-400 text-sf-orange-600';
    }
    
    switch (node.type) {
      case 'agent':
        return 'bg-blue-50 border-sf-blue-400 text-sf-blue-600';
      case 'mcp':
        return 'bg-purple-50 border-purple-400 text-purple-600';
      case 'rag':
        return 'bg-amber-50 border-amber-400 text-amber-600';
      default:
        return 'bg-gray-50 border-sf-gray-400 text-sf-gray-600';
    }
  };
  
  const getIconBgClass = () => {
    if (node.status === 'error' || node.status === 'unreachable') {
      return 'bg-red-100';
    }
    if (node.status === 'warning') {
      return 'bg-orange-100';
    }
    
    switch (node.type) {
      case 'agent':
        return 'bg-blue-100';
      case 'mcp':
        return 'bg-purple-100';
      case 'rag':
        return 'bg-amber-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <motion.div
      className={`absolute rounded-lg border-2 p-3 shadow-sm cursor-pointer 
        ${getNodeColorClass()} 
        ${node.status === 'error' || node.status === 'unreachable' ? 'animate-error-pulse' : ''}
        flow-node`}
      style={getNodeStyles()}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.15,
        type: 'spring',
        stiffness: 200
      }}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${getIconBgClass()}`}>
          {getNodeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{node.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-75">
              {formatDuration(node.latency)}
            </span>
            {node.responseCode && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                node.responseCode >= 400 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
              }`}>
                {node.responseCode}
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex-shrink-0">
          {node.status === 'success' && <CheckCircle className="w-4 h-4 text-sf-green-500" />}
          {node.status === 'error' && <XCircle className="w-4 h-4 text-sf-red-500" />}
          {node.status === 'warning' && <AlertTriangle className="w-4 h-4 text-sf-orange-500" />}
          {node.status === 'unreachable' && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Radio className="w-4 h-4 text-sf-red-500" />
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Loop indicator */}
      {node.loopCount && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.5 + index * 0.15, duration: 0.5 }}
        >
          <Repeat className="w-3 h-3" />
        </motion.div>
      )}
      
      {/* Root badge */}
      {node.isRoot && (
        <motion.div
          className="absolute -top-2 -left-2 px-2 py-0.5 bg-sf-blue-500 text-white text-xs font-medium rounded-full shadow-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.15 }}
        >
          Root
        </motion.div>
      )}
      
      {/* Error message tooltip */}
      {node.errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-10 shadow-lg">
          {node.errorMessage}
        </div>
      )}
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

export default FlowVisualization;

