import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, LinearProgress, Alert,
  Divider, Chip, IconButton, Tooltip,
} from '@mui/material';
import {
  UploadFile, PictureAsPdf, Download, RestartAlt,
  CheckCircle, InsertDriveFile, ZoomIn, ZoomOut,
} from '@mui/icons-material';

export default function DocConverter() {
  const [file, setFile]           = useState(null);
  const [html, setHtml]           = useState('');
  const [status, setStatus]       = useState('idle'); // idle | converting | preview | downloading | done | error
  const [error, setError]         = useState('');
  const [zoom, setZoom]           = useState(100);
  const [dragging, setDragging]   = useState(false);
  const fileInputRef              = useRef(null);
  const previewRef                = useRef(null);

  const ACCEPTED = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  async function processFile(f) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(doc|docx)$/i)) {
      setError('Please upload a .doc or .docx file.');
      setStatus('error');
      return;
    }
    setFile(f);
    setError('');
    setStatus('converting');
    try {
      const mammoth = (await import('mammoth')).default;
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtml(result.value);
      setStatus('preview');
    } catch (e) {
      setError('Failed to parse the document. Make sure it is a valid .docx file.');
      setStatus('error');
    }
  }

  function onFileInput(e) {
    processFile(e.target.files[0]);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  async function downloadPDF() {
    if (!html) return;
    setStatus('downloading');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = previewRef.current;
      const opt = {
        margin:      [10, 12, 10, 12],
        filename:    file ? file.name.replace(/\.(doc|docx)$/i, '.pdf') : 'document.pdf',
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(element).save();
      setStatus('done');
    } catch (e) {
      setError('Failed to generate PDF. Please try again.');
      setStatus('error');
    }
  }

  function reset() {
    setFile(null);
    setHtml('');
    setStatus('idle');
    setError('');
    setZoom(100);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: '1.75rem' }}>📄</Typography>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
              DOC → PDF Converter
            </Typography>
            <Chip label="CORE" size="small" sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.62rem', border: '1px solid rgba(99,102,241,0.35)' }} />
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
            Upload a Word document and download it as a PDF — instantly, no cloud needed.
          </Typography>
        </Box>
        {status !== 'idle' && (
          <Button onClick={reset} startIcon={<RestartAlt />} size="small"
            sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'none', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.06)' } }}>
            Start Over
          </Button>
        )}
      </Box>

      {/* Upload zone */}
      {status === 'idle' && (
        <Box
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragging ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.3)'}`,
            borderRadius: 3,
            p: { xs: 5, md: 8 },
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.03)',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'rgba(99,102,241,0.6)', background: 'rgba(99,102,241,0.06)' },
          }}
        >
          <input ref={fileInputRef} type="file" accept=".doc,.docx" hidden onChange={onFileInput} />
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <UploadFile sx={{ fontSize: 32, color: '#818cf8' }} />
          </Box>
          <Typography fontWeight={700} fontSize="1.05rem" mb={0.75}>
            Drop your Word document here
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', mb: 2 }}>
            or click to browse
          </Typography>
          <Chip label=".doc and .docx supported" size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Box>
      )}

      {/* Converting */}
      {status === 'converting' && (
        <Box sx={{ p: 5, textAlign: 'center', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3, background: 'rgba(99,102,241,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center', mb: 3 }}>
            <InsertDriveFile sx={{ color: '#818cf8', fontSize: 28 }} />
            <Typography fontWeight={600} fontSize="0.95rem">{file?.name}</Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
            Parsing document…
          </Typography>
          <LinearProgress sx={{ borderRadius: 99, background: 'rgba(99,102,241,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' } }} />
        </Box>
      )}

      {/* Error */}
      {status === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          <Button onClick={reset} startIcon={<RestartAlt />} variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}>
            Try Again
          </Button>
        </Box>
      )}

      {/* Preview + download */}
      {(status === 'preview' || status === 'downloading' || status === 'done') && (
        <Box>
          {/* Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {status === 'done'
                ? <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
                : <PictureAsPdf sx={{ color: '#f97316', fontSize: 20 }} />
              }
              <Box>
                <Typography fontWeight={700} fontSize="0.875rem">
                  {file?.name.replace(/\.(doc|docx)$/i, '.pdf')}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                  {status === 'done' ? 'Downloaded successfully' : 'Ready to download'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Zoom controls */}
              <Tooltip title="Zoom out">
                <IconButton size="small" onClick={() => setZoom(z => Math.max(50, z - 10))}
                  sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', minWidth: 36, textAlign: 'center' }}>{zoom}%</Typography>
              <Tooltip title="Zoom in">
                <IconButton size="small" onClick={() => setZoom(z => Math.min(150, z + 10))}
                  sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 0.5 }} />

              <Button
                onClick={downloadPDF}
                disabled={status === 'downloading'}
                startIcon={<Download />}
                variant="contained"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                  '&:hover': { opacity: 0.9 },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                {status === 'downloading' ? 'Generating PDF…' : status === 'done' ? 'Download Again' : 'Download PDF'}
              </Button>
            </Box>
          </Box>

          {/* Document preview */}
          <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2.5, overflow: 'auto', maxHeight: '70vh', background: '#f8fafc' }}>
            <Box
              ref={previewRef}
              sx={{
                transformOrigin: 'top left',
                transform: `scale(${zoom / 100})`,
                width: zoom < 100 ? `${10000 / zoom}%` : '100%',
                p: { xs: 3, md: 5 },
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#1E293B',
                '& h1': { fontSize: '1.8em', fontWeight: 700, mb: 2, mt: 3, lineHeight: 1.3 },
                '& h2': { fontSize: '1.4em', fontWeight: 700, mb: 1.5, mt: 2.5 },
                '& h3': { fontSize: '1.15em', fontWeight: 600, mb: 1, mt: 2 },
                '& p':  { mb: 1.5 },
                '& ul, & ol': { pl: 3, mb: 1.5 },
                '& li': { mb: 0.5 },
                '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
                '& td, & th': { border: '1px solid #CBD5E1', p: '6px 10px', fontSize: '13px' },
                '& th': { background: '#F1F5F9', fontWeight: 600 },
                '& strong': { fontWeight: 700 },
                '& em': { fontStyle: 'italic' },
                '& a': { color: '#6366F1' },
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Box>
        </Box>
      )}

      {/* Info strip */}
      {status === 'idle' && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            ['🔒', 'Private', 'Files never leave your browser'],
            ['⚡', 'Instant', 'No upload to any server'],
            ['📐', 'A4 format', 'Standard PDF output'],
          ].map(([icon, title, desc]) => (
            <Box key={title} sx={{ flex: 1, minWidth: 180, display: 'flex', gap: 1.5, p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Typography fontSize="1.25rem">{icon}</Typography>
              <Box>
                <Typography fontWeight={700} fontSize="0.8rem">{title}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
