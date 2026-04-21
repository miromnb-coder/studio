  import { useEffect, useMemo, useState } from 'react';
    if (unfinishedRows[0]?.title) {
      return `Resume ${unfinishedRows[0].title}`;
    }

    if (latestConversation?.title) {
      return `Continue ${latestConversation.title}`;
    }

    if (activePriorities[0]) {
      return activePriorities[0];
    }

    return 'Open Operator';
  }, [activePriorities, latestConversation?.title, unfinishedRows]);
