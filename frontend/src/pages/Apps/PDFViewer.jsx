import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, TextField, CircularProgress, Chip, IconButton, Divider, LinearProgress } from '@mui/material';
import { AutoAwesome, Upload, NavigateBefore, NavigateNext, ZoomIn, ZoomOut, Send, PictureAsPdf } from '@mui/icons-material';
import { contextAPI, projectsAPI } from '../../services/api.js';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../../store/slices/uiSlice.js';

export default function PDFViewer() {
  const dispatch = useDispatch();
  const canvasRef = useRef();
  const fileRef = useRef();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  React.useEffect(() => {
    projectsAPI.getAll().then(r => setProjects(r.data?.projects || [])).catch(() => {});
  }, []);

  const renderPage = useCallback(async (doc, num, sc) => {
    if (!doc || !canvasRef.current) return;
    const page = await doc.getPage(num);
    const viewport = page.getViewport({ scale: sc });
    const canvas = canvasRef.current;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  }, []);

  const loadPDF = async (file) => {
    setLoading(true);
    setFileName(file.name);
    setExtractedText('');
    setChatLog([]);
    try {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const doc = await getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setPageNum(1);
      await renderPage(doc, 1, scale);

      // Extract all text
      let fullText = '';
      for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      setExtractedText(fullText.trim());
      setChatLog([{ role: 'ai', text: `✓ Loaded "${file.name}" (${doc.numPages} pages). Ask me anything about this document, or click "Analyze for Project Updates" to check for actionable items.` }]);
    } catch (err) {
      dispatch(showSnackbar({ message: 'Could not read PDF: ' + err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') loadPDF(file);
  };

  const handleAsk = async () => {
    if (!question.trim() || !extractedText) return;
    const q = question;
    setQuestion('');
    setChatLog(prev => [...prev, { role: 'user', text: q }]);
    setAnalyzing(true);
    try {
      const prompt = `Based on this PDF document "${fileName}", answer the following question:\n\n${q}\n\nDocument content (first 3000 chars):\n${extractedText.slice(0, 3000)}`;
      const res = await contextAPI.analyze(prompt, selectedProject || undefined, { type: 'pdf', label: `PDF: ${fileName}`, icon: '📑' });
      setChatLog(prev => [...prev, { role: 'ai', text: res.data.analysis, suggestions: res.data.suggestions }]);
    } catch (err) {
      setChatLog(prev => [...prev, { role: 'ai', text: 'Could not analyze. Please try again.' }]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeForProject = async () => {
    if (!extractedText) return;
    setAnalyzing(true);
    const prompt = `This is content from a PDF document titled "${fileName}". Extract all actionable project updates, requirements, decisions, deadlines, or tasks mentioned:\n\n${extractedText.slice(0, 4000)}`;
    try {
      const res = await contextAPI.analyze(prompt, selectedProject || undefined, { type: 'pdf', label: `PDF: ${fileName}`, icon: '📑' });
      if (res.data.suggestions.length > 0) {
        dispatch(showSnackbar({ message: `Found ${res.data.suggestions.length} actionable items! Check Smart Share for suggestions.` }));
        setChatLog(prev => [...prev, { role: 'ai', text: `Found ${res.data.suggestions.length} actionable items from this PDF. ${res.data.analysis}`, suggestions: res.data.suggestions }]);
      } else {
        setChatLog(prev => [...prev, { role: 'ai', text: `Analysis complete. ${res.data.analysis}` }]);
      }
    } catch (err) {
      dispatch(showSnackbar({ message: 'Analysis failed', severity: 'error' }));
    } finally {
      setAnalyzing(false);
    }
  };

  const changePage = async (delta) => {
    const next = pageNum + delta;
    if (next < 1 || next > numPages) return;
    setPageNum(next);
    await renderPage(pdfDoc, next, scale);
  };

  const changeZoom = async (delta) => {
    const next = Math.min(3, Math.max(0.5, scale + delta));
    setScale(next);
    await renderPage(pdfDoc, pageNum, next);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, background: 'linear-gradient(135deg, #e17055, #fd7043)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PictureAsPdf sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} letterSpacing='-0.02em'>PDF + AI</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Open any PDF — ask questions or extract project updates</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 0.7fr' }, gap: 3 }}>
        {/* PDF Panel */}
        <Box>
          {!pdfDoc ? (
            <Box onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current.click()}
              sx={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 3, p: 8, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'rgba(225,112,85,0.5)', bgcolor: 'rgba(225,112,85,0.05)' } }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files[0] && loadPDF(e.target.files[0])} />
              {loading ? <CircularProgress sx={{ color: '#e17055' }} /> : (
                <>
                  <Typography fontSize="3rem" mb={1}>📑</Typography>
                  <Typography fontWeight={700} mb={0.5}>Drop PDF here or click to upload</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Supports any PDF up to 50MB</Typography>
                </>
              )}
            </Box>
          ) : (
            <Card sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
              {/* Toolbar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                <Chip label={fileName} size="small" sx={{ bgcolor: 'rgba(225,112,85,0.15)', color: '#e17055', fontSize: '0.72rem', maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => changePage(-1)} disabled={pageNum <= 1} sx={{ color: 'rgba(255,255,255,0.5)' }}><NavigateBefore fontSize="small" /></IconButton>
                <Typography fontSize="0.78rem" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 70, textAlign: 'center' }}>{pageNum} / {numPages}</Typography>
                <IconButton size="small" onClick={() => changePage(1)} disabled={pageNum >= numPages} sx={{ color: 'rgba(255,255,255,0.5)' }}><NavigateNext fontSize="small" /></IconButton>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 0.5 }} />
                <IconButton size="small" onClick={() => changeZoom(-0.2)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ZoomOut fontSize="small" /></IconButton>
                <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.4)', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</Typography>
                <IconButton size="small" onClick={() => changeZoom(0.2)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ZoomIn fontSize="small" /></IconButton>
                <Button size="small" onClick={() => { setPdfDoc(null); setFileName(''); setExtractedText(''); setChatLog([]); }} sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', textTransform: 'none' }}>Change</Button>
              </Box>
              {/* Canvas */}
              <Box sx={{ overflow: 'auto', maxHeight: '65vh', display: 'flex', justifyContent: 'center', p: 2, bgcolor: '#1a1a2e' }}>
                <canvas ref={canvasRef} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
              </Box>
            </Card>
          )}
        </Box>

        {/* AI Chat Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Analyze button */}
          {pdfDoc && (
            <Button fullWidth variant="contained" onClick={handleAnalyzeForProject} disabled={analyzing}
              startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
              sx={{ py: 1.3, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 2, textTransform: 'none', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              {analyzing ? 'Analyzing...' : 'Analyze for Project Updates'}
            </Button>
          )}

          {/* Chat */}
          <Card sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, flex: 1 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography fontWeight={700} fontSize="0.82rem" mb={2} sx={{ color: 'rgba(255,255,255,0.5)' }}>Ask AI about this document</Typography>

              {/* Chat messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, minHeight: 200, maxHeight: '40vh' }}>
                {chatLog.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography fontSize="1.5rem" mb={1}>💬</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem' }}>Upload a PDF to start chatting</Typography>
                  </Box>
                )}
                {chatLog.map((msg, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{ maxWidth: '90%', bgcolor: msg.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', borderRadius: 2, p: 1.5, border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <Typography fontSize="0.78rem" sx={{ color: msg.role === 'user' ? '#a5b4fc' : 'rgba(255,255,255,0.75)' }}>{msg.text}</Typography>
                      {msg.suggestions?.length > 0 && (
                        <Chip label={`${msg.suggestions.length} suggestions → Smart Share`} size="small" onClick={() => window.location.href = '/dashboard/apps/share'}
                          sx={{ mt: 1, bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700 }} />
                      )}
                    </Box>
                  </Box>
                ))}
                {analyzing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: '#818cf8' }} />
                    <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.3)' }}>AI is thinking...</Typography>
                  </Box>
                )}
              </Box>

              {/* Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder={pdfDoc ? 'Ask anything about this PDF...' : 'Upload a PDF first'}
                  value={question} onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
                  disabled={!pdfDoc || analyzing}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '0.82rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }} />
                <IconButton onClick={handleAsk} disabled={!question.trim() || !pdfDoc || analyzing}
                  sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 2, '&:hover': { bgcolor: 'rgba(99,102,241,0.3)' }, '&:disabled': { opacity: 0.3 } }}>
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
