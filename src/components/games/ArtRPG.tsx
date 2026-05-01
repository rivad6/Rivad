import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paintbrush, User as UserIcon, DollarSign, Zap, RotateCcw, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { FullscreenButton } from '../ui/FullscreenButton';
import { cn } from '../../lib/utils';

type NodeId = string;

interface Choice {
  textKey: string;
  next: NodeId;
  stats?: { budget?: number; sanity?: number; reputation?: number };
}

interface StoryNode {
  textKey: string;
  choices: Choice[];
  isEnding?: boolean;
}

const storyMap: Record<string, StoryNode> = {
  start: {
    textKey: 'game.rpg.start',
    choices: [{ textKey: 'game.rpg.start', next: 'q1' }]
  },
  q1: {
    textKey: 'game.rpg.q1',
    choices: [
      { textKey: 'game.rpg.q1.1', next: 'p1.q2', stats: { budget: -5, sanity: -5 } },
      { textKey: 'game.rpg.q1.2', next: 'p2.q2', stats: { reputation: -10, sanity: -5 } },
      { textKey: 'game.rpg.q1.3', next: 'p3.q2', stats: { budget: -10, reputation: 5 } },
      { textKey: 'game.rpg.q1.4', next: 'p4.q2', stats: { reputation: -5, sanity: -10 } },
      { textKey: 'game.rpg.q1.5', next: 'p5.q2', stats: { budget: -15, sanity: -5 } },
      { textKey: 'game.rpg.q1.6', next: 'p6.q2', stats: { reputation: -20, budget: 10 } },
      { textKey: 'game.rpg.q1.7', next: 'p7.q2', stats: { sanity: -20, reputation: 10 } },
      { textKey: 'game.rpg.q1.8', next: 'p8.q2', stats: { sanity: -15, budget: 15 } }
    ]
  },
  
  // PATH 1: CATERING (Logistics)
  'p1.q2': {
    textKey: 'game.rpg.p1.q2',
    choices: [
      { textKey: 'game.rpg.p1.q2.a', next: 'p1.q3a', stats: { reputation: 15, sanity: -10 } },
      { textKey: 'game.rpg.p1.q2.b', next: 'p1.q3b', stats: { budget: -20, sanity: 5 } },
      { textKey: 'game.rpg.p1.q2.c', next: 'p1.q3c', stats: { sanity: -5, reputation: 10 } }
    ]
  },
  'p1.q3c': {
    textKey: 'game.rpg.p1.q3c',
    choices: [
      { textKey: 'game.rpg.p1.q3c.1', next: 'p1.q4c1', stats: { reputation: 20, budget: -10, sanity: -5 } },
      { textKey: 'game.rpg.p1.q3c.2', next: 'p4.q2', stats: { reputation: -5, sanity: 15, budget: -5 } }
    ]
  },
  'p1.q4c1': { textKey: 'game.rpg.p1.q4c1', choices: [{ textKey: 'game.rpg.p1.q4c1.1', next: 'p1.e9', stats: { budget: -20, reputation: 40 } }, { textKey: 'game.rpg.p1.q4c1.2', next: 'p1.e10', stats: { sanity: 20, reputation: -10 } }] },
  'p1.e9': { textKey: 'game.rpg.p1.e9', choices: [], isEnding: true },
  'p1.e10': { textKey: 'game.rpg.p1.e10', choices: [], isEnding: true },
  'p1.q3a': {
    textKey: 'game.rpg.p1.q3a',
    choices: [
      { textKey: 'game.rpg.p1.q3a.1', next: 'p6.q2', stats: { reputation: 25, sanity: -15 } }, // Leads to Influencer
      { textKey: 'game.rpg.p1.q3a.2', next: 'p1.q4a2', stats: { reputation: -10, sanity: 15 } }
    ]
  },
  'p1.q3b': {
    textKey: 'game.rpg.p1.q3b',
    choices: [
      { textKey: 'game.rpg.p1.q3b.1', next: 'p1.q4b1', stats: { budget: -10, reputation: 10 } },
      { textKey: 'game.rpg.p1.q3b.2', next: 'p4.q2', stats: { budget: -5, reputation: -5 } } // Leads to Politics
    ]
  },
  'p1.q4a2': { textKey: 'game.rpg.p1.q4a2', choices: [{ textKey: 'game.rpg.p1.q4a2.1', next: 'p1.e1', stats: { budget: -20, reputation: 30 } }, { textKey: 'game.rpg.p1.q4a2.2', next: 'p1.e2', stats: { sanity: -20, reputation: -20 } }] },
  'p1.q4b1': { textKey: 'game.rpg.p1.q4b1', choices: [{ textKey: 'game.rpg.p1.q4b1.1', next: 'p1.e3', stats: { reputation: 20, sanity: -10 } }, { textKey: 'game.rpg.p1.q4b1.2', next: 'p1.e4', stats: { budget: 10, reputation: -15 } }] },
  'p1.e1': { textKey: 'game.rpg.p1.e1', choices: [], isEnding: true },
  'p1.e2': { textKey: 'game.rpg.p1.e2', choices: [], isEnding: true },
  'p1.e3': { textKey: 'game.rpg.p1.e3', choices: [], isEnding: true },
  'p1.e4': { textKey: 'game.rpg.p1.e4', choices: [], isEnding: true },

  // PATH 2: ARTIST
  'p2.q2': {
    textKey: 'game.rpg.p2.q2',
    choices: [
      { textKey: 'game.rpg.p2.q2.a', next: 'p2.q3a', stats: { reputation: 20, sanity: -15 } },
      { textKey: 'game.rpg.p2.q2.b', next: 'p2.q3b', stats: { budget: -10, sanity: 10 } }
    ]
  },
  'p2.q3a': {
    textKey: 'game.rpg.p2.q3a',
    choices: [
      { textKey: 'game.rpg.p2.q3a.1', next: 'p2.q4a1', stats: { budget: 40, reputation: -20 } },
      { textKey: 'game.rpg.p2.q3a.2', next: 'p7.q2', stats: { sanity: -25, reputation: 10 } } // Leads to Paranormal
    ]
  },
  'p2.q3b': {
    textKey: 'game.rpg.p2.q3b',
    choices: [
      { textKey: 'game.rpg.p2.q3b.1', next: 'p2.q4b1', stats: { sanity: -10, budget: -5 } },
      { textKey: 'game.rpg.p2.q3b.2', next: 'p2.q4b2', stats: { reputation: 15, sanity: -5 } },
      { textKey: 'game.rpg.p2.q3b.3', next: 'p2.q4b3', stats: { budget: 15, reputation: -10 } }
    ]
  },
  'p2.q4b3': {
    textKey: 'game.rpg.p2.q4b3',
    choices: [
      { textKey: 'game.rpg.p2.q4b3.1', next: 'p2.e9', stats: { reputation: 30, sanity: -20 } },
      { textKey: 'game.rpg.p2.q4b3.2', next: 'p2.e10', stats: { budget: -10, reputation: 10 } }
    ]
  },
  'p2.e9': { textKey: 'game.rpg.p2.e9', choices: [], isEnding: true },
  'p2.e10': { textKey: 'game.rpg.p2.e10', choices: [], isEnding: true },
  'p2.q4a1': { textKey: 'game.rpg.p2.q4a1', choices: [{ textKey: 'game.rpg.p2.q4a1.1', next: 'p2.e1', stats: { budget: 50, sanity: -30 } }, { textKey: 'game.rpg.p2.q4a1.2', next: 'p2.e2', stats: { budget: -20, reputation: 10 } }] },
  'p2.q4b1': { textKey: 'game.rpg.p2.q4b1', choices: [{ textKey: 'game.rpg.p2.q4b1.1', next: 'p2.e3', stats: { budget: -10, reputation: 20 } }, { textKey: 'game.rpg.p2.q4b1.2', next: 'p2.e4', stats: { sanity: 20, reputation: -10 } }] },
  'p2.q4b2': { textKey: 'game.rpg.p2.q4b2', choices: [{ textKey: 'game.rpg.p2.q4b2.1', next: 'p2.e5', stats: { sanity: -40, budget: 10 } }, { textKey: 'game.rpg.p2.q4b2.2', next: 'p2.e6', stats: { reputation: 25, sanity: -10 } }] },
  'p2.e1': { textKey: 'game.rpg.p2.e1', choices: [], isEnding: true },
  'p2.e2': { textKey: 'game.rpg.p2.e2', choices: [], isEnding: true },
  'p2.e3': { textKey: 'game.rpg.p2.e3', choices: [], isEnding: true },
  'p2.e4': { textKey: 'game.rpg.p2.e4', choices: [], isEnding: true },
  'p2.e5': { textKey: 'game.rpg.p2.e5', choices: [], isEnding: true },
  'p2.e6': { textKey: 'game.rpg.p2.e6', choices: [], isEnding: true },

  // PATH 3: TECHNOLOGY (AI)
  'p3.q2': {
    textKey: 'game.rpg.p3.q2',
    choices: [
      { textKey: 'game.rpg.p3.q2.a', next: 'p3.q3a', stats: { reputation: 20, sanity: -20 } },
      { textKey: 'game.rpg.p3.q2.b', next: 'p3.q3b', stats: { budget: -5, sanity: 5 } }
    ]
  },
  'p3.q3a': {
    textKey: 'game.rpg.p3.q3a',
    choices: [
      { textKey: 'game.rpg.p3.q3a.1', next: 'p3.q4a1', stats: { reputation: 30, budget: -10 } },
      { textKey: 'game.rpg.p3.q3a.2', next: 'p8.q2', stats: { sanity: -30, reputation: 20 } } // Leads to Paradox
    ]
  },
  'p3.q3b': {
    textKey: 'game.rpg.p3.q3b',
    choices: [
      { textKey: 'game.rpg.p3.q3b.1', next: 'p3.q4b1', stats: { sanity: -15, budget: -10 } },
      { textKey: 'game.rpg.p3.q3b.2', next: 'p3.q4b2', stats: { reputation: 10, budget: -5 } }
    ]
  },
  'p3.q4a1': { textKey: 'game.rpg.p3.q4a1', choices: [{ textKey: 'game.rpg.p3.q4a1.1', next: 'p3.e1', stats: { budget: 100, reputation: -50 } }, { textKey: 'game.rpg.p3.q4a1.2', next: 'p3.e2', stats: { budget: -50, reputation: 50 } }] },
  'p3.q4b1': { textKey: 'game.rpg.p3.q4b1', choices: [{ textKey: 'game.rpg.p3.q4b1.1', next: 'p3.e3', stats: { sanity: -40, reputation: 10 } }, { textKey: 'game.rpg.p3.q4b1.2', next: 'p3.e4', stats: { sanity: 50, budget: -20 } }] },
  'p3.q4b2': { textKey: 'game.rpg.p3.q4b2', choices: [{ textKey: 'game.rpg.p3.q4b2.1', next: 'p3.e5', stats: { budget: 20, sanity: -10 } }, { textKey: 'game.rpg.p3.q4b2.2', next: 'p3.e6', stats: { reputation: 15, sanity: 5 } }] },
  'p3.e1': { textKey: 'game.rpg.p3.e1', choices: [], isEnding: true },
  'p3.e2': { textKey: 'game.rpg.p3.e2', choices: [], isEnding: true },
  'p3.e3': { textKey: 'game.rpg.p3.e3', choices: [], isEnding: true },
  'p3.e4': { textKey: 'game.rpg.p3.e4', choices: [], isEnding: true },
  'p3.e5': { textKey: 'game.rpg.p3.e5', choices: [], isEnding: true },
  'p3.e6': { textKey: 'game.rpg.p3.e6', choices: [], isEnding: true },

  // PATH 4: POLITICS
  'p4.q2': {
    textKey: 'game.rpg.p4.q2',
    choices: [
      { textKey: 'game.rpg.p4.q2.a', next: 'p4.q3a', stats: { reputation: 10, sanity: -15 } },
      { textKey: 'game.rpg.p4.q2.b', next: 'p4.q3b', stats: { budget: -10, reputation: 5 } }
    ]
  },
  'p4.q3a': {
    textKey: 'game.rpg.p4.q3a',
    choices: [
      { textKey: 'game.rpg.p4.q3a.1', next: 'p1.q2', stats: { budget: 30, reputation: -10 } }, // Back to Logistics with budget
      { textKey: 'game.rpg.p4.q3a.2', next: 'p4.q4a2', stats: { reputation: -20, sanity: 10 } }
    ]
  },
  'p4.q3b': {
    textKey: 'game.rpg.p4.q3b',
    choices: [
      { textKey: 'game.rpg.p4.q3b.1', next: 'p4.q4b1', stats: { sanity: -20, budget: 10 } },
      { textKey: 'game.rpg.p4.q3b.2', next: 'p4.q4b2', stats: { reputation: 10, sanity: -5 } },
      { textKey: 'game.rpg.p4.q3b.3', next: 'p4.q5b', stats: { budget: 20, sanity: -15 } }
    ]
  },
  'p4.q5b': {
    textKey: 'game.rpg.p4.q5b',
    choices: [
      { textKey: 'game.rpg.p4.q5b.1', next: 'p4.e7', stats: { reputation: 30, budget: -20 } },
      { textKey: 'game.rpg.p4.q5b.2', next: 'p4.e8', stats: { sanity: 20, reputation: -10 } }
    ]
  },
  'p4.e7': { textKey: 'game.rpg.p4.e7', choices: [], isEnding: true },
  'p4.e8': { textKey: 'game.rpg.p4.e8', choices: [], isEnding: true },
  'p4.q4a2': { textKey: 'game.rpg.p4.q4a2', choices: [{ textKey: 'game.rpg.p4.q4a2.1', next: 'p4.e1', stats: { budget: -30, sanity: 10 } }, { textKey: 'game.rpg.p4.q4a2.2', next: 'p4.e2', stats: { reputation: 40, sanity: -20 } }] },
  'p4.q4b1': { textKey: 'game.rpg.p4.q4b1', choices: [{ textKey: 'game.rpg.p4.q4b1.1', next: 'p4.e3', stats: { sanity: -30, budget: 20 } }, { textKey: 'game.rpg.p4.q4b1.2', next: 'p4.e4', stats: { reputation: -10, budget: 5 } }] },
  'p4.q4b2': { textKey: 'game.rpg.p4.q4b2', choices: [{ textKey: 'game.rpg.p4.q4b2.1', next: 'p4.e5', stats: { budget: -15, reputation: 25 } }, { textKey: 'game.rpg.p4.q4b2.2', next: 'p4.e6', stats: { sanity: 15, reputation: -5 } }] },
  'p4.e1': { textKey: 'game.rpg.p4.e1', choices: [], isEnding: true },
  'p4.e2': { textKey: 'game.rpg.p4.e2', choices: [], isEnding: true },
  'p4.e3': { textKey: 'game.rpg.p4.e3', choices: [], isEnding: true },
  'p4.e4': { textKey: 'game.rpg.p4.e4', choices: [], isEnding: true },
  'p4.e5': { textKey: 'game.rpg.p4.e5', choices: [], isEnding: true },
  'p4.e6': { textKey: 'game.rpg.p4.e6', choices: [], isEnding: true },

  // PATH 5: INFRASTRUCTURE (Flood/Water)
  'p5.q2': {
    textKey: 'game.rpg.p5.q2',
    choices: [
      { textKey: 'game.rpg.p5.q2.a', next: 'p5.q3a', stats: { reputation: 20, sanity: -10 } },
      { textKey: 'game.rpg.p5.q2.b', next: 'p5.q3b', stats: { budget: -15, sanity: 10 } }
    ]
  },
  'p5.q3a': {
    textKey: 'game.rpg.p5.q3a',
    choices: [
      { textKey: 'game.rpg.p5.q3a.1', next: 'p5.q4a1', stats: { budget: -10, sanity: -20, reputation: 20 } },
      { textKey: 'game.rpg.p5.q3a.2', next: 'p3.q2', stats: { sanity: -15, budget: 10 } } // Leads to Tech
    ]
  },
  'p5.q3b': {
    textKey: 'game.rpg.p5.q3b',
    choices: [
      { textKey: 'game.rpg.p5.q3b.1', next: 'p5.q4b1', stats: { sanity: -10, reputation: 15 } },
      { textKey: 'game.rpg.p5.q3b.2', next: 'p5.q4b2', stats: { budget: -10, sanity: 5 } }
    ]
  },
  'p5.q4a1': { textKey: 'game.rpg.p5.q4a1', choices: [{ textKey: 'game.rpg.p5.q4a1.1', next: 'p5.e1', stats: { reputation: 40, budget: -30 } }, { textKey: 'game.rpg.p5.q4a1.2', next: 'p5.e2', stats: { sanity: -15, budget: -5 } }] },
  'p5.q4b1': { textKey: 'game.rpg.p5.q4b1', choices: [{ textKey: 'game.rpg.p5.q4b1.1', next: 'p5.e3', stats: { sanity: -30, budget: 20 } }, { textKey: 'game.rpg.p5.q4b1.2', next: 'p5.e4', stats: { reputation: -10, sanity: 15 } }] },
  'p5.q4b2': { textKey: 'game.rpg.p5.q4b2', choices: [{ textKey: 'game.rpg.p5.q4b2.1', next: 'p5.e5', stats: { budget: 30, sanity: -10 } }, { textKey: 'game.rpg.p5.q4b2.2', next: 'p5.e6', stats: { reputation: 20, sanity: 5 } }] },
  'p5.e1': { textKey: 'game.rpg.p5.e1', choices: [], isEnding: true },
  'p5.e2': { textKey: 'game.rpg.p5.e2', choices: [], isEnding: true },
  'p5.e3': { textKey: 'game.rpg.p5.e3', choices: [], isEnding: true },
  'p5.e4': { textKey: 'game.rpg.p5.e4', choices: [], isEnding: true },
  'p5.e5': { textKey: 'game.rpg.p5.e5', choices: [], isEnding: true },
  'p5.e6': { textKey: 'game.rpg.p5.e6', choices: [], isEnding: true },

  // PATH 6: SOCIAL (Influencer)
  'p6.q2': {
    textKey: 'game.rpg.p6.q2',
    choices: [
      { textKey: 'game.rpg.p6.q2.a', next: 'p6.q3a', stats: { reputation: 25, sanity: -20 } },
      { textKey: 'game.rpg.p6.q2.b', next: 'p6.q3b', stats: { reputation: -10, sanity: 5 } }
    ]
  },
  'p6.q3a': {
    textKey: 'game.rpg.p6.q3a',
    choices: [
      { textKey: 'game.rpg.p6.q3a.1', next: 'p6.q4a1', stats: { reputation: 40, sanity: -30 } },
      { textKey: 'game.rpg.p6.q3a.2', next: 'p2.q2', stats: { sanity: -15, reputation: 10 } } // Leads to Artist (The talent)
    ]
  },
  'p6.q3b': {
    textKey: 'game.rpg.p6.q3b',
    choices: [
      { textKey: 'game.rpg.p6.q3b.1', next: 'p6.q4b1', stats: { sanity: -10, budget: 15 } },
      { textKey: 'game.rpg.p6.q3b.2', next: 'p6.q4b2', stats: { reputation: 10, sanity: -15 } }
    ]
  },
  'p6.q4a1': { textKey: 'game.rpg.p6.q4a1', choices: [{ textKey: 'game.rpg.p6.q4a1.1', next: 'p6.e1', stats: { reputation: 60, sanity: -40 } }, { textKey: 'game.rpg.p6.q4a1.2', next: 'p6.e2', stats: { reputation: -20, sanity: 10 } }] },
  'p6.q4b1': { textKey: 'game.rpg.p6.q4b1', choices: [{ textKey: 'game.rpg.p6.q4b1.1', next: 'p6.e3', stats: { budget: 40, reputation: -30 } }, { textKey: 'game.rpg.p6.q4b1.2', next: 'p6.e4', stats: { sanity: 20, budget: -10 } }] },
  'p6.q4b2': { textKey: 'game.rpg.p6.q4b2', choices: [{ textKey: 'game.rpg.p6.q4b2.1', next: 'p6.e5', stats: { budget: -10, reputation: 35 } }, { textKey: 'game.rpg.p6.q4b2.2', next: 'p6.e6', stats: { sanity: 15, reputation: 5 } }] },
  'p6.e1': { textKey: 'game.rpg.p6.e1', choices: [], isEnding: true },
  'p6.e2': { textKey: 'game.rpg.p6.e2', choices: [], isEnding: true },
  'p6.e3': { textKey: 'game.rpg.p6.e3', choices: [], isEnding: true },
  'p6.e4': { textKey: 'game.rpg.p6.e4', choices: [], isEnding: true },
  'p6.e5': { textKey: 'game.rpg.p6.e5', choices: [], isEnding: true },
  'p6.e6': { textKey: 'game.rpg.p6.e6', choices: [], isEnding: true },

  // PATH 7: PARANORMAL
  'p7.q2': {
    textKey: 'game.rpg.p7.q2',
    choices: [
      { textKey: 'game.rpg.p7.q2.a', next: 'p7.q3a', stats: { sanity: -20, reputation: 15 } },
      { textKey: 'game.rpg.p7.q2.b', next: 'p7.q3b', stats: { sanity: 10, reputation: -5 } }
    ]
  },
  'p7.q3a': {
    textKey: 'game.rpg.p7.q3a',
    choices: [
      { textKey: 'game.rpg.p7.q3a.1', next: 'p7.q4a1', stats: { sanity: -30, reputation: 40 } },
      { textKey: 'game.rpg.p7.q3a.2', next: 'p5.q2', stats: { budget: -10, sanity: 15 } } // Leads to Infrastructure (Flood)
    ]
  },
  'p7.q3b': {
    textKey: 'game.rpg.p7.q3b',
    choices: [
      { textKey: 'game.rpg.p7.q3b.1', next: 'p7.q4b1', stats: { sanity: -50, budget: 10 } },
      { textKey: 'game.rpg.p7.q4b2', next: 'p7.q2', stats: { sanity: 20, budget: -15 } }
    ]
  },
  'p7.q4a1': { textKey: 'game.rpg.p7.q4a1', choices: [{ textKey: 'game.rpg.p7.q4a1.1', next: 'p7.e1', stats: { reputation: 100, sanity: -60 } }, { textKey: 'game.rpg.p7.q4a1.2', next: 'p7.e2', stats: { budget: 50, sanity: -10 } }] },
  'p7.q4b1': { textKey: 'game.rpg.p7.q4b1', choices: [{ textKey: 'game.rpg.p7.q4b1.1', next: 'p7.e3', stats: { sanity: -60, reputation: 20 } }, { textKey: 'game.rpg.p7.q4b1.2', next: 'p7.e4', stats: { reputation: -15, budget: 10 } }] },
  'p7.q4b2': { textKey: 'game.rpg.p7.q4b2', choices: [{ textKey: 'game.rpg.p7.q4b2.1', next: 'p7.e5', stats: { budget: -20, reputation: 50 } }, { textKey: 'game.rpg.p7.q4b2.2', next: 'p7.e6', stats: { sanity: 30, reputation: -10 } }] },
  'p7.e1': { textKey: 'game.rpg.p7.e1', choices: [], isEnding: true },
  'p7.e2': { textKey: 'game.rpg.p7.e2', choices: [], isEnding: true },
  'p7.e3': { textKey: 'game.rpg.p7.e3', choices: [], isEnding: true },
  'p7.e4': { textKey: 'game.rpg.p7.e4', choices: [], isEnding: true },
  'p7.e5': { textKey: 'game.rpg.p7.e5', choices: [], isEnding: true },
  'p7.e6': { textKey: 'game.rpg.p7.e6', choices: [], isEnding: true },

  // PATH 8: PARADOX (The core truth)
  'p8.q2': {
    textKey: 'game.rpg.p8.q2',
    choices: [
      { textKey: 'game.rpg.p8.q2.a', next: 'p8.q3a', stats: { sanity: -30, budget: -10 } },
      { textKey: 'game.rpg.p8.q2.b', next: 'p3.q2', stats: { reputation: 10, sanity: 5 } } // Diverge to AI
    ]
  },
  'p8.q3a': {
    textKey: 'game.rpg.p8.q3a',
    choices: [
      { textKey: 'game.rpg.p8.q3a.1', next: 'boss.q1', stats: { sanity: -40, budget: 20 } }, // GO TO BOSS
      { textKey: 'game.rpg.p8.q3a.2', next: 'p8.e1', stats: { sanity: 10, reputation: -20 } }
    ]
  },
  'p8.e1': { textKey: 'game.rpg.p8.e1', choices: [], isEnding: true },

  // SECRET BOSS (Final extension)
  'boss.q1': {
    textKey: 'game.rpg.boss.q1',
    choices: [
      { textKey: 'game.rpg.boss.q1.a', next: 'boss.q2a', stats: { budget: 50, sanity: -50 } },
      { textKey: 'game.rpg.boss.q1.b', next: 'boss.q2b', stats: { reputation: 100, sanity: -80 } }
    ]
  },
  'boss.q2a': {
    textKey: 'game.rpg.boss.q2a',
    choices: [
      { textKey: 'game.rpg.boss.q2a.1', next: 'boss.e1', stats: { reputation: 200, budget: -100 } },
      { textKey: 'game.rpg.boss.q2a.2', next: 'boss.e2', stats: { sanity: -100, reputation: 50 } }
    ]
  },
  'boss.q2b': {
    textKey: 'game.rpg.boss.q2b',
    choices: [
      { textKey: 'game.rpg.boss.q2b.1', next: 'boss.e3', stats: { budget: 100, reputation: 50 } },
      { textKey: 'game.rpg.boss.q2b.2', next: 'boss.e4', stats: { sanity: 100, reputation: -100 } }
    ]
  },
  'boss.e1': { textKey: 'game.rpg.boss.e1', choices: [], isEnding: true },
  'boss.e2': { textKey: 'game.rpg.boss.e2', choices: [], isEnding: true },
  'boss.e3': { textKey: 'game.rpg.boss.e3', choices: [], isEnding: true },
  'boss.e4': { textKey: 'game.rpg.boss.e4', choices: [], isEnding: true },

  'fail_budget': { textKey: 'game.rpg.fail_budget', choices: [], isEnding: true },
  'fail_sanity': { textKey: 'game.rpg.fail_sanity', choices: [], isEnding: true },
  'fail_reputation': { textKey: 'game.rpg.fail_reputation', choices: [], isEnding: true },
};

// I will now manually build the logic to make it more narrative.
// The user wants logical difference in stories.

const getMoodColors = (nodeId: string, bizarreLevel: number = 0) => {
  if (bizarreLevel > 5) return { bg: 'bg-[#000000]', border: 'border-[#ff00ff]/30', accent: 'text-[#ff00ff]' };
  if (nodeId.startsWith('p1')) return { bg: 'bg-[#1a1103]', border: 'border-amber-500/50', accent: 'text-amber-400' }; // Warm/Catering
  if (nodeId.startsWith('p2')) return { bg: 'bg-[#12031a]', border: 'border-purple-500/50', accent: 'text-purple-400' }; // Mysterious/Artist
  if (nodeId.startsWith('p3')) return { bg: 'bg-[#031a1a]', border: 'border-cyan-500/50', accent: 'text-cyan-400' }; // Technical/AI
  if (nodeId.startsWith('p4')) return { bg: 'bg-[#1a0303]', border: 'border-red-500/50', accent: 'text-red-400' }; // Politics/Aggressive
  if (nodeId.startsWith('p5')) return { bg: 'bg-[#03031a]', border: 'border-blue-500/50', accent: 'text-blue-400' }; // Aquatic/Flood
  if (nodeId.startsWith('p6')) return { bg: 'bg-[#1a030c]', border: 'border-pink-500/50', accent: 'text-pink-400' }; // Influencer/Pop
  return { bg: 'bg-[#0a0a0B]', border: 'border-white/10', accent: 'text-brand-accent' }; // Default
}

export function ArtRPG({ isPausedGlobal = false, hideFullscreenButton = false, onFinish }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean, onFinish?: () => void }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const [currentNode, setCurrentNode] = useState<NodeId>('start');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // stats system to make decisions feel coherent and impactful
  const [stats, setStats] = useState({ budget: 50, sanity: 50, reputation: 50 });
  const [inventory, setInventory] = useState<string[]>([]);
  const [lastStatDelta, setLastStatDelta] = useState<{b: number, s: number, r: number} | null>(null);
  const [history, setHistory] = useState<NodeId[]>([]);
  const [bizarreLevel, setBizarreLevel] = useState(0);
  const [characterClass, setCharacterClass] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pathContext, setPathContext] = useState<string | null>(null);

  // Helper to provide bridging context when jumping paths
  const getPathBridge = (prev: string, next: string): string => {
    if (prev === 'start' || prev === next) return "";
    const p1 = prev.split('.')[0];
    const p2 = next.split('.')[0];
    if (p1 === p2) return "";

    // Contextual bridges to smooth transitions
    if (p1 === 'p1' && p2 === 'p4') return t('game.rpg.bridge.p1_p4', "Harto del catering, decides que la política de oficina es más nutritiva...");
    if (p1 === 'p2' && p2 === 'p7') return t('game.rpg.bridge.p2_p7', "El pánico del artista atrae una energía densa, casi... no-humana.");
    if (p1 === 'p3' && p2 === 'p8') return t('game.rpg.bridge.p3_p8', "Los circuitos colapsan revelando una verdad que no cabe en un disco duro.");
    if (p1 === 'p5' && p2 === 'p3') return t('game.rpg.bridge.p5_p3', "El agua se filtra en los procesadores, cortocircuitando la realidad.");
    
    return t('game.rpg.bridge.generic', "El caos de la gala te arrastra hacia un nuevo problema...");
  };

  // Typewriter effect
  useEffect(() => {
    if (currentNode === 'start') return;
    const node = storyMap[currentNode];
    if (!node) return;
    const fullText = (pathContext ? pathContext + "\n\n" : "") + t(node.textKey);
    
    // Reset state for new node
    setDisplayedText(""); 
    setIsTyping(true);
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.substring(0, i + 1));
      i++;
      
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setPathContext(null); // Clear context once typed
      }
    }, 12); // Slightly faster for better flow
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentNode, t]);

  const selectBackground = (bg: string) => {
    setCharacterClass(bg);
    playSound('click');
    if (bg === 'artist') setStats({ budget: 30, sanity: 40, reputation: 60 });
    if (bg === 'dealer') setStats({ budget: 80, sanity: 60, reputation: 30 });
    if (bg === 'intern') setStats({ budget: 10, sanity: 80, reputation: 10 });
    setCurrentNode('q1');
  };

  // Helper to glitch text based on sanity
  const getGlitchedText = (text: string) => {
    // Only glitch if sanity is truly critical
    if (stats.sanity > 20) return text;
    
    const chars = text.split('');
    const glitchChars = '!@#$%^&*'; 
    return chars.map((c, i) => {
      if (c === ' ' || c === '\n') return c;
      const stableSeed = (currentNode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + i) % 100;
      
      // Threshold for when to glitch (only in very low sanity)
      const threshold = stats.sanity < 10 ? 12 : 4; 
      
      // Only glitch every few characters to maintain readability
      return (stableSeed < threshold && i % 6 === 0) ? glitchChars[stableSeed % glitchChars.length] : c;
    }).join('');
  };

  useEffect(() => {
    const isPlaying = currentNode !== 'start' && !storyMap[currentNode]?.isEnding;
    if (isPlaying && !isPausedGlobal) {
      playMusic('rpg');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [currentNode, playMusic, isPausedGlobal]);

  // Handle Joystick and Button navigation for Arcade Cabinet
  useEffect(() => {
    if (isPausedGlobal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const node = storyMap[currentNode] || { textKey: 'game.rpg.fail.fallback', choices: [], isEnding: true };
      if (!node || node.isEnding) return;
      
      const choiceCount = node.choices.length;
      if (choiceCount === 0) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setSelectedIndex(prev => (prev - 1 + choiceCount) % choiceCount);
        playSound('hover');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setSelectedIndex(prev => (prev + 1) % choiceCount);
        playSound('hover');
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (node.choices[selectedIndex]) {
          handleChoice(node.choices[selectedIndex].next, selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNode, selectedIndex, isPausedGlobal, playSound]);

  useEffect(() => {
    if (isPausedGlobal) return;
    if (stats.budget <= 0 && currentNode !== 'fail_budget') {
      unlockAchievement('rpg_bankruptcy');
      setCurrentNode('fail_budget');
    } else if (stats.sanity <= 0 && currentNode !== 'fail_sanity') {
      unlockAchievement('rpg_insane');
      setCurrentNode('fail_sanity');
    } else if (stats.reputation <= 0 && currentNode !== 'fail_reputation') {
      setCurrentNode('fail_reputation');
    }
  }, [stats, currentNode, isPausedGlobal]);

  const node = storyMap[currentNode];

  const [activeEvent, setActiveEvent] = useState<{text: string} | null>(null);

  useEffect(() => {
    if (node.isEnding) {
      playSound('win');
      unlockAchievement('red_pill');
    }
    setSelectedIndex(0);

    // Random life events
    if (currentNode !== 'start' && !node.isEnding && Math.random() < 0.2) {
      const events = [
        { b: -10, s: -5, r: 0, text: t('game.rpg.event.coffee') },
        { b: 5, s: -10, r: 10, text: t('game.rpg.event.mention') },
        { b: 0, s: 10, r: -5, text: t('game.rpg.event.meditate') }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      setLastStatDelta({ b: event.b, s: event.s, r: event.r });
      setStats(prev => ({
        budget: Math.min(100, Math.max(0, prev.budget + event.b)),
        sanity: Math.min(100, Math.max(0, prev.sanity + event.s)),
        reputation: Math.min(100, Math.max(0, prev.reputation + event.r))
      }));
      setActiveEvent({ text: event.text });
      setTimeout(() => setActiveEvent(null), 3000);
    }
  }, [currentNode, node.isEnding, playSound, unlockAchievement]);

  const handleChoice = (next: NodeId, choiceIndex?: number) => {
    if (isPausedGlobal) return;
    if (next === 'start') {
      playSound('hover');
      setStats({ budget: 50, sanity: 50, reputation: 50 });
      setInventory([]);
      setLastStatDelta(null);
      setHistory(['start']);
      setBizarreLevel(0);
      setCharacterClass(null);
    } else {
      playSound('click');
      
      const choice = storyMap[currentNode]?.choices[choiceIndex ?? 0];
      let bDelta = 0;
      let sDelta = 0;
      let rDelta = 0;
        
      if (choice && choice.stats) {
        bDelta = choice.stats.budget ?? 0;
        sDelta = choice.stats.sanity ?? 0;
        rDelta = choice.stats.reputation ?? 0;
      }
      
      // Narrative Continuity: Detect if we are changing "worlds"
      const bridge = getPathBridge(currentNode, next);
      if (bridge) {
        setPathContext(bridge);
        sDelta -= 2;
      }

      setLastStatDelta({ b: bDelta, s: sDelta, r: rDelta });
      
      const newStats = {
        budget: Math.min(100, Math.max(0, stats.budget + bDelta)),
        sanity: Math.min(100, Math.max(0, stats.sanity + sDelta)),
        reputation: Math.min(100, Math.max(0, stats.reputation + rDelta))
      };
      
      setStats(newStats);
      setHistory(prev => [...prev, next]);

      // Item Acquisition Logic
      if (next === 'p1.q4a1') setInventory(prev => Array.from(new Set([...prev, 'brush'])));
      if (next === 'p2.q4a1') setInventory(prev => Array.from(new Set([...prev, 'check'])));
      if (next === 'p4.q2b') setInventory(prev => Array.from(new Set([...prev, 'coffee'])));
      if (next === 'boss.q1') setInventory(prev => Array.from(new Set([...prev, 'nft'])));

      // Increase bizarre level if sanity is dangerously low or weird paths are taken
      if (newStats.sanity < 15) setBizarreLevel(prev => prev + 1);
      if (next.startsWith('p7') || next.startsWith('p8') || next.startsWith('boss')) setBizarreLevel(prev => prev + 2);
    }

    // Story Precise Calculation logic for endings
    let finalNext = next;
    if (next.endsWith('.e1') && stats.sanity < 20) {
      finalNext = 'boss.q1'; 
    }

    setCurrentNode(finalNext);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPausedGlobal) return;
      if (node.isEnding) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleChoice('start');
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
        playSound('hover');
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSelectedIndex(prev => Math.min(node.choices.length - 1, prev + 1));
        playSound('hover');
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (node.choices[selectedIndex]) {
          handleChoice(node.choices[selectedIndex].next, selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, selectedIndex, playSound]);

  const renderEndingText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-[#8a63d2] font-bold text-lg md:text-xl">{lines[0]}</h4>
        <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed whitespace-pre-line">{lines.slice(1).join('\n')}</p>
      </div>
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const mood = getMoodColors(currentNode, bizarreLevel);

  if (currentNode === 'start') {
    return (
      <div ref={containerRef} className={cn("w-full h-full flex items-center justify-center p-4 transition-all duration-1000 overflow-y-auto custom-scrollbar", mood.bg)}>
        {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className={cn("w-full max-w-2xl flex flex-col justify-center items-center text-center p-6 sm:p-12 rounded-3xl border-2 transition-all duration-1000 relative shadow-2xl overflow-hidden [&.is-fullscreen]:shadow-none [&.is-fullscreen]:border-none shadow-brand-accent/20", mood.border, mood.bg)}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(138,99,210,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,99,210,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />
          
          <div className="relative z-10 w-full mb-8 flex justify-between items-end border-b pb-2 transition-colors duration-1000 border-white/10">
            <span className="text-white/40 font-mono text-[10px] tracking-widest uppercase italic">Curator Simulator v2.5</span>
            <span className="text-white/40 font-mono text-[10px] uppercase">{t('game.objective')}{t('game.rpg.goal')}</span>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2 italic relative inline-block">
              {t('game.rpg.title')}
              <span className="absolute -top-6 -right-6 rotate-12 text-[10px] bg-brand-accent text-white font-bold px-2 py-0.5 border border-white drop-shadow-md shadow-[0_0_10px_rgba(138,99,210,0.8)]">BY RIVAD</span>
            </h3>
            <div className="h-1 w-24 bg-brand-accent mx-auto mb-12 rounded-full shadow-[0_0_15px_rgba(138,99,210,0.8)]" />
          </motion.div>

          {!characterClass ? (
            <div className="flex flex-col gap-8 w-full z-10">
              <p className="text-white/60 text-xs font-mono uppercase tracking-widest">{t('game.rpg.select.class')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {[
                  { id: 'artist', icon: <UserIcon size={24} />, label: t('game.rpg.class.artist') },
                  { id: 'dealer', icon: <DollarSign size={24} />, label: t('game.rpg.class.dealer') },
                  { id: 'intern', icon: <Zap size={24} />, label: t('game.rpg.class.intern') }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => selectBackground(bg.id)}
                    className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-accent/20 hover:border-brand-accent transition-all group"
                  >
                    <div className="text-white group-hover:scale-110 transition-transform">{bg.icon}</div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              aria-label={t('game.rpg.start')}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice('q1'); }}
              className="px-12 py-5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-[0.4em] hover:bg-brand-accent hover:text-white transition-all shadow-xl shadow-brand-accent/30 cursor-pointer z-50 relative rounded-2xl active:scale-95"
            >
              {t('game.rpg.start')}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("w-full h-full flex flex-col p-4 sm:p-10 transition-colors duration-1000 relative overflow-y-auto custom-scrollbar [&.is-fullscreen]:shadow-none [&.is-fullscreen]:rounded-none [&.is-fullscreen]:border-none", mood.bg)}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}
      
      {activeEvent && (
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="absolute top-20 right-4 z-50 bg-brand-accent/90 text-white p-4 rounded-xl border border-white/20 shadow-2xl"
         >
           {activeEvent.text}
         </motion.div>
       )}
      
      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && currentNode !== 'start' && !node.isEnding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <Paintbrush className="w-12 h-12 text-brand-accent animate-pulse" />
              <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'ART SUSPENDED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'The creative timeline is temporarily frozen. Please wait.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Background Glow */}
      <div className={cn("absolute -top-40 -right-40 w-96 h-96 blur-[150px] opacity-20 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
      <div className={cn("absolute -bottom-40 -left-40 w-96 h-96 blur-[150px] opacity-10 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
      
      {/* Header Info */}
      <div className={cn("flex flex-col gap-6 border-b pb-6 mb-4 shrink-0 transition-colors duration-1000", mood.border, stats.sanity < 15 && "animate-pulse brightness-110")}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className={cn("w-3 h-3 rounded-full animate-pulse", mood.accent.replace('text-', 'bg-'))} />
             <div className="flex flex-col">
               <span className="text-white font-black text-xs uppercase tracking-tighter">{t('game.rpg.title')}</span>
               <div className="flex items-center gap-2">
                 <span className="text-white/40 text-[8px] font-mono uppercase tracking-[0.2em]">{t('game.rpg.label.layer')} {bizarreLevel}</span>
                 {characterClass && (
                   <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border bg-white/5", mood.border, mood.accent)}>
                     {t(`game.rpg.class.${characterClass}`)}
                   </span>
                 )}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleChoice('start')}
              className="text-white/30 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl flex items-center gap-2 group"
            >
              <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">{t('game.rpg.restart')}</span>
            </button>
          </div>
        </div>

        {!node.isEnding && (
          <div className="flex flex-wrap gap-2 items-center border-t border-white/5 pt-4">
            <Package size={12} className="text-white/20" />
            <div className="flex flex-wrap gap-1.5 flex-1">
              {inventory.length === 0 ? (
                <span className="text-white/10 text-[8px] font-mono uppercase tracking-widest italic">{t('game.rpg.inventory.empty')}</span>
              ) : (
                inventory.map((item, i) => (
                  <motion.span 
                    key={i} 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn("px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-tighter", mood.border, "text-white/60 bg-white/5")}
                  >
                    {t(`game.rpg.item.${item}`)}
                  </motion.span>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg border border-white/5">
               <div className={cn("w-1.5 h-1.5 rounded-full", stats.sanity < 30 ? "bg-red-500 animate-ping" : "bg-emerald-500")} />
               <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">NEURAL_STABILITY</span>
            </div>
          </div>
        )}
        
        {!node.isEnding && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'BUDGET', value: stats.budget, color: 'bg-amber-400', icon: '💰' },
              { label: 'SANITY', value: stats.sanity, color: 'bg-blue-400', icon: '🧠' },
              { label: 'REP', value: stats.reputation, color: mood.accent.replace('text-', 'bg-'), icon: '✨' }
            ].map(stat => (
              <div key={stat.label} className="bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col gap-2 transition-all hover:border-white/10">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
                  <span className="flex items-center gap-2">{stat.icon} {stat.label}</span>
                  <span className={cn(
                    stat.value < 25 ? "text-red-500 font-black scale-110 origin-right transition-transform" : "text-white/60",
                    stat.value > 80 ? "text-emerald-400 font-black" : ""
                  )}>
                    {stat.value < 10 ? '¡CRÍTICO!' : stat.value < 30 ? '¡PELIGRO!' : stat.value > 90 ? 'DIVINO' : stat.value + '%'}
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false} 
                    animate={{ width: `${stat.value}%` }} 
                    className={cn("h-full transition-colors duration-1000", stat.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-12 py-4 md:py-8">
        {/* Left icon col */}
        <div className="hidden md:flex flex-col items-center justify-center w-48 shrink-0">
           <motion.div
             key={currentNode + '_art'}
             initial={{ scale: 0.8, opacity: 0, y: 10 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className={cn("text-8xl filter drop-shadow-2xl grayscale transition-all duration-1000 hover:grayscale-0", mood.accent.includes('brand') ? '' : 'brightness-125')}
           >
             {currentNode === 'start' ? '🎟️' : node.isEnding ? '🏁' : currentNode.startsWith('p1') ? '🥂' : currentNode.startsWith('p2') ? '🎨' : currentNode.startsWith('p3') ? '💾' : currentNode.startsWith('p4') ? '🏛️' : currentNode.startsWith('p5') ? '🌊' : currentNode.startsWith('p6') ? '🎥' : '💎'}
           </motion.div>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col justify-center gap-6 md:gap-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className={cn("w-1 h-4 md:h-6 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
                 <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]", mood.accent)}>{node.isEnding ? 'FINAL_STATEMENT' : 'LOG_ENTRY_' + currentNode.toUpperCase()}</span>
              </div>
              
              <div 
                className="relative cursor-pointer"
                onClick={() => {
                  if (isTyping) {
                    setDisplayedText(t(node.textKey));
                    setIsTyping(false);
                  }
                }}
              >
                <div className="flex gap-4 md:gap-6">
                  <span className={cn("text-xl sm:text-3xl md:text-4xl font-black animate-flicker shrink-0 pt-1", mood.accent)}>{'>'}</span>
                  <p className={cn(
                    "text-xl sm:text-3xl md:text-4xl font-bold leading-tight transition-all duration-300 font-sans",
                    stats.sanity < 20 ? "text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" : "text-white"
                  )}>
                    {getGlitchedText(displayedText)}
                    {isTyping && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-2 h-6 bg-brand-accent ml-1 align-middle" />}
                  </p>
                </div>
              </div>

              {lastStatDelta && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-wrap gap-2 md:gap-3"
                >
                  {lastStatDelta.b !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.b > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>{t('game.rpg.stat.budget')}: {lastStatDelta.b > 0 ? '+' : ''}{lastStatDelta.b}</span>}
                  {lastStatDelta.s !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.s > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>{t('game.rpg.stat.sanity')}: {lastStatDelta.s > 0 ? '+' : ''}{lastStatDelta.s}</span>}
                  {lastStatDelta.r !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.r > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>{t('game.rpg.stat.reputation')}: {lastStatDelta.r > 0 ? '+' : ''}{lastStatDelta.r}</span>}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Prompt / Actions */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNode + '-choices'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-2 md:gap-3"
              >
                {node.isEnding ? (
                  <div className="flex flex-col gap-3">
                    <motion.button
                      aria-label={t('game.rpg.restart')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice('start')}
                      className={cn("w-full py-4 md:py-5 text-black bg-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-95 shadow-white/10")}
                    >
                      {t('game.rpg.restart')}
                    </motion.button>
                    {onFinish && (
                      <motion.button
                        aria-label={t('game.rpg.exit')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFinish}
                        className="w-full py-3 md:py-4 border-2 border-brand-accent/50 text-brand-accent rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] hover:bg-brand-accent/10 transition-all opacity-80"
                      >
                        {t('game.rpg.exit')}
                      </motion.button>
                    )}
                  </div>
                ) : (
                  node.choices.map((choice, idx) => (
                    <motion.button
                      aria-label={t(choice.textKey)}
                      key={choice.textKey}
                      whileHover={{ x: 10, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice.next, idx)}
                      className={cn(
                        "w-full px-4 md:px-6 py-4 md:py-5 text-left flex items-center justify-between rounded-xl md:rounded-2xl border-2 transition-all group active:scale-95 shadow-lg relative",
                        idx === selectedIndex ? "bg-white text-black border-white" : cn("bg-black/40 text-white/90 hover:text-white hover:bg-black/60", mood.border)
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1">
                        <span className={cn("text-[9px] md:text-[10px] font-black transition-colors px-2 md:px-3 py-1 md:py-1.5 rounded", idx === selectedIndex ? "bg-black text-white" : "bg-white/10 text-white/30 group-hover:text-white/60")}>0{idx + 1}</span>
                        <span className="text-sm md:text-base font-bold uppercase tracking-wider">{t(choice.textKey)}</span>
                      </div>
                      
                      {/* Stat Preview */}
                      <div className="flex gap-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         {choice.stats?.budget !== undefined && <span className={cn("text-[8px] font-bold", choice.stats.budget > 0 ? "text-emerald-500" : "text-red-500")}>💰{choice.stats.budget > 0 ? '+' : ''}{choice.stats.budget}</span>}
                         {choice.stats?.sanity !== undefined && <span className={cn("text-[8px] font-bold", choice.stats.sanity > 0 ? "text-emerald-500" : "text-red-500")}>🧠{choice.stats.sanity > 0 ? '+' : ''}{choice.stats.sanity}</span>}
                      </div>

                      <span className={cn("transition-all", idx === selectedIndex ? "translate-x-0 opacity-100" : "translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 font-black")}>→</span>
                    </motion.button>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Aesthetic Footer */}
      <div className="flex justify-between items-center text-[7px] font-black text-white/10 uppercase tracking-[0.4em] pt-8 border-t border-white/5">
         <span>SIM_SECTOR_V6 // PROTOCOL_BYPASS_ACTIVE</span>
         <span className="text-brand-accent/40">{t('game.rpg.label.layer')}: {currentNode.startsWith('boss') ? 'BIZARRE_OVERLAY' : 'STANDARD_REALITY'}</span>
         <span>TIMESTAMP: {new Date().toISOString()}</span>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #110f1c; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #3a2d59; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #8a63d2; 
          }
        `}</style>
      </div>
    </div>
  );
}
