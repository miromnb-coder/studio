'use client';

import { memo, useCallback, useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import { ArrowUp, BotMessageSquare, Mic, Plus, Workflow } from 'lucide-react';
import { triggerLightHaptic } from './haptics';
/* unchanged except bottom offset */
