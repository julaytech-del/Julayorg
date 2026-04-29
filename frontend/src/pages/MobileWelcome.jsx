import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AIIllustration() {
  return (
    <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Main card */}
      <rect x="20" y="10" width="280" height="280" rx="20" fill="url(#cardGrad)" />

      {/* Grid lines */}
      {[60,100,140,180,220].map(y => (
        <line key={y} x1="20" y1={y} x2="300" y2={y} stroke="#6366F1" strokeOpacity="0.1" strokeWidth="1" />
      ))}
      {[80,140,200,260].map(x => (
        <line key={x} x1={x} y1="10" x2={x} y2="290" stroke="#6366F1" strokeOpacity="0.1" strokeWidth="1" />
      ))}

      {/* Central glowing orb */}
      <circle cx="160" cy="150" r="50" fill="#6366F1" fillOpacity="0.08" />
      <circle cx="160" cy="150" r="35" fill="#6366F1" fillOpacity="0.12" />
      <circle cx="160" cy="150" r="22" fill="url(#purpleGrad)" filter="url(#glow)" />
      <text x="160" y="155" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">AI</text>

      {/* Orbiting nodes */}
      {/* Top */}
      <circle cx="160" cy="90" r="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
      <circle cx="160" cy="90" r="3" fill="#8B5CF6" filter="url(#glow)" />
      <line x1="160" y1="98" x2="160" y2="128" stroke="#6366F1" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3,3" />

      {/* Right */}
      <circle cx="220" cy="150" r="8" fill="#1E1B4B" stroke="#38BDF8" strokeWidth="2" />
      <circle cx="220" cy="150" r="3" fill="#38BDF8" filter="url(#glow)" />
      <line x1="212" y1="150" x2="182" y2="150" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3,3" />

      {/* Bottom */}
      <circle cx="160" cy="210" r="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
      <circle cx="160" cy="210" r="3" fill="#6366F1" filter="url(#glow)" />
      <line x1="160" y1="202" x2="160" y2="172" stroke="#6366F1" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3,3" />

      {/* Left */}
      <circle cx="100" cy="150" r="8" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="100" cy="150" r="3" fill="#8B5CF6" filter="url(#glow)" />
      <line x1="108" y1="150" x2="138" y2="150" stroke="#8B5CF6" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3,3" />

      {/* Corner nodes */}
      <circle cx="115" cy="107" r="5" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
      <line x1="119" y1="111" x2="141" y2="132" stroke="#6366F1" strokeOpacity="0.25" strokeWidth="1" />

      <circle cx="205" cy="107" r="5" fill="#1E1B4B" stroke="#38BDF8" strokeWidth="1.5" />
      <line x1="201" y1="111" x2="179" y2="132" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="1" />

      <circle cx="205" cy="193" r="5" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
      <line x1="201" y1="189" x2="179" y2="168" stroke="#6366F1" strokeOpacity="0.25" strokeWidth="1" />

      <circle cx="115" cy="193" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1="119" y1="189" x2="141" y2="168" stroke="#8B5CF6" strokeOpacity="0.25" strokeWidth="1" />

      {/* Task chips */}
      <rect x="32" y="30" width="90" height="26" rx="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="46" cy="43" r="4" fill="#6366F1" />
      <rect x="54" y="39" width="52" height="4" rx="2" fill="#334155" />
      <rect x="54" y="46" width="35" height="3" rx="1.5" fill="#1E3A5F" />

      <rect x="198" y="30" width="90" height="26" rx="8" fill="#1E1B4B" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="212" cy="43" r="4" fill="#38BDF8" />
      <rect x="220" y="39" width="52" height="4" rx="2" fill="#334155" />
      <rect x="220" y="46" width="35" height="3" rx="1.5" fill="#1E3A5F" />

      <rect x="32" y="244" width="90" height="26" rx="8" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="46" cy="257" r="4" fill="#8B5CF6" />
      <rect x="54" y="253" width="52" height="4" rx="2" fill="#334155" />
      <rect x="54" y="260" width="40" height="3" rx="1.5" fill="#1E3A5F" />

      <rect x="198" y="244" width="90" height="26" rx="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="212" cy="257" r="4" fill="#6366F1" />
      <rect x="220" y="253" width="52" height="4" rx="2" fill="#334155" />
      <rect x="220" y="260" width="30" height="3" rx="1.5" fill="#1E3A5F" />

      {/* Sparkles */}
      <circle cx="55" cy="150" r="2" fill="#6366F1" opacity="0.6" />
      <circle cx="265" cy="150" r="2" fill="#38BDF8" opacity="0.6" />
      <circle cx="160" cy="55" r="2" fill="#8B5CF6" opacity="0.6" />
      <circle cx="160" cy="245" r="2" fill="#6366F1" opacity="0.6" />
    </svg>
  );
}

export default function MobileWelcome() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      px: 3,
      pt: 7,
      pb: 10,
    }}>
      {/* Logo + Name */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <img
          src="/julay-logo-full.png"
          alt="Julay.org"
          style={{ height: 40, marginBottom: 10, filter: 'brightness(0) invert(1)', opacity: 0.9 }}
        />
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            fontWeight: 500,
          }}
        >
          julay.org
        </Typography>
      </Box>

      {/* Tagline */}
      <Box sx={{ textAlign: 'center', mb: 2, px: 1 }}>
        <Typography sx={{
          color: 'white',
          fontSize: '1.15rem',
          fontWeight: 700,
          lineHeight: 1.4,
        }}>
          We don't manage tasks.
        </Typography>
        <Typography sx={{
          background: 'linear-gradient(90deg, #6366F1, #38BDF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '1.15rem',
          fontWeight: 700,
          lineHeight: 1.4,
        }}>
          We design execution systems.
        </Typography>
      </Box>

      {/* Illustration */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 2 }}>
        <AIIllustration />
      </Box>

      {/* Buttons */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          sx={{
            borderRadius: 3,
            py: 1.8,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
          }}
        >
          Log in
        </Button>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={() => navigate('/register')}
          sx={{
            borderRadius: 3,
            py: 1.8,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderColor: 'rgba(99,102,241,0.4)',
            color: '#A5B4FC',
            '&:hover': { borderColor: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' },
          }}
        >
          Create new account
        </Button>
      </Box>
    </Box>
  );
}
