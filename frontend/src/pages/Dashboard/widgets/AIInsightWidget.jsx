import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { AutoAwesome, Refresh } from '@mui/icons-material';
import { dashboardConfigAPI } from '../../services/api.js';

export default function AIInsightWidget({ config = {}, data = {} }) {
  const [insight, setInsight] = useState(data.insight || '');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { const res = await dashboardConfigAPI.getAIInsight(); setInsight(res.data?.insight || res.insight || ''); } catch {}
    setLoading(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.08))', borderRadius: 2, p: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AutoAwesome sx={{ fontSize: 16, color: '#6366F1' }} />
          <Typography variant="body2" fontWeight={700} color="primary" fontSize="0.78rem" textTransform="uppercase" letterSpacing="0.05em">AI Insight</Typography>
        </Box>
        <Button size="small" onClick={refresh} disabled={loading} startIcon={loading ? <CircularProgress size={12} /> : <Refresh sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}>
          {loading ? '' : 'Refresh'}
        </Button>
      </Box>
      {insight ? (
        <Typography fontSize="0.85rem" lineHeight={1.6} color="text.primary">{insight}</Typography>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button onClick={refresh} disabled={loading} variant="outlined" size="small" startIcon={<AutoAwesome />} sx={{ borderRadius: 2 }}>
            Generate Insight
          </Button>
        </Box>
      )}
    </Box>
  );
}
