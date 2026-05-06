import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Breadcrumbs, Link, Avatar, AvatarGroup,
  IconButton, Button, TextField, Tooltip, LinearProgress, Chip,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Add, ChatBubbleOutline, Close,
  KeyboardDoubleArrowUp, KeyboardArrowUp, Remove, KeyboardArrowDown,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fetchTasks, updateTaskStatus } from '../../store/slices/taskSlice.js';
import { fetchProject } from '../../store/slices/projectSlice.js';
import { showSnackbar } from '../../store/slices/uiSlice.js';
import { tasksAPI } from '../../services/api.js';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal.jsx';

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: 'planned',
    color: '#5B6E8F',
    accent: '#94A3B8',
    topBar: 'linear-gradient(90deg,#94A3B8,#CBD5E1)',
    cardBg: '#F8FAFC',
    headerBg: '#F1F5F9',
    ring: '#E2E8F0',
    badge: { bg: '#E2E8F0', text: '#64748B' },
  },
  {
    id: 'in_progress',
    color: '#1D4ED8',
    accent: '#3B82F6',
    topBar: 'linear-gradient(90deg,#3B82F6,#60A5FA)',
    cardBg: '#EFF6FF',
    headerBg: '#DBEAFE',
    ring: '#BFDBFE',
    badge: { bg: '#DBEAFE', text: '#1D4ED8' },
  },
  {
    id: 'blocked',
    color: '#B91C1C',
    accent: '#EF4444',
    topBar: 'linear-gradient(90deg,#EF4444,#F87171)',
    cardBg: '#FEF2F2',
    headerBg: '#FEE2E2',
    ring: '#FECACA',
    badge: { bg: '#FEE2E2', text: '#B91C1C' },
  },
  {
    id: 'review',
    color: '#92400E',
    accent: '#F59E0B',
    topBar: 'linear-gradient(90deg,#F59E0B,#FCD34D)',
    cardBg: '#FFFBEB',
    headerBg: '#FEF3C7',
    ring: '#FDE68A',
    badge: { bg: '#FEF3C7', text: '#92400E' },
  },
  {
    id: 'done',
    color: '#065F46',
    accent: '#10B981',
    topBar: 'linear-gradient(90deg,#10B981,#34D399)',
    cardBg: '#ECFDF5',
    headerBg: '#D1FAE5',
    ring: '#A7F3D0',
    badge: { bg: '#D1FAE5', text: '#065F46' },
  },
];

// ─── Priority ─────────────────────────────────────────────────────────────────
const PRIORITY = {
  critical: { color: '#DC2626', bg: '#FEF2F2', Icon: KeyboardDoubleArrowUp },
  high:     { color: '#EA580C', bg: '#FFF7ED', Icon: KeyboardArrowUp },
  medium:   { color: '#D97706', bg: '#FFFBEB', Icon: Remove },
  low:      { color: '#65A30D', bg: '#F7FEE7', Icon: KeyboardArrowDown },
};

// ─── Task type ────────────────────────────────────────────────────────────────
const TYPE_EMOJI = {
  design:'🎨', feature:'⚡', testing:'🧪', planning:'📋',
  meeting:'👥', deployment:'🚀', content:'✍️', research:'🔍',
  review:'👀', bug:'🐛', other:'📌',
};

function stringToColor(str = '') {
  const p = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDueToday = task.dueDate && format(new Date(task.dueDate),'yyyy-MM-dd') === format(new Date(),'yyyy-MM-dd');
  const subs   = task.subtasks || [];
  const done   = subs.filter(s => s.status === 'done').length;
  const pMeta  = PRIORITY[task.priority] || PRIORITY.medium;
  const PIcon  = pMeta.Icon;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snap) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          sx={{
            mb: 1.5,
            borderRadius: '12px',
            bgcolor: 'white',
            border: '1px solid',
            borderColor: snap.isDragging ? '#818CF8' : '#E8EDF2',
            boxShadow: snap.isDragging
              ? '0 20px 40px rgba(99,102,241,0.22), 0 4px 12px rgba(0,0,0,0.10)'
              : '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0 transparent',
            cursor: 'grab',
            transform: snap.isDragging ? 'rotate(2deg) scale(1.03)' : 'none',
            transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(99,102,241,0.12), 0 1px 4px rgba(0,0,0,0.06)',
              borderColor: '#C7D2FE',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {/* Colored priority top stripe */}
          <Box sx={{ height: 3, background: `linear-gradient(90deg, ${pMeta.color}, ${pMeta.color}88)` }} />

          <Box sx={{ p: '11px 13px 12px' }}>
            {/* Row 1: type emoji + AI + priority badge */}
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 0.75 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <Typography sx={{ fontSize:12, lineHeight:1 }}>{TYPE_EMOJI[task.type] || '📌'}</Typography>
                {task.aiGenerated && (
                  <Box sx={{ bgcolor:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:'4px',
                             px:0.6, py:0.1, display:'flex', alignItems:'center' }}>
                    <Typography sx={{ fontSize:'0.58rem', fontWeight:700, color:'#6366F1', lineHeight:1.4 }}>AI</Typography>
                  </Box>
                )}
              </Box>
              <Tooltip title={task.priority} placement="top">
                <Box sx={{ display:'flex', alignItems:'center', gap:0.25,
                           bgcolor: pMeta.bg, borderRadius:'5px', px:0.6, py:0.2 }}>
                  <PIcon sx={{ fontSize:12, color: pMeta.color }} />
                </Box>
              </Tooltip>
            </Box>

            {/* Title */}
            <Typography sx={{
              fontSize: '0.82rem', fontWeight: 550, lineHeight: 1.45, color: '#111827',
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
              mb: subs.length > 0 ? 1.2 : 0.85,
            }}>
              {task.title}
            </Typography>

            {/* Subtask progress */}
            {subs.length > 0 && (
              <Box sx={{ mb: 1.2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(done / subs.length) * 100}
                  sx={{
                    height: 3.5, borderRadius: 2, mb: 0.35,
                    bgcolor: '#F0F4F8',
                    '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#6366F1' },
                  }}
                />
                <Typography sx={{ fontSize:'0.67rem', color:'#94A3B8' }}>
                  {done}/{subs.length} subtasks
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <AvatarGroup max={3} sx={{
                '& .MuiAvatar-root': { width:22, height:22, fontSize:'0.58rem',
                                       border:'1.5px solid white' },
              }}>
                {(task.assignees || []).map(a => (
                  <Tooltip key={a._id} title={a.name}>
                    <Avatar sx={{ bgcolor: stringToColor(a.name) }}>
                      {a.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>

              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                {(task.comments||[]).length > 0 && (
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.25 }}>
                    <ChatBubbleOutline sx={{ fontSize:11, color:'#94A3B8' }}/>
                    <Typography sx={{ fontSize:'0.67rem', color:'#94A3B8' }}>{task.comments.length}</Typography>
                  </Box>
                )}
                {task.dueDate && (
                  <Box sx={{
                    bgcolor: isOverdue ? '#FEF2F2' : isDueToday ? '#FFFBEB' : 'transparent',
                    borderRadius:'5px', px: isOverdue||isDueToday ? 0.6 : 0, py: 0.2,
                  }}>
                    <Typography sx={{
                      fontSize:'0.67rem', fontWeight: isOverdue||isDueToday ? 600 : 400,
                      color: isOverdue ? '#DC2626' : isDueToday ? '#D97706' : '#94A3B8',
                    }}>
                      {format(new Date(task.dueDate),'MMM d')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Draggable>
  );
}

// ─── Quick-add card ───────────────────────────────────────────────────────────
function QuickAdd({ onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  return (
    <Box sx={{
      borderRadius:'12px', bgcolor:'white',
      border:'1.5px solid #A5B4FC',
      boxShadow:'0 4px 16px rgba(99,102,241,0.14)',
      p: 1.5, mb: 1,
    }}>
      <TextField
        autoFocus fullWidth multiline maxRows={4}
        placeholder="Task title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(title); }
          if (e.key === 'Escape') onCancel();
        }}
        variant="standard"
        InputProps={{ disableUnderline: true }}
        sx={{ mb: 1.25, '& textarea': { fontSize:'0.82rem', fontWeight:500, lineHeight:1.5 } }}
      />
      <Box sx={{ display:'flex', gap:0.75 }}>
        <Button size="small" variant="contained" onClick={() => onAdd(title)} sx={{
          borderRadius:'7px', textTransform:'none', fontSize:'0.77rem',
          px:1.5, py:0.4, bgcolor:'#6366F1', '&:hover':{ bgcolor:'#4F46E5' },
          boxShadow:'0 2px 6px rgba(99,102,241,0.35)',
        }}>
          Add task
        </Button>
        <IconButton size="small" onClick={onCancel} sx={{ color:'#94A3B8' }}>
          <Close sx={{ fontSize:15 }}/>
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── Empty-column placeholder ─────────────────────────────────────────────────
function EmptyCol({ col, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border:'1.5px dashed', borderColor: col.ring,
        borderRadius:'12px', py: 3.5,
        display:'flex', flexDirection:'column', alignItems:'center', gap: 0.75,
        cursor:'pointer', color: col.accent, opacity: 0.7,
        transition:'all 0.18s ease',
        '&:hover':{ opacity:1, bgcolor: col.cardBg, borderColor: col.accent,
                    boxShadow:`0 4px 14px ${col.accent}22` },
      }}
    >
      <Box sx={{
        width:32, height:32, borderRadius:'8px', bgcolor: col.headerBg,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Add sx={{ fontSize:20, color: col.accent }}/>
      </Box>
      <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color: col.color }}>
        Add a task
      </Typography>
    </Box>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function KanbanBoard() {
  const { id }       = useParams();
  const dispatch     = useDispatch();
  const { t }        = useTranslation();
  const { tasks }    = useSelector(s => s.tasks);
  const { currentProject } = useSelector(s => s.projects);
  const user         = useSelector(s => s.auth.user);
  const [selected, setSelected]   = useState(null);
  const [addingTo, setAddingTo]   = useState(null);

  const cols = COLUMNS.map(c => ({ ...c, label: t(`kanban.columns.${c.id}`) }));

  useEffect(() => {
    dispatch(fetchTasks({ projectId: id }));
    if (!currentProject || currentProject._id !== id) dispatch(fetchProject(id));
  }, [id]);

  const getColTasks = status =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId;
    dispatch(updateTaskStatus({ id: draggableId, status: newStatus }));
    const colTasks = getColTasks(newStatus);
    const updates  = colTasks.map((t, i) => ({ id: t._id, status: newStatus, position: i }));
    updates.splice(destination.index, 0, { id: draggableId, status: newStatus, position: destination.index });
    try { await tasksAPI.reorder(updates); }
    catch { dispatch(showSnackbar({ message: 'Failed to save order', severity: 'error' })); }
  };

  const handleAdd = async (colId, title) => {
    if (!title?.trim()) { setAddingTo(null); return; }
    await tasksAPI.create({ title: title.trim(), project: id, status: colId, priority: 'medium', createdBy: user._id });
    setAddingTo(null);
    dispatch(fetchTasks({ projectId: id }));
  };

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Breadcrumb */}
      <Breadcrumbs separator="›" sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator':{ color:'#CBD5E1' } }}>
        <Link component={RouterLink} to="/dashboard/projects" underline="hover"
          sx={{ fontSize:'0.8rem', color:'#64748B', '&:hover':{ color:'#6366F1' } }}>
          {t('nav.projects')}
        </Link>
        <Link component={RouterLink} to={`/dashboard/projects/${id}`} underline="hover"
          sx={{ fontSize:'0.8rem', color:'#64748B', '&:hover':{ color:'#6366F1' } }}>
          {currentProject?.name}
        </Link>
        <Typography sx={{ fontSize:'0.8rem', color:'#0F172A', fontWeight:600 }}>
          {t('kanban.title')}
        </Typography>
      </Breadcrumbs>

      {/* Board canvas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{
          display:'flex', gap: 2, overflowX:'auto', flex:1,
          pb: 3, alignItems:'flex-start',
          '&::-webkit-scrollbar':{ height:5 },
          '&::-webkit-scrollbar-track':{ bgcolor:'transparent' },
          '&::-webkit-scrollbar-thumb':{ bgcolor:'#CBD5E1', borderRadius:3 },
        }}>
          {cols.map(col => {
            const colTasks = getColTasks(col.id);
            return (
              <Box key={col.id} sx={{ minWidth:272, width:272, flexShrink:0, display:'flex', flexDirection:'column' }}>

                {/* ── Column card ── */}
                <Box sx={{
                  borderRadius:'16px',
                  bgcolor: col.headerBg,
                  border:'1px solid', borderColor: col.ring,
                  boxShadow:`0 2px 8px ${col.accent}14`,
                  overflow:'hidden',
                  display:'flex', flexDirection:'column',
                }}>
                  {/* Gradient top bar */}
                  <Box sx={{ height:4, background: col.topBar }} />

                  {/* Column header */}
                  <Box sx={{
                    display:'flex', alignItems:'center', gap:0.75,
                    px: 1.75, pt: 1.25, pb: 1.25,
                  }}>
                    <Box sx={{
                      width:8, height:8, borderRadius:'50%',
                      bgcolor: col.accent, flexShrink:0,
                      boxShadow:`0 0 0 3px ${col.accent}30`,
                    }}/>
                    <Typography sx={{
                      fontSize:'0.72rem', fontWeight:800, color: col.color,
                      letterSpacing:'0.06em', flex:1, textTransform:'uppercase',
                    }}>
                      {col.label}
                    </Typography>
                    <Box sx={{
                      minWidth:20, height:20, px:0.75,
                      borderRadius:'6px', bgcolor: col.badge.bg,
                      border:`1px solid ${col.ring}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Typography sx={{ fontSize:'0.68rem', fontWeight:800, color: col.badge.text, lineHeight:1 }}>
                        {colTasks.length}
                      </Typography>
                    </Box>
                    <Tooltip title={`Add to ${col.label}`}>
                      <IconButton size="small" onClick={() => setAddingTo(col.id)} sx={{
                        width:24, height:24, color: col.accent,
                        '&:hover':{ bgcolor:`${col.accent}22` },
                      }}>
                        <Add sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Drop zone */}
                  <Droppable droppableId={col.id}>
                    {(provided, snap) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          flex:1, minHeight:160,
                          px: 1.25, pb: 1.25,
                          bgcolor: snap.isDraggingOver ? `${col.accent}10` : 'transparent',
                          borderTop: snap.isDraggingOver ? `1.5px dashed ${col.accent}` : '1.5px dashed transparent',
                          transition:'background-color 0.2s, border-color 0.2s',
                        }}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard key={task._id} task={task} index={index} onClick={setSelected}/>
                        ))}
                        {provided.placeholder}

                        {colTasks.length === 0 && addingTo !== col.id && (
                          <EmptyCol col={col} onClick={() => setAddingTo(col.id)}/>
                        )}

                        {addingTo === col.id && (
                          <QuickAdd
                            onAdd={title => handleAdd(col.id, title)}
                            onCancel={() => setAddingTo(null)}
                          />
                        )}
                      </Box>
                    )}
                  </Droppable>
                </Box>

                {/* Add task button below column card */}
                {colTasks.length > 0 && addingTo !== col.id && (
                  <Button
                    size="small" startIcon={<Add sx={{ fontSize:14 }}/>}
                    onClick={() => setAddingTo(col.id)}
                    sx={{
                      mt: 1, color: col.accent, justifyContent:'flex-start',
                      textTransform:'none', fontSize:'0.75rem', fontWeight:600,
                      borderRadius:'8px', px: 1, opacity:0.75,
                      '&:hover':{ opacity:1, bgcolor: col.cardBg },
                    }}
                  >
                    Add task
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      {selected && (
        <TaskDetailModal
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => dispatch(fetchTasks({ projectId: id }))}
        />
      )}
    </Box>
  );
}
